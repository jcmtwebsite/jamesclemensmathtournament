# AGENTS.md

Static site for the James Clemens Math Tournament. Deployed by GitHub Pages straight from
`main` (root folder, `.nojekyll` present). **No build, no dependencies, no CI, no tests.**
Keep it that way: edit files directly, never add npm/bundlers/frameworks. Commit to `main`.

## Run it

```
python -m http.server 8000     # then http://localhost:8000
```

The home page mostly works over `file://`, but the four interior pages use root-absolute asset
paths (they sit one directory down) and the old `/#register` links redirect to real URLs, so use
the server. This is the whole verification story — there is no other.

`python -m http.server` never serves `404.html` itself — it answers a missing path with its own
plain 404. Preview ours directly at `http://localhost:8000/404.html`, where its relative
`theme.css` / `tangram.js` resolve correctly (they only misresolve on GitHub Pages, at depth).

## Layout

Five real documents, not one:

- `index.html` — home.
- `register/index.html`, `past-tests/index.html`, `schedule/index.html`, `committee/index.html` —
  the interior pages. Their text is plain markup, which is the whole point: search engines used
  to see only the home page because the others were built at runtime from JS template strings.
  `sitemap.xml` lists all five.

Shared files, so there is one source of truth for the things that used to be copied by hand:

- `theme.css` — the Google Fonts `@import`, the colour tokens, and the two font stacks
  (`--font-display`, `--font-body`). **Change a font or a colour here, not in the pages.**
- `site.css` — all layout and component CSS, extracted verbatim from the old inline `<style>`.
  The five pages use it; `404.html` keeps its own layout CSS.
- `tangram.js` — sets `window.JCMT_TANGRAM` (`IDS`, `COL`, `TYPE`, `sq`, `RAW`). `app.js`
  destructures it; `404.html` draws its single figure from it.
- `app.js` — the engine plus per-page boot: reads `<body data-fig>` / `data-shape`, draws and
  morphs that figure, runs the home intro, the drag interactions, `revealCopy()`, and
  `verifyEvent()`.

Each page carries its own `<head>` metadata, header, nav and copy. That duplication is the price
of having no build step, so **the header and the five nav links are repeated in all five
files — change them together.** The nav links are real `<a href>` elements (crawlable, and usable
with JavaScript off); `app.js` only injects the little tangram glyphs into them.

`404.html` is still hand-maintained. It keeps its own layout CSS and its own knock-apart offsets,
and builds its tangram from `tangram.js` with a few lines of script — so without JavaScript it
shows the text and the link but no figure. It hard-depends on `theme.css` and `tangram.js`: if
`theme.css` fails the page is unstyled, and if `tangram.js` fails the figure is missing.

## Traps

**Home copy is static markup.** It lives inside `.copy-in` in `index.html`. There is no `HOME`
constant any more and nothing swaps page content — each page is loaded from the server, so edit
the HTML.

**`--acc` is set inline on `<html>`, one colour per page.** It is not declared in `:root`. This is
not a bug: every rule that uses it (`.btn`, `.kick`, `.group`, `.grp a.k`, `.times li.hl`,
`.person`, `.nav a[aria-current]`) lives on a page that sets it. Doing it inline rather than from
script means the accent is right on the first paint and with JavaScript off.

**Interior pages use root-absolute paths, home uses relative ones.** `register/index.html` is one
directory down, so it links `/site.css`, `/app.js`, `/theme.css`, `/tangram.js`, and every content
link (`/tests/…`, `/img/…`) has to be root-absolute too. `index.html` is always at the root, so it
uses plain relative paths. Copying a content link from home to an interior page without adding the
leading slash silently breaks it.

**Dates: one source for the JS-rendered copy, a guard for the static rest.** `EVENT` at the top of
`app.js` holds the tournament date and roster deadline. Each page also carries the dates in static
HTML — the `<head>` description/OG tags, the header `.when` chip, and on home the `.facts` list.
`verifyEvent()` runs on every page, checks the ten values that page actually has, and logs the stale
ones; it skips the JSON-LD and facts checks on interior pages, which don't carry them. A year
rollover therefore can't half-land. `og:image:alt` deliberately carries no year; don't put one back.
The "third edition" wording in the home copy is still manual.

**Old `#hash` links still work.** A tiny `<script>` in each page's `<head>` redirects
`/#register` (and `/#past-tests`, `/#schedule`, `/#committee`) to the real directory URL, so links
shared before the split keep resolving. That script also decides whether the intro is armed.

**The site is on its own domain (`jcmathtournament.org`).** Every page's `og:image`, `og:url`,
`<link rel="canonical">` carry the full address; `index.html` also has JSON-LD `url` / `image`, and
`404.html` uses root-absolute `/`, `/theme.css` and `/tangram.js`. That last part is not cosmetic:
GitHub Pages serves `404.html` at the *requested* URL, so a relative path resolves against the
missing page and a deep 404 would load no stylesheet and no geometry. If the domain ever changes,
grep for the hostname.

## Pending

Everything below was found while reviewing the site and is recorded nowhere else.

