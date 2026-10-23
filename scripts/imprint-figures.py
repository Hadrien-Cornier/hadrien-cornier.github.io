"""Read the numbers behind the Imprint canvas back out of the paper.

Source: Wu, Shah, Huang, Sontakke, Bharadhwaj, Bajcsy, Simchowitz and Shi, "Memory Without Curation:
Learning Multi-Stream Latent Memory for Robot Policies", arXiv 2610.14406v1 (9 Oct 2026).

- Tables 10, 11, 12, 15, 16, 17 and 18 are HTML tables in the arXiv rendering, read cell by cell.
- The Fig. 6 latencies are quoted in Sec. 5.2, 5.3 and App. C.5. Each one is stored with the sentence
  it comes from, and the script stops if a sentence is no longer in the paper.

Run from the repository root:
    python3 -I scripts/imprint-figures.py [cache-dir]
It writes scripts/imprint-figures.json. It uses only the standard library.
"""

import html.parser
import json
import pathlib
import re
import sys
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAPER_URL = 'https://arxiv.org/html/2610.14406v1'
TABLES = {'A3.T10': 'rmbench', 'A3.T11': 'robocasa', 'A3.T12': 'real', 'A3.T15': 'recipe',
          'A3.T16': 'backbones', 'A3.T17': 'probe', 'A3.T18': 'latency_by_history'}

# Fig. 6 plots success against latency per 50-step action chunk on an L40S GPU. Its numbers are in the text.
LATENCY = {
    'pi05': (91.0, 'The non-memory \\pi_{0.5} policy requires 91.0 ms per 50-action prediction'),
    'hamlet': (144, 'HAMLET and MemoryVLA reach 28.1% and 41.7% success at 144 and 321 ms'),
    'memoryvla': (321, 'HAMLET and MemoryVLA reach 28.1% and 41.7% success at 144 and 321 ms'),
    'eventvla': (960, 'EventVLA reaches 67.8% but requires 960 ms due to long context to Qwen backbone'),
    'imprint_full': (130.8, 'reducing average inference latency from 130.8 ms to 122.8 ms per action chunk'),
    'imprint_recurrent': (122.8, 'recurrent Imprint achieves the highest success (72.8%) at 122.8 ms'),
}
REPORTED = ['EventVLA has a reported latency of 960 ms and is shown off-scale for reference']


class Paper(html.parser.HTMLParser):
    """Collect the cells of the wanted tables and the plain text, with each formula as its TeX source."""

    def __init__(self, wanted):
        super().__init__(convert_charrefs=True)
        self.wanted, self.tables, self.text = wanted, {}, []
        self.table = self.row = self.cell = None
        self.depth = self.math = self.caption = 0

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
        elif self.table and tag == 'figcaption':
            self.caption += 1
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
        elif tag == 'figcaption' and self.table:
            self.caption -= 1
        elif tag == 'figure' and self.table:
            self.depth -= 1
            if not self.depth:
                self.table = self.row = self.cell = None

    def handle_data(self, data):
        if not self.math:
            self._write(data)

    def _write(self, value):
        self.text.append(value)
        if self.cell is not None and not self.caption:
            self.cell.append(value)


def clean(cell):
    return ' '.join(''.join(cell).split())


def number(value):
    return float(value.rstrip('%').replace(',', ''))


def rows(table, width):
    """Data rows: a label and `width` numeric cells, as {label: [numbers]}."""
    out = {}
    for row in table:
        cells = [clean(c) for c in row]
        if len(cells) != width + 1 or not cells[0]:
            continue
        try:
            out[cells[0]] = [number(c) for c in cells[1:]]
        except ValueError:
            continue
    return out


def read(path):
    paper = Paper(set(TABLES))
    paper.feed(path.read_text(encoding='utf-8'))
    text = ' '.join(''.join(paper.text).split())
    assert 'Memory Without Curation' in text, 'not the Imprint paper'
    return {TABLES[key]: paper.tables[key] for key in TABLES}, text


