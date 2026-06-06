# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Static personal portfolio site for Luis Tomás La Madrid (HTML/CSS/JS). No build step, package manager, or backend. A second microsite lives under `minisitio/`.

### Services

| Service | Required | Start command | URL |
|---------|----------|---------------|-----|
| Static file server | Yes | `cd /workspace && python3 -m http.server 8000` | http://localhost:8000/ |

Run the server in a tmux session if it should stay up across commands. Only one process is needed; it serves both the main site and `minisitio/`.

### Lint / test / build

There is no configured linter, test suite, or build pipeline. Validation is manual: start the server and open pages in a browser (or `curl` for HTTP 200 checks).

### External runtime dependencies

- **Internet** is required for Google Fonts, jQuery CDN, and Google Drive media embeds on `index.html` and `av1.html`.
- **Known quirk:** `av1.html` references `css/main.css`, which is not in the repo; that page may have incomplete styling.

### Key pages to smoke-test

- http://localhost:8000/ — main portfolio
- http://localhost:8000/web.html — design & web gallery
- http://localhost:8000/av1.html — audiovisual detail
- http://localhost:8000/minisitio/index.html — microsite
