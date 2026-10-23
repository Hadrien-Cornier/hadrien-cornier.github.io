"""Read the numbers behind the Offline Empowerment canvas back out of the paper.

Source: Garg, Myers, Li, Ji, Eysenbach and Levine, "Measuring Empowerment from Offline Data for
Intrinsically Motivated Exploration", arXiv 2610.24461v1 (17 Oct 2026).

- Fig. 1b (antmaze-medium-navigate-v0) is a raster heat map. Each pixel colour is matched to the
  nearest colour on the figure's own colour bar and converted to nats with the bar's ticks.
- Fig. 4 is vector graphics in the PDF. The antmaze-medium / navigate success curves are read from
  the drawing paths, so the points are the plotted (smoothed) means, not re-estimated values.

Run from the repository root:
    uv run --no-project --with pymupdf==1.26.4 --with pillow==11.3.0 --with numpy==2.3.3 \
        python scripts/offline-empowerment-figures.py [cache-dir]
It writes scripts/offline-empowerment-figures.json.
"""

import json
import pathlib
import sys
import tempfile
import urllib.request

import numpy as np
import pymupdf
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PDF_URL = 'https://arxiv.org/pdf/2610.24461v1'
MAP_URL = 'https://arxiv.org/html/2610.24461v1/antmaze_medium_navigate_empowerment.png'

# OGBench medium maze, rows from the top of Fig. 1b (its y axis points up, so this is maze_map[6..1]).
MAZE = [
    [0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 0],
    [1, 0, 0, 0, 1, 1],
    [0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0],
]
SUB = 4  # samples per cell side

# Section 6.3: where adding the bonus to CRL helps, and where it is on par.
TALLY = [
    ('cube-single', 'play', 'better'), ('cube-single', 'noisy', 'better'),
    ('antmaze-medium', 'navigate', 'better'), ('antmaze-medium', 'stitch', 'better'),
    ('pointmaze-teleport', 'stitch', 'better'), ('antmaze-medium', 'explore', 'on par'),
    ('pointmaze-teleport', 'navigate', 'on par'), ('antsoccer-arena', 'navigate', 'on par'),
    ('antsoccer-arena', 'stitch', 'on par'),
]


def fetch(url, path):
    if not path.exists():
        urllib.request.urlretrieve(url, path)
    return path


def empowerment_map(png):
    image = np.asarray(Image.open(png).convert('RGB')).astype(float)
    x0, y0, cell = 20.0, 20.0, (528 - 20) / 6  # maze extent in pixels, measured on the figure
    bar = image[21:529, 552:560].mean(1)  # colour bar, top is high
    bar_value = 1.3 - (np.arange(21, 529) - 72) * (0.7 / (481 - 72))  # ticks 1.3 at y=72 ... 0.6 at y=481
    grid, worst = [], 0.0
    for r in range(6 * SUB):
        row = []
        for c in range(6 * SUB):
            if MAZE[r // SUB][c // SUB]:
                row.append(None)
                continue
            left, top = x0 + c * cell / SUB, y0 + r * cell / SUB
            patch = image[int(top) + 2:int(top + cell / SUB) - 1, int(left) + 2:int(left + cell / SUB) - 1].reshape(-1, 3)
            distance = ((bar[None] - patch[:, None]) ** 2).sum(2)
            worst = max(worst, float(np.median(np.sqrt(distance.min(1)))))
            row.append(round(float(np.median(bar_value[distance.argmin(1)])), 3))
        grid.append(row)
    assert worst < 5, f'colours do not match the colour bar (median RGB error {worst:.1f})'
    return grid


def success_curves(pdf):
    page = pymupdf.open(pdf)[8]
    drawings, words = page.get_drawings(), page.get_text('words')
    panels = [d['rect'] for d in drawings if d['type'] == 'f' and d.get('fill') == (1.0, 1.0, 1.0)
              and 40 < d['rect'].width < 60 and 30 < d['rect'].height < 50]
    found = {}
    for rect in panels:
        title = ' '.join(w[4] for w in words if rect.x0 - 3 <= w[0] <= rect.x1 and rect.y0 - 14 <= w[3] <= rect.y0 + 1)
        if title != 'antmaze-medium navigate':
            continue
        family = 'supe' if rect.y0 > 400 else 'crl'  # panel (b) sits lower on the page
        xmax = [w[4] for w in words if rect.x0 - 6 <= w[0] <= rect.x1 + 6 and rect.y1 + 1 <= w[1] <= rect.y1 + 9][-1]
        curves = []
        for d in drawings:
            box = d['rect']
            if d['type'] != 's' or abs((d.get('width') or 0) - 0.8) > 0.01:
                continue
            if not (box.x0 >= rect.x0 - .5 and box.x1 <= rect.x1 + .5 and box.y0 >= rect.y0 - .5 and box.y1 <= rect.y1 + .5):
                continue
            points = []
            for item in d['items']:
                if item[0] == 'l':
                    for p in (item[1], item[2]):
                        point = [round((p.x - rect.x0) / rect.width, 4), round((rect.y1 - p.y) / rect.height, 4)]
                        if not points or points[-1] != point:
                            points.append(point)
            color = tuple(round(v, 2) for v in d['color'])
            curves.append({'color': color, 'dashed': bool(d.get('dashes', '').strip('[] 0')), 'points': points})
        found[family] = {'xmax': xmax, 'curves': curves}
    # Fig. 4 legend: CRL grey dotted, CRL + Empowerment blue, CRL + RND orange dashed,
    # CRL + RND + Empowerment orange solid; SUPE pink dashed, SUPE + Empowerment blue.
    names = {
        'crl': {((0.54, 0.54, 0.5), True): 'CRL', ((0.16, 0.47, 0.84), False): 'CRL + Emp',
                ((0.92, 0.41, 0.2), True): 'CRL + RND', ((0.92, 0.41, 0.2), False): 'CRL + RND + Emp'},
        'supe': {((0.91, 0.48, 0.64), True): 'SUPE', ((0.16, 0.47, 0.84), False): 'SUPE + Emp'},
    }
    out = {}
    for family, panel in found.items():
        series = {names[family][(c['color'], c['dashed'])]: c['points'] for c in panel['curves']}
        assert set(series) == set(names[family].values()), f'{family}: unexpected curves {sorted(series)}'
        out[family] = {'xmax': panel['xmax'], 'series': series}
    assert set(out) == {'crl', 'supe'}, 'expected both antmaze-medium navigate panels'
    return out


def main():
    cache = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(tempfile.mkdtemp())
    cache.mkdir(parents=True, exist_ok=True)
    data = {
        'source': {'paper': 'arXiv 2610.24461v1', 'map': 'Fig. 1b, antmaze-medium-navigate-v0', 'curves': 'Fig. 4, antmaze-medium / navigate, 5 seeds', 'tally': 'Section 6.3'},
        'map': {'units': 'nats', 'top_row': 'maze top (y up, as in Fig. 1b)', 'sub': SUB, 'maze': MAZE, 'grid': empowerment_map(fetch(MAP_URL, cache / 'map.png'))},
        'curves': success_curves(fetch(PDF_URL, cache / 'paper.pdf')),
        'tally': [{'task': t, 'dataset': d, 'vs_crl': v} for t, d, v in TALLY],
    }
    target = ROOT / 'scripts/offline-empowerment-figures.json'
    target.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(f'Wrote {target.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
