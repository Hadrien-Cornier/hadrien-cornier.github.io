"""Small figures from audited summary tables. No fits or simulations.

Run with a Python environment containing matplotlib:
    python scripts/so101_part7_figures.py
Source scope and pins: docs/so101-part7/claim-check.md.
"""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/robotics/so101-after-part6"
DATA = json.loads((OUT / "figure-data.json").read_text())
INK, MUTED, BLUE, ORANGE = "#1f2933", "#6b7280", "#1d4ed8", "#c2410c"


def style():
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 11,
        "text.color": INK, "axes.labelcolor": INK,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.edgecolor": "#9ca3af", "xtick.color": MUTED,
        "ytick.color": MUTED, "figure.facecolor": "white",
        "savefig.facecolor": "white", "legend.frameon": False,
    })


def save(fig, filename):
    fig.savefig(OUT / filename, dpi=150)
    plt.close(fig)


def budget():
    d = DATA["repeat_budget"]
    fig, axes = plt.subplots(1, 2, figsize=(10.6, 4.5))
    fig.suptitle("What the encoders explain between repeated runs", fontsize=16, x=.07, ha="left")
    ax = axes[0]
    ax.barh([0], [d["seen_percent"]], color=BLUE, height=.5)
    ax.barh([0], [d["unexplained_percent"]], left=d["seen_percent"], color=ORANGE, height=.5)
    ax.text(35, 0, "70%\nexplained", color="white", ha="center", va="center", weight="bold")
    ax.text(85, 0, "30%\nleft", color="white", ha="center", va="center", weight="bold")
    ax.set(xlim=(0, 100), ylim=(-.65, .65), yticks=[], xlabel="Share of repeat variance (%)")
    ax.set_title("Encoder signals at the same time", loc="left", fontsize=12)
    ax.spines["left"].set_visible(False)
    ax.text(0, -.48, "Repeat deviation: 0.69 mm RMS", color=MUTED, fontsize=10)
    ax = axes[1]
    ax.plot(d["delay_ms"], d["predicted_variance_percent"], "o-", color=BLUE, lw=2)
    for x, y in zip(d["delay_ms"], d["predicted_variance_percent"]):
        ax.annotate(f"{y}%", (x, y), xytext=(0, 9), textcoords="offset points", ha="center")
    ax.set(xlim=(35, 215), ylim=(0, 65), xticks=d["delay_ms"], xlabel="Prediction delay (ms)", ylabel="Variance predicted (%)")
    ax.set_title("History predicts less as delay grows", loc="left", fontsize=12)
    ax.grid(axis="y", color="#e5e7eb")
    ax.set_axisbelow(True)
    fig.text(.07, .035, "Offline · 40 old-nib s40 repeats · phys, P16 · prediction is an upper bound for feedback", fontsize=10, color=MUTED)
    fig.subplots_adjust(left=.07, right=.97, top=.78, bottom=.22, wspace=.38)
    save(fig, "repeat-budget.png")


def learning():
    d = DATA["learning"]
    fig, axes = plt.subplots(1, 2, figsize=(10.6, 4.7), sharey=True)
    fig.suptitle("The timing gain and the drawing error", fontsize=16, x=.07, ha="left")
    for ax, key, title, note in zip(
        axes, ["fixed", "native"],
        ["Fixed time: includes lag", "Native reports: lag fitted"],
        ["Lower error with the head", "Higher error with the head"],
    ):
        values = [sum(d[f"{key}_baselines_mm"]) / 2, d[f"{key}_head_mm"]]
        ax.bar([0, 1], values, width=.55, color=[MUTED, BLUE])
        for x, value in enumerate(values):
            ax.text(x, value+.05, f"{value:.3f}", ha="center", weight="bold")
        ax.set(xticks=[0, 1], xticklabels=["Bracketed physics", "Frozen head"], ylim=(0, 2.75))
        ax.set_title(title, loc="left", fontsize=12)
        ax.set_xlabel(note, labelpad=12)
        ax.grid(axis="y", color="#e5e7eb")
        ax.set_axisbelow(True)
    axes[0].set_ylabel("Mean drawing RMS (mm)")
    fig.text(.07, .04, "Measured · N64 frozen head, 102 training passes · mean of four Test drawings · one A/B/A block", fontsize=10, color=MUTED)
    fig.subplots_adjust(left=.07, right=.97, top=.78, bottom=.25, wspace=.25)
    save(fig, "timing-and-shape.png")


def twin():
    d = DATA["twin"]
    fig, ax = plt.subplots(figsize=(9, 4.7))
    fig.suptitle("Does the same twin reproduce another day's error?", fontsize=16, x=.1, ha="left")
    values = [d["original_cohort"]["share_percent"], d["held_date"]["share_percent"]]
    ax.bar([0, 1], values, width=.5, color=[BLUE, ORANGE])
    for x, value in enumerate(values):
        ax.text(x, value + (2 if value > 0 else -2), f"{value:g}%", ha="center", va="bottom" if value > 0 else "top", weight="bold")
    ax.axhline(0, color=MUTED, lw=1)
    ax.set(ylim=(-18, 65), xticks=[0, 1], xticklabels=["Original cohort\n72 passes", "Held-out date, 13 Oct\n28 passes"], ylabel="Share of squared arm error reproduced (%)")
    ax.grid(axis="y", color="#e5e7eb")
    ax.set_axisbelow(True)
    fig.text(.1, .04, "Simulation vs Offline arm logs · same c2 + play twin · cohorts differ in nib, setup and controllers", fontsize=9, color=MUTED)
    fig.subplots_adjust(left=.1, right=.97, top=.79, bottom=.24)
    save(fig, "twin-across-days.png")


if __name__ == "__main__":
    style()
    budget()
    learning()
    twin()
