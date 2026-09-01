# It Works! Now What? — Airflow Summit 2026

Served at `/talks/airflow-summit/2026/it-works-now-what/`.

This deck is **pre-rendered elsewhere** and copied in, unlike the other talks in
`talks/`, which are Quarto inputs rendered by this site.

- Built in the separate `airflow-summit/talk` project, whose
  `scripts/package_deck.py` writes a self-contained bundle under its `dist/`.
- `alex-guglielmone-nemi-fast-iteration-ai-airflow-summit-2026.qmd` is a copy of
  the packaged source, kept for reference. It is excluded from `render` in
  `_quarto.yml`; building it needs `custom.scss` from the talk project.
- `index.html` is the packaged deck, renamed so the directory URL serves it. Its
  asset directory was renamed to `index_files/` to match.

Speaker notes are stripped from this copy, in both the `.qmd` (`::: {.notes}`
blocks) and the deck (`<aside class="notes">` elements). They are delivery cues
— useful to the speaker, noise to a reader who presses `S` out of curiosity.
The talk project keeps them. Reader-facing notes, if any, get written
deliberately rather than inherited from the script.

To update: re-package in the talk project, copy the bundle over this directory,
rename the `.html` to `index.html` and the `<name>_files/` directory to
`index_files/`, then strip the notes again.
