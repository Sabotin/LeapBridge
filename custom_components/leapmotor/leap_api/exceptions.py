"""Leapmotor API exceptions."""

from __future__ import annotations


class LeapmotorApiError(Exception):
    """Base Leapmotor API error."""


class LeapmotorAuthError(LeapmotorApiError):
    """Leapmotor authentication failed."""


class LeapmotorAccountCertError(LeapmotorAuthError):
    """Leapmotor account certificate could not be opened."""


class LeapmotorMissingAppCertError(LeapmotorAuthError):
    """Local app certificate material is missing."""


class LeapmotorNoVehicleError(LeapmotorApiError):
    """The account login worked, but no vehicle is linked to the account."""


class LeapmotorShareInvitationPendingError(LeapmotorNoVehicleError):
    """No vehicle yet, but a car-share invitation is waiting to be accepted."""

    def __init__(self, invitations: list[dict]) -> None:
        super().__init__("A car-share invitation is waiting for this account.")
        self.invitations = invitations


class LeapmotorRemoteCommandUnconfirmedError(LeapmotorApiError):
    """The cloud accepted a remote command, but its result could not be confirmed.

    The command may already be running in the car, so callers must not resend
    it automatically (toggles such as the trunk would flip back).
    """
