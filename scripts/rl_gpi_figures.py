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
current move when it is still among the best (Sutton and Barto, Section 4.3 and Exercise 4.4).
Moves within 1e-9 of the best count as ties. The first greedy step breaks ties in the order
up, right, down, left; every other order gives the same run.
"""

import base64
import json
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


def sub(body):
    return f'<tspan baseline-shift="-20%" font-size="72%">{body}</tspan>'


def sup(body):
    return f'<tspan baseline-shift="38%" font-size="72%">{body}</tspan>'


def tint(body, color):
    return f'<tspan {fill(color)}>{body}</tspan>'


# Symbols. Values are blue and policies green on every panel, the colors of evaluation and improvement.
V_PI, Q_PI = "v" + sub("π"), "q" + sub("π")


def eq(x, y, pieces, size=19):
    """An equation as one line of text, each piece in its own color. The panels place labels under the pieces
    at x + size * (offset in em), with the offsets measured in the chalk font."""
    body = "".join(f'<tspan {fill(color)}>{markup}</tspan>' for markup, color in pieces)
    return text(x, y, body, "chalk", size)


def line(x1, y1, x2, y2, color="dim", width=1.2, extra=""):
    return f'<path d="M{x1:g} {y1:g}L{x2:g} {y2:g}" {stroke(color)} stroke-width="{width}"{extra}/>'


def under(x, y, label, color, size=12, anchor="middle", drop=22, start=6):
    """A short chalk tick under an equation term at (x, y), and the term's name under it."""
    lx = x if anchor == "middle" else x + 18 if anchor == "end" else x - 18
    return [line(x, y + start, x, y + drop - 9, color, 1, ' stroke-opacity=".75"'), text(lx, y + drop + 3, label, color, size, anchor)]


def big_sum(x, y, below, color="chalk", size=24):
    """A summation sign with its index under it."""
    return [text(x, y + 3, "Σ", color, size, "middle"), text(x, y + 17, below, "dim", 11, "middle")]


def check(x, y, color="green"):
    return f'<path d="M{x - 8:g} {y - 4:g}l6 7l11 -14" fill="none" {stroke(color)} stroke-width="2.6"/>'


def cross(x, y, color="red"):
    return f'<path d="M{x - 6:g} {y - 9:g}l12 12M{x + 6:g} {y - 9:g}l-12 12" fill="none" {stroke(color)} stroke-width="2.6"/>'


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


def panel(name, x, y, h, title):
    return [f'<g class="rc-panel" data-panel="{name}"><rect x="{x}" y="{y}" width="400" height="{h}" rx="6" fill="none" stroke="#b6baaf"/>',
            f'<text class="rls-panel-title" x="{x + 14}" y="{y + 28}" fill="#ffe17c" font-size="16">{title}</text>']


def facts(history):
    """The numbers the panels draw, all from the policy iteration run."""
    rnd_v = history[0][1]
    s = INDEX[START]
    return {
        "history": history,
        "random_v": rnd_v,
        "q_start": dict(zip(NAMES, action_values(rnd_v)[s])),
        "detour": next(m for m, v in history[1:] if route(m) and len(route(m)) == 18),
        "stuck": {c for c in STATES if abs(history[1][1][INDEX[c]] + 100) < 1e-6},
        "sweeps": value_iteration(history[-1][1])[0],
    }


