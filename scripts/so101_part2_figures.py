"""Figures for SO-101 part 2: content/robotics/so101-2-finer-than-the-sensor.md.

Run: python3 scripts/so101_figures.py 2
"""

from so101_common import *  # noqa: F401,F403


def tick_rounding():
    time = np.linspace(0, 10, 1001)
    true_angle = time * 0.8 + 0.1
    reading = np.round(true_angle)
    error = reading - true_angle
    fig, axes = plt.subplots(2, 1, figsize=(8, 5.4), sharex=True,
                             gridspec_kw={"height_ratios": [1.1, 1]})
    axes[0].plot(time, true_angle, color=BLUE, lw=2, label="true angle")
    axes[0].step(time, reading, where="mid", color=ORANGE, lw=1.8,
                 label="reading, rounded to nearest tick")
    axes[0].set_ylabel("angle (tick)")
    axes[0].legend(loc="upper left", fontsize=9.5, ncol=2)
    axes[1].plot(time, error, color=TEAL, lw=1.7)
    axes[1].fill_between(time, -1 / np.sqrt(12), 1 / np.sqrt(12), color=YELLOW,
                         alpha=0.20, label=r"$\pm1/\sqrt{12}=\pm0.289$ tick")
    axes[1].axhline(0, color=MUTED, lw=0.8)
    axes[1].set_ylim(-0.58, 0.58)
    axes[1].set_ylabel("reading error (tick)")
    axes[1].set_xlabel("time (tick intervals)")
    axes[1].legend(loc="upper right", fontsize=9.5)
    axes[1].text(0.02, 0.10, "RMS = 1/sqrt(12) tick = 0.443 mrad",
                 transform=axes[1].transAxes, color=INK, fontsize=10.5,
                 bbox={"facecolor": "white", "edgecolor": "none", "alpha": 0.85})
    for ax in axes:
        clean_axis(ax, "y")
    fig.suptitle("Encoder rounding creates a bounded reading error", x=0.08, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.12, right=0.98, top=0.88, bottom=0.12, hspace=0.22)
    save_figure(fig, "tick-rounding.png")


def accel_pipelines():
    fig, ax = plt.subplots(figsize=(8, 4.2))
    setup_diagram(ax, (0, 8), (0, 4.2))
    ax.text(0.22, 3.64, "Encoder-based estimate", fontsize=12, weight="bold", color=RED)
    boxes_top = [(0.3, 1.45, "encoder\nticks"), (2.55, 1.55, "difference\ntwice"),
                 (4.95, 2.70, "noisy acceleration\n(one tick at 30 Hz = 1.4 rad/s²)")]
    for x, width, label in boxes_top:
        draw_box(ax, (x, 2.61), width, 0.72, label, edge=RED, face="#fef2f2", fontsize=10.4)
    add_arrow(ax, (1.80, 2.97), (2.51, 2.97), RED)
    add_arrow(ax, (4.12, 2.97), (4.91, 2.97), RED)
    ax.text(0.22, 1.84, "Target-path estimate", fontsize=12, weight="bold", color=TEAL)
    boxes_bottom = [(0.3, 1.68, "planned\ntarget path"), (2.55, 1.55, "exact\nderivative"),
                    (4.95, 2.70, "clean acceleration")]
    for x, width, label in boxes_bottom:
        draw_box(ax, (x, 0.78), width, 0.72, label, edge=TEAL, face="#ecfdf5", fontsize=10.8)
    add_arrow(ax, (2.00, 1.14), (2.51, 1.14), TEAL)
    add_arrow(ax, (4.12, 1.14), (4.91, 1.14), TEAL)
    ax.text(6.40, 0.34, "inv, solve and mpc use this one", ha="center",
            fontsize=10.2, color=TEAL)
    fig.suptitle("Controllers can estimate acceleration from different signals", x=0.05, y=0.98,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.82, bottom=0.06)
    save_figure(fig, "accel-pipelines.png")


def one_step_gain():
    tau = -0.0333 / np.log(0.85)
    time = np.linspace(0, 0.0333, 401)
    response = 1 - np.exp(-time / tau)
    fig, axes = plt.subplots(1, 2, figsize=(8, 4.6))
    axes[0].plot(time * 1000, response, color=TEAL, lw=2.4, label="joint response")
    axes[0].axhline(1, color=BLUE, ls="--", lw=1.4, label="goal: 1 tick")
    axes[0].scatter([33.3], [0.15], color=ORANGE, zorder=4)
    axes[0].annotate("0.15 tick after 33 ms", (33.3, 0.15), xytext=(-105, 25),
                     textcoords="offset points", fontsize=9.8,
                     arrowprops={"arrowstyle": "->", "color": ORANGE})
    axes[0].set_xlim(0, 35)
    axes[0].set_ylim(0, 1.15)
    axes[0].set_xlabel("time after goal step (ms)")
    axes[0].set_ylabel("joint motion (tick)")
    axes[0].set_title("A 1-tick goal step", fontsize=12, weight="bold")
    axes[0].legend(loc="center right", fontsize=9)
    clean_axis(axes[0], "y")

    axes[1].bar([0, 1], [7, 1], width=0.56, color=[ORANGE, TEAL])
    axes[1].set_xticks([0, 1], ["goal jump", "joint motion\nafter 33 ms"])
    axes[1].set_ylim(0, 8.2)
    axes[1].set_ylabel("angle change (tick)")
    axes[1].set_title("To move 1 tick in one step", fontsize=12, weight="bold")
    axes[1].text(0, 7.25, "about 7", ha="center", fontsize=11, weight="bold")
    axes[1].text(1, 1.25, "1", ha="center", fontsize=11, weight="bold")
    clean_axis(axes[1], "y")
    fig.suptitle("A slow servo needs a larger goal change", x=0.07, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.11, right=0.98, top=0.84, bottom=0.19, wspace=0.33)
    save_figure(fig, "one-step-gain.png")


