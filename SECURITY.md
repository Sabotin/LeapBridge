# Security Policy

## Reporting

Please report security issues privately instead of opening a public issue. Public
issues must not include credentials, account certificates, tokens, VINs, exact
vehicle locations, or raw diagnostic dumps.

## Secrets

The app certificate pair (`app_cert.pem` and `app_key.pem`) is app-level
material, the same for every user. It is published on purpose in the
[`certs`](certs) folder, and the integration downloads it from there when you
ask for it (setup, options or the repair for a missing pair). It identifies the
app, not you or your car, and is of no use without an account's password.

Never commit or upload:

- the account certificate and key the Leapmotor cloud issues to your account
  after login
- Leapmotor passwords or vehicle PINs
- API tokens for ABRP, Home Assistant, or other services
- raw API traces containing headers, cookies, VINs, or locations

If a secret was posted publicly, revoke or rotate it immediately where possible.

## Supported Scope

This project supports local Home Assistant use with a user's own Leapmotor
account and vehicle. It does not support credential sharing, bypassing account
controls, extracting third-party secrets, or accessing vehicles that the user is
not authorized to use.