- **No analytics, on purpose.** A third-party tag on what is effectively a children's event site
  has a real privacy cost, and the site is run by students. Registration counts are a reasonable
  substitute for page views. Treat this as a decision, not an oversight.
- **Only the home page carries structured data.** The JSON-LD `Event` covers the date and place but
  not the schedule or the registration deadline. The four pages are crawlable now, so the HTML
  itself carries that text; adding `subEvent`/`offers` would be the next step if the date ever
  stops showing in search results.
- **No `CNAME` file yet.** Adding one before DNS resolves would make GitHub redirect the live
  `github.io` URL to a dead host. Add it in Pages settings once the A records are live (see
  `README.md`).
- **`social-preview.png` is date-free by design.** It used to carry the event date painted
  top-left in the tomato red; that was removed, so the image no longer needs regenerating each
  year. Keep it that way — `verifyEvent()` only reads HTML, so a date baked back into pixels would
  be invisible to it.

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
- Each page names its figure on `<body data-fig="…" data-shape="…">`. `app.js` morphs to that
  figure on load (so every page gets an entrance), and `Put them back` re-morphs to it. An unknown
  `data-fig` falls back to the square.
- `show()` no longer exists: there is no client-side page switching. Moving between pages is a
  normal navigation.

## Intro animation

Once per session, on a cold load of the home page only: the pieces scatter across the viewport,
gather into the square at the centre of the screen, then slide into the stage and the copy reveals
line by line. The wiring is split across three places, which is the part that isn't guessable:

- **`<html class="intro">` is the single switch.** A small `<script>` in `<head>` adds it before
  the first paint and `finishIntro()` removes it again. The head script also arms a 3.5s safety
  timer that removes it, so a throw in `app.js` can't leave the page blank.
  `html.intro .top/.nav/.tip/.copy/.dotbg{opacity:0}` is the *only* thing that empties the screen:
  the header, the bottom nav, the drag hint, the copy column, and the stage's dotted backdrop. The
  pieces themselves stay visible and are the whole animation. Keep it class-gated rather than a
  plain stylesheet rule, so visitors without JavaScript still see the page, and keep it on
  `opacity` rather than `display` so nothing reflows while the intro measures the stage.
  Everything comes back when `finishIntro()` removes the class: the frame fades, and the copy is
  handed to `revealCopy()`.
- **`revealCopy()` is shared with the ordinary page entrance.** Every page calls it on load, and
  the intro calls the same function rather than its own copy, so arriving on a page looks identical
  however you got there. Change one and you change both. `fill:'backwards'` is load-bearing: without
  it each child stays visible through its own delay and pops in instead of revealing. `.copy` is
  deliberately *not* in the frame's `transition` list — a fade on the column would race the
  per-child reveal and wash it out.
- **The head script decides, `app.js` obeys.** It arms the class only when
  `<html data-page="home">`, motion isn't reduced, and `sessionStorage['jcmt-intro-seen']` is unset.
  It identifies home from the `data-page` attribute rather than the path, because `/` and
  `/register/` both end in a slash and a path test can't tell them apart. `app.js` reads the class
  once into `introActive` instead of re-deriving those conditions, so the two can't drift.
- **`camX`/`camY` is a camera offset added to every piece in `draw()`.** Every figure is authored
  centred on the SVG origin, so the square would naturally form at the *stage* centre. The intro
  instead scatters pieces in screen coordinates and parks the camera at the screen centre, so the
  square forms there, then tweens the camera back to 0. This leans on `.stage svg{overflow:visible}`
  — remove that and pieces scattered outside the stage are clipped away.
- **`morph(fig, onDone)` grew an optional callback** so the intro can chain its slide after the
  square forms.
- **`finishIntro()` empties the whole `tweens` array.** That is only safe because on a cold load
  the intro is the only thing animating. Don't call it where other tweens may be running.
- **`stepTweens()` runs `done` callbacks after the walk, not inside it.** The loop reads
  `tweens[i]` for the length it saw when it started, so a callback that empties the array
  (that is exactly what `finishIntro()` does) would make the next read `undefined` and throw.
  The throw escapes `loop()`, which means `requestAnimationFrame(loop)` never re-registers — the
  whole engine goes dead and nothing redraws again, not drags, not "Put them back". Nothing but a
  refresh recovers. Normally each morph tween matures on its own frame so only one is left when it
  finishes, but a stalled tab collapses them into a single frame: `rAF` stops while hidden and every
  pending tween is due at once on return. Only the stacked/mobile branch is exposed, because it
  calls `finishIntro()` straight from the morph callback while the desktop branch starts a camera
  tween instead. Keep the callbacks deferred if you touch this.
- **The `780` in `runIntro()` must stay in step with the CSS breakpoint.** Below it the layout is
  stacked, so there is no "side" to slide to and the slide phase is skipped; the square converges
  in place instead.
- **Only a keypress or a click skips it.** `wheel` and `touchstart` are deliberately not in that
  list: a trackpad nudge fires `wheel`, which used to end the intro by accident. A tap still works
  because touch generates a click.
- Reduced motion skips all of it. There is no automated test — check it by eye over
  `python -m http.server`, and note that a second load in the same tab will not replay it
  (that is `sessionStorage`, not a bug).