def observer_step():
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.set_xlim(9.2, 13.4)
    ax.set_ylim(-0.2, 3.4)
    ax.axhline(1.05, color=GRID, lw=2)
    values = [(10.0, "last estimate\n10.0", MUTED, 0.45),
              (11.2, "prediction\n11.2", BLUE, 1.46),
              (11.64, "corrected estimate\n11.64", TEAL, 0.45),
              (12.3, "reading\n12.3", ORANGE, 1.46)]
    for x, label, color, y in values:
        ax.scatter([x], [1.05], s=75, color=color, zorder=4)
        ax.text(x, y, label, ha="center", va="center", fontsize=10.5, color=color)
    ax.annotate("", xy=(12.3, 2.25), xytext=(11.2, 2.25),
                arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 1.6})
    ax.text(11.75, 2.47, "innovation = 1.1", ha="center", fontsize=10.5, color=PURPLE)
    ax.text(9.42, 3.13, "1 predict", fontsize=10.5, weight="bold", color=BLUE)
    ax.text(10.95, 3.13, "2 compare", fontsize=10.5, weight="bold", color=PURPLE)
    ax.text(12.26, 3.13, "3 correct", fontsize=10.5, weight="bold", color=TEAL)
    ax.text(11.60, 0.05, "11.2 + 0.4 × 1.1; alpha = 0.4", ha="center",
            fontsize=10.5, color=INK)
    ax.set_yticks([])
    ax.set_xlabel("joint angle (mrad)")
    ax.set_title("One observer step: predict, compare, correct", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", left=False, labelleft=False)
    fig.subplots_adjust(left=0.08, right=0.98, top=0.85, bottom=0.17)
    save_figure(fig, "observer-step.png")


def two_observers():
    fig, axes = plt.subplots(1, 2, figsize=(8, 5.0))
    titles = ["State observer", "Disturbance observer"]
    descriptions = [
        "true angle and speed\n(state observer, alpha-beta filter)",
        "missing force: a tool, a sag\n(disturbance observer: w in solve and mpc,\nKalman filter in mpca)",
    ]
    for ax, title, description, color in zip(axes, titles, descriptions, [BLUE, TEAL]):
        setup_diagram(ax, (0, 4), (0, 5))
        ax.text(2, 4.58, title, ha="center", fontsize=12, weight="bold", color=color)
        draw_box(ax, (0.16, 3.35), 1.12, 0.64, "model\npredict", edge=color,
                 face="white", fontsize=10)
        draw_box(ax, (1.53, 3.35), 1.08, 0.64, "compare\nwith reading", edge=color,
                 face="white", fontsize=9.8)
        draw_box(ax, (2.86, 3.35), 1.00, 0.64, "correct", edge=color,
                 face="white", fontsize=10)
        add_arrow(ax, (1.30, 3.67), (1.50, 3.67), color, lw=1.2, mutation_scale=9)
        add_arrow(ax, (2.63, 3.67), (2.83, 3.67), color, lw=1.2, mutation_scale=9)
        ax.plot([3.36, 3.36, 0.70], [3.30, 2.87, 2.87], color=color, lw=1.2)
        add_arrow(ax, (0.70, 2.87), (0.70, 3.30), color, lw=1.2, mutation_scale=9)
        draw_box(ax, (0.35, 1.15), 3.30, 1.00, description, edge=color,
                 face="#f8fafc", fontsize=10.1)
        add_arrow(ax, (3.36, 3.33), (3.36, 2.19), color, lw=1.2, mutation_scale=9)
        ax.text(0.25, 0.45, "reading", fontsize=9.7, color=MUTED)
        add_arrow(ax, (0.63, 0.58), (1.00, 3.30), MUTED, lw=1.0, mutation_scale=8)
    fig.suptitle("Observers estimate different hidden quantities", x=0.06, y=0.98,
                 ha="left", fontsize=14, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.89, bottom=0.04, wspace=0.04)
    save_figure(fig, "two-observers.png")


FIGURES = [tick_rounding, accel_pipelines, one_step_gain, observer_step, two_observers]
