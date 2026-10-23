"""Small chalk figures from audited summary tables. No fits or simulations.

Run with a Python environment containing matplotlib, numpy and Pillow:
    python scripts/so101_part7_figures.py
Source scope and pins: docs/so101-part7/claim-check.md.
The style is the shared chalk style in assets/robotics/chalk/.
"""

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/so101-after-part6"
DATA = json.loads((OUT / "figure-data.json").read_text())


def footnote(fig, text):
    """Source note at the bottom left of the figure, in secondary ink."""
    fig.text(0.02, 0.012, text, ha="left", va="bottom", color=chalk.DIM, linespacing=1.0)


def title(fig, text):
    fig.suptitle(text, x=0.02, y=0.99, ha="left", va="top", color=chalk.YELLOW)


def margins(fig, top, bottom, left=0.9, right=0.15, gap=None, rows=1):
    """Set the plot area from margins in inches (top and bottom hold titles, labels and the note)."""
    width, height = fig.get_size_inches()
    kwargs = {}
    if gap is not None:
        axes_h = (height - top - bottom - gap * (rows - 1)) / rows
        kwargs["hspace"] = gap / axes_h
    fig.subplots_adjust(left=left / width, right=1 - right / width,
                        top=1 - top / height, bottom=bottom / height, **kwargs)


def budget():
    d = DATA["repeat_budget"]
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 8.6), gridspec_kw={"height_ratios": [1.7, 2.9]})
    title(fig, "What the encoders explain between repeated runs")
    ax = axes[0]
    ax.barh([0], [d["seen_percent"]], color=chalk.BLUE, height=.5)
    ax.barh([0], [d["unexplained_percent"]], left=d["seen_percent"], color=chalk.RED, height=.5)
    ax.text(35, 0, "70%\nexplained", color=chalk.BOARD, ha="center", va="center", linespacing=1.0)
    ax.text(85, 0, "30%\nleft", color=chalk.BOARD, ha="center", va="center", linespacing=1.0)
    ax.set(xlim=(0, 100), ylim=(-.65, .65), yticks=[], xlabel="Share of repeat variance (%)")
    ax.set_title("Encoder signals at the same time")
    ax.spines["left"].set_visible(False)
    ax.text(0, -.46, "Repeat deviation: 0.69 mm RMS", color=chalk.DIM, va="center")
    ax = axes[1]
    ax.plot(d["delay_ms"], d["predicted_variance_percent"], "o-", color=chalk.BLUE)
    for x, y in zip(d["delay_ms"], d["predicted_variance_percent"]):
        last = x == d["delay_ms"][-1]
        ax.annotate(f"{y}%", (x, y), xytext=(10, 0) if last else (8, 6), textcoords="offset points",
                    ha="left", va="center" if last else "bottom", bbox=chalk.label_box())
    ax.set(xlim=(35, 215), ylim=(0, 65), xticks=d["delay_ms"], xlabel="Prediction delay (ms)", ylabel="Variance predicted (%)")
    ax.set_title("History predicts less as delay grows")
    ax.grid(axis="y")
    footnote(fig, "Offline · 40 old-nib s40 repeats · phys, P16 ·\nprediction is an upper bound for feedback")
    margins(fig, top=1.15, bottom=1.6, gap=1.25, rows=2)
    chalk.save(fig, OUT / "repeat-budget.png")


def learning():
    d = DATA["learning"]
    fig, axes = plt.subplots(1, 2, figsize=(6.4, 5.4), sharey=True)
    title(fig, "The timing gain and the drawing error")
    for ax, key, heading, note in zip(
        axes, ["fixed", "native"],
        ["Fixed time: includes lag", "Native reports: lag fitted"],
        ["Lower error with the head", "Higher error with the head"],
    ):
        values = [sum(d[f"{key}_baselines_mm"]) / 2, d[f"{key}_head_mm"]]
        ax.bar([0, 1], values, width=.62, color=[chalk.DIM, chalk.BLUE])
        for x, value in enumerate(values):
            ax.text(x, value + .05, f"{value:.3f}", ha="center")
        ax.set(xticks=[0, 1], xticklabels=["Bracketed\nphysics", "Frozen\nhead"], ylim=(0, 2.75))
        ax.set_title(heading)
        ax.set_xlabel(note, labelpad=10)
        ax.grid(axis="y")
    axes[0].set_yticks([0, .5, 1, 1.5, 2, 2.5], ["0.0", "0.5", "1.0", "1.5", "2.0", "2.5"])
    axes[0].set_ylabel("Mean drawing RMS (mm)")
    footnote(fig, "Measured · N64 frozen head, 102 training passes ·\nmean of four Test drawings · one A/B/A block")
    margins(fig, top=0.95, bottom=1.85, right=0.1)
    fig.subplots_adjust(wspace=0.12)
    chalk.save(fig, OUT / "timing-and-shape.png")


def twin():
    d = DATA["twin"]
    fig, ax = plt.subplots(figsize=(6.4, 5.3))
    title(fig, "Does the same twin reproduce another day's error?")
    values = [d["original_cohort"]["share_percent"], d["held_date"]["share_percent"]]
    ax.bar([0, 1], values, width=.5, color=[chalk.BLUE, chalk.RED])
    for x, value in enumerate(values):
        ax.text(x, value + (2 if value > 0 else -2), f"{value:g}%", ha="center", va="bottom" if value > 0 else "top")
    ax.axhline(0, color=chalk.DIM, lw=1.4)
    ax.set(ylim=(-18, 65), xticks=[0, 1], xticklabels=["Original cohort\n72 passes", "Held-out date, 13 Oct\n28 passes"],
           ylabel="Share of squared arm error\nreproduced (%)")
    ax.grid(axis="y")
    footnote(fig, "Simulation vs Offline arm logs · same c2 + play twin ·\ncohorts differ in nib, setup and controllers")
    margins(fig, top=0.65, bottom=1.65, left=1.0)
    chalk.save(fig, OUT / "twin-across-days.png")


if __name__ == "__main__":
    chalk.use()
    budget()
    learning()
    twin()
