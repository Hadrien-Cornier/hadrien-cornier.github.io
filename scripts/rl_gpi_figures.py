#!/usr/bin/env python3
"""Policy iteration on the Part 1 cliff grid, and the blackboard canvas of the GPI article.

Run from the repository root:

    python3 scripts/rl_gpi_figures.py          # print the numbers the article quotes
    python3 scripts/rl_gpi_figures.py --write  # also redraw the canvas and the thumbnail

The grid is the one from Part 1: 4 rows by 12 columns, start at the bottom left, flag at the
bottom right, ten cliff cells between them. Every move costs -1, a cliff step costs -100 and
sends you back to the start, a move into the outer wall leaves you in place, and gamma = 0.99.

Policy iteration starts from the random policy (each move with probability 1/4). Evaluation
solves the linear Bellman equations exactly. Improvement takes the greedy move, and keeps the
current move when it is still among the best (Sutton and Barto, p. 80 and Exercise 4.4).
Moves within 1e-9 of the best count as ties. The first greedy step breaks ties in the order
up, right, down, left; every other order gives the same run.
"""

import base64
import re
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ARTICLE = ROOT / "content/robotics/rl-gpi.md"
THUMB = ROOT / "assets/robotics/rl/rl-gpi-loop.svg"
FONT = ROOT / "assets/robotics/rl/fonts/patrick-hand-latin.woff2"

ROWS, COLS, GAMMA = 4, 12, 0.99
START, GOAL = (3, 0), (3, 11)
CLIFF = {(3, c) for c in range(1, 11)}
MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]
NAMES = "URDL"
STATES = [(r, c) for r in range(ROWS) for c in range(COLS) if (r, c) not in CLIFF and (r, c) != GOAL]
INDEX = {s: i for i, s in enumerate(STATES)}
TIE = 1e-9


def step(s, a):
    r, c = s
    nr, nc = r + MOVES[a][0], c + MOVES[a][1]
    if not (0 <= nr < ROWS and 0 <= nc < COLS):
        return s, -1.0
    if (nr, nc) in CLIFF:
        return START, -100.0
    return (nr, nc), -1.0


def evaluate(pi):
    """Solve v = r_pi + gamma P_pi v for a policy given as move probabilities, one row per state."""
    n = len(STATES)
    P, b = np.zeros((n, n)), np.zeros(n)
    for s in STATES:
        i = INDEX[s]
        for a in range(4):
            if pi[i, a] == 0:
                continue
            nxt, rew = step(s, a)
            b[i] += pi[i, a] * rew
            if nxt != GOAL:
                P[i, INDEX[nxt]] += pi[i, a]
    return np.linalg.solve(np.eye(n) - GAMMA * P, b)


def action_values(v):
    q = np.zeros((len(STATES), 4))
    for s in STATES:
        for a in range(4):
            nxt, rew = step(s, a)
            q[INDEX[s], a] = rew + (0.0 if nxt == GOAL else GAMMA * v[INDEX[nxt]])
    return q


def policy_iteration():
    """Return one (moves, values) pair per evaluated policy. The first policy is random (moves is None)."""
    pi = np.full((len(STATES), 4), 0.25)
    moves, history = None, []
    while True:
        v = evaluate(pi)
        history.append((moves, v))
        q = action_values(v)
        new = np.zeros(len(STATES), int)
        for i in range(len(STATES)):
            best = set(np.flatnonzero(q[i] >= q[i].max() - TIE))
            new[i] = moves[i] if moves is not None and moves[i] in best else min(best)
        if moves is not None and np.array_equal(new, moves):
            return history
        moves = new
        pi = np.zeros((len(STATES), 4))
        pi[np.arange(len(STATES)), moves] = 1.0


def value_iteration(target):
    """Sweeps of eq. 4.10 from all zeros until the values equal the target, and the sweep that confirms it."""
    v, sweeps = np.zeros(len(STATES)), 0
    while True:
        sweeps += 1
        nv = action_values(v).max(1)
        if np.abs(nv - v).max() < 1e-10:
            return reached, sweeps
        if np.abs(nv - target).max() < 1e-9 and np.abs(v - target).max() >= 1e-9:
            reached = sweeps
        v = nv