def draw_walker(x, y, h, f):
    """1. Policy evaluation: the random walker's values and the equation they solve."""
    rnd = f["random_v"]
    out = panel("walker", x, y, h, "1. How good is a random walker?")
    out.append(eq(x + 70, y + 60, [("π(a | s)", "green"), (" = 1/4 for each move a", "chalk")], 19))
    out += under(x + 70 + 19 * 1.37, y + 60, "policy: chance of move a in cell s", "green")
    gx, gy = x + 26, y + 100
    out += grid(gx, gy, rnd, None, spread=True)
    out.append(f'<rect x="{gx + 11 * CELL + 2}" y="{gy + 2 * CELL + 2}" width="{CELL - 4}" height="{CELL - 4}" fill="none" {stroke("yellow")} stroke-width="2"/>')
    out.append(text(gx, gy + 4 * CELL + 24, f"{V_PI}(S) = {num(rnd[INDEX[START]])}", "red", 17))
    out.append(text(gx + 360, gy + 4 * CELL + 24, f"above G: {num(rnd[INDEX[(2, 11)]])}", "yellow", 17, "end"))
    out.append(text(x + 200, gy + 4 * CELL + 44, "redder = worse", "dim", 13, "middle"))
    # The Bellman expectation equation, 18.1 em wide.
    ex, ey, size = x + 28, y + 314, 19
    out.append(eq(ex, ey, [(V_PI + "(s)", "blue"), (" = ", "chalk"), ("Σ", "chalk"), (" π(a | s)", "green"), (" Σ", "chalk"),
                           (" p(s′, r | s, a)", "chalk"), (" [ r + γ ", "chalk"), (V_PI + "(s′)", "blue"), (" ]", "chalk")], size))
    out.append(text(ex + size * 3.18, ey + 15, "a", "dim", 11, "middle"))
    out.append(text(ex + size * 7.02, ey + 15, "s′, r", "dim", 11, "middle"))
    out += under(ex + size * 0.96, ey, "value function", "blue", anchor="start", drop=26)
    out += under(ex + size * 9.90, ey, "model: next cell, reward", "dim", drop=26)
    out += under(ex + size * 16.33, ey, "next cell's value", "blue", anchor="end", drop=26)
    out.append(text(x + 120, ey + 54, "r: reward", "dim", 13, "middle"))
    out.append(text(x + 270, ey + 54, "γ = 0.99: discount", "dim", 13, "middle"))
    out.append(text(x + 200, ey + 82, "one equation per cell: 37 equations, 37 unknowns", "yellow", 15, "middle"))
    out.append("</g>")
    return out


def draw_greedy(x, y, h, f):
    """2. Policy improvement: the action value, the greedy policy and one greedy step on the grid."""
    rnd, (m1, v1) = f["random_v"], f["history"][1]
    out = panel("greedy", x, y, h, "2. Act greedily on those numbers")
    # The action value, 15.2 em wide.
    ex, ey, size = x + 56, y + 66, 19
    out.append(eq(ex, ey, [(Q_PI + "(s, a)", "blue"), (" = ", "chalk"), ("Σ", "chalk"), (" p(s′, r | s, a) [ r + γ ", "chalk"),
                           (V_PI + "(s′)", "blue"), (" ]", "chalk")], size))
    out.append(text(ex + size * 4.10, ey + 15, "s′, r", "dim", 11, "middle"))
    out += under(ex + size * 1.42, ey, "action value", "blue", drop=26)
    out.append(text(ex + size * 9.6, ey + 29, "move a once, then follow π", "dim", 12, "middle"))
    # The greedy policy, 9 em wide.
    ex, ey, size = x + 110, y + 138, 20
    out.append(eq(ex, ey, [("π′(s)", "green"), (" = ", "chalk"), ("argmax", "chalk"), (" ", "chalk"), (Q_PI + "(s, a)", "blue")], size))
    out.append(text(ex + size * 4.36, ey + 15, "a", "dim", 11, "middle"))
    out += under(ex + size * 1.01, ey, "new policy", "green", drop=26)
    out.append(text(ex + size * 7.55, ey + 29, "the best move in each cell", "dim", 12, "middle"))
    gx, gy = x + 26, y + 200
    out += grid(gx, gy, v1, m1, stuck=f["stuck"])
    out.append(f'<path d="M{gx + 4:g} {gy - 3:g}h{CELL - 8}" {stroke("red")} stroke-width="3"/>')
    out.append(text(gx + 3 * CELL + 6, gy - 6, "← the red arrows end here, at the wall", "red", 13))
    out.append(text(gx, gy + 4 * CELL + 24, f"S: {num(rnd[INDEX[START]])} → {num(v1[INDEX[START]])}", "yellow", 17))
    out.append(text(gx + 360, gy + 4 * CELL + 24, "no cell got worse", "green", 17, "end"))
    out.append(text(gx, gy + 4 * CELL + 48, f"red: −1 a step forever = −1/(1 − γ) = {num(-1 / (1 - GAMMA))}", "red", 14))
    out.append("</g>")
    return out


