"""Read the numbers behind the MolmoBot canvas back out of the paper.

Source: MolmoBot: Large-Scale Simulation Enables Zero-Shot Manipulation,
arXiv 2603.16861v2 (26 Mar 2026).

- Tables 1, 2, 6, 7 and 8 are HTML tables in the arXiv rendering, read cell by cell.
- Fig. 7 success rates are read from the bar heights in the SVG. The script checks
  each bar against its exact count out of 120 trials.
- The script stops if a quoted sentence is no longer in the paper.

Run from the repository root:
    python3 -I scripts/molmobot-figures.py [cache-dir]
It writes scripts/molmobot-figures.json. It uses only the standard library.
"""

import html.parser
import json
import pathlib
import re
import sys
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
ARXIV = '2603.16861v2'
PAPER_URL = 'https://arxiv.org/html/2603.16861v2'
SVG_URL = 'https://arxiv.org/html/2603.16861v2/real_results_droid_all.svg'
TABLES = {'S3.T1': 'dataset', 'S3.T2': 'prior', 'S5.T6': 'sim',
          'S5.T7': 'single_camera', 'S5.T8': 'rby1_sim'}
MODEL_NAMES = ['π0-DROID', 'π0.5-DROID', 'MolmoBot-Pi0', 'MolmoBot-Img', 'MolmoBot (F=2)']

# Table 6 prints π0.5 Real as 31.3 while the abstract, Sec. 1 and Fig. 7 give 39.2.
# The canvas uses Fig. 7.
TABLE6_NOTE = ('Table 6 prints π0.5 Real as 31.3 while the abstract, Sec. 1 and Fig. 7 give 39.2; '
               'the canvas uses Fig. 7.')

QUOTES = {
    'evaluation_count': 'Cumulatively, each policy is evaluated 120 times.',
    'real_demonstrations': 'Both are trained with >10k hours of real-world manipulation demonstrations',
    'zero_real_robot_data': 'All MolmoBot policies have never seen any real-robot data.',
    'dataset_compute': 'The full MolmoBot-Data dataset was generated in approximately 6,500 GPU-hours.',
    'gpu_setup': 'Using 100 NVIDIA A100 80GB GPUs',
    'figure_variant': 'Here, MolmoBot denotes the MolmoBot (F=2) variant.',
    'retry_limit': 'If more than 3 retries are triggered in an episode, it is terminated and discarded.',
    'door_trials': 'we observed 4 out of 9 trials with handle grasp success and 2 out of 9 trials with door opening success',
    'tabletop_real_success': ('On tabletop pick-and-place, MolmoBot achieves a success rate of 79.2% in real world '
                             'evaluations across 4 settings, outperforming \\pi_{0.5} at 39.2%.'),
    'environment_diversity': 'Environment diversity does not improve performance in either setting',
    'action_chunks': ('We train the action head to predict chunks of H=16 actions and execute 8 before re-querying '
                      'the policy'),
    'flow_timesteps': 'We use T=8 to train all MolmoBots unless otherwise stated',
    'frozen_vision': 'We freeze the vision encoder and the projector weights during training',
}


class Paper(html.parser.HTMLParser):
    """Collect the wanted table cells and plain text, with each formula as its TeX source."""

    def __init__(self, wanted):
        super().__init__(convert_charrefs=True)
        self.wanted, self.tables, self.text = wanted, {}, []
        self.table = self.row = self.cell = None
        self.depth = self.math = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'math':
            self.math += 1
            self._write(attrs.get('alttext', ''))
            return
        if tag == 'figure':
            if self.table:
                self.depth += 1
            elif attrs.get('id') in self.wanted:
                self.table, self.depth = attrs['id'], 1
                self.tables[self.table] = []
        elif self.table and tag == 'tr':
            self.row = []
            self.tables[self.table].append(self.row)
        elif self.table and tag in ('td', 'th') and self.row is not None:
            self.cell = []
            self.row.append(self.cell)

    def handle_endtag(self, tag):
        if tag == 'math':
            self.math = max(0, self.math - 1)
        elif tag in ('td', 'th'):
            self.cell = None
        elif tag in ('tr', 'table'):
            self.row = self.cell = None
        elif tag == 'figure' and self.table:
            self.depth -= 1
            if not self.depth:
                self.table = self.row = self.cell = None

    def handle_data(self, data):
        if not self.math:
            self._write(data)

    def _write(self, value):
        self.text.append(value)
        if self.cell is not None:
            self.cell.append(value)