def route(moves):
    """Cells visited from the start, or None when the moves loop without reaching the flag."""
    s, path = START, [START]
    while s != GOAL:
        s, _ = step(s, moves[INDEX[s]])
        if s in path:
            return None
        path.append(s)
    return path


def report(history):
    print(f"deterministic policies on this grid: 4^{len(STATES)} = {4 ** len(STATES):.3g}")
    previous = None
    for k, (moves, v) in enumerate(history):
        name = "random" if moves is None else f"pi_{k}"
        line = f"{name:>7}: v(start) = {v[INDEX[START]]:9.2f}"
        if previous is not None:
            changed = "all" if previous[0] is None else int((moves != previous[0]).sum())
            line += f"   moves changed {changed:>3}   cells improved {(v - previous[1] > TIE).sum():2d}   worst change {(v - previous[1]).min():+.3f}"
        if moves is not None:
            path = route(moves)
            line += f"   route {len(path) - 1} steps" if path else "   never reaches the flag"
        print(line)
        previous = (moves, v)
    final_moves, final_v = history[-1]
    reached, confirmed = value_iteration(final_v)
    print(f"stable after {len(history) - 1} improvements; the next greedy step changes nothing")
    print(f"value iteration from zeros: exact optimal values after sweep {reached}; sweep {confirmed} changes nothing")
    stuck = [s for s in STATES if abs(history[1][1][INDEX[s]] + 100) < 1e-6]
    print(f"pi_1 cells stuck against the wall: {len(stuck)}, each worth -1/(1 - gamma) = {-1 / (1 - GAMMA):.0f}")
    print(f"random walker: top-left corner {history[0][1][INDEX[(0, 0)]]:.1f}, cell above the flag {history[0][1][INDEX[(2, 11)]]:.1f}")


# ---------------------------------------------------------------- drawing

CHALK = {"chalk": "#f4f1e8", "dim": "#c3c9bd", "faint": "#6f7d75", "red": "#ff9f88", "blue": "#93d4ff",
         "green": "#a8e2a0", "yellow": "#ffe17c", "pink": "#ff93b8"}
CELL = 30
SUB = '<tspan baseline-shift="sub" font-size="75%">π</tspan>'


def num(x, fmt=".0f"):
    """A number for the board, with a true minus sign."""
    return format(x, fmt).replace("-", "−")


def fill(color):
    return f'fill="{CHALK[color]}" class="c-{color}"'


def stroke(color):
    return f'stroke="{CHALK[color]}" class="s-{color}"'


def text(x, y, body, color="chalk", size=15, anchor="start", extra=""):
    a = "" if anchor == "start" else f' text-anchor="{anchor}"'
    return f'<text x="{x:g}" y="{y:g}" {fill(color)} font-size="{size}"{a}{extra}>{body}</text>'


def badness(v):
    """Wash opacity: a log scale of how negative the value is, the same in every grid."""
    return 0.06 + 0.5 * np.log10(max(1.0, -v)) / np.log10(1100.0)


