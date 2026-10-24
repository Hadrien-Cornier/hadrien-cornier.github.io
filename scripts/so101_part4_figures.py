"""Figures for SO-101 part 4: content/robotics/so101-4-learning-what-physics-misses.md.

Run: python3 scripts/so101_figures.py 4

Every figure is 6.4 in wide, so the text keeps its size on a phone. The default
chalk text sizes (15 pt text, 14 pt ticks, 17.5 pt titles) are used throughout.
"""

from so101_common import *  # noqa: F401,F403


def text_box(ax, xy, width, height, text, edge, linespacing=1.05):
    """A diagram box with tight line spacing: the hand font has tall lines."""
    ax.add_patch(Rectangle(xy, width, height, facecolor=PALE, edgecolor=edge,
                           linewidth=1.8, joinstyle="round", zorder=2))
    ax.text(xy[0] + width / 2, xy[1] + height / 2, text, ha="center", va="center",
            color=INK, linespacing=linespacing, zorder=3)


def hindsight_label():
    fig, ax = plt.subplots(figsize=(6.4, 4.0))
    ax.set_xlim(85, 165)
    ax.set_ylim(-0.3, 3.25)
    ax.axhline(1.12, color=GRID, lw=3)
    points = [(100, "reading q = 100", BLUE, 0.45),
              (110, "next reading q' = 110", TEAL, 2.52),
              (150, "goal sent u = 150", ORANGE, 0.45)]
    for x, label, color, y in points:
        ax.scatter([x], [1.12], color=color, s=110, zorder=4)
        ax.text(x, y, label, ha="center", va="center", color=color)
    ax.annotate("", xy=(110, 1.95), xytext=(100, 1.95),
                arrowprops={"arrowstyle": "<->", "color": TEAL, "lw": 2.2})
    ax.text(105, 1.82, "joint moved 10", ha="center", va="top", color=TEAL)
    ax.annotate("", xy=(150, 2.92), xytext=(110, 2.92),
                arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 2.2})
    ax.text(130, 3.04, "label = u - q' = 40", ha="center", va="bottom", color=PURPLE)
    ax.set_yticks([])
    ax.set_xlabel("encoder position (tick)")
    ax.set_title("The next reading changes the training label", loc="left", pad=22)
    clean_axis(ax)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", left=False, labelleft=False)
    fig.subplots_adjust(left=0.03, right=0.98, top=0.84, bottom=0.17)
    save_figure(fig, "hindsight-label.png")


def network_io():
    # The axes fill the figure, so the saved file is the figure width plus the margin: 6.08 in keeps it under 6.4 in.
    fig, ax = plt.subplots(figsize=(6.08, 4.6))
    setup_diagram(ax, (0, 6.4), (0.4, 4.6))
    ax.text(0.12, 4.28, "inputs", color=MUTED)
    input_labels = ["q (reading)", r"$r_k$", r"$r_{k+1}$", "past goal"]
    input_ys = [3.55, 2.85, 2.15, 0.75]
    box_h = 0.55
    for label, y in zip(input_labels, input_ys):
        draw_box(ax, (0.12, y), 1.6, box_h, label, edge=BLUE, face=PALE)
    text_box(ax, (2.85, 2.55), 1.45, 1.1, "small\nnetwork", RED)
    draw_box(ax, (5.0, 2.82), 1.2, 0.56, "offset", edge=TEAL, face=PALE)
    ends = [3.45, 3.45, 3.45]
    for y, end in zip(input_ys[:3], ends):
        add_arrow(ax, (1.77, y + box_h / 2), (2.8, end), BLUE, lw=1.8, mutation_scale=14)
    ax.plot([1.72, 2.1, 2.1, 2.55], [input_ys[3] + box_h / 2, input_ys[3] + box_h / 2, 2.3, 2.3],
            color=MUTED, lw=1.8)
    add_arrow(ax, (2.1, 2.3), (2.8, 2.62), MUTED, lw=1.8, mutation_scale=14)
    add_arrow(ax, (4.35, 3.1), (4.95, 3.1), TEAL, lw=2.2)
    ax.text(4.2, 1.85, r"$step^*=(r_{k+1}-r_k)+0.75(r_k-q)$",
            ha="center", va="center", color=INK)
    # The last symbol is the italic capital I (U+1D43C): the hand font draws I like the digit 1.
    ax.text(4.2, 0.95, "$goal=q+step^*+offset+3\U0001D43C$", ha="center", va="center", color=INK)
    fig.suptitle("A small network predicts an offset\nto a model-based step", x=0.03, y=0.995,
                 ha="left", va="top", color=YELLOW)
    fig.subplots_adjust(left=0.0, right=1.0, top=0.86, bottom=0.0)
    save_figure(fig, "network-io.png")


