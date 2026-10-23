"""Figures for SO-101 part 2: content/robotics/so101-2-finer-than-the-sensor.md.

Run: python3 scripts/so101_figures.py 2
"""

from so101_common import *  # noqa: F401,F403


def board_legend(ax, **kwargs):
    """Legend on a board-colored patch, so grid lines do not run through its text."""
    return ax.legend(frameon=True, facecolor=BOARD, edgecolor="none", framealpha=1, **kwargs)


def chalk_box(ax, xy, width, height, text, edge, face=BOARD):
    """A labeled box. The hand font has tall lines, so the line spacing is tighter than draw_box."""
    ax.add_patch(Rectangle(xy, width, height, facecolor=face, edgecolor=edge, linewidth=1.8,
                           joinstyle="round", zorder=2))
    ax.text(xy[0] + width / 2, xy[1] + height / 2, text, ha="center", va="center",
            color=INK, linespacing=0.95, zorder=3)


def tick_rounding():
    time = np.linspace(0, 10, 1001)
    true_angle = time * 0.8 + 0.1
    reading = np.round(true_angle)
    error = reading - true_angle
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 6.6), sharex=True,
                             gridspec_kw={"height_ratios": [1.1, 1]})
    axes[0].plot(time, true_angle, color=BLUE, label="true angle")
    axes[0].step(time, reading, where="mid", color=ORANGE, lw=2.2,
                 label="reading, rounded to nearest tick")
    axes[0].set_ylabel("angle (tick)")
    board_legend(axes[0], loc="upper left", handlelength=1.4)
    axes[1].fill_between(time, -1 / np.sqrt(12), 1 / np.sqrt(12), color=YELLOW,
                         alpha=0.18, lw=0, label=r"$\pm1/\sqrt{12}=\pm0.289$ tick")
    axes[1].plot(time, error, color=TEAL, lw=2.2)
    axes[1].axhline(0, color=MUTED, lw=1.0)
    # Extra room above the sawtooth holds the legend and the RMS note.
    axes[1].set_ylim(-0.58, 0.95)
    axes[1].set_yticks([-0.5, -0.25, 0, 0.25, 0.5],
                       ["\u22120.50", "\u22120.25", "0.00", "0.25", "0.50"])
    axes[1].set_ylabel("reading error (tick)")
    axes[1].set_xlabel("time (tick intervals)")
    board_legend(axes[1], loc="upper left", handlelength=1.4)
    axes[1].text(0.98, 0.97, "RMS = 1/sqrt(12) tick = 0.443 mrad",
                 transform=axes[1].transAxes, ha="right", va="top", color=INK)
    for ax in axes:
        ax.grid(True, axis="y")
    fig.suptitle("Encoder rounding creates a\nbounded reading error", x=0.03, y=0.985,
                 ha="left", va="top", color=YELLOW)
    fig.subplots_adjust(left=0.15, right=0.97, top=0.85, bottom=0.10, hspace=0.18)
    save_figure(fig, "tick-rounding.png")


def accel_pipelines():
    width, height = 6.08, 4.65
    fig = plt.figure(figsize=(width, height))
    ax = fig.add_axes([0, 0, 1, 1])
    setup_diagram(ax, (0, width), (0, height))
    box_h = 1.0
    ax.text(0.04, 3.66, "Encoder-based estimate", va="center", color=RED)
    top = [(0.04, 1.45, "encoder\nticks"), (1.89, 1.40, "difference\ntwice"),
           (3.69, 2.35, "noisy acceleration\n(one tick at 30 Hz\n= 1.4 rad/s\u00b2)")]
    for x, w, label in top:
        chalk_box(ax, (x, 2.30), w, box_h, label, RED)
    add_arrow(ax, (1.53, 2.80), (1.85, 2.80), RED)
    add_arrow(ax, (3.33, 2.80), (3.65, 2.80), RED)
    ax.text(0.04, 1.90, "Target-path estimate", va="center", color=TEAL)
    bottom = [(0.04, 1.45, "planned\ntarget path"), (1.89, 1.40, "exact\nderivative"),
              (3.69, 2.35, "clean acceleration")]
    for x, w, label in bottom:
        chalk_box(ax, (x, 0.62), w, box_h, label, TEAL)
    add_arrow(ax, (1.53, 1.12), (1.85, 1.12), TEAL)
    add_arrow(ax, (3.33, 1.12), (3.65, 1.12), TEAL)
    ax.text(6.04, 0.25, "inv, solve and mpc use this one", ha="right", va="center",
            color=TEAL)
    fig.suptitle("Controllers can estimate acceleration\nfrom different signals", x=0.0,
                 y=0.99, ha="left", va="top", color=YELLOW)
    save_figure(fig, "accel-pipelines.png")


