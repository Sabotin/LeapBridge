"""Constants for the Leapmotor integration."""

from __future__ import annotations

DOMAIN = "leapmotor"

CONF_ACCOUNT_P12_PASSWORD = "account_p12_password"
CONF_APP_CERT_FILE = "app_cert_file"
CONF_APP_CERT_PEM = "app_cert_pem"
CONF_APP_KEY_FILE = "app_key_file"
CONF_APP_KEY_PEM = "app_key_pem"
CONF_ABRP_ENABLED = "abrp_enabled"
CONF_ABRP_TOKEN = "abrp_token"
CONF_ECO_POLLING_ENABLED = "eco_polling_enabled"
CONF_ECO_SCAN_INTERVAL = "eco_scan_interval"
CONF_DRIVING_SCAN_INTERVAL = "driving_scan_interval"
CONF_DEVICE_ID = "device_id"
CONF_OPERATION_PASSWORD = "operation_password"
CONF_SCAN_INTERVAL = "scan_interval"
CONF_VIN = "vin"
CONF_PRICE_HOME = "price_home_kwh"
CONF_PRICE_PUBLIC_AC = "price_public_ac_kwh"
CONF_PRICE_PUBLIC_DC = "price_public_dc_kwh"
CONF_BATTERY_REFERENCE_KWH = "battery_reference_kwh"
CONF_PRICE_HOME_LOW = "price_home_low_kwh"
CONF_LOW_TARIFF_START = "low_tariff_start"
CONF_LOW_TARIFF_END = "low_tariff_end"
CONF_LOW_TARIFF_WEEKENDS = "low_tariff_weekends"
CONF_MAINTENANCE_SEVERE = "maintenance_severe_use"
CONF_PREHEAT_TEMPERATURE = "preheat_temperature"
CONF_PREHEAT_FAN = "preheat_fan_speed"
CONF_PREHEAT_RECIRCULATE = "preheat_recirculate"
DEFAULT_PREHEAT_TEMPERATURE = 22
DEFAULT_PREHEAT_FAN = 7
CONF_PRECOOL_TEMPERATURE = "precool_temperature"
CONF_PRECOOL_FAN = "precool_fan_speed"
CONF_PRECOOL_RECIRCULATE = "precool_recirculate"
CONF_PRECONDITION_THRESHOLD = "precondition_cool_above"
DEFAULT_PRECOOL_TEMPERATURE = 18
DEFAULT_PRECOOL_FAN = 7
DEFAULT_PRECONDITION_THRESHOLD = 20
CONF_SPEED_ALERT = "speed_alert_kmh"
#: Factory vehicle PIN; prefilled in setup and vehicle settings, changeable.
DEFAULT_OPERATION_PASSWORD = "0000"
CONF_SHOW_PANEL = "show_sidebar_panel"

SUBENTRY_TYPE_VEHICLE = "vehicle"

DEFAULT_ABRP_API_KEY = "".join(
    (
        "7310445a",
        "-0947",
        "-4adc",
        "-82f5",
        "-29bb882c5926",
    )
)
DEFAULT_BASE_URL = "https://appgateway.leapmotor-international.de"
DEFAULT_APP_VERSION = "1.12.3"
DEFAULT_DEVICE_ID = "bd605e5c599944efb846bcf70f1449d8"
DEFAULT_SOURCE = "leapmotor"
DEFAULT_CHANNEL = "1"
DEFAULT_LANGUAGE = "en-GB"
DEFAULT_DEVICE_TYPE = "1"
DEFAULT_P12_ENC_ALG = "1"
DEFAULT_OPERPWD_AES_KEY = "f1cf0c025baec0e2"
DEFAULT_OPERPWD_AES_IV = "6b6a1fe94e133fd7"
DEFAULT_SCAN_INTERVAL_MINUTES = 5
DEFAULT_ECO_SCAN_INTERVAL_MINUTES = 15
#: Faster polling while a car is driving, so trip maps get a usable route.
DEFAULT_DRIVING_SCAN_INTERVAL_MINUTES = 1
DEFAULT_STATE_STALE_SECONDS = 900
REMOTE_ACTION_COOLDOWN_SECONDS = 10
VEHICLE_ABILITY_UNLOCK_CHARGE_GUN = 53

# Normal setup derives the account certificate password from login id + uid.
KNOWN_ACCOUNT_P12_PASSWORDS: tuple[str, ...] = ()

STATIC_APP_CERT = "app_cert.pem"
STATIC_APP_KEY = "app_key.pem"
STATIC_CERT_STORAGE_DIR = "leapmotor"

REMOTE_CTL_LOCK = "lock"
REMOTE_CTL_UNLOCK = "unlock"
REMOTE_CTL_UNLOCK_CHARGER = "unlock_charger"
REMOTE_CTL_TRUNK = "trunk"
REMOTE_CTL_TRUNK_OPEN = "trunk_open"
REMOTE_CTL_TRUNK_CLOSE = "trunk_close"
REMOTE_CTL_FIND_CAR = "find_car"
REMOTE_CTL_SUNSHADE = "sunshade"
REMOTE_CTL_SUNSHADE_OPEN = "sunshade_open"
REMOTE_CTL_SUNSHADE_CLOSE = "sunshade_close"
REMOTE_CTL_BATTERY_PREHEAT = "battery_preheat"
REMOTE_CTL_BATTERY_PREHEAT_OFF = "battery_preheat_off"
REMOTE_CTL_STEERING_WHEEL_HEAT_ON = "steering_wheel_heat_on"
REMOTE_CTL_STEERING_WHEEL_HEAT_OFF = "steering_wheel_heat_off"
REMOTE_CTL_REARVIEW_MIRROR_HEAT_ON = "rearview_mirror_heat_on"
REMOTE_CTL_REARVIEW_MIRROR_HEAT_OFF = "rearview_mirror_heat_off"
REMOTE_CTL_SEAT_HEAT = "seat_heat"
REMOTE_CTL_SEAT_VENTILATION = "seat_ventilation"
REMOTE_CTL_WINDOWS = "windows"
REMOTE_CTL_WINDOWS_OPEN = "windows_open"
REMOTE_CTL_WINDOWS_CLOSE = "windows_close"
REMOTE_CTL_AC_SWITCH = "ac_switch"
REMOTE_CTL_AC_ON = "ac_on"
REMOTE_CTL_AC_OFF = "ac_off"
REMOTE_CTL_QUICK_COOL = "quick_cool"
REMOTE_CTL_QUICK_HEAT = "quick_heat"
REMOTE_CTL_WINDSHIELD_DEFROST = "windshield_defrost"
# Ported from LeapConnect / leapmotor-api (AGPL-3.0): same remote-control flow.
REMOTE_CTL_SENTRY_MODE_ON = "sentry_mode_on"
REMOTE_CTL_SENTRY_MODE_OFF = "sentry_mode_off"
REMOTE_CTL_CHARGE_START = "charging_start"
REMOTE_CTL_CHARGE_STOP = "charging_stop"
REMOTE_CTL_HEALTHY_CHARGING_ON = "healthy_charging_on"
REMOTE_CTL_HEALTHY_CHARGING_OFF = "healthy_charging_off"
REMOTE_CTL_SUNROOF_OPEN = "sunroof_open"
REMOTE_CTL_SUNROOF_CLOSE = "sunroof_close"
