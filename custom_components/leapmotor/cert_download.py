"""Download the Leapmotor app certificate pair from this project's repository.

The pair is kept in the ``certs`` folder of https://github.com/Sabotin/LeapBridge
and is fetched only when the user asks for it (setup, options or a repair). It
is not part of the installed integration.

Three independent addresses are tried, so one of them failing does not matter:
GitHub's file server, the same files through github.com, and the jsDelivr
mirror of the repository.

A pair is only installed after it was parsed and the private key was checked
against the certificate, and it replaces the old files atomically. A failed
download therefore never damages certificates that already work.

This module has no Home Assistant imports; it runs in an executor thread.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import logging
import os
from pathlib import Path
import re
import tempfile
import time
from typing import Any
from urllib.parse import urlsplit

import requests

from .const import STATIC_APP_CERT, STATIC_APP_KEY

_LOGGER = logging.getLogger(__name__)

CERT_REPOSITORY = "Sabotin/LeapBridge"
CERT_FOLDER = "certs"
CERT_REPOSITORY_URL = f"https://github.com/{CERT_REPOSITORY}/tree/main/{CERT_FOLDER}"

#: (name for the log, address of the folder)
_BASES: tuple[tuple[str, str], ...] = (
    ("GitHub", f"https://raw.githubusercontent.com/{CERT_REPOSITORY}/HEAD/{CERT_FOLDER}"),
    ("github.com", f"https://github.com/{CERT_REPOSITORY}/raw/HEAD/{CERT_FOLDER}"),
    ("jsDelivr mirror", f"https://cdn.jsdelivr.net/gh/{CERT_REPOSITORY}@main/{CERT_FOLDER}"),
)

#: File names the pair may be stored under.
_PAIR_NAMES: tuple[tuple[str, str], ...] = (
    ("app_cert.pem", "app_key.pem"),
    ("app.crt", "app.key"),
    ("app_cert.crt", "app_key.key"),
)

_USER_AGENT = "LeapBridge-HomeAssistant"
_CONNECT_TIMEOUT = 8.0
_READ_TIMEOUT = 15.0
_ATTEMPTS = 3
_RETRY_WAIT_SECONDS = 1.0
#: The whole download gives up after this long, however many routes are left.
_DEADLINE_SECONDS = 60.0
#: A PEM certificate or key is a few kilobytes; anything much larger is not one.
_MAX_FILE_BYTES = 64 * 1024

_PEM_BLOCK = re.compile(
    rb"-----BEGIN ([A-Z0-9 ]+)-----\r?\n.*?\r?\n-----END \1-----",
    re.DOTALL,
)
_CERTIFICATE_LABEL = "CERTIFICATE"
_KEY_LABEL_SUFFIX = "PRIVATE KEY"

REASON_CANNOT_CONNECT = "cert_download_cannot_connect"
REASON_NOT_FOUND = "cert_download_not_found"
REASON_INVALID = "cert_download_invalid"
REASON_WRITE_FAILED = "cert_download_write_failed"


class CertificateDownloadError(Exception):
    """The certificate pair could not be downloaded or installed.

    ``reason`` is a translation key for the setup and options dialogs.
    """

    def __init__(self, reason: str, detail: str) -> None:
        super().__init__(detail)
        self.reason = reason
        self.detail = detail


class InvalidCertificatePair(ValueError):
    """Downloaded or supplied files are not a usable certificate and key."""


@dataclass(frozen=True, slots=True)
class CertificatePair:
    """A checked certificate and private key, as clean PEM text."""

    cert_pem: bytes
    key_pem: bytes
    subject: str
    not_after: datetime | None
    fingerprint_sha256: str

    @property
    def expired(self) -> bool:
        """Return whether the certificate's validity period is over."""
        return self.not_after is not None and self.not_after < datetime.now(UTC)


@dataclass(frozen=True, slots=True)
class CertificateDownloadResult:
    """What a successful download installed."""

    source: str
    changed: bool
    subject: str
    not_after: datetime | None
    expired: bool
    fingerprint_sha256: str


class _SourceUnavailable(Exception):
    """One route could not be read (network, rate limit, server error)."""


def _pem_blocks(data: bytes) -> list[tuple[str, bytes]]:
    """Return the PEM blocks of a file, without the text around them."""
    return [
        (match.group(1).decode("ascii"), match.group(0).replace(b"\r\n", b"\n"))
        for match in _PEM_BLOCK.finditer(data)
    ]


