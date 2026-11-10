# Notices

**Leapmotor for Home Assistant**
Copyright (C) 2026 Sabotin

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version. See [LICENSE](LICENSE).

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

Source code: <https://github.com/Sabotin/LeapBridge>

---

## Third-party code

### LeapConnect (GNU AGPL-3.0)

The trip log, charging-session detection and battery state-of-health estimate
in `custom_components/leapmotor/drive_analytics.py` are ported from
[LeapConnect](https://github.com/markoceri/leapconnect) by Marco Mancino,
licensed under the GNU Affero General Public License v3.0. Changes: adapted to
this integration's polled data and storage, explicit parks at segment
boundaries end a trip, net energy instead of absolute difference, flat
per-tier charging prices, no regenerated-energy estimate and no stored
coordinates.

LeapConnect's time-of-use pricing, trip similarity scoring and maintenance
due/overdue engine are ported into the same module.

### leapmotor-api (GNU AGPL-3.0-or-later)

The remote-control payloads for sentry mode, start/stop charging, healthy
charging and the sunroof (`custom_components/leapmotor/leap_api/remote.py`)
are taken from [leapmotor-api](https://pypi.org/project/leapmotor-api/) 0.6.0
by Marco Mancino, the library LeapConnect uses. Its payloads for actions this
integration already had are identical.

### LeapConnect maintenance packs (MIT)

`custom_components/leapmotor/maintenance_packs.json` bundles the factory and
community schedules from
[leapconnect-maintenance-packs](https://github.com/markoceri/leapconnect-maintenance-packs),
normalised but otherwise unchanged:

```
MIT License

Copyright (c) 2026 markoceri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### leapmotor-ha (MIT)

The Home Assistant integration is based on
[leapmotor-ha](https://github.com/kerniger/leapmotor-ha). Its original licence
notice is reproduced as required:

```
MIT License

Copyright (c) 2026 kerniger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Fonts (SIL Open Font License 1.1)

Outfit and JetBrains Mono, bundled in
`custom_components/leapmotor/frontend/fonts/` with their licence files.
