"""Chalk card thumbnail for can-you-zero-shot-robotics-with-a-coding-agent.

The card shows the article's chalk loop figure, the inline SVG #fig-aspire that
scripts/zero-shot-figures.mjs draws. Its hand font, wobble and grain come from the browser
(chalk.css and the #bb-chalk filter), so the figure is rasterized there first:

1. Build the site and open /robotics/can-you-zero-shot-robotics-with-a-coding-agent/ at a
   900 x 1200 viewport, device scale 2, dark color scheme.
2. Screenshot the <svg aria-labelledby="fig-aspire-t fig-aspire-d"> element to a PNG, for example
   with `chrome-devtools-axi screenshot fig-aspire.png --uid @<uid>`.

Then run from the repository root:
    python3 scripts/zero-shot-thumbnail.py fig-aspire.png
It writes assets/robotics/thumbnails/can-you-zero-shot-robotics-with-a-coding-agent.jpg (720 x 424).
"""

import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

TARGET = ROOT / "assets/robotics/thumbnails/can-you-zero-shot-robotics-with-a-coding-agent.jpg"
# The screenshot edge holds the board's rounded corners on the page color. The drawing keeps
# a 6-unit margin inside its 480-unit viewBox, so 1% of the width comes off each side.
TRIM = 0.01


def main(source):
    """Trim the corners, then contain the figure on the board at the card size."""
    image = Image.open(source).convert("RGB")
    edge = round(image.width * TRIM)
    with tempfile.TemporaryDirectory() as tmp:
        trimmed = Path(tmp) / "fig-aspire.png"
        image.crop((edge, edge, image.width - edge, image.height - edge)).save(trimmed)
        chalk.thumbnail(trimmed, TARGET)
    print(TARGET.relative_to(ROOT))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]))
