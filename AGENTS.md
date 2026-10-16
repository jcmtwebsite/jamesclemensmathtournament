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

**Committee:** edit `CREW_GROUPS`. Each person is `[name, role, [bio lines]]`; the photo
`img/<slug>.jpg` is derived from the name, so there's no filename to keep in sync by hand. The
derivation is ASCII-only — a name with an apostrophe or accent (`O'Neill`, `María`) needs the
optional fourth element holding the real file name.

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

## Pending: once the site has a real domain

The three cutover edits already live in `README.md` → "Connecting the custom domain": make
`og:image` an absolute address, add `og:url` + `<link rel="canonical">`, and switch
`404.html`'s link from `index.html` to `/`. Don't duplicate them here. Everything below was
found while reviewing the site and is recorded nowhere else:

- **Link previews are broken until that cutover, on purpose.** With a relative `og:image`,
  Slack, iMessage and Discord render a bare text row with no image. Highest-impact item —
  sharing is how parents hear about this tournament — and it resolves in the cutover above.
- **`social-preview.png` is date-free by design.** It used to carry the event date painted
  top-left in the tomato red; that was removed, so the image no longer needs regenerating each
  year. Keep it that way — `verifyEvent()` only reads HTML, so a date baked back into pixels
  would be invisible to it.
- **No analytics.** Nothing measures whether anyone visits. Worth treating as a decision
  rather than a default: a third-party tag on what is effectively a children's event site has
  a real privacy cost, and the site is run by students. Registration counts are a reasonable
  substitute for page views.
- **No `robots.txt` and no `sitemap.xml`.** Both absent. Nearly free if wanted, low value
  for a site that is one crawlable page.
- **Only the home page is crawlable.** Register, Past tests, The day and The crew are built
  at runtime, so search engines never see them. The structured data covers the date but not
  the schedule or the registration deadline. The fix is to move those four pages into static
  HTML and have JavaScript enhance rather than generate — a real architectural change,
  deliberately parked, not cutover work.
- **No touch icon.** `favicon.svg` is the only icon, so iOS adds no home-screen image.
  Cosmetic; skip unless asked.

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

## Intro animation

Once per session, on a cold load of the home page: the pieces scatter across the viewport, gather
into the square at the centre of the screen, then slide into the stage and the copy fades in. The
wiring is split across three places, which is the part that isn't guessable:

- **`<html class="intro">` is the single switch.** A small `<script>` in `<head>` adds it before
  the first paint and `finishIntro()` removes it again. The head script also arms a 3.5s safety
  timer that removes it, so a throw in the main script can't leave the page blank.
  `html.intro .top/.nav/.tip/.copy/.dotbg{opacity:0}` is the *only* thing that empties the screen:
  the header, the bottom nav, the drag hint, the copy column, and the stage's dotted backdrop. The
  pieces themselves stay visible and are the whole animation. Keep it class-gated rather than a
  plain stylesheet rule, so visitors without JavaScript still see the page, and keep it on
  `opacity` rather than `display` so nothing reflows while the intro measures the stage.
  Everything fades back in together when `finishIntro()` removes the class.
- **The head script decides, the main script obeys.** It arms the class only when motion isn't
  reduced, the URL carries no hash (or `#home`), and `sessionStorage['jcmt-intro-seen']` is unset.
  The main script reads the class once into `introActive` instead of re-deriving those conditions,
  so the two can't drift.
- **`camX`/`camY` is a camera offset added to every piece in `draw()`.** Every figure is authored
  centred on the SVG origin, so the square would naturally form at the *stage* centre. The intro
  instead scatters pieces in screen coordinates and parks the camera at the screen centre, so the
  square forms there, then tweens the camera back to 0. This leans on `.stage svg{overflow:visible}`
  — remove that and pieces scattered outside the stage are clipped away.
- **`morph(fig, onDone)` and `show(i, first, skipMorph)` grew optional arguments** so the intro can
  chain its slide after the square forms, and can suppress the usual first-load morph.
- **`finishIntro()` empties the whole `tweens` array.** That is only safe because on a cold load
  the intro is the only thing animating. Don't call it where other tweens may be running.
- **The `780` in `runIntro()` must stay in step with the CSS breakpoint.** Below it the layout is
  stacked, so there is no "side" to slide to and the slide phase is skipped; the square converges
  in place instead.
- **Only a keypress or a click skips it.** `wheel` and `touchstart` are deliberately not in that
  list: a trackpad nudge fires `wheel`, which used to end the intro by accident. A tap still works
  because touch generates a click.
- Reduced motion skips all of it. There is no automated test — check it by eye over
  `python -m http.server`, and note that a second load in the same tab will not replay it
  (that is `sessionStorage`, not a bug).