class SVG(html.parser.HTMLParser):
    """Collect SVG path attributes."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paths = []

    def handle_starttag(self, tag, attrs):
        if tag == 'path':
            self.paths.append(dict(attrs))


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def clean(cell):
    return ' '.join(''.join(cell).split())


def paper_tables(path):
    parser = Paper(set(TABLES))
    parser.feed(path.read_text(encoding='utf-8'))
    text = ' '.join(''.join(parser.text).split())
    require('MolmoB' in text or 'MolmoBot' in text, 'not the MolmoBot paper')
    for figure_id in TABLES:
        require(figure_id in parser.tables, f'table {figure_id} not found in the paper')
    return {TABLES[key]: parser.tables[key] for key in TABLES}, text


def table_rows(table, name):
    require(bool(table), f'{name}: table has no header row')
    columns = [clean(cell) for cell in table[0]]
    rows = []
    for raw in table[1:]:
        cells = [clean(cell) for cell in raw]
        if not cells or not cells[0]:
            continue
        require(len(cells) == len(columns), f'{name}: row has {len(cells)} cells, expected {len(columns)}')
        rows.append(cells)
    return columns, rows


def model_name(value):
    value = value.replace(r'\pi_{0.5}', 'π0.5').replace(r'\pi_{0}', 'π0')
    return re.sub(r'\s*\[\d+\]$', '', value)


def first_number(value):
    value = value.strip()
    if value in ('N/A', '–', '-'):
        return None
    match = re.search(r'-?\d+(?:\.\d+)?', value)
    return float(match.group()) if match else None


def read_real(svg_path):
    parser = SVG()
    parser.feed(svg_path.read_text(encoding='utf-8'))
    number = r'-?\d+(?:\.\d+)?'
    clip_re = re.compile(rf'^M{number}\s+({number})H{number}V({number})H{number}Z$')
    clip = None
    for path in parser.paths:
        match = clip_re.fullmatch(path.get('d', ''))
        if match:
            start, end = map(float, match.groups())
            if abs(start - 28.860625) < 1e-6 and abs(end - 129.92063) < 1e-6:
                clip = (start, end)
                break
    require(clip is not None, 'Fig. 7 plot clip box not found in the SVG')
    baseline, top = clip

    bar_re = re.compile(rf'^M{number}\s+({number})H{number}V({number})H{number}Z$')
    bars = []
    for path in parser.paths:
        if path.get('transform') != 'matrix(1,0,0,-1,0,144)' or path.get('fill') not in ('#a6a6a6', '#f0529c'):
            continue
        match = bar_re.fullmatch(path.get('d', ''))
        require(match is not None, 'Fig. 7 bar has an unexpected SVG path')
        low, high = map(float, match.groups())
        require(abs(low - baseline) < 1e-6, 'Fig. 7 bar does not start at the 0% baseline')
        bars.append((high, path['fill']))

    require(len(bars) == len(MODEL_NAMES), f'Fig. 7 has {len(bars)} filled bars, expected {len(MODEL_NAMES)}')
    require([fill for _, fill in bars].count('#a6a6a6') == 2 and
            [fill for _, fill in bars][:2] == ['#a6a6a6', '#a6a6a6'],
            'Fig. 7 gray bars are not the first two bars')

    values = {}
    for name, (height, fill) in zip(MODEL_NAMES, bars):
        percent = (height - baseline) / (top - baseline) * 100
        rounded = round(percent, 2)
        successes = round(percent * 120 / 100)
        require(abs(percent - successes / 120 * 100) <= 0.05,
                f'Fig. 7 {name} bar is not an exact count out of 120')
        values[name] = {'percent': rounded, 'successes': successes,
                        'real_data': fill == '#a6a6a6'}
    return {'trials': 120, 'bars': values}


def extract(html_path, svg_path):
    tables, text = paper_tables(html_path)
    dataset_columns, dataset_rows = table_rows(tables['dataset'], 'Table 1')
    prior_columns, prior_rows = table_rows(tables['prior'], 'Table 2')
    sim_columns, sim_rows = table_rows(tables['sim'], 'Table 6')
    single_columns, single_rows = table_rows(tables['single_camera'], 'Table 7')
    rby1_columns, rby1_rows = table_rows(tables['rby1_sim'], 'Table 8')

    for row in prior_rows:
        row[2] = row[2].replace(r'\sim', '~')

    sim = {model_name(row[0]): [first_number(value) for value in row[1:]] for row in sim_rows}
    single_camera = {model_name(row[0]): [first_number(value) for value in row[1:]] for row in single_rows}
    rby1_sim = {row[0]: {column: first_number(value) for column, value in zip(rby1_columns[1:], row[1:])}
                for row in rby1_rows}
    real = read_real(svg_path)

    dataset_total = next((row for row in dataset_rows if row[0] == 'Total'), None)
    require(dataset_total is not None and dataset_total[2] == '1.7M' and
            dataset_total[7] == '5,704 h' and dataset_total[5] == '94.2k',
            'Table 1 Total row must report 1.7M episodes, 5,704 h and 94.2k environments')
    droid = next((row for row in prior_rows if row[0].startswith('DROID')), None)
    require(droid is not None and droid[2:5] == ['76k', '350', '564'],
            'Table 2 DROID row must report 76k episodes, 350 hours and 564 environments')
    require(sim.get('MolmoBot (F=2)', [None])[-1] == 79.2,
            'Table 6 MolmoBot (F=2) Real value must be 79.2')
    require(sim.get('MolmoBot-Pi0', [None])[-1] == 46.7,
            'Table 6 MolmoBot-Pi0 Real value must be 46.7')
    require(abs(real['bars']['MolmoBot (F=2)']['percent'] - 79.2) <= 0.05,
            'Fig. 7 MolmoBot (F=2) must match Table 6 value 79.2 within 0.05')
    require(abs(real['bars']['MolmoBot-Pi0']['percent'] - 46.7) <= 0.05,
            'Fig. 7 MolmoBot-Pi0 must match Table 6 value 46.7 within 0.05')

    for quote in QUOTES.values():
        require(quote in text, f'quote not found in the paper: {quote}')

    data = {
        'paper': {'arxiv': ARXIV, 'url': 'https://arxiv.org/abs/2603.16861'},
        'dataset': {'columns': dataset_columns, 'rows': dataset_rows},
        'prior': {'columns': prior_columns, 'rows': prior_rows},
        'sim': {'columns': sim_columns[1:], 'rows': sim},
        'single_camera': single_camera,
        'rby1_sim': rby1_sim,
        'real': real,
        'quotes': QUOTES,
        'notes': [TABLE6_NOTE],
    }
    return data


def main():
    cache = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if cache is not None and (cache / 'v2.html').is_file() and (cache / 'fig7.svg').is_file():
        data = extract(cache / 'v2.html', cache / 'fig7.svg')
    else:
        with tempfile.TemporaryDirectory() as temporary:
            source = pathlib.Path(temporary)
            urllib.request.urlretrieve(PAPER_URL, source / 'v2.html')
            urllib.request.urlretrieve(SVG_URL, source / 'fig7.svg')
            data = extract(source / 'v2.html', source / 'fig7.svg')

    target = ROOT / 'scripts/molmobot-figures.json'
    target.write_text(json.dumps(data, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Wrote {target.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
