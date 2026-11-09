"""Remote commands recover an expired Leapmotor session without sending twice.

A fake cloud stands in for the transport, so the real remote-control flow
(cert sync, PIN verify, command, result polling, token refresh) runs offline.
All data is synthetic.
"""
import base64
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import Mock, patch

from test_status_path_fallback import api

LeapmotorApiError = api.LeapmotorApiError
LeapmotorRemoteCommandUnconfirmedError = api.LeapmotorRemoteCommandUnconfirmedError

VIN = "SYNTHETIC-VIN-123456"
PATH = "/carownerservice/oversea"


def synthetic_token(serial: int) -> str:
    """Return a JWT-shaped token long enough for operatePassword derivation."""
    payload = json.dumps({"user_name": f"synthetic,user,device-{serial},x"}).encode()
    body = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    return f"header.{body}.{'s' * 64}{serial}"


class FakeCloud:
    """Answer the remote-control endpoints and count every call."""

    def __init__(self) -> None:
        self.valid_token = synthetic_token(1)
        self.calls: list[tuple[str, str]] = []
        self.reject_token_at: dict[str, int] = {}
        self.refreshes = 0
        self.result_data = 1

    def count(self, endpoint: str) -> int:
        return sum(1 for name, _ in self.calls if name == endpoint)

    def post(self, *, path, headers, data, cert):
        endpoint = {
            f"{PATH}/vehicle/v1/cert/sync": "cert_sync",
            f"{PATH}/vehicle/v1/operPwd/verify": "verify",
            f"{PATH}/vehicle/v1/app/remote/ctl": "ctl",
            f"{PATH}/vehicle/v1/app/remote/ctl/result/query": "result",
            f"{PATH}/acct/v1/token/refresh": "refresh",
        }[path]
        self.calls.append((endpoint, headers.get("token")))
        if endpoint == "refresh":
            self.refreshes += 1
            self.valid_token = synthetic_token(1 + self.refreshes)
            return self._ok({"token": self.valid_token, "refreshToken": "synthetic-refresh"})
        if self.reject_token_at.get(endpoint, 0) > 0:
            self.reject_token_at[endpoint] -= 1
            return {"status_code": 200, "body": json.dumps({"code": 401, "message": "Token is invalid"})}
        if headers.get("token") != self.valid_token:
            return {"status_code": 200, "body": json.dumps({"code": 401, "message": "Token is invalid"})}
        if endpoint == "ctl":
            return self._ok({"remoteCtlId": "synthetic-ctl", "queryInterval": 250,
                             "queryRemoteCtlResultTimeout": 3000})
        if endpoint == "result":
            return self._ok(self.result_data)
        return self._ok(None)

    @staticmethod
    def _ok(data):
        return {"status_code": 200, "body": json.dumps({"code": 0, "message": "ok", "data": data})}


class RemoteSessionRecoveryTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(prefix="leapmotor-remote-")
        self.addCleanup(directory.cleanup)
        cert = Path(directory.name) / "account.pem"
        cert.write_text("synthetic")
        self.client = api.LeapmotorApiClient(username="synthetic", password="synthetic",
                                             operation_password="0000")
        self.addCleanup(self.client.close)
        self.cloud = FakeCloud()
        self.client.transport = self.cloud
        self.client.user_id = "synthetic-user"
        self.client.token = self.cloud.valid_token
        self.client.refresh_token = "synthetic-refresh"
        self.client.sign_ikm = self.client.sign_salt = self.client.sign_info = "synthetic"
        self.client.account_cert_file = self.client.account_key_file = str(cert)
        self.client._clear_account_cert_files = Mock()
        self.client._find_vehicle_by_vin = Mock(
            return_value=api.Vehicle(VIN, "synthetic-car", "T03", "Owner", False)
        )
        self.client.login = Mock(side_effect=AssertionError("refresh should be enough"))

    def preheat(self):
        return self.client.set_climate(VIN, mode="hot", temperature=22, fan_speed=7,
                                       recirculate=True)

    def test_expired_token_while_polling_keeps_polling_the_same_command(self):
        # The reported case: verify and command accepted, result query rejected.
        self.cloud.reject_token_at["result"] = 1
        result = self.preheat()
        self.assertEqual(result["data"]["remoteCtlId"], "synthetic-ctl")
        self.assertEqual(self.cloud.count("ctl"), 1, "the car must not get the command twice")
        self.assertEqual(self.cloud.refreshes, 1)
        self.assertEqual(self.client.token, self.cloud.valid_token)
        self.assertEqual(self.client.device_id, "device-2")
        self.assertEqual(self.cloud.calls[-1], ("result", self.cloud.valid_token))

    def test_expired_token_before_sending_retries_the_whole_command(self):
        for endpoint in ("verify", "ctl", "cert_sync"):
            with self.subTest(endpoint=endpoint):
                self.setUp()
                self.cloud.reject_token_at[endpoint] = 1
                self.preheat()
                self.assertEqual(self.cloud.refreshes, 1)
                self.assertEqual(self.cloud.count("ctl"), 2 if endpoint == "ctl" else 1)
                # The retry derives the PIN and signature from the renewed token.
                verify_tokens = [token for name, token in self.cloud.calls if name == "verify"]
                self.assertEqual(verify_tokens[-1], self.cloud.valid_token)
                self.assertEqual(self.cloud.calls[-1], ("result", self.cloud.valid_token))

    def test_token_rejected_again_while_polling_is_reported_as_unconfirmed(self):
        self.cloud.reject_token_at["result"] = 2
        with self.assertRaises(LeapmotorRemoteCommandUnconfirmedError):
            self.preheat()
        self.assertEqual(self.cloud.count("ctl"), 1)
        self.assertEqual(self.cloud.refreshes, 1)

    def test_result_timeout_is_unconfirmed(self):
        self.cloud.result_data = 0
        with patch.object(api.time, "sleep"):
            with patch.object(api.time, "monotonic", side_effect=[0, 0, 0, 5, 5]):
                with self.assertRaises(LeapmotorRemoteCommandUnconfirmedError):
                    self.preheat()
        self.assertEqual(self.cloud.count("ctl"), 1)

    def test_token_rejected_twice_before_sending_gives_up(self):
        self.cloud.reject_token_at["verify"] = 2
        with self.assertRaises(LeapmotorApiError) as caught:
            self.preheat()
        self.assertNotIsInstance(caught.exception, LeapmotorRemoteCommandUnconfirmedError)
        self.assertEqual(self.cloud.count("ctl"), 0)

    def test_send_destination_retries_after_token_error(self):
        self.cloud.reject_token_at["ctl"] = 1
        self.client.send_destination(VIN, address="Ljubljana", address_name="Ljubljana",
                                     latitude=46.05, longitude=14.5)
        self.assertEqual(self.cloud.count("ctl"), 2)
        self.assertEqual(self.cloud.refreshes, 1)

    def test_status_poll_waits_for_a_running_command(self):
        # A poll must not renew the session while a command is mid-flight.
        order = []
        self.client._fetch_authenticated_data = Mock(side_effect=lambda: order.append("poll") or {})
        original = self.client._poll_remote_control_result

        def slow_poll(**kwargs):
            poller.start()
            poller.join(0.3)
            order.append("command result")
            return original(**kwargs)

        poller = threading.Thread(target=self.client.fetch_data)
        with patch.object(self.client, "_poll_remote_control_result", side_effect=slow_poll):
            self.preheat()
        poller.join(2)
        self.assertEqual(order, ["command result", "poll"])


if __name__ == "__main__":
    unittest.main()
