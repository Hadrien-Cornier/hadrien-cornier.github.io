#!/usr/bin/env python3
"""Generate the static chalk figures for the SO-101 series, parts 1 to 4.

    python3 scripts/so101_figures.py          # every part
    python3 scripts/so101_figures.py 2 3      # only parts 2 and 3
    python3 scripts/so101_figures.py 2 tick_rounding   # one figure

Part 7 has its own script: scripts/so101_part7_figures.py.
"""

import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from so101_common import set_style  # noqa: E402

PARTS = (1, 2, 3, 4)


def main(argv):
    set_style()
    parts = [int(arg) for arg in argv if arg.isdigit()] or list(PARTS)
    only = {arg for arg in argv if not arg.isdigit()}
    for part in parts:
        module = importlib.import_module(f"so101_part{part}_figures")
        for make_figure in module.FIGURES:
            if only and make_figure.__name__ not in only:
                continue
            make_figure()
            print(f"part {part}: wrote {make_figure.__name__}")


if __name__ == "__main__":
    main(sys.argv[1:])
