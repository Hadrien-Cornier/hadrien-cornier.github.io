"""Figures for SO-101 part 1 (first half): content/robotics/so101-1-target-and-goal.md.

Run: python3 scripts/so101_figures.py 1

Every saved PNG is 6.4 in wide or less, so the text keeps its size on a phone. The
canvas is 6.05 in wide: the chalk save adds 0.16 in of padding on each side. Box diagrams
use a data scale of 1 unit = 1 inch, so the sizes in the code are the sizes on the page.
"""

from so101_common import *  # noqa: F401,F403

WIDTH = 6.05


def diagram_figure(height, y0=0.0, title_height=0.8):
    """A figure whose one axes has a data scale of 1 unit = 1 inch, with room above for a title."""
    fig = plt.figure(figsize=(WIDTH, height + title_height))
    ax = fig.add_axes([0, 0, 1, height / (height + title_height)])
    setup_diagram(ax, (0, WIDTH), (y0, y0 + height))
    return fig, ax


def figure_title(fig, text):
    fig.suptitle(text, x=0.02, y=0.995, ha="left", va="top", color=YELLOW)


def stacked_axes(count, panel_height, gap, top, bottom, left, right=0.15, **kwargs):
    """Vertical stack of plot panels with sizes in inches. Returns the figure and the axes."""
    height = top + count * panel_height + (count - 1) * gap + bottom
    fig = plt.figure(figsize=(WIDTH, height))
    axes = []
    for index in range(count):
        y = height - top - (index + 1) * panel_height - index * gap
        axes.append(fig.add_axes([left / WIDTH, y / height,
                                  (WIDTH - left - right) / WIDTH, panel_height / height],
                                 **kwargs))
    return fig, axes, height


def pid_parts():
    fig, axes, height = stacked_axes(3, panel_height=2.15, gap=1.15, top=1.3,
                                     bottom=1.3, left=1.0)
    panels = [
        ("p", "P: spring", r"$\tau=13.64(goal-q)$"),
        ("pd", "P + D: spring in honey", r"$\tau=13.64(goal-q)-v$"),
        ("pi", "P + I: spring that keeps pushing",
         r"$\tau=13.64(goal-q)$" + "\n" + r"$+20\int e\,dt$"),
    ]
    for ax, (kind, title, equation) in zip(axes, panels):
        time, q = simulate_joint(kind)
        ax.plot(time, q * 1000, color=BLUE, lw=2.6, label="joint position q")
        ax.axhline(100, color=ORANGE, lw=2.0, ls="--", label="goal")
        ax.text(0.98, 0.04, equation, transform=ax.transAxes, color=MUTED,
                ha="right", va="bottom", linespacing=1.2)
        ax.set_title(title, pad=8)
        ax.set_xlim(0, 1.5)
        ax.set_ylim(-5, 125)
        ax.set_xticks([0, 0.5, 1.0, 1.5])
        ax.set_yticks(range(0, 121, 20))
        ax.set_xlabel("time (s)")
        clean_axis(ax, "y")
    fig.supylabel("joint angle (mrad)", x=0.03, fontsize=15)
    axes[0].legend(loc="center right", bbox_to_anchor=(1.0, 0.38))
    fig.suptitle("A gravity-loaded joint\nresponds to a goal step", x=0.02, y=0.995,
                 ha="left", va="top", color=YELLOW)
    fig.text(0.5, 0.28 / height, "Teaching model, not the real servo.",
             ha="center", color=MUTED)
    save_figure(fig, "pid-parts.png")


