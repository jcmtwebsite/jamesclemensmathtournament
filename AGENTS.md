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

`python -m http.server` never serves `404.html` itself — it answers a missing path with its own
plain 404. Preview ours directly at `http://localhost:8000/404.html`, where its relative
`theme.css` / `tangram.js` resolve correctly (they only misresolve on GitHub Pages, at depth).

## Layout

`index.html` holds the site: hand-written CSS in one `<style>` block, one vanilla IIFE
`<script>`. The five "pages" (home, register, past tests, the day, the crew) are hash routes
driven by the `PAGES` array, not separate documents.

Two small files are shared with `404.html`, so there is one source of truth for the things that
used to be copied by hand:

- `theme.css` — the Google Fonts `@import`, the colour tokens, and the two font stacks
  (`--font-display`, `--font-body`). **Change a font or a colour here, not in the pages.** Swapping
  a family is now one line in this file.
- `tangram.js` — sets `window.JCMT_TANGRAM` (`IDS`, `COL`, `TYPE`, `sq`, `RAW`). `index.html`'s
  engine destructures it; `404.html` draws its single figure from it.

`404.html` is still hand-maintained, but it no longer copies fonts, colours or coordinates. It
keeps its own layout CSS and its own knock-apart offsets, and builds its tangram from
`tangram.js` with a few lines of script — so without JavaScript it shows the text and the link
but no figure. Both pages now hard-depend on those two files: if `theme.css` fails the page is
unstyled (every colour and font comes from a `var()`), and if `tangram.js` fails `index.html`
throws on the guard.

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
Marked spots: `404.html`'s `href="index.html"` plus its relative `theme.css` and `tangram.js`,
`og:image` in `index.html` (relative), and the missing `og:url` + `<link rel="canonical">`.
The 404 ones are not cosmetic — GitHub Pages serves `404.html` at the *requested* URL, so a
relative path resolves against the missing page: a deep 404 loads no stylesheet and no geometry
(it still reads, but unstyled and figureless). `index.html` is always at the root, so its
relative `theme.css` / `tangram.js` links are correct as they are. `README.md` has the full
cutover steps.

## Pending: once the site has a real domain

The cutover edits already live in `README.md` → "Connecting the custom domain": make
`og:image` an absolute address, add `og:url` + `<link rel="canonical">`, and switch
`404.html`'s three relative paths (`index.html`, `theme.css`, `tangram.js`) to root-absolute.
Don't duplicate them here. Everything below was found while reviewing the site and is recorded
nowhere else:

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
- `IDS` is referenced from several parallel structures (`sq`, `RAW`, `COL`, `TYPE`) — all of them
  in `tangram.js` — and from the draw order in `404.html`, whose handful of lines look up
  `JCMT_TANGRAM.sq[id]` and `JCMT_TANGRAM.COL[id]`. Adding or renaming a piece means touching all
  of them, and a piece missing from `404.html`'s ORDER table is silently not drawn.
- `show()` morphs by tweening position/rotation/scale; there is no per-piece collision or
  layout logic, so pieces overlap freely.

## Intro animation

Once per session, on a cold load of the home page: the pieces scatter across the viewport, gather
into the square at the centre of the screen, then slide into the stage and the copy reveals line by
line. The wiring is split across three places, which is the part that isn't guessable:

- **`<html class="intro">` is the single switch.** A small `<script>` in `<head>` adds it before
  the first paint and `finishIntro()` removes it again. The head script also arms a 3.5s safety
  timer that removes it, so a throw in the main script can't leave the page blank.
  `html.intro .top/.nav/.tip/.copy/.dotbg{opacity:0}` is the *only* thing that empties the screen:
  the header, the bottom nav, the drag hint, the copy column, and the stage's dotted backdrop. The
  pieces themselves stay visible and are the whole animation. Keep it class-gated rather than a
  plain stylesheet rule, so visitors without JavaScript still see the page, and keep it on
  `opacity` rather than `display` so nothing reflows while the intro measures the stage.
  Everything comes back when `finishIntro()` removes the class: the frame fades, and the copy is
  handed to `revealCopy()`.
- **`revealCopy()` is shared with page changes.** It is the per-child fade-and-lift that `setCopy()`
  runs after swapping markup, and the intro calls the same function rather than its own copy, so
  arriving on a page looks identical however you got there. Change one and you change both.
  `fill:'backwards'` is load-bearing: without it each child stays visible through its own delay and
  pops in instead of revealing. `.copy` is deliberately *not* in the frame's `transition` list — a
  fade on the column would race the per-child reveal and wash it out.
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
- **`stepTweens()` runs `done` callbacks after the walk, not inside it.** The loop reads
  `tweens[i]` for the length it saw when it started, so a callback that empties the array
  (that is exactly what `finishIntro()` does) would make the next read `undefined` and throw.
  The throw escapes `loop()`, which means `requestAnimationFrame(loop)` never re-registers — the
  whole engine goes dead and nothing redraws again, not drags, not "Put them back", not page
  changes. Nothing but a refresh recovers. Normally each morph tween matures on its own frame so
  only one is left when it finishes, but a stalled tab collapses them into a single frame: `rAF`
  stops while hidden and every pending tween is due at once on return. Only the stacked/mobile
  branch is exposed, because it calls `finishIntro()` straight from the morph callback while the
  desktop branch starts a camera tween instead. Keep the callbacks deferred if you touch this.
- **The `780` in `runIntro()` must stay in step with the CSS breakpoint.** Below it the layout is
  stacked, so there is no "side" to slide to and the slide phase is skipped; the square converges
  in place instead.
- **Only a keypress or a click skips it.** `wheel` and `touchstart` are deliberately not in that
  list: a trackpad nudge fires `wheel`, which used to end the intro by accident. A tap still works
  because touch generates a click.
- Reduced motion skips all of it. There is no automated test — check it by eye over
  `python -m http.server`, and note that a second load in the same tab will not replay it
  (that is `sessionStorage`, not a bug).
