# simple-voting-frontend

Static HTML/CSS/vanilla JS frontend for simple-voting-backend. No build step, no framework, no dependencies.

## Run

Serve as static files (fetch requires http:// not file://), e.g.:

```bash
python3 -m http.server 5500
```

Then open in browser, e.g. `http://localhost:5500/index.html?pollId=demo-poll-1`.

## Configuration

`config.js` defines `BACKEND_BASE_URL`, the base URL of simple-voting-backend. Points to a deployed Render URL by default - change to `http://localhost:4000` for local backend development. Loaded before all other scripts in every HTML page.

## Pages

- `index.html` / `main.js` - voter view for a poll. Reads `?pollId=` from URL, renders question + radio options, submits a vote (one-shot, form disables after submit).
- `admin.html` / `admin.js` - poll results view. Takes pollId + admin token (via input fields, pollId can be prefilled from `?pollId=` URL param), fetches `/api/polls/:pollId/results` with `x-admin-token` header, renders a results table with vote counts and percentages.
- `survey.html` / `survey.js` - voter view for a survey. Reads `?surveyId=` from URL. Multi-step wizard: name -> one question per step. Saves progress to backend after each question (upsert by name), so partial completion is preserved. Shows a thank-you screen at the end.
- `survey-admin.html` / `survey-admin.js` - survey responses view. Reads `?surveyId=` from URL, fetches `/api/surveys/:surveyId/responses` (no auth needed), renders a table of all responses, auto-refreshes every 5 seconds.
- `styles.css` - shared styling for all pages.

## URL params

All pages are driven entirely by query string params, no client-side routing:
- `?pollId=<id>` for index.html and admin.html
- `?surveyId=<id>` for survey.html and survey-admin.html

## Notes / gotchas

- `config.js` currently points at `http://localhost:4000` (edited for local dev) - remember to revert to the Render URL before deploying, or keep both lines and comment/uncomment as needed.
- survey-admin.js polls every 5s indefinitely once loaded; no cleanup on page navigation needed since it's a full page reload SPA-free setup, but be aware if adding SPA-style navigation later.
- No auth/session handling anywhere except the admin token header on poll results - it's just typed into a plain input each time, not persisted.