def main():
    cache = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(tempfile.mkdtemp())
    cache.mkdir(parents=True, exist_ok=True)
    source = cache / 'imprint-2610.14406v1.html'
    if not source.exists():
        urllib.request.urlretrieve(PAPER_URL, source)
    tables, text = read(source)

    rmbench = rows(tables['rmbench'], 10)
    rmbench_tasks = [clean(c) for c in tables['rmbench'][1][1:-1]]
    robocasa = {}
    for row in tables['robocasa'][1:]:
        cells = [clean(c) for c in row]
        robocasa[cells[0]] = {'type': cells[1], 'values': [number(c) for c in cells[2:]]}
    real = {}
    for row in tables['real'][1:]:
        cells = [clean(c) for c in row]
        real[cells[0]] = {'tasks': [[int(v) for v in re.match(r'(\d+)/(\d+)', c).groups()] for c in cells[1:4]], 'average': number(cells[4])}
    recipe = rows(tables['recipe'], 7)
    backbones = rows(tables['backbones'], 6)
    probe = rows(tables['probe'], 4)
    latency_by_history = rows(tables['latency_by_history'], 4)

    for name, (value, quote) in LATENCY.items():
        assert quote in text, f'{name}: quote not found in the paper'
        assert f'{value:g}' in quote, f'{name}: {value} is not in its quote'
    for quote in REPORTED:
        assert quote in text, 'reported-latency quote not found'

    data = {
        'source': {'paper': 'arXiv 2610.14406v1', 'url': PAPER_URL},
        'rmbench': {'source': 'Table 10 (Fig. 3), success %, 100 trials per task', 'tasks': rmbench_tasks, 'methods': rmbench},
        'robocasa': {'source': 'Table 11 (Fig. 4), success %, 50 trials per task',
                     'columns': ['pi05', 'heuristic action', 'heuristic VLM', 'IMPRINT full', 'IMPRINT recurrent'], 'rows': robocasa},
        'real': {'source': 'Table 12 (Fig. 5), successes / rollouts; base policy pi0', 'tasks': ['Dust Table', 'Scan Bottle', 'Fold Cloth'], 'methods': real},
        'recipe': {'source': 'Table 15 (Fig. 8), RMBench success %',
                   'columns': ['E2E', 'IMPRINT frozen', 'IMPRINT', 'IMPRINT (objectives)', 'Without progress', 'Visual only', 'Action + state'], 'rows': recipe},
        'backbones': {'source': 'Table 16 (Fig. 10), RMBench success %',
                      'columns': ['pi05 no memory', 'pi05 IMPRINT', 'pi0 no memory', 'pi0 IMPRINT', 'MolmoAct2 no memory', 'MolmoAct2 IMPRINT'], 'rows': backbones},
        'probe': {'source': 'Table 17 (Fig. 9), Cover Blocks color-order linear probe, %; chance is 1/6',
                  'columns': ['timestep accuracy', 'balanced accuracy', 'episode accuracy', 'task success'], 'rows': probe},
        'latency_by_history': {'source': 'Table 18, ms per policy call by memory tokens B',
                               'columns': ['full 1 frame', 'full 1451 frames', 'recurrent 1 frame', 'recurrent 1451 frames'], 'rows': latency_by_history},
        'latency': {'source': 'Fig. 6 values quoted in Sec. 5.2, 5.3 and App. C.5; ms per 50-step action chunk, L40S GPU',
                    'ms': {name: value for name, (value, _) in LATENCY.items()},
                    'quotes': {name: quote for name, (_, quote) in LATENCY.items()}, 'reported': ['eventvla']},
    }
    target = ROOT / 'scripts/imprint-figures.json'
    # One line per table row keeps the committed data easy to compare with the paper.
    text = re.sub(r'\[\s*([^\[\]{}]*?)\s*\]', lambda m: '[' + ', '.join(v.strip() for v in m.group(1).split(',')) + ']',
                  json.dumps(data, indent=1, ensure_ascii=False))
    target.write_text(text + '\n')
    print(f'Wrote {target.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
