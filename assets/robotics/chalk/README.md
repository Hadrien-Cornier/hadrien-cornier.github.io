# Chalk figure style

This folder holds the one shared blackboard style for site figures: chalk on a dark board, hand lettering, and a light hand wobble. It matches the RL series boards (`assets/robotics/rl/series.css`). Use it for every new figure and for every redraw of an older light figure. Do not keep a private copy of these values in a figure script.

The folder has these files:

| File | Use |
| --- | --- |
| `chalk.mplstyle` | Matplotlib colors, font, sizes, and the `path.sketch` wobble. |
| `chalk.py` | Matplotlib helper: `use()`, the color names, `save()` with the chalk grain, and `thumbnail()`. |
| `chalk.css` | Inline SVG figures: the board, the hand font, color classes, and a map from the old light palette to chalk. |
| `fonts/PatrickHand-Regular.ttf` | Patrick Hand (SIL Open Font License, `fonts/OFL.txt`) for matplotlib. The web pages use the WOFF2 files in `assets/robotics/rl/fonts/`. |

## Colors

Each color has one meaning, as in the RL series. Keep the same color for the same series in all figures of an article.

| Name | Hex | Use |
| --- | --- | --- |
| `BOARD` | `#1d2824` | Background. |
| `BOARD_2` | `#24312c` | A raised panel or a shaded band. |
| `CHALK` | `#f4f1e8` | Main ink: labels, axes text, key lines. |
| `DIM` | `#c3c9bd` | Secondary ink: tick labels, notes, a baseline series. |
| `FAINT` | `#6f7d75` | Grid, guides, dividers. |
| `YELLOW` | `#ffe17c` | Titles and the one thing to look at. |
| `RED` | `#ff9f88` | Risk, error, or the value that changes. |
| `BLUE` | `#93d4ff` | A learned value, a choice, or the main measured series. |
| `GREEN` | `#a8e2a0` | A safe or good result. |
| `PINK` | `#ff93b8` | A fourth series. |
| `LAVENDER` | `#c9b6ff` | A fifth series. |
| `SLATE` | `#9fb4c4` | A muted blue-gray series. |

`chalk.FROM_LIGHT` gives the usual replacement for each color of the older light palettes.

## Make a matplotlib figure

1. Import the helper and apply the style:

   ```python
   import sys
   from pathlib import Path
   sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "assets/robotics/chalk"))
   import chalk

   chalk.use()
   ```

2. Draw with the color names, for example `ax.plot(t, q, color=chalk.BLUE)`.
3. Save with `chalk.save(fig, "assets/robotics/<article>/<name>.png")`. It saves at 220 dpi, crops to the content, applies the chalk grain, and writes a 256-color PNG.
4. If the figure is an article thumbnail, run `chalk.thumbnail(png, "assets/robotics/thumbnails/<article>.jpg")`. It contains and pads the figure on the board at 720 × 424. Use `crop=True` for a photo or a video frame.

Run figure scripts with a Python that has `matplotlib` 3.8 or later, `numpy`, and `Pillow`.

## Keep text readable on a phone

The article column is about 358 px wide on a 390 px phone. A figure scales down to that width, so the figure width sets the text size.

- Make the figure 6.4 in wide or less. Use the default font sizes from `chalk.mplstyle` (15 pt text, 14 pt ticks, 17.5 pt titles).
- Do not set a font size under 13 pt.
- If two panels side by side make the text too small, stack them vertically.
- Break a long title onto two lines. Put long notes under the plot, not inside it.
- Check the result at 390 px width before you commit.

## Make an inline SVG figure

1. Load the style once on the article:

   ```html
   <link rel="stylesheet" href="/assets/robotics/chalk/chalk.css">
   ```

2. Add `class="chalk"` to the `<svg>`. Keep `role="img"` and the title.
3. Color new shapes with the classes `c-chalk`, `c-dim`, `c-red`, `c-blue`, `c-green`, `c-yellow`, `c-pink`, `c-lavender`, `c-board` for fill, and `s-*` for stroke. Use `chalk-title` for a title.
4. An older drawing in the site light palette (`#242622`, `#656b62`, `#2b6a8e`, `#b44c2c`, white paper, and the pale tints) needs no color change. The attribute rules in `chalk.css` map that palette to chalk.
5. Use 15 user units or more for text in a 480-unit-wide drawing, so the text is about 11 px on a phone.

For the hand wobble and grain of the RL boards, add `chalk-filter` to the class list and put this filter once on the page. It is the RL `#bb-chalk` filter with the board color drawn under the chalk, so the page color does not show through the grain in the light theme:

```html
<svg class="chalk-defs" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><filter id="chalk-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="1" seed="7" result="wobble"/><feDisplacementMap in="SourceGraphic" in2="wobble" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="drawn"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.4 1.14" result="mask"/><feComposite in="drawn" in2="mask" operator="in" result="chalk"/><feFlood flood-color="#1d2824" result="board"/><feComposite in="chalk" in2="board" operator="over"/></filter></svg>
```

The board stays dark in both site themes, as the RL boards do.
