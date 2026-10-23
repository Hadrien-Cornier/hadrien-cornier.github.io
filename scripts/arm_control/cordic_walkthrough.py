"""Chalk re-render of the CORDIC walkthrough video in "From joint angles to a moving arm".

Media (written under assets/robotics/arm-control/):

- v4/cordic_walkthrough.mp4: twelve integer CORDIC steps for the vector
  (887, 512), 4 s per step and a 6 s result card, 12 frames per second,
  820 x 1080 px, H.264, yuv420p, 54 s.
- v4/cordic_walkthrough_poster.png: the step 2 frame of the same render at
  twice the video resolution (1640 x 2160 px).

Adapted from github.com/Hadrien-Cornier/maniskill-playground at commit 81e2a65,
experiments/encoder-benchmark/cordic_walkthrough.py. The step values come from
experiments/encoder-benchmark/walkthrough_steps.json in that checkout. The script
also recomputes the steps with the original integer code and stops if the two
differ.

Only the style and the text sizes change. The frames, the timing, the vectors
and every printed number are the same. The frame keeps its 820 x 1080 px size,
but the layout is drawn on the chalk 6.4 in width so that the smallest text is
13 pt (about 10 px tall at a 358 px phone column; the original's smallest text
was about 6.7 px). The shift and update lines use the chalk hand font instead of
DejaVu Sans Mono.

Run from the blog repository root, with a checkout of maniskill-playground:

    PYTHONDONTWRITEBYTECODE=1 python3 scripts/arm_control/cordic_walkthrough.py \\
        --source <maniskill-playground checkout>

It needs matplotlib 3.8 or later, numpy, Pillow and ffmpeg with libx264. Use
--out DIR to write the files to another folder (as DIR/v4/<name>), and
--poster-only to skip the video.
"""

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyArrowPatch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "assets/robotics/chalk"))
import chalk  # noqa: E402

OUT = ROOT / "assets/robotics/arm-control"
STEPS_JSON = Path("experiments/encoder-benchmark/walkthrough_steps.json")

FPS, HOLD, END = 12, 4, 6
FRAME_W, FRAME_H = 820, 1080
FIG_W = 6.4
VIDEO_DPI = FRAME_W / FIG_W  # 128.125: the 6.4 in figure is 820 px wide
FIG_H = FRAME_H / VIDEO_DPI

# Old colors mapped by meaning, the same as in the other figures of the article:
# teal is GREEN and gold is YELLOW. The "Faint arrow" is FAINT. The old frame text
# "Teal arrow: after" now reads "Green arrow: after", to name the chalk color.
INK = chalk.CHALK  # old #203747
GRAY = chalk.DIM  # old #83949f
FAINT = chalk.FAINT  # old #83949f at 45 % opacity
TEAL = chalk.GREEN  # old #168b92
GOLD = chalk.YELLOW  # old #b66c1f
# Patrick Hand has a tall line box: linespacing 0.9 gives about 1.2 em per line.
LINE = 0.9


def steps():
    """The original integer CORDIC steps (unchanged)."""
    x, y, angle = 887, 512, 0
    result = []
    for i in range(12):
        direction = 1 if y >= 0 else -1
        turn = round(math.degrees(math.atan(2**-i)) * 1000)
        row = {
            "i": i,
            "x": x,
            "y": y,
            "a": angle,
            "xs": x >> i,
            "ys": y >> i,
            "d": direction,
            "turn": turn,
        }
        x, y = x + direction * (y >> i), y - direction * (x >> i)
        angle += direction * turn
        row.update(new_x=x, new_y=y, new_a=angle)
        result.append(row)
    return result


def load_steps(source):
    data = json.loads((source / STEPS_JSON).read_text())
    records = data["steps"]
    reference = math.degrees(math.atan2(512, 887))
    if records != steps() or not math.isclose(data["reference_deg"], reference):
        raise SystemExit(f"{source / STEPS_JSON} does not match the integer CORDIC steps")
    assert records[1]["ys"] == -188
    assert abs(records[-1]["new_a"] / 1000 - reference) < 360 / 4096 / 2
    return records, data["reference_deg"]


