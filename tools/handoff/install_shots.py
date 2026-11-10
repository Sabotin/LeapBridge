"""Copy the generated screenshots into docs/images (PNG optimised, themes as WebP)."""
import sys
from pathlib import Path
from PIL import Image

src, repo = Path(sys.argv[1]), Path(sys.argv[2])
images = repo / "docs" / "images"
plan = {"dashboard.png": images / "dashboard.png", "nadzorna-plosca.png": images / "sl" / "nadzorna-plosca.png",
        "en_journey.png": images / "en" / "journey.png", "sl_pot.png": images / "sl" / "pot.png"}
for name in ("overview", "trips", "charging", "vehicle", "journey"):
    plan[f"en_page-{name}.png"] = images / "en" / f"page-{name}.png"
for name in ("pregled", "voznje", "polnjenje", "vozilo", "pot"):
    plan[f"sl_stran-{name}.png"] = images / "sl" / f"stran-{name}.png"
for look in ("classic", "cluster", "console"):
    for kind in ("wide", "drive", "phone"):
        plan[f"looks_{look}-{kind}.png"] = images / "looks" / f"{look}-{kind}.webp"
plan["looks_settings.png"] = images / "looks" / "settings.webp"
for name, target in plan.items():
    image = Image.open(src / name).convert("RGB")
    if target.suffix == ".webp":
        image.save(target, "WEBP", quality=86, method=6)
    else:
        image.save(target, "PNG", optimize=True)
    print(f"{target.relative_to(repo)}  {image.size[0]}x{image.size[1]}  {target.stat().st_size // 1024} kB")