def grid(x0, y0, values, moves, arrows="chalk", stuck=None, show_start=True, spread=False):
    """The cliff grid with a red wash for bad values and one arrow per cell.
    With spread, the wash runs from the best to the worst value of this grid instead of the shared log scale."""
    out = []
    lo, hi = values.min(), values.max()

    def wash(v):
        return 0.08 + 0.62 * (hi - v) / (hi - lo) if spread else badness(v)
    for r in range(ROWS):
        for c in range(COLS):
            x, y = x0 + c * CELL, y0 + r * CELL
            if (r, c) in CLIFF:
                continue
            if (r, c) == GOAL:
                out.append(f'<rect x="{x}" y="{y}" width="{CELL}" height="{CELL}" fill="none" {stroke("green")} stroke-width="2"/>')
                out.append(text(x + CELL / 2, y + 21, "G", "green", 17, "middle"))
                continue
            v = values[INDEX[(r, c)]]
            out.append(f'<rect x="{x}" y="{y}" width="{CELL}" height="{CELL}" fill="{CHALK['red']}" fill-opacity="{wash(v):.2f}" stroke="{CHALK['faint']}" class="c-red s-faint" stroke-width="1"/>')
    cx0, cy0 = x0 + CELL, y0 + 3 * CELL
    out.append(f'<rect x="{cx0}" y="{cy0}" width="{10 * CELL}" height="{CELL}" fill="none" {stroke("dim")} stroke-width="1.5" stroke-dasharray="3 4"/>')
    out.append(text(cx0 + 5 * CELL, cy0 + 20, "cliff: −100, back to S", "dim", 14, "middle"))
    if moves is not None:
        for s in STATES:
            r, c = s
            dr, dc = MOVES[moves[INDEX[s]]]
            cx, cy = x0 + c * CELL + CELL / 2, y0 + r * CELL + CELL / 2
            color = "red" if stuck and s in stuck else arrows
            marker = "gpi-ar" if color == "red" else "gpi-a"
            out.append(f'<path d="M{cx - 7 * dc:g} {cy - 7 * dr:g}L{cx + 7 * dc:g} {cy + 7 * dr:g}" {stroke(color)} stroke-width="1.8" marker-end="url(#{marker})"/>')
    else:
        cx, cy = x0 + CELL / 2, y0 + 3 * CELL + CELL / 2
        for dr, dc in MOVES:
            out.append(f'<path d="M{cx + 3 * dc:g} {cy + 3 * dr:g}L{cx + 10 * dc:g} {cy + 10 * dr:g}" {stroke("chalk")} stroke-width="1.4" marker-end="url(#gpi-a)"/>')
    if show_start:
        out.append(text(x0 - 4, y0 + 3 * CELL + 20, "S", "yellow", 16, "end"))
    return out


def route_path(x0, y0, moves, color, dash="", shift=0):
    """The route from S, drawn through cell centers, moved by shift pixels and stopped at the edge of the flag cell."""
    cells = route(moves)
    pts = [(x0 + c * CELL + CELL / 2 + shift, y0 + r * CELL + CELL / 2 + shift) for r, c in cells]
    pts[-1] = (pts[-1][0], pts[-1][1] - CELL / 2)
    pts = " ".join(f"{px:g} {py:g}" for px, py in pts)
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="M{pts}" fill="none" {stroke(color)} stroke-width="3" stroke-opacity=".9"{d}/>'


def panel(name, x, y, title):
    return [f'<g class="rc-panel" data-panel="{name}"><rect x="{x}" y="{y}" width="400" height="280" rx="6" fill="none" stroke="#b6baaf"/>',
            f'<text class="rls-panel-title" x="{x + 14}" y="{y + 28}" fill="#ffe17c" font-size="16">{title}</text>']