def two_loops():
    fig, ax = diagram_figure(5.75, y0=1.3)
    # Columns shared by the outer boxes and the inner boxes: x of the left edge.
    cols = [0.77, 2.635, 4.50]
    box_w = 1.3
    center = [x + box_w / 2 for x in cols]
    right = [x + box_w for x in cols]
    mid = center[1]

    # Outer loop (computer).
    ax.add_patch(Rectangle((0.62, 5.15), 5.33, 1.45, fill=False, ec=BLUE, lw=1.8))
    ax.text(mid, 6.85, "Computer, 30 or 60 Hz (outer loop)", ha="center", va="center",
            color=BLUE)
    for x, text in zip(cols, ["target", "controller", "goal"]):
        draw_box(ax, (x, 5.7), box_w, 0.6, text, edge=BLUE)
    add_arrow(ax, (right[0] + 0.02, 6.0), (cols[1] - 0.02, 6.0), BLUE, mutation_scale=20)
    add_arrow(ax, (right[1] + 0.02, 6.0), (cols[2] - 0.02, 6.0), BLUE, mutation_scale=20)

    # Inner loop (servo firmware).
    ax.add_patch(Rectangle((0.62, 1.45), 5.33, 2.75, fill=False, ec=TEAL, lw=1.8))
    ax.text(mid, 4.5, "Servo firmware (inner loop, fast)", ha="center", va="center",
            color=TEAL)
    top_y, low_y, box_h = 3.2, 1.7, 0.8
    draw_box(ax, (cols[0], top_y), box_w, box_h, "gap = goal\n- encoder", edge=TEAL)
    draw_box(ax, (cols[1], top_y), box_w, box_h, "P/D", edge=TEAL)
    draw_box(ax, (cols[2], top_y), box_w, box_h, "motor\npower", edge=TEAL)
    draw_box(ax, (cols[2], low_y), box_w, box_h, "motor +\ngearbox", edge=TEAL)
    draw_box(ax, (cols[1], low_y), box_w, box_h, "joint", edge=TEAL)
    draw_box(ax, (cols[0], low_y), box_w, box_h, "encoder\n(ticks)", edge=PURPLE)
    row_1, row_2 = top_y + box_h / 2, low_y + box_h / 2
    add_arrow(ax, (right[0] + 0.02, row_1), (cols[1] - 0.02, row_1), TEAL, mutation_scale=20)
    add_arrow(ax, (right[1] + 0.02, row_1), (cols[2] - 0.02, row_1), TEAL, mutation_scale=20)
    add_arrow(ax, (center[2], top_y - 0.02), (center[2], low_y + box_h + 0.02), TEAL,
              mutation_scale=20)
    add_arrow(ax, (cols[2] - 0.02, row_2), (right[1] + 0.02, row_2), TEAL, mutation_scale=20)
    add_arrow(ax, (cols[1] - 0.02, row_2), (right[0] + 0.02, row_2), PURPLE,
              mutation_scale=20)

    # The goal enters the inner loop at the gap box.
    ax.plot([center[2], center[2], center[0]], [5.7, 4.9, 4.9], color=BLUE, lw=1.8)
    add_arrow(ax, (center[0], 4.9), (center[0], top_y + box_h + 0.02), BLUE,
              mutation_scale=20)

    # Encoder feedback: to the gap box, and along the left edge to the controller.
    add_arrow(ax, (center[0], low_y + box_h + 0.02), (center[0], top_y - 0.02), PURPLE,
              mutation_scale=20)
    ax.plot([cols[0] - 0.02, 0.42, 0.42, center[1]], [row_2, row_2, 5.38, 5.38],
            color=PURPLE, lw=1.8)
    add_arrow(ax, (center[1], 5.38), (center[1], 5.68), PURPLE, mutation_scale=20)
    ax.text(0.15, (row_2 + 5.38) / 2, "encoder feedback", rotation=90, ha="center",
            va="center", color=MUTED)
    figure_title(fig, "Two feedback loops run at\ndifferent speeds")
    save_figure(fig, "two-loops.png")