def check_certificate_pair(cert_data: bytes, key_data: bytes) -> CertificatePair:
    """Parse a certificate and key and make sure they belong together.

    Text around the PEM blocks (such as the "Bag Attributes" lines of an
    exported file) is dropped, so the stored files are plain PEM.
    """
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization

    cert_blocks = [block for label, block in _pem_blocks(cert_data) if label == _CERTIFICATE_LABEL]
    key_blocks = [
        (label, block)
        for label, block in _pem_blocks(key_data)
        if label.endswith(_KEY_LABEL_SUFFIX)
    ]
    if not cert_blocks:
        raise InvalidCertificatePair("the certificate file contains no PEM certificate")
    if not key_blocks:
        raise InvalidCertificatePair("the key file contains no PEM private key")
    key_label, key_pem = key_blocks[0]
    if key_label.startswith("ENCRYPTED"):
        raise InvalidCertificatePair("the private key is encrypted")

    try:
        certificate = x509.load_pem_x509_certificate(cert_blocks[0])
    except Exception as exc:  # noqa: BLE001 - any parse failure is a bad certificate
        raise InvalidCertificatePair(f"the certificate cannot be read: {exc}") from exc
    try:
        private_key = serialization.load_pem_private_key(key_pem, password=None)
    except Exception as exc:  # noqa: BLE001 - any parse failure is a bad key
        raise InvalidCertificatePair(f"the private key cannot be read: {exc}") from exc

    spki = (serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    if certificate.public_key().public_bytes(*spki) != private_key.public_key().public_bytes(*spki):
        raise InvalidCertificatePair("the private key does not belong to the certificate")

    # cryptography 42 added the timezone-aware property; older ones are naive UTC.
    not_after = getattr(certificate, "not_valid_after_utc", None)
    if not_after is None:
        naive = getattr(certificate, "not_valid_after", None)
        not_after = naive.replace(tzinfo=UTC) if naive is not None else None
    return CertificatePair(
        # Keep a certificate chain, if the file has one, in its order.
        cert_pem=b"\n".join(cert_blocks) + b"\n",
        key_pem=key_pem + b"\n",
        subject=certificate.subject.rfc4514_string(),
        not_after=not_after,
        fingerprint_sha256=certificate.fingerprint(hashes.SHA256()).hex(),
    )


class _Fetcher:
    """HTTP reads with retries, a size limit and one overall deadline."""

    def __init__(self, session: Any, *, deadline_seconds: float = _DEADLINE_SECONDS) -> None:
        self._session = session
        self._deadline = time.monotonic() + deadline_seconds
        self._dead_hosts: set[str] = set()

    def _remaining(self) -> float:
        return self._deadline - time.monotonic()

    def get(self, url: str, *, accept: str = "*/*") -> bytes | None:
        """Return the body, or None when the file does not exist (HTTP 404)."""
        host = urlsplit(url).hostname or ""
        if host in self._dead_hosts:
            raise _SourceUnavailable(f"{host} is not reachable")
        last_error = "no attempt made"
        for attempt in range(1, _ATTEMPTS + 1):
            remaining = self._remaining()
            if remaining <= 0:
                raise _SourceUnavailable("the download took too long")
            try:
                response = self._session.get(
                    url,
                    headers={"User-Agent": _USER_AGENT, "Accept": accept},
                    timeout=(min(_CONNECT_TIMEOUT, remaining), min(_READ_TIMEOUT, remaining)),
                    allow_redirects=True,
                    stream=True,
                )
            except requests.RequestException as exc:
                last_error = f"{exc.__class__.__name__}: {exc}"
            else:
                try:
                    status = response.status_code
                    if status == 200:
                        return self._read_body(response, url)
                    if status in (404, 410):
                        return None
                    last_error = f"HTTP {status}"
                    if status < 500:
                        # Rate limit or refusal: asking again right away does not help.
                        raise _SourceUnavailable(f"{host} answered {last_error}")
                except requests.RequestException as exc:
                    last_error = f"{exc.__class__.__name__}: {exc}"
                finally:
                    response.close()
            if attempt < _ATTEMPTS:
                time.sleep(min(_RETRY_WAIT_SECONDS * attempt, max(self._remaining(), 0)))
        # Do not wait for the same host again on the remaining routes.
        self._dead_hosts.add(host)
        raise _SourceUnavailable(f"{host}: {last_error}")

    @staticmethod
    def _read_body(response: Any, url: str) -> bytes:
        chunks: list[bytes] = []
        size = 0
        for chunk in response.iter_content(chunk_size=8192):
            size += len(chunk)
            if size > _MAX_FILE_BYTES:
                raise _SourceUnavailable(f"{url} is larger than a certificate file")
            chunks.append(chunk)
        return b"".join(chunks)


def _pair_from_base(fetcher: _Fetcher, base_url: str) -> tuple[bytes, bytes] | None:
    """Read the pair below one address, under any of its known file names."""
    for cert_name, key_name in _PAIR_NAMES:
        cert_data = fetcher.get(f"{base_url}/{cert_name}")
        if cert_data is None:
            continue
        key_data = fetcher.get(f"{base_url}/{key_name}")
        if key_data is not None:
            return cert_data, key_data
    return None


_SOURCES = tuple(
    (label, lambda fetcher, base=base: _pair_from_base(fetcher, base)) for label, base in _BASES
)


def fetch_certificate_pair(session: Any | None = None) -> tuple[CertificatePair, str]:
    """Download and check the pair. Returns it with the route that delivered it."""
    own_session = session is None
    session = session or requests.Session()
    fetcher = _Fetcher(session)
    unreachable: list[str] = []
    invalid: list[str] = []
    try:
        for label, source in _SOURCES:
            try:
                files = source(fetcher)
            except _SourceUnavailable as exc:
                unreachable.append(f"{label}: {exc}")
                _LOGGER.debug("Leapmotor certificate download, %s failed: %s", label, exc)
                continue
            if files is None:
                _LOGGER.debug("Leapmotor certificate download, %s has no certificate pair", label)
                continue
            try:
                return check_certificate_pair(*files), label
            except InvalidCertificatePair as exc:
                invalid.append(f"{label}: {exc}")
                _LOGGER.debug("Leapmotor certificate download, %s is not usable: %s", label, exc)
    finally:
        if own_session:
            session.close()

    if unreachable:
        raise CertificateDownloadError(REASON_CANNOT_CONNECT, "; ".join(unreachable + invalid))
    if invalid:
        raise CertificateDownloadError(REASON_INVALID, "; ".join(invalid))
    raise CertificateDownloadError(
        REASON_NOT_FOUND, f"no certificate pair was found in {CERT_REPOSITORY_URL}"
    )


def _write_private(directory: Path, data: bytes, mode: int) -> Path:
    """Write a temporary file next to its final place, already with its mode."""
    descriptor, name = tempfile.mkstemp(dir=directory, prefix=".download-", suffix=".tmp")
    path = Path(name)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(path, mode)
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    return path


def _read_or_none(path: Path) -> bytes | None:
    try:
        return path.read_bytes()
    except OSError:
        return None


def install_certificate_pair(cert_dir: str | Path, pair: CertificatePair) -> bool:
    """Store the pair as app_cert.pem and app_key.pem. Returns whether files changed.

    Both files are written completely first and then moved into place, so a
    reader never sees half a file; when the second move fails, the first file
    is put back, so the two files always belong together.
    """
    directory = Path(cert_dir)
    cert_path = directory / STATIC_APP_CERT
    key_path = directory / STATIC_APP_KEY
    try:
        directory.mkdir(parents=True, exist_ok=True)
        old_cert = _read_or_none(cert_path)
        old_key = _read_or_none(key_path)
        if old_cert == pair.cert_pem and old_key == pair.key_pem:
            # Same content; only make sure the key is not readable by others.
            os.chmod(key_path, 0o600)
            return False
        new_key = _write_private(directory, pair.key_pem, 0o600)
        try:
            new_cert = _write_private(directory, pair.cert_pem, 0o644)
        except BaseException:
            new_key.unlink(missing_ok=True)
            raise
        try:
            os.replace(new_key, key_path)
            try:
                os.replace(new_cert, cert_path)
            except BaseException:
                if old_key is None:
                    key_path.unlink(missing_ok=True)
                else:
                    os.replace(_write_private(directory, old_key, 0o600), key_path)
                raise
        finally:
            new_key.unlink(missing_ok=True)
            new_cert.unlink(missing_ok=True)
    except OSError as exc:
        raise CertificateDownloadError(
            REASON_WRITE_FAILED, f"could not store the certificates in {directory}: {exc}"
        ) from exc
    return True


def download_app_certificates(
    cert_dir: str | Path, *, session: Any | None = None
) -> CertificateDownloadResult:
    """Download the certificate pair, check it and install it in ``cert_dir``."""
    pair, source = fetch_certificate_pair(session)
    changed = install_certificate_pair(cert_dir, pair)
    if pair.expired:
        _LOGGER.warning(
            "The downloaded Leapmotor app certificate expired on %s; login may be refused",
            pair.not_after,
        )
    _LOGGER.info(
        "Leapmotor app certificates %s from %s (%s), valid until %s",
        "installed" if changed else "already up to date",
        CERT_REPOSITORY_URL,
        source,
        pair.not_after,
    )
    return CertificateDownloadResult(
        source=source,
        changed=changed,
        subject=pair.subject,
        not_after=pair.not_after,
        expired=pair.expired,
        fingerprint_sha256=pair.fingerprint_sha256,
    )


__all__ = [
    "CERT_REPOSITORY",
    "CERT_REPOSITORY_URL",
    "CertificateDownloadError",
    "CertificateDownloadResult",
    "CertificatePair",
    "InvalidCertificatePair",
    "check_certificate_pair",
    "download_app_certificates",
    "fetch_certificate_pair",
    "install_certificate_pair",
]