def canvas(history):
    rnd_v = history[0][1]
    m1, v1 = history[1]
    final_moves, final_v = history[-1]
    detour_moves = next(m for m, v in history[1:] if route(m) and len(route(m)) == 18)
    stuck = {s for s in STATES if abs(v1[INDEX[s]] + 100) < 1e-6}
    out = ['<defs>',
           f'<marker id="gpi-a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke("chalk")} stroke-width="1.8"/></marker>',
           f'<marker id="gpi-ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke("red")} stroke-width="1.8"/></marker>',
           f'<marker id="gpi-ab" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke("blue")} stroke-width="1.6"/></marker>',
           f'<marker id="gpi-ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke("green")} stroke-width="1.6"/></marker>',
           f'<marker id="gpi-ay" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke("yellow")} stroke-width="1.6"/></marker>',
           '</defs>', '<g font-size="15">']

    # 1. The random walker and its values.
    x, y = 10, 10
    gx, gy = x + 26, y + 48
    out += panel("walker", x, y, "1. How good is a random walker?")
    out += grid(gx, gy, rnd_v, None, spread=True)
    out.append(f'<rect x="{gx + 11 * CELL + 2}" y="{gy + 2 * CELL + 2}" width="{CELL - 4}" height="{CELL - 4}" fill="none" {stroke("yellow")} stroke-width="2"/>')
    out.append(text(gx + 6 * CELL, gy - 6, "every move with chance 1/4", "dim", 14, "middle"))
    out.append(text(gx, gy + 4 * CELL + 24, f"S: v = {num(rnd_v[INDEX[START]])}", "red", 16))
    out.append(text(gx + 360, gy + 4 * CELL + 24, f"above G: v = {num(rnd_v[INDEX[(2, 11)]])}", "yellow", 16, "end"))
    out.append(text(gx, gy + 4 * CELL + 50, "v(s): the average discounted return from s", "chalk", 15))
    out.append(text(gx, gy + 4 * CELL + 72, f"redder = worse, from {num(rnd_v.max())} to {num(rnd_v.min())}", "dim", 14))
    out.append("</g>")

    # 2. One greedy step.
    x, y = 430, 10
    gx, gy = x + 26, y + 48
    out += panel("greedy", x, y, "2. Act greedily on those numbers")
    out += grid(gx, gy, v1, m1, stuck=stuck)
    out.append(f'<path d="M{gx + 4:g} {gy - 3:g}h{CELL - 8}" {stroke("red")} stroke-width="3"/>')
    out.append(text(gx + 3 * CELL + 6, gy - 6, "← red cells end here, against the wall", "red", 14))
    out.append(text(gx, gy + 4 * CELL + 24, f"S: {num(rnd_v[INDEX[START]])} → {num(v1[INDEX[START]])}", "yellow", 16))
    out.append(text(gx + 360, gy + 4 * CELL + 24, "no cell got worse", "green", 16, "end"))
    out.append(text(gx, gy + 4 * CELL + 50, f"red: stuck, −1 each step forever = −100", "red", 15))
    out.append(text(gx, gy + 4 * CELL + 72, "white: reaches G, some by the top row", "dim", 14))
    out.append("</g>")

    # 3. Repeat until the greedy step changes nothing.
    x, y = 10, 305
    gx, gy = x + 26, y + 44
    out += panel("rounds", x, y, "3. Repeat until nothing changes")
    gy += 8
    out += grid(gx, gy, final_v, final_moves, arrows="dim")
    out.append(text(gx + 6 * CELL, gy - 6, "arrows: the final policy, round 6", "dim", 14, "middle"))
    out.append(route_path(gx, gy, detour_moves, "yellow", "6 6", shift=-6))
    out.append(route_path(gx, gy, final_moves, "green"))
    cols = [str(k) for k in range(len(history))]
    vals = [num(v[INDEX[START]], ".0f" if abs(v[INDEX[START]]) >= 99 else ".1f") for _, v in history]
    vals[-1] = num(history[-1][1][INDEX[START]], ".2f")
    tx, ty, w = gx + 54, gy + 4 * CELL + 22, 44
    out.append(text(gx, ty, "round", "dim", 14))
    out.append(text(gx, ty + 22, "v(S)", "dim", 14))
    for k, (c, v) in enumerate(zip(cols, vals)):
        color = "green" if k == len(cols) - 1 else ("yellow" if k == 4 else "chalk")
        out.append(text(tx + k * w, ty, c, "dim", 14, "middle"))
        out.append(text(tx + k * w, ty + 22, v, color, 15, "middle"))
    out.append(text(gx, ty + 48, "yellow, round 4: 17 steps", "yellow", 14))
    out.append(text(gx + 360, ty + 48, "green, round 6: 13 steps", "green", 14, "end"))
    out.append("</g>")

    # 4. The loop diagram (Sutton and Barto, p. 86).
    x, y = 430, 305
    out += panel("loop", x, y, "4. Two processes (book, p. 86)")
    px, vx, cy = x + 100, x + 300, y + 122
    out.append(text(px, cy + 10, "π", "chalk", 34, "middle"))
    out.append(text(vx, cy + 10, "V", "chalk", 34, "middle"))
    mid = (px + vx) / 2
    out.append(f'<path d="M{px + 24} {cy - 16} Q{mid} {cy - 70} {vx - 24} {cy - 16}" fill="none" {stroke("blue")} stroke-width="2.4" marker-end="url(#gpi-ab)"/>')
    out.append(f'<path d="M{vx - 24} {cy + 16} Q{mid} {cy + 70} {px + 24} {cy + 16}" fill="none" {stroke("green")} stroke-width="2.4" marker-end="url(#gpi-ag)"/>')
    out.append(text(mid, cy - 54, f"evaluation (panel 1): V → v{SUB}", "blue", 17, "middle"))
    out.append(text(mid, cy + 68, "improvement (panel 2): π → greedy(V)", "green", 17, "middle"))
    for k in range(3):
        out.append(f'<circle cx="{mid}" cy="{cy + 84 + 9 * k}" r="1.8" {fill("dim")}/>')
    out.append(text(px, y + 244, "π*", "yellow", 22, "middle"))
    out.append(text(vx, y + 244, "v*", "yellow", 22, "middle"))
    out.append(f'<path d="M{px + 24} {y + 237}H{vx - 24}" {stroke("yellow")} stroke-width="1.8" marker-end="url(#gpi-ay)" marker-start="url(#gpi-ay)"/>')
    out.append(text(mid, y + 266, "until neither changes", "dim", 14, "middle"))
    out.append("</g>")

    # 5. The two-lines diagram (Sutton and Barto, p. 87).
    x, y = 10, 600
    out += panel("lines", x, y, "5. Two goals pull apart (book, p. 87)")
    top = (x + 200, y + 84)
    left_end, right_end = (x + 74, y + 238), (x + 326, y + 238)

    def on(end, t):
        return (top[0] + (end[0] - top[0]) * t, top[1] + (end[1] - top[1]) * t)
    out.append(f'<path d="M{left_end[0]} {left_end[1]}L{top[0]} {top[1]}" {stroke("blue")} stroke-width="2.4"/>')
    out.append(f'<path d="M{right_end[0]} {right_end[1]}L{top[0]} {top[1]}" {stroke("green")} stroke-width="2.4"/>')
    out.append(text(x + 18, y + 264, f"v = v{SUB}", "blue", 16))
    out.append(text(x + 386, y + 264, "π = greedy(v)", "green", 16, "end"))
    out.append(text(top[0], top[1] - 10, "v*, π*", "yellow", 18, "middle"))
    out.append(text(top[0], y + 52, "each point: a value table v and a policy π", "dim", 14, "middle"))
    zig = [(x + 200, y + 232)]
    for t in (0.86, 0.72, 0.55, 0.42, 0.28, 0.18, 0.1):
        zig.append(on(left_end if len(zig) % 2 else right_end, t))
    out.append(text(zig[0][0], y + 254, "start: v, π", "chalk", 14, "middle"))
    for k, (a, b) in enumerate(zip(zig, zig[1:])):
        color, marker = ("blue", "gpi-ab") if k % 2 == 0 else ("green", "gpi-ag")
        out.append(f'<path d="M{a[0]:.1f} {a[1]:.1f}L{b[0]:.1f} {b[1]:.1f}" {stroke(color)} stroke-width="1.6" stroke-dasharray="5 3" marker-end="url(#{marker})"/>')
    out.append(text(x + 16, y + 106, "evaluate: jump", "blue", 14))
    out.append(text(x + 16, y + 124, "to the blue line", "blue", 14))
    out.append(text(x + 384, y + 106, "improve: jump", "green", 14, "end"))
    out.append(text(x + 384, y + 124, "to the green line", "green", 14, "end"))
    out.append("</g>")

    # 6. Who evaluates, who improves.
    x, y = 430, 600
    out += panel("family", x, y, "6. Same loop, different parts")
    c1, c2, c3 = x + 14, x + 138, x + 270
    out.append(text(c2, y + 56, "evaluate", "blue", 16))
    out.append(text(c3, y + 56, "improve", "green", 16))
    out.append(f'<path d="M{x + 12} {y + 64}H{x + 388}" {stroke("faint")} stroke-width="1"/>')
    rows = [
        ("policy iteration", f"solve for v{SUB}", "greedy, all cells"),
        ("value iteration", "one sweep", "max in the sweep"),
        ("Monte Carlo", "average returns", "greedy per episode"),
        ("Sarsa", "one TD step on Q", "ε-greedy on Q"),
        ("Q-learning", "one TD step on Q", "max in the target"),
        ("actor-critic", "critic: TD error", "actor: gradient step"),
        ("AlphaGo Zero", "self-play winner z", "tree search (MCTS)"),
    ]
    for k, (name, ev, im) in enumerate(rows):
        ry = y + 88 + 27 * k
        color = "yellow" if name == "AlphaGo Zero" else "chalk"
        out.append(text(c1, ry, name, color, 15))
        out.append(text(c2, ry, ev, "dim", 14))
        out.append(text(c3, ry, im, "dim", 14))
    out.append("</g>")
    out.append("</g>")
    return out


