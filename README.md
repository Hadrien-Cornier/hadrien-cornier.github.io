# Hadrien Cornier

Personal website hosted on GitHub Pages.

## Update the website

Edit `resume/profile.md` for experience, `content/management.md` for management philosophy, or `content/notes.md` for the Notes page. Notes use level-two headings followed by short paragraphs. Then install the pinned build dependencies (Node.js 22 or later), and run:

```sh
npm ci
python3 scripts/build_site.py
```

Commit the generated `index.html`, `about.html`, `notes.html`, `robotics/`, `papers/`, `sitemap.xml`, and vendored math assets alongside the source. GitHub Pages serves the static HTML directly, with no runtime dependencies. Shared styles and interactions live in `assets/site.css` and `assets/site.js`. The writing and article layouts use `assets/robotics.css`. Shared navigation and footer markup live in `scripts/templates/`.

The generator expects the current profile heading structure: four Talroo work areas, earlier roles, education, and skills. Structural changes should also update the generator. Contact links, Talroo dates and role progression are curated in `scripts/build_site.py`; update those alongside the profile when they change.

## Design and page structure

The homepage puts published writing first. It reads the same article metadata as the Robotics section, so new reports appear automatically. The full biography lives at `about.html`; older links such as `/#experience` still lead to the same biography section. Notes and report URLs stay the same.

The homepage control playground compares five architecture examples. The scene and main controls stay visible. Closed drawers hold the approach summary and paper, experiment settings, predicted futures, and failure explanations. Readers can move cubes, change the task and delay, or try an injected failure. The simulation uses supplied rules and shared physical checks. See [the setup and sources](docs/control-playground.md).

The two-link geometry game lives beside the position equations in the moving-arm article. Its sliders change the shoulder and elbow angles. Link lengths stay at 1 and 0.8 units. Add an empty `robotics-arm` code fence to include it in an article. The static drawing works without JavaScript. Interactive controls appear only when ready. The builder loads `assets/arm-geometry.js` only on pages with this component. The homepage loads its separate playground module and styles.

Four alternative designs are saved at `/design-previews/`: editorial, journal, notebook, and dark. They are independent pages, excluded from search indexing and the sitemap. They do not appear in the public navigation.

## Preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. Check desktop and mobile layouts, writing links, the control playground, the article arm sliders, Notes, report media and equations, and biography expand/collapse controls. Details also work without JavaScript. Printing expands all details when JavaScript is enabled.

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

Use level-two and level-three headings for the table of contents. Set `layout: essay`
for a centered reading column without a contents sidebar. The title supplies the
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
npm test
npm run build
```

`python3 scripts/build_site.py` builds About and Notes with the shared navigation, then calls
`scripts/build_robotics.mjs` when the report source directory exists, including when it is empty. `npm run build:robotics` builds
the writing homepage, Robotics list, and reports. The renderer uses pinned Markdown-it, gray-matter, and KaTeX packages.
It copies KaTeX styles, fonts, and its license into `assets/vendor/katex/`. Generated pages
need no network math service or reader-side JavaScript. GitHub Pages serves the committed
files directly. The build preserves unrelated sitemap entries and updates Robotics entries.

The article layout lives in `assets/robotics.css`, on top of the existing site styles.
Essay pages and trusted authored `rf-figure` diagrams load `assets/robotics-futures.css`.
These diagrams need no JavaScript.
Preview both `/robotics/` and a report at desktop and phone widths. Check images, equations,
table scrolling, table-of-contents links, and the native details controls with JavaScript off.

The company map uses a `robotics-market` fence with a local JSON data asset. Its HTML,
company evidence and source links work without JavaScript; the optional script adds search,
filters and map-to-entry navigation. Styles and interactions load only on that article.

## Visual paper explanations

The Papers section uses matching `content/papers/<slug>.json` metadata and
`content/papers/<slug>.html` bodies. Metadata supplies the title, description, date,
and Paper, Project, and Code links. The builder supplies the level-one heading.
These HTML bodies are trusted author content.

`scripts/build_papers.mjs` generates the section, individual explanations, and sitemap
entries. The full build calls it after the Robotics builder, which also adds the newest
paper to the homepage. Shared paper styles live in `assets/papers.css`; each explanation
loads its own `assets/papers-<slug>.css` and module.

Check the animation at desktop and phone widths, with touch controls, reduced motion,
and JavaScript disabled. Keep the core explanation visible without animation.