def draw_theorem(x, y, h, f):
    """3. Why the greedy step never hurts: at S the best action value beats the average, which is the value."""
    q, v0 = f["q_start"], f["random_v"][INDEX[START]]
    v1 = f["history"][1][1][INDEX[START]]
    out = panel("never-worse", x, y, h, "3. Why greedy never hurts")
    out.append(text(x + 200, y + 58, f"at S, the four moves under the random walker: {Q_PI}(S, a)", "dim", 14, "middle"))
    lo, hi, x0, x1, ly = -1185.0, -985.0, x + 26, x + 374, y + 140

    def at(u):
        return x0 + (u - lo) / (hi - lo) * (x1 - x0)
    out.append(line(x0, ly, x1, ly, "chalk", 1.6))
    for t in range(-1175, -985, 25):
        out.append(line(at(t), ly - 4, at(t), ly + 4, "faint", 1.2))
    for name, color, label in (("R", "red", "→ cliff"), ("D", "dim", "↓ ← walls (2 moves)"), ("U", "green", "↑ up")):
        px = at(q[name])
        out.append(f'<circle cx="{px:.1f}" cy="{ly}" r="5" {fill(color)}/>')
        out.append(text(px, ly - 14, num(q[name]), color, 15, "middle"))
        out.append(text(px, ly - 34, label, color, 14, "middle"))
    out.append(f'<circle cx="{at(q["U"]):.1f}" cy="{ly}" r="11" fill="none" {stroke("green")} stroke-width="1.8"/>')
    out.append(text(at(q["U"]), ly + 32, "max", "green", 15, "middle"))
    ax = at(v0)
    out.append(line(ax, ly - 10, ax, ly + 30, "blue", 2.2))
    out.append(text(ax, ly + 48, f"average = {V_PI}(S) = {num(v0)}", "blue", 15, "middle"))
    out.append(text(x + 200, ly + 80, "max ≥ average", "yellow", 19, "middle"))
    ey = y + 266
    every = '<tspan font-size="70%"> in every cell</tspan>'
    out.append(eq(x + 92, ey, [(Q_PI + "(s, ", "blue"), ("π′(s)", "green"), (") ≥ " + V_PI + "(s)", "blue"), (every, "dim")], 20))
    out.append(text(x + 200, ey + 21, "one greedy move, then π: never worse", "dim", 12, "middle"))
    out.append(text(x + 116, ey + 48, "⇓", "yellow", 20, "middle"))
    out.append(text(x + 132, ey + 47, "policy improvement theorem", "yellow", 14))
    out.append(eq(x + 116, ey + 80, [(f"v{sub('π′')}(s) ≥ {V_PI}(s)", "blue"), (every, "dim")], 20))
    out.append(text(x + 200, ey + 101, "greedy moves every time: never worse", "dim", 12, "middle"))
    sy = ey + 140
    out.append(text(x + 14, sy, "at S:", "dim", 15))
    for cx, value, label in ((x + 110, v0, f"{V_PI}(S)"), (x + 230, q["U"], f"{Q_PI}(S, up)"), (x + 340, v1, f"v{sub('π′')}(S)")):
        out.append(text(cx, sy, num(value), "chalk", 18, "middle"))
        out.append(text(cx, sy + 21, label, "blue", 12, "middle"))
    for cx in (x + 170, x + 290):
        out.append(text(cx, sy, "≤", "yellow", 18, "middle"))
    out.append("</g>")
    return out


