"""Figures for SO-101 part 4: content/robotics/so101-4-learning-what-physics-misses.md.

Run: python3 scripts/so101_figures.py 4
"""

from so101_common import *  # noqa: F401,F403


def hindsight_label():
    fig, ax = plt.subplots(figsize=(8, 4.2))
    ax.set_xlim(85, 165)
    ax.set_ylim(-0.3, 3.2)
    ax.axhline(1.12, color=GRID, lw=2)
    points = [(100, "reading q = 100", BLUE, 0.35),
              (110, "next reading q' = 110", TEAL, 2.58),
              (150, "goal sent u = 150", ORANGE, 0.35)]
    for x, label, color, y in points:
        ax.scatter([x], [1.12], color=color, s=70, zorder=4)
        ax.text(x, y, label, ha="center", va="center", fontsize=10.2, color=color)
    ax.annotate("", xy=(110, 2.05), xytext=(100, 2.05),
                arrowprops={"arrowstyle": "<->", "color": TEAL, "lw": 1.5})
    ax.text(105, 1.84, "joint moved 10", ha="center", fontsize=11, color=TEAL,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.annotate("", xy=(150, 2.95), xytext=(110, 2.95),
                arrowprops={"arrowstyle": "<->", "color": PURPLE, "lw": 1.5})
    ax.text(130, 3.10, "label = u - q' = 40", ha="center", fontsize=11, color=PURPLE)
    ax.set_yticks([])
    ax.set_xlabel("encoder position (tick)")
    ax.set_title("The next reading changes the training label", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax)
    ax.spines["left"].set_visible(False)
    ax.tick_params(axis="y", left=False, labelleft=False)
    fig.subplots_adjust(left=0.07, right=0.98, top=0.85, bottom=0.17)
    save_figure(fig, "hindsight-label.png")


def network_io():
    fig, ax = plt.subplots(figsize=(8, 4.8))
    setup_diagram(ax, (0, 8), (0, 4.8))
    ax.text(0.56, 4.18, "inputs", fontsize=11, weight="bold", color=MUTED)
    input_labels = ["q (reading)", r"$r_k$", r"$r_{k+1}$", "past goal"]
    input_ys = [3.48, 2.87, 2.26, 1.05]
    for label, y in zip(input_labels, input_ys):
        draw_box(ax, (0.35, y), 1.52, 0.42, label, edge=BLUE,
                 face="#eff6ff", fontsize=10.2)
    draw_box(ax, (3.05, 2.78), 1.54, 0.75, "small\nnetwork", edge=RED,
             face="#fef2f2", fontsize=11, linewidth=1.6)
    draw_box(ax, (5.42, 2.94), 1.30, 0.48, "offset", edge=TEAL,
             face="#ecfdf5", fontsize=10.8)
    for y in input_ys[:3]:
        add_arrow(ax, (1.89, y + 0.21), (2.99, 3.16), BLUE, lw=1.0, mutation_scale=9)
    ax.plot([1.89, 2.15, 2.15, 2.70], [1.26, 1.26, 2.62, 2.62], color=MUTED, lw=1.0)
    add_arrow(ax, (2.28, 2.62), (2.98, 3.00), MUTED, lw=1.0, mutation_scale=9)
    add_arrow(ax, (4.61, 3.15), (5.38, 3.15), TEAL)
    ax.text(3.82, 2.12,
            r"$step^*=(r_{k+1}-r_k)+0.75(r_k-q)$",
            ha="center", fontsize=11, color=INK,
            bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.0})
    ax.text(5.58, 1.45, r"$goal=q+step^*+offset+3I$",
            ha="center", fontsize=12, weight="bold", color=INK)
    fig.suptitle("A small network predicts an offset to a model-based step", x=0.05, y=0.98,
                 ha="left", fontsize=13.5, weight="bold", color=INK)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.84, bottom=0.06)
    save_figure(fig, "network-io.png")


def nn_vs_fitted():
    labels = ["holds", "moving paths"]
    intervals = [(0.83, 0.99), (1.05, 1.70)]
    y = np.arange(2)
    fig, ax = plt.subplots(figsize=(8, 3.8))
    ax.axvline(1.0, color=INK, lw=1.5, ls="--", label="same as Fitted")
    for yi, (lo, hi) in zip(y, intervals):
        ax.hlines(yi, lo, hi, color=RED, lw=8, zorder=3)
        ax.vlines([lo, hi], yi - 0.13, yi + 0.13, color=RED, lw=1.5)
        ax.text((lo + hi) / 2, yi - 0.19, f"{lo:.2f} to {hi:.2f}",
                ha="center", va="top", fontsize=10.5)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0.65, 1.9)
    ax.set_ylim(1.55, -0.55)
    ax.set_xlabel("network error / Fitted error (ratio)")
    ax.set_title("The network helps on holds but not on every moving path",
                 loc="left", pad=12, weight="bold")
    ax.legend(loc="upper right", fontsize=9.8)
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.22, right=0.97, top=0.84, bottom=0.19)
    save_figure(fig, "nn-vs-fitted.png")