def servo_inside():
    fig, ax = diagram_figure(5.6, y0=0.35)
    ax.add_patch(Rectangle((0.05, 0.95), 5.9, 5.0, fill=False, edgecolor=INK, lw=2.0))
    ax.text(0.3, 5.65, "case", ha="left", va="center", color=INK)

    # Row 1: motor, gear train, output shaft with the magnet on it.
    draw_box(ax, (0.4, 4.4), 1.15, 0.9, "DC motor", edge=ORANGE)
    draw_box(ax, (1.9, 4.3), 1.3, 1.1, "gear train", edge=BLUE)
    add_arrow(ax, (1.57, 4.85), (1.88, 4.85), ORANGE, mutation_scale=20)
    add_arrow(ax, (3.22, 4.85), (3.5, 4.85), BLUE, mutation_scale=20)
    ax.add_patch(Rectangle((3.52, 4.74), 2.18, 0.22, facecolor=LIGHT_BLUE,
                           edgecolor=INK, lw=1.4))
    ax.text(4.3, 5.12, "output shaft", ha="center", va="bottom", color=INK)
    ax.add_patch(Circle((5.45, 4.85), 0.17, facecolor=YELLOW, edgecolor=INK, lw=1.4,
                        zorder=4))
    ax.text(5.25, 4.3, "magnet on\nthe shaft", ha="right", va="center", color=INK,
            linespacing=1.25)

    # Row 2: encoder chip reads the magnet; control board reads the chip.
    draw_box(ax, (4.4, 3.0), 1.4, 0.8, "magnetic\nencoder chip", edge=PURPLE)
    add_arrow(ax, (5.45, 4.64), (5.45, 3.82), PURPLE, mutation_scale=20)
    draw_box(ax, (0.4, 2.95), 2.4, 0.9, "control board\nMCU runs P/D loop", edge=TEAL)
    ax.plot([4.38, 2.82], [3.4, 3.4], color=TEAL, lw=1.8, ls="--")

    # Row 3: serial bus.
    draw_box(ax, (0.4, 1.2), 2.7, 1.15,
             "serial bus\ncommands in: goal\nreadings out: position", edge=MUTED)
    add_arrow(ax, (1.6, 2.93), (1.6, 2.37), TEAL, mutation_scale=20)

    ax.text(3.0, 0.6, "Simplified cutaway of a smart servo", ha="center", va="center",
            color=MUTED)
    figure_title(fig, "Inside a smart servo\n(STS3215, simplified)")
    save_figure(fig, "servo-inside.png")


def calibration_columns():
    fig, ax = diagram_figure(5.5, y0=0.1, title_height=1.05)
    left_x, right_x, col_w = 0.1, 3.6, 2.3
    ax.text(left_x + col_w / 2, 4.65, "What LeRobot\ncalibration stores\n(per motor)",
            ha="center", va="bottom", color=INK, linespacing=1.2)
    ax.text(right_x + col_w / 2, 4.65, "What the\ncontrollers needed",
            ha="center", va="bottom", color=TEAL, linespacing=1.2)
    left = ["id", "drive_mode", "homing_offset", "range_min", "range_max"]
    right = ["stiffness kp", "damping d", "dead time", "dead band",
             "dry friction", "gravity by pose", "servo lag"]
    for index, text in enumerate(left):
        y = 3.95 - index * 0.9175
        draw_box(ax, (left_x, y), col_w, 0.55, text, edge=MUTED, face=PALE)
    for index, text in enumerate(right):
        y = 4.0 - index * 0.62
        draw_box(ax, (right_x, y), col_w, 0.5, text, edge=TEAL, face=BOARD, linewidth=1.5)
    ax.text(3.0, 2.39, "≠", fontsize=36, ha="center", va="center", color=MUTED)
    figure_title(fig, "Calibration fields do not\ndescribe servo dynamics")
    save_figure(fig, "calibration-columns.png")


def error_vs_kp():
    kp = np.linspace(8, 60, 400)
    error = 32.2 * (13.64 / kp) + 5.0
    all_scaled = 37.2 * 13.64 / kp
    fig, (ax,), height = stacked_axes(1, panel_height=3.9, gap=0, top=0.55,
                                      bottom=2.55, left=0.95)
    ax.plot(kp, error, color=TEAL, lw=3.0, label=r"$e(k_p)=32.2(13.64/k_p)+5.0$")
    ax.plot(kp, all_scaled, color=LIGHT_BLUE, lw=2.4, ls=":",
            label=r"if all error scaled with $1/k_p$: $37.2(13.64/k_p)$")
    ax.axhline(5.0, color=ORANGE, lw=2.0, ls="--",
               label="goal hold, does not depend on kp")
    points = [
        (13.64, 37.2, "nominal", BLUE, (21.0, 45.0)),
        (12.31, 40.5, "weak_supply", RED, (16.5, 55.0)),
        (22.1, 24.8, "stiff_servo", PURPLE, (29.0, 35.0)),
    ]
    for x, y, label, color, offset in points:
        ax.scatter(x, y, s=70, color=color, edgecolor=BOARD, linewidth=1.0, zorder=4)
        ax.annotate(f"{label} ({x:g}, {y:g})", (x, y), xytext=offset,
                    textcoords="data", color=INK, va="center",
                    arrowprops={"arrowstyle": "->", "color": color, "lw": 1.8,
                                "shrinkA": 4, "shrinkB": 6, "relpos": (0, 0.5)})
    ax.set_xlim(8, 60)
    ax.set_ylim(0, 66)
    ax.set_xlabel(r"servo stiffness $k_p$ (N m/rad)")
    ax.set_ylabel("tracking error (mrad)")
    ax.set_title("A stiffer servo cannot remove every error", pad=12)
    clean_axis(ax, "y")
    ax.legend(loc="upper left", bbox_to_anchor=(-0.06, -0.21), labelspacing=0.3)
    fig.text(0.02, 0.25 / height, "Simulation, Out of the box controller.", color=MUTED)
    save_figure(fig, "error-vs-kp.png")


