# Hadrien Cornier

Personal website hosted on GitHub Pages.

## Update the website

Edit `resume/profile.md` for experience, `content/management.md` for management philosophy, or `content/notes.md` for the Notes page. Notes use level-two headings followed by short paragraphs. Then run:

```sh
python3 scripts/build_site.py
```

Commit the generated `index.html` and `notes.html` alongside the source. GitHub Pages serves the static HTML directly, with no runtime dependencies. Layout and interactions live in `assets/site.css` and `assets/site.js`.

The generator expects the current profile heading structure: four Talroo work areas, earlier roles, education, and skills. Structural changes should also update the generator. Contact links, Talroo dates and role progression are curated in `scripts/build_site.py`; update those alongside the profile when they change.

## Preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. Check desktop and mobile layouts, section links, and expand/collapse controls. Details also work without JavaScript. Printing expands all details when JavaScript is enabled.

## Downloadable resume

The PDF link points to `out/resume.pdf`. Edit the concise source at `resume/resume.md`, then run `python3 resume/build_resume.py`. See `resume/README.md` for details.