def sensitivity():
    labels = ["solve, right lag", "solve, 30% wrong lag", "pi, right lag", "pi, 30% wrong lag"]
    values = [2.3, 4.1, 6.7, 7.9]
    colors = [CONTROLLER["solve"], CONTROLLER["solve"], CONTROLLER["pi"], CONTROLLER["pi"]]
    ratios = ["", "×1.78", "", "×1.18"]
    y = np.arange(4)
    fig, ax = plt.subplots(figsize=(8, 4.1))
    ax.barh(y, values, color=colors, height=0.62, zorder=3)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 10)
    for yi, value, ratio in zip(y, values, ratios):
        ax.text(value + 0.2, yi, f"{value:g}  {ratio}", va="center", fontsize=10.5)
    ax.set_xlabel("tracking error (mrad)")
    ax.set_title("Solve is more sensitive than pi to a wrong lag", loc="left",
                 pad=12, weight="bold")
    clean_axis(ax, "x")
    fig.subplots_adjust(left=0.30, right=0.97, top=0.85, bottom=0.17)
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
    fig, ax = plt.subplots(figsize=(8, 4.8))
    for label, (error, spread, color, marker) in series.items():
        ax.errorbar(minutes, error, yerr=spread, color=color, marker=marker,
                    lw=1.7, ms=6.5, capsize=3, label=label)
    ax.set_xscale("log")
    ax.set_xticks([1, 2, 4, 8, 16], ["1", "2", "4", "8", "16"])
    ax.set_yscale("log")
    ax.set_yticks([3, 5, 10, 20, 30], ["3", "5", "10", "20", "30"])
    ax.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
    ax.set_xlim(0.9, 19)
    ax.set_ylim(2.6, 45)
    ax.set_xlabel("real data (minutes, log scale)")
    ax.set_ylabel("offline R200 error (mrad, log scale)")
    ax.set_title("With little data, the physics model alone overfits", loc="left",
                 pad=12, weight="bold")
    ax.legend(loc="center right", fontsize=8.8, bbox_to_anchor=(1.0, 0.78))
    clean_axis(ax, "both")
    fig.text(0.5, 0.035,
             "Real-arm logs, offline error over 0.2 s, mean of 3 seeds.",
             ha="center", fontsize=10.5, color=MUTED)
    fig.subplots_adjust(left=0.15, right=0.98, top=0.85, bottom=0.19)
    save_figure(fig, "data-curves.png")


def residual():
    fig, axes = plt.subplots(1, 2, figsize=(8, 4.8), gridspec_kw={"width_ratios": [1.08, 1.4]})
    ax = axes[0]
    setup_diagram(ax, (0, 4.6), (0, 4.8))
    draw_box(ax, (0.12, 3.13), 2.05, 0.72, "servo model\n+ observer, frozen",
             edge=BLUE, face="#eff6ff", fontsize=10.2)
    draw_box(ax, (0.12, 1.88), 1.88, 0.72, "small GRU\nlearns residual",
             edge=RED, face="#fef2f2", fontsize=10.2)
    draw_box(ax, (2.60, 2.50), 1.62, 0.86, "combined\nprediction",
             edge=TEAL, face="#ecfdf5", fontsize=10.5)
    add_arrow(ax, (2.02, 3.48), (2.54, 3.00), BLUE)
    add_arrow(ax, (2.02, 2.22), (2.54, 2.77), RED)
    ax.text(2.28, 2.92, "+", ha="center", va="center", fontsize=18, color=INK)
    ax.text(2.15, 1.62, "residual", ha="center", fontsize=9.5, color=RED)
    ax.text(2.15, 0.85, "physics + learned correction", ha="center",
            fontsize=9.3, color=MUTED)

    ax = axes[1]
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
                    f"{bar.get_height():.2f}", ha="center", fontsize=9.3)
    ax.set_xticks(x, methods)
    ax.set_ylim(0, 6.8)
    ax.set_ylabel("tracking error (mrad)")
    ax.legend(loc="upper right", fontsize=8.9)
    clean_axis(ax, "y")
    fig.text(0.5, 0.045, "P0 = servo model + observer.", ha="center",
             fontsize=9.5, color=MUTED)
    fig.suptitle("A learned residual improves the combined prediction", x=0.05, y=0.98,
                 ha="left", fontsize=13.2, weight="bold", color=INK)
    fig.subplots_adjust(left=0.04, right=0.98, top=0.84, bottom=0.21, wspace=0.20)
    save_figure(fig, "residual.png")


FIGURES = [hindsight_label, network_io, nn_vs_fitted, sensitivity, data_curves, residual]