def three_delays():
    fig, axes, height = stacked_axes(2, panel_height=3.0, gap=1.15, top=1.2,
                                     bottom=0.95, left=1.0)
    t = np.linspace(0, 450, 901)
    dead_time = 33.0
    tau = 95.0
    response = np.where(t < dead_time, 0.0,
                        100 * (1 - np.exp(-(t - dead_time) / tau)))
    axes[0].axvspan(0, dead_time, color=YELLOW, alpha=0.24, lw=0)
    axes[0].plot(t, response, color=BLUE, lw=2.8, label="joint response")
    axes[0].axhline(100, color=MUTED, lw=1.8, ls="--", label="goal")
    axes[0].axvline(dead_time, color=ORANGE, lw=2.0, ls=":")
    axes[0].scatter([dead_time + tau], [63.2], color=TEAL, s=60, zorder=4)
    axes[0].annotate("dead time\n33 ms", xy=(24, 80), xytext=(55, 80), va="center",
                     color=INK, linespacing=1.2,
                     arrowprops={"arrowstyle": "->", "color": ORANGE, "lw": 1.8,
                                 "shrinkA": 4, "shrinkB": 0, "relpos": (0, 0.5)})
    axes[0].annotate("lag\n95 ms to 63%", (dead_time + tau, 63.2),
                     xytext=(34, -48), textcoords="offset points",
                     arrowprops={"arrowstyle": "->", "color": TEAL, "lw": 1.8},
                     color=TEAL, linespacing=1.2)
    axes[0].set_xlim(-15, 450)
    axes[0].set_ylim(-5, 112)
    axes[0].set_ylabel("response (% of goal)")
    axes[0].set_xlabel("time after goal step (ms)")
    axes[0].legend(loc="lower right")
    clean_axis(axes[0], "y")

    t2 = np.linspace(0, 300, 1201)
    target = 0.45 * t2
    axes[1].plot(t2, target, color=INK, lw=2.4, label="ramp target")
    for period, color, label in [(1000 / 30, BLUE, "goal hold, 30 Hz"),
                                 (1000 / 60, TEAL, "goal hold, 60 Hz")]:
        updates = np.arange(0, 300 + period, period)
        held = 0.45 * updates
        valid = updates <= 300
        axes[1].step(updates[valid], held[valid], where="post", color=color,
                     lw=2.2, label=label)
    axes[1].text(0.03, 0.97,
                 "Average goal age:\n16.7 ms at 30 Hz; 8.3 ms at 60 Hz",
                 transform=axes[1].transAxes, va="top", color=INK, linespacing=1.2,
                 bbox={**chalk.label_box(), "edgecolor": GRID, "boxstyle": "round,pad=0.3"})
    axes[1].set_xlim(0, 300)
    axes[1].set_yticks(range(0, 126, 25))
    axes[1].set_ylabel("target angle (mrad)")
    axes[1].set_xlabel("time (ms)")
    axes[1].legend(loc="lower right")
    clean_axis(axes[1], "y")
    figure_title(fig, "Dead time, servo lag, and goal hold\nare different delays")
    save_figure(fig, "three-delays.png")