def draw_rounds(x, y, h, f):
    """4. Policy iteration: the chain of rounds, the routes, v(S) by round and the stop condition."""
    history = f["history"]
    final_moves = history[-1][0]
    out = panel("rounds", x, y, h, "4. Repeat until nothing changes")
    cy, step = y + 64, 49
    items = [("π" + sub("0"), "green"), (V_PI + sub("0"), "blue"), ("π" + sub("1"), "green"), (V_PI + sub("1"), "blue"),
             ("π" + sub("2"), "green"), ("⋯", "dim"), ("π*", "green"), ("v*", "blue")]
    for k, (body, color) in enumerate(items):
        out.append(text(x + 26 + k * step, cy, body, color, 19, "middle"))
        if k < len(items) - 1:
            ax = x + 26 + k * step
            col, letter = ("blue", "E") if k % 2 == 0 else ("green", "I")
            out.append(f'<path d="M{ax + 14} {cy - 6}H{ax + step - 14}" {stroke(col)} stroke-width="1.6" marker-end="url(#gpi-a{col[0]})"/>')
            out.append(text(ax + step / 2, cy - 14, letter, col, 13, "middle"))
    out.append(text(x + 120, cy + 26, f"{tint('E', 'blue')}: evaluate (panel 1)", "dim", 13, "middle"))
    out.append(text(x + 290, cy + 26, f"{tint('I', 'green')}: improve (panel 2)", "dim", 13, "middle"))
    gx, gy = x + 26, y + 112
    out += grid(gx, gy, history[-1][1], final_moves, arrows="dim")
    out.append(route_path(gx, gy, f["detour"], "yellow", "6 6", shift=-6))
    out.append(route_path(gx, gy, final_moves, "green"))
    out.append(text(gx, gy + 4 * CELL + 22, "round 4: 17 steps", "yellow", 14))
    out.append(text(gx + 360, gy + 4 * CELL + 22, "round 6: 13 steps", "green", 14, "end"))
    # v(S) by round, on a log scale of how negative it is.
    top, span, px0, pstep = y + 292, 58, x + 86, 46

    def py(v):
        return top + (np.log10(-v) - 1) / 2 * span
    out.append(text(x + 14, top - 12, f"{V_PI}(S)", "blue", 15))
    for t in (-10, -100, -1000):
        out.append(text(px0 - 22, py(t) + 4, num(t), "faint", 11, "end"))
        out.append(line(px0 - 16, py(t), px0 + 6 * pstep + 8, py(t), "faint", 0.8, ' stroke-dasharray="2 4"'))
    pts = [(px0 + k * pstep, py(v[INDEX[START]])) for k, (_, v) in enumerate(history)]
    d = f"M{pts[0][0]:g} {pts[0][1]:.1f}" + "".join(f"H{px:g}V{pyv:.1f}" for px, pyv in pts[1:])
    out.append(f'<path d="{d}" fill="none" {stroke("blue")} stroke-width="2"/>')
    labels = {0: (".0f", 10, "start"), 1: (".0f", 8, "start"), 4: (".1f", 0, "middle"), 6: (".2f", 0, "middle")}
    for k, (px, pyv) in enumerate(pts):
        color = "green" if k == len(pts) - 1 else "blue"
        out.append(f'<circle cx="{px:g}" cy="{pyv:.1f}" r="3.5" {fill(color)}/>')
        out.append(text(px, top + span + 24, str(k), "dim", 12, "middle"))
        if k in labels:
            fmt, dx, anchor = labels[k]
            out.append(text(px + dx, pyv - 9, num(history[k][1][INDEX[START]], fmt), color, 13, anchor))
    out.append(text(x + 14, top + span + 24, "round", "dim", 12))
    ex, ey, size = x + 124, y + 430, 20
    out.append(text(x + 200, ey - 30, "a greedy step changes nothing, so in every cell", "dim", 13, "middle"))
    out.append(eq(ex, ey, [(V_PI + "(s)", "blue"), (" = ", "chalk"), ("max", "green"), (" ", "chalk"), (Q_PI + "(s, a)", "blue")], size))
    out.append(text(ex + size * 3.65, ey + 15, "a", "dim", 11, "middle"))
    out.append(text(x + 200, ey + 34, "Bellman optimality: only v* solves it, so π = π*", "yellow", 14, "middle"))
    out.append("</g>")
    return out


