"""Model-specific command behavior confirmed on real vehicles."""

from __future__ import annotations

T03_AC_OFF_PAYLOAD = {
    "circle": "out",
    "mode": "wind",
    "operate": "off",
    "position": "all",
    "temperature": "26",
    "windlevel": "3",
    "wshld": "0",
}

WINDOW_OPEN_PERCENT = 20
WINDOW_POSITION_SCALE = {
    "B05": 10,
    "B10": 10,
    "C10": 10,
}


class VehicleStatusPathResolver:
    """Remember the working model-specific status path for each VIN."""

    def __init__(self) -> None:
        self._proven_paths: dict[str, str] = {}
        self._fallback_attempted: set[str] = set()

    def path_for(self, vin: str, car_type: object) -> str:
        """Return a proven path, or the best path derived from the model."""
        return self._proven_paths.get(vin, vehicle_status_path(car_type))

    def remember(self, vin: str, path: str) -> None:
        """Remember a path after a successful status response."""
        self._proven_paths[vin] = path

    def should_try_c10_fallback(
        self,
        vin: str,
        current_path: str,
        http_status: object,
    ) -> bool:
        """Allow one C10 fallback per VIN for an unsupported status path."""
        if current_path == "c10" or http_status != 404 or vin in self._fallback_attempted:
            return False
        self._fallback_attempted.add(vin)
        return True


def vehicle_status_path(car_type: object) -> str:
    """Return the backend status path segment for a vehicle model."""
    normalized = str(car_type or "C10").strip().lower()
    if normalized in {"b05", "b10", "b11"}:
        return "c10"
    return normalized or "c10"


def climate_off_payload(car_type: object) -> dict[str, str] | None:
    """Return the full T03 A/C-off body, or None for the standard command."""
    if str(car_type or "").strip().upper() != "T03":
        return None
    return dict(T03_AC_OFF_PAYLOAD)


def native_window_position(car_type: object, position_percent: int) -> int:
    """Convert a percentage to the model's native window command scale."""
    normalized_car_type = str(car_type or "").strip().upper()
    full_open_value = WINDOW_POSITION_SCALE.get(normalized_car_type, 100)
    return round(position_percent / 100.0 * full_open_value)


def native_window_open_position(
    car_type: object,
    position_percent: int | None,
) -> int:
    """Return the native open position, defaulting to a 20 percent vent gap."""
    requested_percent = (
        WINDOW_OPEN_PERCENT if position_percent is None else position_percent
    )
    return native_window_position(car_type, requested_percent)


def charging_plan_control_supported(car_type: object) -> bool:
    """Allow the status-based command 190 path except on the T03.

    T03 reports confirmed that writes built from the status plan had no
    effect. The T03 sets its charge limit through the schedule-based path
    instead (as LeapConnect does); switching its schedule stays unsupported.
    """
    return str(car_type or "").strip().upper() != "T03"


#: ``rightList`` code of the start/stop charging command (193).
RIGHT_START_STOP_CHARGING = "193"


def remote_charge_toggle_supported(car_type: object, rights: object) -> bool:
    """Return whether the car takes the start/stop charging command (193).

    The T03 has no such command: the cloud's right list of a T03 does not
    carry 193 (leapmotor-api 0.6.0 documents it for the C10 and B10 only), and
    a T03 that waits for its schedule does not start on it. A T03 whose right
    list does carry 193 is believed. Other models are not restricted here.
    """
    if str(car_type or "").strip().upper() != "T03":
        return True
    if isinstance(rights, (list, tuple, set, frozenset)):
        codes = {str(code).strip() for code in rights}
    else:
        codes = {part.strip() for part in str(rights or "").split(",")}
    return RIGHT_START_STOP_CHARGING in codes