VIEWS = '{"walker": [16, 38, 388, 244], "greedy": [436, 38, 388, 244], "rounds": [16, 333, 388, 244], "loop": [436, 333, 388, 244], "lines": [16, 628, 388, 244], "family": [436, 628, 388, 244]}'
TITLE = "Generalized policy iteration on a blackboard"
DESC = ("Six panels. 1: the Part 1 cliff grid under a random walker, with values from about −482 to −1072. 2: one greedy step: "
        "the right side heads for the goal, the left side bumps the top wall forever at −100, and no cell gets worse. "
        "3: six rounds of evaluate and improve; the start value goes −1072, −100, −100, −100, −15.7, −15.7, −12.25 and the "
        "route shrinks from 17 to 13 steps along the cliff edge. 4: the book's loop diagram, evaluation from π to V and "
        "improvement from V to π, ending at π* and v*. 5: the book's two-lines diagram, a zigzag between v = vπ and "
        "π = greedy(v) that climbs to v*, π*. 6: seven methods and what plays evaluation and improvement in each.")


def canvas_svg(history):
    body = "\n".join(canvas(history))
    return (f'<svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 890" data-whole="0 0 840 890" '
            f"data-views='{VIEWS}' role=\"img\" aria-labelledby=\"gpi-title gpi-desc\">"
            f'<title id="gpi-title">{TITLE}</title><desc id="gpi-desc">{DESC}</desc>\n{body}\n</svg>')