def draw_sweeps(x, y, h, f):
    """5. Evaluation can stop early: policy iteration, value iteration and anything between, on one time line."""
    out = panel("sweeps", x, y, h, "5. Evaluation can stop early")
    out.append(text(x + 322, y + 58, "evaluate", "blue", 14, "end"))
    out.append(text(x + 386, y + 58, "improve", "green", 14, "end"))

    def bars(x0, y0, lengths):
        res, cx = [], x0
        for n in lengths:
            if n:
                res.append(line(cx, y0, cx + n, y0, "blue", 7, ' stroke-linecap="butt"'))
            res.append(line(cx + n + 3, y0 - 9, cx + n + 3, y0 + 9, "green", 2.6))
            cx += n + 9
        return res, cx
    rows = [("policy iteration", [62, 62, 62, 62], "evaluate to the end, then improve: 6 rounds"),
            ("value iteration", [11] * f["sweeps"], f"one sweep, then improve: {f['sweeps']} sweeps on the cliff grid"),
            ("anything between", [34, 6, 52, 18, 3, 26, 11, 40], "a few sweeps, one cell, one sample ...")]
    for k, (name, lengths, caption) in enumerate(rows):
        ry = y + 60 + 74 * k
        out.append(text(x + 14, ry, name, "chalk", 16))
        res, end = bars(x + 16, ry + 22, lengths)
        out += res
        if k == 0:
            out.append(text(end + 6, ry + 27, "⋯", "dim", 16))
        out.append(text(x + 14, ry + 50, caption, "dim", 13))
    # The value iteration update, 16.5 em wide.
    ex, ey, size = x + 52, y + 300, 18
    out.append(eq(ex, ey, [(f"v{sub('k+1')}(s)", "blue"), (" = ", "chalk"), ("max", "green"), (" Σ", "chalk"),
                           (" p(s′, r | s, a) [ r + γ ", "chalk"), (f"v{sub('k')}(s′)", "blue"), (" ]", "chalk")], size))
    out.append(text(ex + size * 4.18, ey + 15, "a", "dim", 11, "middle"))
    out.append(text(ex + size * 5.50, ey + 15, "s′, r", "dim", 11, "middle"))
    out += under(ex + size * 4.18, ey, "improve: best move", "green", drop=34, start=20)
    out += under(ex + size * 10.79, ey, "evaluate: one sweep", "blue", drop=34)
    out.append(text(x + 200, ey + 64, "the max replaces the average over π(a | s) in panel 1", "dim", 13, "middle"))
    out.append(text(x + 200, ey + 92, f"from v = 0, exact v* after {f['sweeps']} sweeps", "yellow", 15, "middle"))
    out.append("</g>")
    return out


def spiral(cx, cy, radii, squash):
    """Half turns that alternate over the top (evaluation, blue) and under the bottom (improvement, green),
    each closer to the center. Every half turn is half an ellipse whose ends lie on the horizontal axis."""
    out = []
    for k, (a, b) in enumerate(zip(radii, radii[1:])):
        top = k % 2 == 0
        x_from, x_to = (cx - a, cx + b) if top else (cx + a, cx - b)
        rx = (a + b) / 2
        color = "blue" if top else "green"
        out.append(f'<path d="M{x_from:.1f} {cy}A{rx:.1f} {rx * squash:.1f} 0 0 1 {x_to:.1f} {cy}" fill="none" {stroke(color)} '
                   f'stroke-width="{2.6 - 0.2 * k:.2f}" marker-end="url(#gpi-a{color[0]})"/>')
    return out


