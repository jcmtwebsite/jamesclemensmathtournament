# AGENTS.md

Static site for the James Clemens Math Tournament. Deployed by GitHub Pages straight from
`main` (root folder, `.nojekyll` present). **No build, no dependencies, no CI, no tests.**
Keep it that way: edit files directly, never add npm/bundlers/frameworks. Commit to `main`.

## Run it

```
python -m http.server 8000     # then http://localhost:8000
```

Opening `index.html` via `file://` mostly works, but PDFs and photos only behave realistically
over HTTP. This is the whole verification story — there is no other.

## Layout

Everything is in `index.html`: hand-written CSS in one `<style>` block, one vanilla IIFE
`<script>`. The five "pages" (home, register, past tests, the day, the crew) are hash routes
driven by the `PAGES` array, not separate documents.

`404.html` is a **separate hand-maintained file**, not generated from `index.html`. It
re-declares the fonts, color variables, and tangram coordinates by hand. Any visual or
geometry change in `index.html` must be copied over or the two will drift.

## Traps

**Home copy is not in the `CONTENT` section.** The home page's text lives as static markup
inside `.copy-in` (around line 223) so search engines can read it without JavaScript. The
script captures it once via `document.querySelector('.copy-in').innerHTML` into the `HOME`
constant and reuses that snapshot every time you navigate back. Edit the HTML, not `HOME`.

**`--acc` is not declared in `:root`.** `show()` assigns it per page on `documentElement`. This
is not a bug: every rule that uses it (`.btn`, `.kick`, `.group`, `.grp a.k`, `.times li.hl`,
`.person`, `.nav a[aria-current]`) lives on a JS-rendered page, and the static home markup uses
only the other variables. Adding `:root { --acc:#1D3160 }` is safe as a default if you want one.

**Adding a year of tests:** put PDFs at `tests/<year>/<division>-<written|team>[-key].pdf`,
then add the line at the **top** of `TESTS` (newest first). A division key that isn't in
`DIVISIONS` is now dropped with a console warning instead of printing `undefined` — watch the
console when you add one. Nothing validates that the PDFs actually exist, so a mismatched
filename is still a dead link with no error; check the filenames by hand.

**Committee:** edit `CREW_GROUPS`. Each person is `[name, role, photo-slug, [bio lines]]`;
the photo is `img/<slug>.jpg`. Slug is the third element, not the name.

**Dates: one source for the JS-rendered copy, a guard for the static rest.** `EVENT` at the top
of the `CONTENT` section holds the tournament date and roster deadline, and drives `REGISTER` and
`DAY`. The `<head>` tags, the header `.when` chip, and the home `.facts` list are static HTML that
JS can't rewrite, so they stay hand-edited — but `verifyEvent()` compares all ten against `EVENT`
and logs the stale ones, so a year rollover can't half-land. `og:image:alt` deliberately carries no
year; don't put one back. The "third edition" wording in the home copy is still manual.

**Leave the custom-domain TODOs alone** unless the site is actually on its own domain.
Three marked spots: `404.html`'s `href="index.html"`, `og:image` in `index.html` (relative),
and the missing `og:url` + `<link rel="canonical">`. The 404 one is not cosmetic — GitHub
Pages serves `404.html` at the *requested* URL, so a relative `index.html` resolves wrong for
any missing asset under a subdirectory. `README.md` has the full cutover steps.

## Tangram engine

Only relevant if you're changing the figures, but the wiring is not guessable:

- `RAW` holds hand-authored vertex arrays per figure. `square` is special: it's generated
  from the `sq` reference and scaled by `√½`; every other figure is authored directly.
- **`RAW.house` is the canonical reference pose.** `BASE` is derived from it, and `pose()`
  computes each piece's rotation by comparing edge 0 of `BASE` to edge 0 of the target.
- `norm()` is load-bearing. It fixes winding, start vertex, and parallelogram edge order so
  that edge-0 angle matching yields the *shortest* rotation. Remove or weaken it and figures
  spin the wrong way during the morph.
- The parallelogram (`PG`) is the one piece that can't be rotated into place — `pose()`
  returns `s: -1` to mirror it via `scale(-1, 1)`.
- `IDS` is referenced from several parallel structures (`sq`, `RAW`, `COL`, `TYPE`, and the
  hardcoded polygons in `404.html`). Adding or renaming a piece means touching all of them.
- `show()` morphs by tweening position/rotation/scale; there is no per-piece collision or
  layout logic, so pieces overlap freely.
