# Hadrien Cornier

Personal website hosted on GitHub Pages.

## Update the website

Edit `resume/profile.md` for experience, `content/management.md` for management philosophy, or `content/notes.md` for the Notes page. Notes use level-two headings followed by short paragraphs. Then install the pinned build dependencies (Node.js 22 or later), and run:

```sh
npm ci
python3 scripts/build_site.py
```

Commit the generated `index.html`, `notes.html`, `robotics/`, `sitemap.xml`, and vendored math assets alongside the source. GitHub Pages serves the static HTML directly, with no runtime dependencies. Layout and interactions live in `assets/site.css` and `assets/site.js`.

The generator expects the current profile heading structure: four Talroo work areas, earlier roles, education, and skills. Structural changes should also update the generator. Contact links, Talroo dates and role progression are curated in `scripts/build_site.py`; update those alongside the profile when they change.

## Preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. Check desktop and mobile layouts, section links, and expand/collapse controls. Details also work without JavaScript. Printing expands all details when JavaScript is enabled.

## Downloadable resume

The PDF link points to `out/resume.pdf`. Edit the concise source at `resume/resume.md`, then run `python3 resume/build_resume.py`. See `resume/README.md` for details.

## Robotics reports

The [Robotics section](https://hadrien-cornier.github.io/robotics/) is generated from
`content/robotics/*.md`. The filename becomes the URL, such as
`content/robotics/from-joint-angles-to-a-moving-arm.md` becoming
`/robotics/from-joint-angles-to-a-moving-arm/`.

Each report starts with YAML metadata:

```yaml
---
title: 'Report title'
description: 'A short summary.'
date: '2026-09-26'
# updated: '2026-09-27'
# draft: true
---
```

Use level-two and level-three headings for the table of contents. The title supplies the
level-one heading. Standard Markdown handles links, lists, tables, and code. Use `$q_1$`
for inline math and `$$` on separate lines for display equations. Matrices and other KaTeX
expressions render during the build. Invalid math, missing image files, and missing metadata
stop the build.

Store PNG diagrams beneath `assets/robotics/<report-name>/`. Use a site-root path and
meaningful alt text, for example:

```markdown
![Two links showing horizontal and vertical projections](/assets/robotics/arm-control/01_link_projections.png)
```

An optional Markdown image title becomes a visible caption. Images link to their full size,
load lazily, and include their dimensions to avoid page movement while loading. Keep any
required asset licenses beside the images. The renderer currently supports PNG diagrams.

Optional derivations use native HTML controls. Leave blank lines around the Markdown body:

```html
<details>
<summary>Show the derivation</summary>

Markdown and math can go here.

</details>
```

Report source is trusted author content, including embedded HTML. Do not build unreviewed
third-party Markdown. Drafts are excluded from builds. Marking a published report as a draft or deleting its
Markdown removes its old generated HTML. Only pages carrying this builder's ownership marker
are removed. Unrelated files inside a report directory stay intact. Keep the empty
`content/robotics/` directory when removing the last report so the full build refreshes
the landing page and sitemap.

```sh
npm ci
npm run test:robotics
npm run build
```

`python3 scripts/build_site.py` keeps the existing profile and Notes renderer, then calls
`scripts/build_robotics.mjs` when the report source directory exists, including when it is empty. `npm run build:robotics` builds
only the reports. The renderer uses pinned Markdown-it, gray-matter, and KaTeX packages.
It copies KaTeX styles, fonts, and its license into `assets/vendor/katex/`. Generated pages
need no network math service or reader-side JavaScript. GitHub Pages serves the committed
files directly. The build preserves unrelated sitemap entries and updates Robotics entries.

The article layout lives in `assets/robotics.css`, on top of the existing site styles.
Preview both `/robotics/` and a report at desktop and phone widths. Check images, equations,
table scrolling, table-of-contents links, and the native details controls with JavaScript off.