def draw_gpi(x, y, h, f):
    """6. Generalized policy iteration: two processes that pull toward two conditions, which hold together only at the optimum."""
    out = panel("gpi", x, y, h, "6. GPI: two processes, one loop")
    cx, cy, squash = x + 200, y + 150, 0.62
    radii = [150, 112, 82, 60, 42, 0]
    out += spiral(cx, cy, radii, squash)
    out.append(text(x + 28, cy + 8, "π", "green", 28, "middle"))
    out.append(text(x + 28, cy + 26, "policy", "green", 12, "middle"))
    out.append(text(x + 360, cy + 8, "v", "blue", 28, "middle"))
    out.append(text(x + 392, cy + 26, "value function", "blue", 12, "end"))
    rx0, rx1 = (radii[0] + radii[1]) / 2, (radii[1] + radii[2]) / 2
    out.append(text(cx + (radii[1] - radii[0]) / 2, cy - rx0 * squash - 12, f"evaluate:  v → {V_PI}", "blue", 17, "middle"))
    out.append(text(cx + (radii[1] - radii[2]) / 2, cy + rx1 * squash + 26, "improve:  π → greedy(v)", "green", 17, "middle"))
    out.append(f'<circle cx="{cx}" cy="{cy}" r="4.5" {fill("yellow")}/>')
    out.append(text(cx, cy + 22, "π*, v*", "yellow", 17, "middle"))
    ty, c1, c2 = y + 272, x + 196, x + 322
    out.append(text(c1, ty, f"v = {V_PI}", "blue", 17, "middle"))
    out.append(text(c1, ty + 21, "values fit π", "blue", 12, "middle"))
    out.append(text(c2, ty, "π = greedy(v)", "green", 17, "middle"))
    out.append(text(c2, ty + 21, "π acts best on v", "green", 12, "middle"))
    out.append(text(x + 14, ty - 2, "full steps, as in", "dim", 12))
    out.append(text(x + 14, ty + 14, "policy iteration", "dim", 12))
    out.append(line(x + 12, ty + 30, x + 388, ty + 30, "faint", 1))
    rows = [("after evaluate", "chalk", (True, False)), ("after improve", "chalk", (False, True)), ("at π*, v*", "yellow", (True, True))]
    for k, (name, color, marks) in enumerate(rows):
        ry = ty + 56 + 28 * k
        out.append(text(x + 14, ry, name, color, 15))
        for col, ok in zip((c1, c2), marks):
            out.append(check(col, ry - 4) if ok else cross(col, ry - 4))
    out.append(text(x + 200, ty + 136, "each step usually undoes the other, until the optimum", "dim", 13, "middle"))
    out.append("</g>")
    return out


def draw_family(x, y, h, f):
    """7. The same two processes inside other methods, and AlphaGo Zero's loss split into them."""
    out = panel("family", x, y, h, "7. Same loop, different parts")
    c1, c2, c3 = x + 14, x + 136, x + 268
    out.append(text(c2, y + 58, "evaluate", "blue", 16))
    out.append(text(c3, y + 58, "improve", "green", 16))
    out.append(line(x + 12, y + 66, x + 388, y + 66, "faint", 1))
    rows = [
        ("policy iteration", f"solve for {V_PI}", "greedy, all cells"),
        ("value iteration", "one sweep", "max in the sweep"),
        ("Monte Carlo", "average returns", "greedy per episode"),
        ("Sarsa", "one TD step on Q", "ε-greedy on Q"),
        ("Q-learning", "one TD step on Q", "max in the target"),
        ("actor-critic", "critic: TD error", "actor: gradient step"),
        ("AlphaGo Zero", "self-play winner z", "tree search (MCTS)"),
    ]
    for k, (name, ev, im) in enumerate(rows):
        ry = y + 90 + 27 * k
        out.append(text(c1, ry, name, "yellow" if name == "AlphaGo Zero" else "chalk", 15))
        out.append(text(c2, ry, ev, "dim", 14))
        out.append(text(c3, ry, im, "dim", 14))
    # AlphaGo Zero's loss, 11.4 em wide.
    ex, ey, size = x + 86, y + 318, 20
    out.append(text(x + 14, ey - 40, "AlphaGo Zero's training loss", "yellow", 15))
    out.append(eq(ex, ey, [("l = ", "chalk"), (f"(z − v){sup('2')}", "blue"), (" − ", "chalk"), (f"π{sup('T')} log p", "green"),
                           (f" + c‖θ‖{sup('2')}", "dim")], size))
    out += under(ex + size * 2.66, ey, "evaluate: v → winner z", "blue")
    out += under(ex + size * 6.54, ey, "improve: p → search π", "green", drop=40)
    out += under(ex + size * 10.0, ey, "regularizer", "dim")
    out.append(text(x + 200, ey + 70, "p, v: the network's move probabilities and value", "dim", 12, "middle"))
    out.append("</g>")
    return out


# The board: panels in text order, two to a row, the last one centered.
PANELS = [("walker", draw_walker), ("greedy", draw_greedy), ("never-worse", draw_theorem), ("rounds", draw_rounds),
          ("sweeps", draw_sweeps), ("gpi", draw_gpi), ("family", draw_family)]
