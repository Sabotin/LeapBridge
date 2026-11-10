"""Offline tests for the app certificate download (all material is generated here)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
import importlib
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID
import requests

import test_status_path_fallback  # noqa: F401 - registers the package for the import below

cd = importlib.import_module("custom_components.leapmotor.cert_download")

RELEASE = "https://raw.githubusercontent.com/Sabotin/LeapBridge/HEAD/certs"
WEB = "https://github.com/Sabotin/LeapBridge/raw/HEAD/certs"
RAW = "https://cdn.jsdelivr.net/gh/Sabotin/LeapBridge@main/certs"


def make_pair(*, days: int = 365, name: str = "synthetic") -> tuple[bytes, bytes]:
    """Return a fresh certificate and its key as PEM."""
    key = ec.generate_private_key(ec.SECP256R1())
    subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, name)])
    now = datetime.now(UTC)
    start = min(now, now + timedelta(days=days)) - timedelta(days=1)
    certificate = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(start)
        .not_valid_after(now + timedelta(days=days))
        .sign(key, hashes.SHA256())
    )
    return (
        certificate.public_bytes(serialization.Encoding.PEM),
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ),
    )


CERT, KEY = make_pair()
OTHER_CERT, OTHER_KEY = make_pair(name="other")
BAG = b"Bag Attributes\n    localKeyID: 01 02\nsubject=CN = synthetic\n"


class FakeResponse:
    def __init__(self, status: int, body: bytes = b"") -> None:
        self.status_code = status
        self._body = body
        self.closed = False

    def iter_content(self, chunk_size: int = 8192):
        for offset in range(0, len(self._body), chunk_size):
            yield self._body[offset:offset + chunk_size]

    def close(self) -> None:
        self.closed = True


class FakeSession:
    """Answers by URL; a list is consumed one answer per request."""

    def __init__(self, routes: dict) -> None:
        self.routes = routes
        self.calls: list[str] = []
        self.responses: list[FakeResponse] = []

    def get(self, url, **kwargs):
        self.calls.append(url)
        assert kwargs["timeout"][0] > 0 and kwargs["allow_redirects"] and kwargs["stream"]
        answer = self.routes.get(url, 404)
        if isinstance(answer, list):
            answer = answer.pop(0) if len(answer) > 1 else answer[0]
        if isinstance(answer, Exception):
            raise answer
        if isinstance(answer, int):
            response = FakeResponse(answer)
        else:
            response = FakeResponse(200, answer)
        self.responses.append(response)
        return response

    def close(self) -> None:
        raise AssertionError("a session passed in by the caller must stay open")


class NoWaiting(unittest.TestCase):
    def setUp(self) -> None:
        patcher = patch.object(cd, "_RETRY_WAIT_SECONDS", 0)
        patcher.start()
        self.addCleanup(patcher.stop)


class CheckPairTests(unittest.TestCase):
    def test_text_around_the_pem_blocks_is_dropped(self) -> None:
        pair = cd.check_certificate_pair(
            BAG + CERT.replace(b"\n", b"\r\n") + b"trailing text\n", BAG + KEY
        )
        self.assertEqual(pair.cert_pem, CERT)
        self.assertEqual(pair.key_pem, KEY)
        self.assertEqual(pair.subject, "CN=synthetic")
        self.assertFalse(pair.expired)
        self.assertEqual(len(pair.fingerprint_sha256), 64)
        self.assertGreater(pair.not_after, datetime.now(UTC) + timedelta(days=300))

    def test_a_certificate_chain_is_kept_in_order(self) -> None:
        pair = cd.check_certificate_pair(CERT + OTHER_CERT, KEY)
        self.assertEqual(pair.cert_pem, CERT + OTHER_CERT)

    def test_expired_certificate_is_reported_not_refused(self) -> None:
        cert, key = make_pair(days=-2)
        self.assertTrue(cd.check_certificate_pair(cert, key).expired)

    def test_unusable_files_are_refused(self) -> None:
        encrypted = ec.generate_private_key(ec.SECP256R1()).private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.BestAvailableEncryption(b"secret"),
        )
        broken = CERT.replace(CERT.splitlines()[3], b"!!!!")
        cases = (
            (CERT, OTHER_KEY, "does not belong"),
            (b"<html>Not Found</html>", KEY, "no PEM certificate"),
            (CERT, b"", "no PEM private key"),
            (KEY, KEY, "no PEM certificate"),
            (CERT, CERT, "no PEM private key"),
            (CERT, encrypted, "encrypted"),
            (broken, KEY, "certificate cannot be read"),
        )
        for cert, key, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(cd.InvalidCertificatePair, message):
                    cd.check_certificate_pair(cert, key)


class RepositoryPairTests(unittest.TestCase):
    def test_the_pair_in_the_certs_folder_is_usable_plain_pem(self) -> None:
        folder = Path(__file__).parents[1] / "certs"
        cert, key = (folder / "app_cert.pem").read_bytes(), (folder / "app_key.pem").read_bytes()
        pair = cd.check_certificate_pair(cert, key)
        self.assertEqual((pair.cert_pem, pair.key_pem), (cert, key))
        self.assertFalse(pair.expired)


class FetchTests(NoWaiting):
    def fetch(self, routes: dict):
        session = FakeSession(routes)
        try:
            return cd.fetch_certificate_pair(session), session
        finally:
            self.assertTrue(all(response.closed for response in session.responses))

    def failure(self, routes: dict) -> tuple[cd.CertificateDownloadError, FakeSession]:
        session = FakeSession(routes)
        with self.assertRaises(cd.CertificateDownloadError) as caught:
            cd.fetch_certificate_pair(session)
        return caught.exception, session

    def test_the_first_address_is_used_first(self) -> None:
        (pair, source), session = self.fetch(
            {f"{RELEASE}/app_cert.pem": BAG + CERT, f"{RELEASE}/app_key.pem": BAG + KEY}
        )
        self.assertEqual((source, pair.cert_pem, pair.key_pem), ("GitHub", CERT, KEY))
        self.assertEqual(session.calls, [f"{RELEASE}/app_cert.pem", f"{RELEASE}/app_key.pem"])

    def test_renamed_files_are_found(self) -> None:
        (pair, source), _ = self.fetch({f"{RELEASE}/app.crt": CERT, f"{RELEASE}/app.key": KEY})
        self.assertEqual((source, pair.cert_pem), ("GitHub", CERT))

    def test_the_mirror_is_used_when_github_fails(self) -> None:
        (pair, source), session = self.fetch({
            f"{RELEASE}/app_cert.pem": 503,
            f"{WEB}/app_cert.pem": 429,  # refused: asking again does not help
            f"{RAW}/app_cert.pem": BAG + CERT, f"{RAW}/app_key.pem": BAG + KEY,
        })
        self.assertEqual((source, pair.key_pem), ("jsDelivr mirror", KEY))
        # The server error was retried, the refusal was not.
        self.assertEqual(session.calls.count(f"{RELEASE}/app_cert.pem"), 3)
        self.assertEqual(session.calls.count(f"{WEB}/app_cert.pem"), 1)

    def test_a_dropped_connection_is_retried(self) -> None:
        (pair, source), session = self.fetch({
            f"{RELEASE}/app_cert.pem": [requests.ConnectionError("reset"), CERT],
            f"{RELEASE}/app_key.pem": [requests.Timeout("slow"), 502, KEY],
        })
        self.assertEqual((source, pair.cert_pem), ("GitHub", CERT))
        self.assertEqual(len(session.calls), 5)

    def test_an_unusable_pair_falls_through_to_the_next_route(self) -> None:
        (pair, source), _ = self.fetch({
            f"{RELEASE}/app_cert.pem": CERT, f"{RELEASE}/app_key.pem": OTHER_KEY,
            f"{RAW}/app.crt": CERT, f"{RAW}/app.key": KEY,
        })
        self.assertEqual((source, pair.key_pem), ("jsDelivr mirror", KEY))

    def test_oversized_file_is_not_read_to_the_end(self) -> None:
        error, _ = self.failure({
            f"{RELEASE}/app_cert.pem": b"x" * (cd._MAX_FILE_BYTES + 1),
            f"{RELEASE}/app_key.pem": KEY,
        })
        self.assertEqual(error.reason, cd.REASON_CANNOT_CONNECT)
        self.assertIn("larger than a certificate file", error.detail)

    def test_failure_reasons(self) -> None:
        offline = requests.ConnectionError("Name or service not known")
        everything_down = {f"{base}/{name}": offline for base in (RELEASE, WEB, RAW)
                           for name in ("app_cert.pem", "app.crt", "app_cert.crt")}
        cases = (
            ("no network", everything_down, cd.REASON_CANNOT_CONNECT),
            ("nothing published", {}, cd.REASON_NOT_FOUND),
            ("only a broken pair", {f"{RAW}/app.crt": CERT, f"{RAW}/app.key": OTHER_KEY},
             cd.REASON_INVALID),
        )
        for label, routes, reason in cases:
            with self.subTest(label):
                error, _ = self.failure(dict(routes))
                self.assertEqual(error.reason, reason)
                self.assertTrue(error.detail)

    def test_an_unreachable_host_is_asked_only_once(self) -> None:
        offline = requests.ConnectionError("unreachable")
        _, session = self.failure({f"{RELEASE}/app_cert.pem": offline,
                                   f"{RAW}/app_cert.pem": offline})
        # Three attempts for the first file of each host, none for its other names.
        for base in (RELEASE, RAW):
            self.assertEqual(session.calls.count(f"{base}/app_cert.pem"), 3)
            self.assertNotIn(f"{base}/app.crt", session.calls)

    def test_the_deadline_stops_a_slow_download(self) -> None:
        session = FakeSession({f"{RELEASE}/app_cert.pem": CERT})
        with self.assertRaisesRegex(cd._SourceUnavailable, "took too long"):
            cd._Fetcher(session, deadline_seconds=-1).get(f"{RELEASE}/app_cert.pem")
        self.assertEqual(session.calls, [])


class InstallTests(NoWaiting):
    def setUp(self) -> None:
        super().setUp()
        directory = tempfile.TemporaryDirectory(prefix="leapmotor-certs-")
        self.addCleanup(directory.cleanup)
        self.dir = Path(directory.name) / "leapmotor"
        self.cert = self.dir / "app_cert.pem"
        self.key = self.dir / "app_key.pem"

    def mode(self, path: Path) -> int:
        return stat.S_IMODE(path.stat().st_mode)

    def test_download_installs_plain_pem_with_a_private_key_mode(self) -> None:
        session = FakeSession(
            {f"{RELEASE}/app_cert.pem": BAG + CERT, f"{RELEASE}/app_key.pem": BAG + KEY}
        )
        result = cd.download_app_certificates(self.dir, session=session)
        self.assertEqual((result.source, result.changed, result.expired),
                         ("GitHub", True, False))
        self.assertEqual((self.cert.read_bytes(), self.key.read_bytes()), (CERT, KEY))
        self.assertEqual((self.mode(self.cert), self.mode(self.key)), (0o644, 0o600))
        self.assertEqual(sorted(path.name for path in self.dir.iterdir()),
                         ["app_cert.pem", "app_key.pem"])
        # The same pair again changes nothing, but repairs a too-open key file.
        os.chmod(self.key, 0o644)
        before = self.cert.stat().st_mtime_ns
        again = cd.download_app_certificates(self.dir, session=session)
        self.assertFalse(again.changed)
        self.assertEqual((self.cert.stat().st_mtime_ns, self.mode(self.key)), (before, 0o600))

    def test_a_newer_pair_replaces_the_old_one(self) -> None:
        self.dir.mkdir()
        self.cert.write_bytes(OTHER_CERT)
        self.key.write_bytes(OTHER_KEY)
        changed = cd.install_certificate_pair(self.dir, cd.check_certificate_pair(CERT, KEY))
        self.assertTrue(changed)
        self.assertEqual((self.cert.read_bytes(), self.key.read_bytes()), (CERT, KEY))

    def test_a_failed_download_leaves_working_certificates_alone(self) -> None:
        self.dir.mkdir()
        self.cert.write_bytes(OTHER_CERT)
        self.key.write_bytes(OTHER_KEY)
        for routes in ({f"{RELEASE}/app_cert.pem": CERT, f"{RELEASE}/app_key.pem": OTHER_KEY},
                       {f"{RELEASE}/app_cert.pem": requests.ConnectionError("offline")}):
            with self.assertRaises(cd.CertificateDownloadError):
                cd.download_app_certificates(self.dir, session=FakeSession(routes))
            self.assertEqual((self.cert.read_bytes(), self.key.read_bytes()),
                             (OTHER_CERT, OTHER_KEY))

    def test_a_half_finished_replacement_is_undone(self) -> None:
        self.dir.mkdir()
        self.cert.write_bytes(OTHER_CERT)
        self.key.write_bytes(OTHER_KEY)
        real_replace = os.replace

        def failing_replace(source, target):
            if Path(target).name == "app_cert.pem":
                raise OSError("disk full")
            return real_replace(source, target)

        with patch.object(cd.os, "replace", side_effect=failing_replace), \
                self.assertRaises(cd.CertificateDownloadError) as caught:
            cd.install_certificate_pair(self.dir, cd.check_certificate_pair(CERT, KEY))
        self.assertEqual(caught.exception.reason, cd.REASON_WRITE_FAILED)
        self.assertEqual((self.cert.read_bytes(), self.key.read_bytes()), (OTHER_CERT, OTHER_KEY))
        self.assertEqual(sorted(path.name for path in self.dir.iterdir()),
                         ["app_cert.pem", "app_key.pem"])

    def test_an_unwritable_place_is_reported(self) -> None:
        blocker = self.dir.parent / "file"
        blocker.write_text("not a directory")
        with self.assertRaises(cd.CertificateDownloadError) as caught:
            cd.install_certificate_pair(blocker / "leapmotor", cd.check_certificate_pair(CERT, KEY))
        self.assertEqual(caught.exception.reason, cd.REASON_WRITE_FAILED)


if __name__ == "__main__":
    unittest.main()