def without_panel(markup, name):
    """Remove one panel group, matching its closing tag through any nested groups."""
    start = markup.index(f'<g class="rc-panel" data-panel="{name}"')
    depth, i = 0, start
    while True:
        opening, closing = markup.find("<g", i), markup.find("</g>", i)
        if opening != -1 and opening < closing:
            depth, i = depth + 1, opening + 2
        else:
            depth, i = depth - 1, closing + 4
            if depth == 0:
                return markup[:start] + markup[i:]


def thumbnail_svg(history):
    """Panels 3 and 4 as a 720 x 424 card, with the colors and the font written in."""
    font = base64.b64encode(FONT.read_bytes()).decode()
    inner = "\n".join(canvas(history))
    for name in ("walker", "greedy", "lines", "family"):
        inner = without_panel(inner, name)
    inner = inner.replace(">panel 1, then panel 2<", "><")  # the card has no panels 1 and 2
    inner = inner.replace('stroke="#b6baaf"', 'stroke="#6f7d75" stroke-width="1.5" stroke-dasharray="2 5"')
    alt = ("Two blackboard panels: policy iteration on the cliff grid, whose start value climbs from −1072 to −12.25 in six rounds, "
           "and the book's loop between evaluation and improvement that ends at the optimal policy and value")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="720" height="424" viewBox="0 197.6 840 494.7" '
            f'preserveAspectRatio="xMidYMid meet" role="img" aria-label="{alt}" color="#f4f1e8">'
            "<!-- Font: Patrick Hand, Copyright (c) 2010-2012 Patrick Wagesreiter, SIL Open Font License 1.1, see /assets/robotics/rl/fonts/OFL.txt -->"
            f'<style>@font-face{{font-family:"RL Chalk";src:url(data:font/woff2;base64,{font}) format("woff2")}}'
            'text,tspan{font-family:"RL Chalk","Patrick Hand","Chalkboard SE","Comic Neue","Segoe Print",cursive;letter-spacing:.01em}</style>'
            '<rect x="-200" y="0" width="1240" height="900" fill="#1d2824"/>'
            f'<g fill="#f4f1e8" stroke-linecap="round" stroke-linejoin="round">{inner}</g></svg>')


def write(history):
    source = ARTICLE.read_text()
    start, end = "<!-- gpi-canvas -->", "<!-- /gpi-canvas -->"
    if start not in source or end not in source:
        sys.exit(f"{ARTICLE} needs the {start} and {end} markers")
    head, rest = source.split(start, 1)
    _, tail = rest.split(end, 1)
    ARTICLE.write_text(f"{head}{start}{canvas_svg(history)}{end}{tail}")
    THUMB.write_text(thumbnail_svg(history))
    print(f"wrote the canvas into {ARTICLE.relative_to(ROOT)} and {THUMB.relative_to(ROOT)}")


if __name__ == "__main__":
    runs = policy_iteration()
    report(runs)
    if "--write" in sys.argv:
        write(runs)
