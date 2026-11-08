<p align="center">
  <img src="images/dashboard.png" alt="Leapmotor dashboard card" width="100%">
</p>

# Leapmotor dashboard card

A night-sky dashboard for your Leapmotor, shipped inside the integration.
Home Assistant loads it automatically once the integration is set up — there
is no Lovelace resource to add and nothing extra to install from HACS.

```yaml
type: custom:leapmotor-card
```

That is the whole configuration. The card finds your Leapmotor on its own and
follows the language and units of your Home Assistant profile.

---

## Best layout

The card is built as a full dashboard and adapts to the space it gets:

| Width | Layout |
| --- | --- |
| ≥ 1180 px | Three columns, like the screenshot above |
| 760 – 1180 px | Two columns |
| < 760 px | One column, phone layout |

For the full experience create a dedicated dashboard and switch its view to
**Panel (single card)**:

1. **Settings → Dashboards → Add dashboard → New dashboard from scratch**.
2. Open it, click **✎ Edit**, then the pencil next to the view name.
3. Set **View type** to **Panel (single card)** and save.
4. **Add card → Leapmotor** (or *Manual* and paste `type: custom:leapmotor-card`).

In a Sections or Masonry view the card still works and uses the phone layout,
or pick just the parts you want with `sections` (see below).

## Options

| Option | Default | Description |
| --- | --- | --- |
| `device_id` | first Leapmotor | Which vehicle to show when you have more than one. The visual editor offers a picker. |
| `name` | `Leapmotor <model>` | Title shown in the hero. |
| `sections` | all | Any of `hero`, `check`, `chart`, `week`, `charging`, `energy`, `controls`. Order is fixed; the list picks what is shown. |
| `scene` | `auto` | `auto` follows `sun.sun` (day sky / night sky), or force `night` / `day`. |
| `language` | `auto` | `auto` follows your profile. Built in: `en`, `sl`, `de`. |
| `confirm_actions` | `true` | Remote actions need a second tap within 4 seconds. |
| `backdrop` | `true` | Dark rounded backdrop behind the panels, so the card looks right on light themes too. |
| `show_image` | `true` | Show **your own car**: the official render of your model and colour that the integration downloads from the Leapmotor cloud (`image.<model>_vehicle_picture`). Falls back to a drawn silhouette until it is available. |
| `image` | – | Your own picture URL (a transparent PNG works best). |
| `image_flip` | `false` | Mirror the car picture if it faces the other way. |
| `entity_prefix` | – | Only needed if auto-discovery fails, e.g. `c10` for `sensor.c10_battery`. |
| `entities` | – | Override single entities, e.g. `{ battery: sensor.my_battery }`. Keys match the card's internal names (`battery`, `range`, `lock`, `tracker`, …). |

### Examples

A compact phone card with the hero and the charging arc:

```yaml
type: custom:leapmotor-card
sections: [hero, charging]
```

Second vehicle, always at night, without confirmation taps:

```yaml
type: custom:leapmotor-card
device_id: 0123456789abcdef0123456789abcdef
name: Family B10
scene: night
confirm_actions: false
```

## What each panel shows

| Panel | Contents |
| --- | --- |
| **Hero** | Night or day scene with your car, wallbox and animated cable while plugged in. State of charge, lock and driving state, location, range, inside temperature and a metric strip (outside/inside temperature, odometer, charge limit, speed, consumption, data age). |
| **Vehicle check** | One glance answer: *All secure* or *Needs attention*. Lock, doors, windows and sunroof, trunk, tire pressure, battery and data freshness, with Lock/Unlock and Find car buttons. |
| **Last 24 hours** | Battery, range or charging power from the recorder, with charging and driving periods shaded and an icon for what the car was doing every three hours. |
| **Last 7 days** | Kilometres per day from the Leapmotor cloud, with energy and consumption per day. |
| **Charging** | Arc from 0 to 100 % with the charge limit, power, current and voltage, finish time and remaining time. |
| **Energy & tires** | Six-week average consumption on an efficiency scale, four tire pressures and last week's driving/climate/other split. |
| **Remote control** | Climate, quick heat/cool, defrost, battery preheat, steering wheel and mirror heating, charge schedule, trunk, windows, sunshade, cable release and find car — only the ones your car supports. |

Click any value to open Home Assistant's detail dialog for that entity.

## Safety

Remote actions are sent to the real car. With `confirm_actions: true` (default)
every action needs a second tap. Actions that move parts of the car still need
the vehicle PIN configured in the integration.

## Preview without a car

`docs/preview/index.html` renders the card with demo data:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/docs/preview/` in your browser. Use the links
at the top to switch scenario and language.

## Troubleshooting

- **"Custom element doesn't exist: leapmotor-card"** — refresh the browser
  with cache bypass (Ctrl + F5 / ⌘ + Shift + R). In the companion app:
  *Settings → Companion app → Debugging → Reset frontend cache*.
- **"No Leapmotor vehicle found"** — set `entity_prefix` to the part before
  `_battery` in your battery sensor's entity ID.
- **Empty 24-hour chart** — the chart reads Home Assistant's recorder. Check
  that the Leapmotor battery sensor is not excluded from `recorder:`.
