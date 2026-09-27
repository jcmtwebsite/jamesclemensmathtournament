# James Clemens Math Tournament website

A single-page site: `index.html` holds all the text, and each page (home, register, past tests,
the day, the crew) is drawn from the same seven tangram pieces.

## Files
- `index.html`: the whole site. All wording is in the `CONTENT` section of the script near the bottom.
- `tests/<year>/`: past tests and answer keys as PDFs.
- `img/`: committee photos (square JPEGs, about 400×400).
- `favicon.svg`: the browser-tab icon.

## Adding a year's tests
1. Put the PDFs in `tests/<year>/`, named `<division>-<written|team>.pdf` and
   `<division>-<written|team>-key.pdf`. Divisions: `4th-grade`, `5th-grade`, `6th-grade`,
   `pre-algebra`, `algebra-1`. Example: `tests/2027/pre-algebra-team-key.pdf`.
2. In `index.html`, add a line at the top of `TESTS`, e.g.
   `{ year: 2027, divisions: ['4th-grade', '5th-grade', '6th-grade', 'pre-algebra', 'algebra-1'] },`

## Updating the committee
Edit `CREW_GROUPS` in `index.html`. Each person is `[name, role, photo file name, [bio lines]]`.
Put their photo in `img/` as `<photo file name>.jpg`.

## Testing locally
Open a terminal in this folder and run `python -m http.server 8000`, then visit http://localhost:8000.
(Opening `index.html` directly works too, but PDFs and photos behave most like the real site on a server.)

## Publishing
Push to GitHub and turn on Pages (Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`).