def build(records, reference):
    """Draw the fixed parts of the frame and return (figure, update function)."""
    fig = plt.figure(figsize=(FIG_W, FIG_H), dpi=VIDEO_DPI)

    def at(x_in, y_in, value, **kwargs):
        """Text placed in inches from the top-left corner of the frame."""
        kwargs.setdefault("va", "top")
        return fig.text(x_in / FIG_W, 1 - y_in / FIG_H, value, **kwargs)

    at(0.38, 0.2, "Finding an angle with shifts and adds", fontsize=20, color=chalk.YELLOW)
    at(
        0.38,
        0.62,
        f"Measured vector: (887, 512)    Reference angle: {reference:.3f}°",
        fontsize=14,
        color=INK,
    )
    status = at(0.38, 0.98, "", fontsize=18.5, color=TEAL)

    top, height = 1.45, 2.55
    ax = fig.add_axes([0.83 / FIG_W, 1 - (top + height) / FIG_H, 4.67 / FIG_W, height / FIG_H])
    ax.set(xlim=(-100, 1850), ylim=(-650, 850), aspect="equal")
    ax.axis("off")
    ax.annotate("", (1800, 0), (0, 0), arrowprops={"arrowstyle": "->", "color": GRAY, "lw": 1.6})
    ax.annotate(
        "", (0, 780), (0, -600), arrowprops={"arrowstyle": "->", "color": GRAY, "lw": 1.6}
    )
    ax.text(1800, -85, "x", fontsize=15, color=GRAY)
    ax.text(-65, 780, "y", fontsize=15, color=GRAY)
    before = FancyArrowPatch(
        (0, 0), (887, 512), arrowstyle="->", mutation_scale=19, lw=3, color=FAINT
    )
    after = FancyArrowPatch(
        (0, 0), (1399, -375), arrowstyle="->", mutation_scale=21, lw=4, color=TEAL
    )
    ax.add_patch(before)
    ax.add_patch(after)

    vector_note = at(0.83, 4.08, "", fontsize=14.5, color=TEAL)
    at(0.83, 4.42, "Faint arrow: before    Green arrow: after", fontsize=13.5, color=GRAY)
    # One text per line, so that both two-line blocks keep the same line pitch
    # (the arrow glyph comes from a fallback font with a taller line box).
    shifts = [at(0.45, 4.8 + k * 0.34, "", fontsize=17.5, color=INK) for k in range(2)]
    updates = [at(0.45, 5.56 + k * 0.34, "", fontsize=17.5, color=INK) for k in range(2)]
    at(0.45, 6.34, "ANGLE ESTIMATE", fontsize=13.5, color=GOLD)
    angle_math = at(0.45, 6.58, "", fontsize=20, color=GOLD)
    angle_value = at(0.45, 6.96, "", fontsize=17.5, color=GOLD)
    foot = at(0.45, 7.33, "", fontsize=13.5, color=INK, linespacing=LINE)
    at(
        0.45,
        7.86,
        "1 coordinate unit = 1/1024. Angle table unit = 0.001°.\n"
        "Small integers for teaching; the benchmark uses 30 fractional bits.",
        fontsize=13,
        color=GRAY,
        linespacing=LINE,
    )

    def signed(n):
        return f"({n})" if n < 0 else str(n)

    def update(frame):
        index = min(frame // (FPS * HOLD), 11)
        r = records[index]
        end = frame >= 12 * FPS * HOLD
        status.set_text(
            "Result: an angle from integer arithmetic"
            if end
            else f"Step {index + 1}/12  ·  "
            f"{'turn clockwise' if r['d'] > 0 else 'turn back counterclockwise'}"
        )
        before.set_positions((0, 0), (r["x"], r["y"]))
        after.set_positions((0, 0), (r["new_x"], r["new_y"]))
        residual = math.degrees(math.atan2(r["new_y"], r["new_x"]))
        vector_note.set_text(f"Remaining vector angle: {residual:+.3f}°  (aim: 0°)")
        shifts[0].set_text(f"y >> {index} : {r['y']} → {r['ys']}")
        shifts[1].set_text(f"x >> {index} : {r['x']} → {r['xs']}")
        sx, sy = ("+", "−") if r["d"] > 0 else ("−", "+")
        updates[0].set_text(f"new x = {r['x']} {sx} {signed(r['ys'])} = {r['new_x']}")
        updates[1].set_text(f"new y = {r['y']} {sy} {signed(r['xs'])} = {r['new_y']}")
        angle_math.set_text(f"{r['a']} {sx} {r['turn']} = {r['new_a']}")
        angle_value.set_text(f"Recovered angle: {r['new_a'] / 1000:.3f}°")
        if end:
            foot.set_text(
                f"Reference: {reference:.3f}°  ·  "
                f"Error: {abs(r['new_a'] / 1000 - reference):.3f}°\n"
                "Small integers leave rounding error."
            )
        else:
            foot.set_text(
                "Use both OLD coordinates for each update.\n"
                "A signed right shift rounds down: −375 >> 1 = −188."
                if index == 1
                else "The vector turns toward zero. The angle estimate tracks the turns.\n"
                "Only numbers rotate here; the magnet stays at its measured angle."
            )

    return fig, update


def set_sketch(base, dpi):
    """Keep the chalk wobble the same size relative to the frame at any dpi.

    base: the path.sketch value of the chalk style. Its amplitude and length are
    in pixels and fit savefig.dpi, so scale them to the dpi of this render.
    """
    scale, length, randomness = base
    ratio = dpi / matplotlib.rcParams["savefig.dpi"]
    matplotlib.rcParams["path.sketch"] = (scale * ratio, length * ratio, randomness)


def render_poster(records, reference, path, sketch):
    dpi = 2 * VIDEO_DPI
    set_sketch(sketch, dpi)
    fig, update = build(records, reference)
    update(FPS * HOLD)
    saved_dpi = matplotlib.rcParams["savefig.dpi"]
    matplotlib.rcParams["savefig.dpi"] = dpi
    try:
        chalk.save(fig, path, tight=False)
    finally:
        matplotlib.rcParams["savefig.dpi"] = saved_dpi
    return path


def render_video(records, reference, path, sketch):
    set_sketch(sketch, VIDEO_DPI)
    fig, update = build(records, reference)
    total = FPS * (12 * HOLD + END)
    # Frames inside one step are identical, so draw each step once.
    cache = {}
    path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{FRAME_W}x{FRAME_H}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-c:v",
        "libx264",
        "-b:v",
        "1600k",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(path),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    for frame in range(total):
        key = min(frame // (FPS * HOLD), 12)
        if key not in cache:
            update(frame)
            fig.canvas.draw()
            rgba = np.asarray(fig.canvas.buffer_rgba())
            if rgba.shape[:2] != (FRAME_H, FRAME_W):
                raise SystemExit(f"frame size {rgba.shape[:2]} is not {FRAME_H}x{FRAME_W}")
            grained = chalk.chalk_grain(rgba[..., :3].copy(), scale=FRAME_W / 720.0)
            cache[key] = grained.tobytes()
        encoder.stdin.write(cache[key])
    encoder.stdin.close()
    if encoder.wait() != 0:
        raise SystemExit("ffmpeg failed")
    plt.close(fig)
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--source", type=Path, required=True, help="maniskill-playground checkout"
    )
    parser.add_argument("--out", type=Path, default=OUT, help="arm-control asset folder")
    parser.add_argument("--poster-only", action="store_true")
    args = parser.parse_args()
    records, reference = load_steps(args.source)
    chalk.use()
    sketch = tuple(matplotlib.rcParams["path.sketch"])
    poster = args.out / "v4" / "cordic_walkthrough_poster.png"
    print(render_poster(records, reference, poster, sketch))
    if not args.poster_only:
        video = args.out / "v4" / "cordic_walkthrough.mp4"
        print(render_video(records, reference, video, sketch))

if __name__ == "__main__":
    main()