def one_step_gain():
    tau = -0.0333 / np.log(0.85)
    time = np.linspace(0, 0.0333, 401)
    response = 1 - np.exp(-time / tau)
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 8.2),
                             gridspec_kw={"height_ratios": [1.0, 1.0]})
    axes[0].plot(time * 1000, response, color=TEAL, label="joint response")
    axes[0].axhline(1, color=BLUE, ls="--", lw=2.0, label="goal: 1 tick")
    axes[0].scatter([33.3], [0.15], color=ORANGE, s=50, zorder=4)
    axes[0].annotate("0.15 tick after 33 ms", (33.3, 0.15), xytext=(-18, 52),
                     textcoords="offset points", ha="right", color=INK,
                     arrowprops={"arrowstyle": "->", "color": ORANGE, "lw": 1.8})
    axes[0].set_xlim(0, 35)
    axes[0].set_ylim(0, 1.15)
    axes[0].set_xlabel("time after goal step (ms)")
    axes[0].set_ylabel("joint motion (tick)")
    axes[0].set_title("A 1-tick goal step")
    board_legend(axes[0], loc="center left", handlelength=1.6)
    axes[0].grid(True, axis="y")

    axes[1].bar([0, 1], [7, 1], width=0.56, color=[ORANGE, TEAL])
    axes[1].set_xticks([0, 1], ["goal jump", "joint motion\nafter 33 ms"])
    axes[1].set_ylim(0, 8.2)
    axes[1].set_ylabel("angle change (tick)")
    axes[1].set_title("To move 1 tick in one step")
    axes[1].text(0, 7.25, "about 7", ha="center", color=INK)
    axes[1].text(1, 1.25, "1", ha="center", color=INK)
    axes[1].grid(True, axis="y")
    fig.suptitle("A slow servo needs a larger goal change", x=0.03, y=0.985,
                 ha="left", va="top", color=YELLOW)
    fig.subplots_adjust(left=0.15, right=0.97, top=0.88, bottom=0.09, hspace=0.38)
    save_figure(fig, "one-step-gain.png")


def observer_step():
    fig, ax = plt.subplots(figsize=(6.4, 5.0))
    ax.set_xlim(9.2, 13.4)
    ax.set_ylim(-0.65, 3.4)
    ax.axhline(1.05, color=GRID, lw=2.4)
    values = [(10.0, "last estimate\n10.0", MUTED, 0.45),
              (11.2, "prediction\n11.2", BLUE, 1.50),
              (11.64, "corrected estimate\n11.64", TEAL, 0.45),
              (12.3, "reading\n12.3", ORANGE, 1.50)]
    for x, label, color, y in values:
        ax.scatter([x], [1.05], s=90, color=color, zorder=4)
        ax.text(x, y, label, ha="center", va="center", color=color)
    ax.annotate("", xy=(12.3, 2.25), xytext=(11.2, 2.25),
                arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 2.0})
    ax.text(11.75, 2.47, "innovation = 1.1", ha="center", color=PURPLE)
    ax.text(9.42, 3.1, "1 predict", color=BLUE)
    ax.text(10.95, 3.1, "2 compare", color=PURPLE)
    ax.text(12.26, 3.1, "3 correct", color=TEAL)
    ax.text(11.60, -0.28, "11.2 + 0.4 \u00d7 1.1; alpha = 0.4", ha="center", color=INK)
    ax.set_yticks([])
    ax.set_xlabel("joint angle (mrad)")
    ax.set_title("One observer step: predict, compare, correct", pad=12)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", left=False, labelleft=False)
    fig.subplots_adjust(left=0.05, right=0.97, top=0.88, bottom=0.15)
    save_figure(fig, "observer-step.png")


def two_observers():
    width, panel_h = 6.08, 4.4
    first_y0 = panel_h - 0.35
    height = first_y0 + 4.45 + 0.75
    fig = plt.figure(figsize=(width, height))
    ax = fig.add_axes([0, 0, 1, 1])
    setup_diagram(ax, (0, width), (0, height))
    titles = ["State observer", "Disturbance observer"]
    descriptions = [
        "true angle and speed\n(state observer, alpha-beta filter)",
        "missing force: a tool, a sag\n(disturbance observer: w in solve and mpc,\nKalman filter in mpca)",
    ]
    for index, (title, description, color) in enumerate(zip(titles, descriptions, [BLUE, TEAL])):
        y0 = first_y0 - index * panel_h
        ax.text(0.08, y0 + 4.28, title, va="center", color=color)
        chalk_box(ax, (0.08, y0 + 2.50), 1.60, 0.80, "model\npredict", color)
        chalk_box(ax, (2.10, y0 + 2.50), 1.95, 0.80, "compare\nwith reading", color)
        chalk_box(ax, (4.47, y0 + 2.50), 1.40, 0.80, "correct", color)
        add_arrow(ax, (1.71, y0 + 2.90), (2.07, y0 + 2.90), color, lw=1.8)
        add_arrow(ax, (4.08, y0 + 2.90), (4.44, y0 + 2.90), color, lw=1.8)
        # From "correct": one line back to "model predict", one arrow down to the estimate.
        ax.plot([5.17, 5.17, 0.88], [y0 + 2.47, y0 + 2.10, y0 + 2.10], color=color, lw=1.8)
        add_arrow(ax, (0.88, y0 + 2.10), (0.88, y0 + 2.47), color, lw=1.8)
        chalk_box(ax, (0.80, y0 + 0.50), 5.08, 1.15, description, color, face=PALE)
        add_arrow(ax, (5.17, y0 + 2.47), (5.17, y0 + 1.68), color, lw=1.8)
        # The reading enters the compare step from above.
        ax.text(3.075, y0 + 3.95, "reading", ha="center", va="center", color=MUTED)
        add_arrow(ax, (3.075, y0 + 3.72), (3.075, y0 + 3.35), MUTED, lw=1.6)
    fig.suptitle("Observers estimate different hidden quantities", x=0.0, y=0.99,
                 ha="left", va="top", color=YELLOW)
    save_figure(fig, "two-observers.png")


FIGURES = [tick_rounding, accel_pipelines, one_step_gain, observer_step, two_observers]
