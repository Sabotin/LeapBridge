# Leapmotor app certificates

`app_cert.pem` and `app_key.pem` are the app-level client certificate and key
the Leapmotor cloud asks for when logging in. The integration downloads them
from this folder when you choose **Download from GitHub** during setup, in the
account options or in the repair for a missing pair, and stores them in
`/config/leapmotor/`. They are not part of the installed integration.

## Credits

The certificate pair comes from
[leapmotor-certs](https://github.com/markoceri/leapmotor-certs) by Marco Mancino
([markoceri](https://github.com/markoceri)), the author of
[LeapConnect](https://github.com/markoceri/leapconnect). The files here are the
pair of its release v1.0.0, reduced to the plain PEM blocks. Thank you, Marco.
