"""Chalk thumbnail for content/robotics/how-robot-control-is-changing.md.

Source: assets/robotics/modern-control/moved-target-preview.svg (recorded in
content/robotics/thumbnail-sources.json). The script maps the light palette of that
drawing to the shared chalk colors, sets the hand font, renders it with headless
Chrome at twice the card size, applies the chalk grain, and writes the 720 x 424 card.
The SVG geometry and words stay as they are. Colors that are already chalk pass through.

Run: python3 scripts/how_robot_control_thumbnail.py [--chrome <Chrome binary>]
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

SOURCE = ROOT / "assets/robotics/modern-control/moved-target-preview.svg"
TARGET = ROOT / "assets/robotics/thumbnails/how-robot-control-is-changing.jpg"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WIDTH, HEIGHT = 720, 424

# Light palette of the drawing -> chalk, by role.
COLORS = {
    "#f1f2ed": chalk.BOARD,    # page
    "#f8f8f2": chalk.BOARD_2,  # the two panels
    "#d4d9cd": chalk.FAINT,    # panel edges
    "#242924": chalk.CHALK,    # titles and captions
    "#77806f": chalk.DIM,      # panel numbers and the view note
    "#323a34": chalk.CHALK,    # arm outline, joints, gripper
    "#d4dacf": chalk.BOARD,    # inside of the arm links, so a link reads as a chalk outline
    "#f6f6ef": chalk.BOARD,    # joint discs
    "#dce0d7": chalk.BOARD_2,  # arm base
    "#a1ab9a": chalk.DIM,
    "#e0e5d9": chalk.BOARD_2,  # tray
    "#98a58c": chalk.DIM,
    "#edf0e7": chalk.BOARD,
    "#bbc5b2": chalk.FAINT,
    "#9caa93": chalk.DIM,      # dashed old cube position
    "#b84d2e": chalk.RED,      # cube and move arrow
    "#8f3e27": chalk.RED,
    "#d99474": chalk.CHALK,    # cube highlight
}
FONT_FAMILIES = ("Arial, Helvetica, sans-serif", "ui-monospace, monospace")


def chalk_svg(svg: str) -> str:
    for old, new in COLORS.items():
        svg = re.sub(re.escape(old), new, svg, flags=re.IGNORECASE)
    for family in FONT_FAMILIES:
        svg = svg.replace(f'font-family="{family}"', "font-family=\"'Patrick Hand', sans-serif\"")
    return svg


def render(svg: str, chrome: str, scale: int = 2) -> Image.Image:
    font = (ROOT / "assets/robotics/chalk/fonts/PatrickHand-Regular.ttf").as_uri()
    page = (
        "<!doctype html><meta charset='utf-8'><style>"
        f"@font-face{{font-family:'Patrick Hand';src:url('{font}') format('truetype');}}"
        f"html,body{{margin:0;background:{chalk.BOARD};}}svg{{display:block;width:{WIDTH}px;height:{HEIGHT}px}}"
        f"</style>{svg}"
    )
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / "card.html"
        png = Path(tmp) / "card.png"
        html.write_text(page, encoding="utf-8")
        subprocess.run(
            [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
             f"--force-device-scale-factor={scale}", f"--window-size={WIDTH},{HEIGHT}",
             "--virtual-time-budget=3000", f"--screenshot={png}", html.as_uri()],
            check=True, capture_output=True,
        )
        return Image.open(png).convert("RGB")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--chrome", default=os.environ.get("CHROME", CHROME))
    args = parser.parse_args()
    image = render(chalk_svg(SOURCE.read_text(encoding="utf-8")), args.chrome)
    image = Image.fromarray(chalk.chalk_grain(np.asarray(image), scale=image.width / WIDTH))
    image = image.resize((WIDTH, HEIGHT), Image.LANCZOS)
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    image.save(TARGET, quality=90, optimize=True, progressive=True)
    print(TARGET.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