def dead_time_ranges():
    labels = ["step test\n(real arm)", "per-joint servo fit\n(real arm)", "first simulator"]
    ranges = [(31, 36), (15.6, 26.6), (0, 0)]
    y = np.arange(3)
    fig, (ax,), height = stacked_axes(1, panel_height=3.0, gap=0, top=1.05,
                                      bottom=0.95, left=1.95, right=0.2)
    for yi, (lo, hi) in zip(y, ranges):
        if hi == lo:
            ax.scatter([lo], [yi], s=110, color=LIGHT_BLUE, edgecolor=INK, zorder=3)
            ax.text(lo + 1.3, yi, "about 0", va="center")
        else:
            ax.hlines(yi, lo, hi, color=TEAL if yi == 1 else BLUE, linewidth=9, zorder=3)
            ax.vlines([lo, hi], yi - 0.16, yi + 0.16,
                      color=TEAL if yi == 1 else BLUE, linewidth=2.0)
            ax.text((lo + hi) / 2, yi - 0.27, f"{lo:g} to {hi:g}",
                    ha="center", va="bottom")
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlim(-3, 43)
    ax.set_ylim(2.65, -0.65)
    ax.set_xlabel("dead time (ms)")
    ax.set_title("Measured dead time differs\nfrom the first simulator", pad=12)
    clean_axis(ax, "x")
    save_figure(fig, "dead-time-ranges.png")


def lag_on_path():
    path = DATA_DIR / "cat-direct.npz"
    with np.load(path) as data:
        time_all = data["time_s"]
        q_all = data["q"][:, 1]
        target_all = data["target_q"][:, 1]
    duration = 6.0
    sample_step = float(np.median(np.diff(time_all)))
    starts = np.arange(time_all[0], time_all[-1] - duration, sample_step)
    start = max(starts, key=lambda value: np.ptp(
        q_all[(time_all >= value) & (time_all <= value + duration)]))
    end = start + duration
    mask = (time_all >= start) & (time_all <= end)
    time = time_all[mask]
    q = q_all[mask]
    target = target_all[mask]
    dt = float(np.median(np.diff(time)))
    uniform_time = np.arange(time[0], time[-1], dt)
    target_uniform = np.interp(uniform_time, time, target)
    q_uniform = np.interp(uniform_time, time, q)
    target_velocity = np.gradient(target_uniform, dt)
    q_velocity = np.gradient(q_uniform, dt)
    target_velocity -= target_velocity.mean()
    q_velocity -= q_velocity.mean()
    corr = np.correlate(q_velocity, target_velocity, mode="full")
    lags = np.arange(-len(target_velocity) + 1, len(target_velocity))
    allowed = np.abs(lags) <= int(0.75 / dt)
    lag_samples = int(lags[allowed][np.argmax(corr[allowed])])
    lag_s = lag_samples * dt
    print(f"lag-on-path cross-correlation: shoulder_lift is about {lag_s * 1000:.0f} ms late")

    fig, (ax,), height = stacked_axes(1, panel_height=3.4, gap=0, top=1.0,
                                      bottom=0.95, left=1.0)
    relative_time = time - start
    ax.plot(relative_time, np.rad2deg(target), color=BLUE, lw=2.4, label="target")
    ax.plot(relative_time, np.rad2deg(q), color=ORANGE, lw=2.2, label="shoulder_lift")
    feature_time = float(relative_time[np.argmax(np.abs(np.gradient(target, dt)))])
    delayed_feature_time = feature_time + lag_s
    y_annot = np.nanmax(np.rad2deg(target)) + 2.0
    if lag_s > 0:
        ax.annotate("", xy=(delayed_feature_time, y_annot), xytext=(feature_time, y_annot),
                    arrowprops={"arrowstyle": "|-|,widthA=1.0,widthB=1.0", "color": PURPLE, "lw": 2.0,
                                "shrinkA": 0, "shrinkB": 0, "mutation_scale": 9})
        ax.text(feature_time - 0.12, y_annot, f"about {abs(lag_s) * 1000:.0f} ms late",
                ha="right", va="center", color=PURPLE)
    else:
        ax.text(0.5, 0.88, "Target and joint velocity align in this window",
                transform=ax.transAxes, color=PURPLE,
                bbox=chalk.label_box())
    ax.set_xlim(0, 6)
    ax.set_ylim(None, y_annot + 9.0)
    ax.set_xlabel("time (s)")
    ax.set_ylabel("shoulder_lift angle (degrees)")
    ax.set_title("Real arm, direct control:\nthe joint runs behind the target", pad=12)
    ax.legend(loc="lower right")
    clean_axis(ax, "y")
    save_figure(fig, "lag-on-path.png")


FIGURES = [pid_parts, two_loops, servo_inside, calibration_columns, error_vs_kp, three_delays, dead_time_ranges, lag_on_path]
