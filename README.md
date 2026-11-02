# James Clemens Math Tournament website

A site with real pages: `index.html` is home, and `register/`, `past-tests/`, `schedule/`, `committee/` each have their own document. Every page draws its figure from the same seven tangram pieces using the shared engine in `app.js`.

## Files
- `index.html`: the home page (static copy in `.copy-in` for search engines, tangram stage, nav).
- `register/`, `past-tests/`, `schedule/`, `committee/`: the four interior pages, each with static content that matches what the site used to render from JavaScript. The nav is shared across all five.
- `site.css`: the site layout and component styles (extracted from the former inline stylesheet).
- `theme.css`: fonts (the Google Fonts `@import`), colour tokens, and the two font stacks (`--font-display`, `--font-body`). Change a font or a colour here, not in the pages.
- `app.js`: the tangram engine and per-page boot (draws the figure named by `<body data-fig>`, runs the home intro, drag/`Put them back`, `verifyEvent()`).
- `tangram.js`: the shared tangram geometry and piece colours, used by `app.js` and `404.html`.
- `tests/<year>/`: past tests and answer keys as PDFs.
- `img/`: committee photos (square JPEGs, about 400×400).
- `404.html`: the page shown for any address that doesn't exist — on GitHub Pages. The local dev server has its own plain 404 instead; preview ours at `http://localhost:8000/404.html`.
- `social-preview.png`: the image shown when the link is shared in a text, email, or post (1200×630).
- `favicon.svg`: the browser-tab icon.
- `apple-touch-icon.png`: the iOS home-screen icon.
- `robots.txt`, `sitemap.xml`: crawl hints for search engines.
- `.nojekyll`: tells GitHub Pages to publish the files as-is.

## Adding a year's tests
1. Put the PDFs in `tests/<year>/`, named `<division>-<written|team>.pdf` and `<division>-<written|team>-key.pdf`. Divisions: `4th-grade`, `5th-grade`, `6th-grade`, `pre-algebra`, `algebra-1`. Example: `tests/2027/pre-algebra-team-key.pdf`.
2. Edit `past-tests/index.html` and add the new year's links at the **top** of its table (newest first), using the same pattern as the existing rows. Nothing validates that the PDFs exist, so double-check the filenames.

## Updating the dates each year
Set `EVENT` in `app.js` — the tournament date and the roster deadline. Each page also carries the dates in static HTML (the header `.when` chip, and on home the facts list and `<head>` metadata); `verifyEvent()` runs on every page and logs any that are stale to the console.

## Updating the committee
Edit `committee/index.html`. Each person is a `<details class="person">` block with their name, role, photo (`/img/<slug>.jpg` derived from the name, ASCII-only) and bio paragraphs. A name with an apostrophe or accent that doesn't reduce cleanly needs an image with the right slug on disk.

## Testing locally
Open a terminal in this folder and run `python -m http.server 8000`, then visit http://localhost:8000.
(Opening `index.html` directly works for the home page in many browsers, but the interior pages use root-absolute asset paths and the dev server is the most realistic way to check routing.)

## Publishing
Push to GitHub and turn on Pages (Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`).

## Connecting the custom domain

The site is on `jcmathtournament.org`, and the code side (steps 5 and 6) is already applied.
The steps are kept for the DNS/Pages setup, or in case the domain ever changes.

1. **Add the domain in GitHub:** Settings → Pages → Custom domain → type the domain (`jcmathtournament.org`)
   → Save. GitHub adds a `CNAME` file to the repo; keep it.
2. **Point the domain at GitHub** in your domain registrar's DNS settings:
   - Four `A` records for the bare domain (`@`): `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - Optional `AAAA` records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`,
     `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - One `CNAME` record for `www` pointing to `<your-github-username>.github.io`
3. **Turn on HTTPS:** once GitHub shows the DNS check passing (can take up to a day), tick
   "Enforce HTTPS" on the same Pages settings screen.
4. **Protect the domain:** in your GitHub account (not the repo) go to Settings → Pages →
   "Add a verified domain" and follow the steps, so nobody else can claim it on GitHub.
5. **Link previews:** every page carries its own `<meta property="og:url">`, `<link rel="canonical">`,
   and `og:image`; `index.html` keeps the JSON-LD `Event` block with the full address. All need changing if the domain does.
6. **`404.html`'s paths:** GitHub Pages serves that file at the *requested* URL, so a relative path would resolve against the missing page. Its links are therefore root-absolute: `href="/"`, `/theme.css` and `/tangram.js`.
