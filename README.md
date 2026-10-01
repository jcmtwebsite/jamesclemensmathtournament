# James Clemens Math Tournament website

A single-page site: `index.html` holds all the text, and each page (home, register, past tests,
the day, the crew) is drawn from the same seven tangram pieces.

## Files
- `index.html`: the whole site. All wording is in the `CONTENT` section of the script near the bottom,
   **except the home page's text**, which sits in the static HTML inside `.copy-in` so search engines can
   read it without JavaScript. The script snapshots that markup into the `HOME` constant and reuses it
   whenever you navigate back. Edit the HTML, not `HOME`.
- `tests/<year>/`: past tests and answer keys as PDFs.
- `img/`: committee photos (square JPEGs, about 400×400).
- `404.html`: the page shown for any address that doesn't exist.
- `social-preview.png`: the image shown when the link is shared in a text, email, or post (1200×630).
- `favicon.svg`: the browser-tab icon.
- `.nojekyll`: tells GitHub Pages to publish the files as-is.

## Adding a year's tests
1. Put the PDFs in `tests/<year>/`, named `<division>-<written|team>.pdf` and
   `<division>-<written|team>-key.pdf`. Divisions: `4th-grade`, `5th-grade`, `6th-grade`,
   `pre-algebra`, `algebra-1`. Example: `tests/2027/pre-algebra-team-key.pdf`.
2. In `index.html`, add a line at the top of `TESTS`, e.g.
   `{ year: 2027, divisions: ['4th-grade', '5th-grade', '6th-grade', 'pre-algebra', 'algebra-1'] },`

## Updating the dates each year
Set `EVENT` near the top of the script in `index.html` — the tournament date and the roster deadline.
The register and day pages follow from it automatically. The same dates are also typed into the
`<head>` and the home page, which JavaScript can't rewrite, so those still need editing by hand:
open the console and `verifyEvent()` names any that are stale.

## Updating the committee
Edit `CREW_GROUPS` in `index.html`. Each person is `[name, role, [bio lines]]`, and their photo is
`img/<name>.jpg` with the name lowercased and every run of non-alphanumerics turned into a dash —
"Kristin Hartland" looks for `img/kristin-hartland.jpg`. A name with an apostrophe or an accent won't
reduce to the file name you have, so add the file name as a fourth element:
`['Name', 'Role', [bio lines], 'photo-slug']`.

## Testing locally
Open a terminal in this folder and run `python -m http.server 8000`, then visit http://localhost:8000.
(Opening `index.html` directly works too, but PDFs and photos behave most like the real site on a server.)

## Publishing
Push to GitHub and turn on Pages (Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`).

## Connecting the custom domain
1. **Add the domain in GitHub:** Settings → Pages → Custom domain → type the domain (for example
   `example.org`) → Save. GitHub adds a `CNAME` file to the repo; keep it.
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
5. **Finish the link previews:** in `index.html`, change `content="social-preview.png"` to the full
   address (`https://example.org/social-preview.png`), and add these two lines next to it:
   `<meta property="og:url" content="https://example.org/">` and
   `<link rel="canonical" href="https://example.org/">`.

Note: `404.html` links to `index.html`, but has to be switched to `/` once the site is on its own domain.