ROW_H = [410, 480, 420, 400]
GAP = 15


def layout():
    """Each panel's name, drawing function, top left corner and height."""
    placed, y = [], 10
    for row, h in enumerate(ROW_H):
        pair = PANELS[2 * row:2 * row + 2]
        xs = (10, 430) if len(pair) == 2 else (220,)
        placed += [(name, draw, px, y, h) for (name, draw), px in zip(pair, xs)]
        y += h + GAP
    return placed, y - GAP + 10


def markers():
    out = ['<defs>', f'<marker id="gpi-a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke("chalk")} stroke-width="1.8"/></marker>',
           f'<marker id="gpi-ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke("red")} stroke-width="1.8"/></marker>']
    for color in ("blue", "green", "yellow"):
        out.append(f'<marker id="gpi-a{color[0]}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" {stroke(color)} stroke-width="1.6"/></marker>')
    return out + ['</defs>']


def canvas(history):
    f = facts(history)
    out = markers() + ['<g font-size="15">']
    for name, draw, x, y, h in layout()[0]:
        out += draw(x, y, h, f)
    return out + ["</g>"]


def views():
    """The camera view of each panel: the panel without its title row, which the bar above the board shows."""
    return json.dumps({name: [x + 6, y + 36, 388, h - 42] for name, _, x, y, h in layout()[0]})


TITLE = "Generalized policy iteration on a blackboard"
DESC = ("Seven panels on the Part 1 cliff grid. 1: a random walker's values, −1072 at the start, and the Bellman expectation "
        "equation. 2: the greedy policy and one greedy step; no cell gets worse. 3: at the start the best move, −1002, beats the "
        "average, −1072. 4: six rounds of policy iteration, −1072 to −12.25. 5: value iteration, 14 sweeps. 6: a spiral between "
        "the policy and the value function that closes in on the optimum. 7: what evaluates and what improves in seven methods.")


def canvas_svg(history):
    body = "\n".join(canvas(history))
    _, height = layout()
    return (f'<svg class="rc-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 {height}" data-whole="0 0 840 {height}" '
            f"data-views='{views()}' role=\"img\" aria-labelledby=\"gpi-title gpi-desc\">"
            f'<title id="gpi-title">{TITLE}</title><desc id="gpi-desc">{DESC}</desc>\n{body}\n</svg>')


def thumbnail_svg(history):
    """Panels 4 and 6 side by side as a 720 x 424 card, with the colors and the font written in."""
    f, h = facts(history), max(ROW_H[1], ROW_H[2])
    font = base64.b64encode(FONT.read_bytes()).decode()
    inner = "\n".join(markers() + draw_rounds(10, 10, h, f) + draw_gpi(430, 10, h, f))
    inner = inner.replace(" (panel 1)", "").replace(" (panel 2)", "")  # the card has no panels 1 and 2
    inner = inner.replace('stroke="#b6baaf"', 'stroke="#6f7d75" stroke-width="1.5" stroke-dasharray="2 5"')
    vh = 840 * 424 / 720
    alt = ("Two blackboard panels: policy iteration on the cliff grid, whose start value climbs from −1072 to −12.25 in six rounds, "
           "and a spiral between evaluation and improvement that closes in on the optimal policy and value")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="720" height="424" viewBox="0 {10 + h / 2 - vh / 2:.1f} 840 {vh:.1f}" '
            f'preserveAspectRatio="xMidYMid meet" role="img" aria-label="{alt}" color="#f4f1e8">'
            "<!-- Font: Patrick Hand, Copyright (c) 2010-2012 Patrick Wagesreiter, SIL Open Font License 1.1, see /assets/robotics/rl/fonts/OFL.txt -->"
            f'<style>@font-face{{font-family:"RL Chalk";src:url(data:font/woff2;base64,{font}) format("woff2")}}'
            'text,tspan{font-family:"RL Chalk","Patrick Hand","Chalkboard SE","Comic Neue","Segoe Print",cursive;letter-spacing:.01em}</style>'
            '<rect x="-200" y="-200" width="1240" height="1000" fill="#1d2824"/>'
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