def nn_vs_fitted():
    labels = ["holds", "moving paths"]
    intervals = [(0.83, 0.99), (1.05, 1.70)]
    y = np.arange(2)
    fig, ax = plt.subplots(figsize=(6.4, 3.8))
    ax.axvline(1.0, color=INK, lw=2.2, ls="--", label="same as Fitted")
    for yi, (lo, hi) in zip(y, intervals):
        ax.hlines(yi, lo, hi, color=RED, lw=9, zorder=3)
        ax.vlines([lo, hi], yi - 0.13, yi + 0.13, color=RED, lw=2.2)
        # The text for "holds" sits left of the dashed line, so the line does not cross it.
        if hi < 1.0:
            ax.text(hi - 0.03, yi - 0.2, f"{lo:.2f} to {hi:.2f}", ha="right", va="bottom",
                    bbox=chalk.label_box())
        else:
            ax.text((lo + hi) / 2, yi - 0.2, f"{lo:.2f} to {hi:.2f}", ha="center", va="bottom",
                    bbox=chalk.label_box())
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0.65, 1.9)
    ax.set_ylim(1.55, -0.55)
    ax.set_xlabel("network error / Fitted error (ratio)")
    ax.set_title("The network helps on holds but\nnot on every moving path", pad=12)
    ax.legend(loc="upper right")
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.25, right=0.97, top=0.80, bottom=0.18)
    save_figure(fig, "nn-vs-fitted.png")


def sensitivity():
    labels = ["solve, right lag", "solve, 30% wrong lag", "pi, right lag", "pi, 30% wrong lag"]
    values = [2.3, 4.1, 6.7, 7.9]
    colors = [CONTROLLER["solve"], CONTROLLER["solve"], CONTROLLER["pi"], CONTROLLER["pi"]]
    ratios = ["", "×1.78", "", "×1.18"]
    y = np.arange(4)
    fig, ax = plt.subplots(figsize=(6.4, 3.9))
    ax.barh(y, values, color=colors, height=0.62, zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 11)
    ax.set_xticks([0, 2, 4, 6, 8, 10])
    for yi, value, ratio in zip(y, values, ratios):
        ax.text(value + 0.2, yi, f"{value:g}  {ratio}", va="center", bbox=chalk.label_box())
    ax.set_xlabel("tracking error (mrad)")
    ax.set_title("Solve is more sensitive than pi\nto a wrong lag", pad=12)
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.34, right=0.98, top=0.83, bottom=0.17)
    save_figure(fig, "sensitivity.png")


def data_curves():
    minutes = np.array([1.1, 2.1, 4.1, 8.3, 15.9])
    series = {
        "P0, servo model": ([30.6, 19.0, 9.8, 7.8, 7.4],
                            [5.8, 8.1, 0.9, 0.6, 0.0], BLUE, "o"),
        "P0 + observer": ([12.9, 4.7, 4.1, 3.8, 3.7],
                           [8.2, 1.0, 0.1, 0.1, 0.0], TEAL, "D"),
        "N0, network only": ([12.0, 11.0, 7.8, 5.5, 3.9],
                             [0.4, 1.4, 0.7, 0.3, 0.1], RED, "s"),
        "H2o, residual on P0 + observer": ([10.7, 5.3, 4.5, 3.6, 3.0],
                                            [4.9, 1.1, 0.4, 0.2, 0.1], PURPLE, "^"),
    }
    fig, ax = plt.subplots(figsize=(6.4, 5.4))
    for label, (error, spread, color, marker) in series.items():
        ax.errorbar(minutes, error, yerr=spread, color=color, marker=marker,
                    lw=2.4, ms=7.5, capsize=4, elinewidth=1.6, capthick=1.6, label=label)
    ax.set_xscale("log")
    ax.set_xticks([1, 2, 4, 8, 16], ["1", "2", "4", "8", "16"])
    ax.set_yscale("log")
    ax.set_yticks([3, 5, 10, 20, 30], ["3", "5", "10", "20", "30"])
    ax.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
    ax.set_xlim(0.9, 19)
    ax.set_ylim(2.6, 45)
    ax.set_xlabel("real data (minutes, log scale)")
    ax.set_ylabel("offline R200 error (mrad, log scale)")
    ax.set_title("With little data, the physics model\nalone overfits", pad=12)
    ax.legend(loc="upper right", frameon=True, facecolor=BOARD, edgecolor=GRID, framealpha=1,
              borderpad=0.6)
    clean_axis(ax, "both")
    fig.text(0.5, 0.012,
             "Real-arm logs, offline error over 0.2 s, mean of 3 seeds.",
             ha="center", fontsize=14, color=MUTED)
    fig.subplots_adjust(left=0.13, right=0.98, top=0.86, bottom=0.2)
    save_figure(fig, "data-curves.png")


def residual():
    fig = plt.figure(figsize=(6.08, 6.9))
    ax = fig.add_axes([0.01, 0.60, 0.98, 0.27])
    setup_diagram(ax, (0, 6.4), (0, 2.7))
    text_box(ax, (0.1, 1.8), 2.3, 0.85, "servo model\n+ observer, frozen", BLUE)
    text_box(ax, (0.1, 0.6), 2.3, 0.85, "small GRU\nlearns residual", RED)
    text_box(ax, (4.3, 1.15), 1.8, 0.9, "combined\nprediction", TEAL)
    add_arrow(ax, (2.46, 2.22), (4.24, 1.85), BLUE, lw=2.0)
    add_arrow(ax, (2.46, 1.02), (4.24, 1.42), RED, lw=2.0)
    ax.text(3.35, 1.63, "+", ha="center", va="center", fontsize=22, color=INK)
    ax.text(3.35, 0.72, "residual", ha="center", va="center", color=RED)
    ax.text(3.2, 0.05, "physics + learned correction", ha="center", va="bottom", color=MUTED)

    ax = fig.add_axes([0.13, 0.115, 0.85, 0.42])
    methods = ["N0", "P0", "H2o"]
    offline = [3.90, 3.70, 3.01]
    closed = [5.50, 2.76, 3.12]
    x = np.arange(3)
    width = 0.34
    bars1 = ax.bar(x - width / 2, offline, width, color=BLUE, label="offline error")
    bars2 = ax.bar(x + width / 2, closed, width, color=ORANGE,
                   label="stand-in closed loop")
    for bars in (bars1, bars2):
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.1,
                    f"{bar.get_height():.2f}", ha="center", va="bottom", fontsize=14,
                    bbox=chalk.label_box())
    ax.set_xticks(x, methods)
    ax.set_ylim(0, 6.8)
    ax.set_ylabel("tracking error (mrad)")
    ax.legend(loc="upper right", frameon=True, facecolor=BOARD, edgecolor=GRID, framealpha=1,
              borderpad=0.6)
    clean_axis(ax, "y")
    fig.text(0.5, 0.012, "P0 = servo model + observer.", ha="center", fontsize=14, color=MUTED)
    fig.suptitle("A learned residual improves\nthe combined prediction", x=0.03, y=0.995,
                 ha="left", va="top", color=YELLOW)
    save_figure(fig, "residual.png")


FIGURES = [hindsight_label, network_io, nn_vs_fitted, sensitivity, data_curves, residual]
