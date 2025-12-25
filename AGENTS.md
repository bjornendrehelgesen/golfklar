# Repository Guidelines

## Project Structure & Module Organization
This repository is a static webapp. Key files:

- `index.html`: Page markup and layout.
- `styles.css`: Visual styling, layout, and animations.
- `app.js`: Client-side logic (geolocation, course search, weather fetch, i18n).
- `promt.txt`: Product requirements and design notes.
- `LICENSE`: Project license.

If you add more features later (maps, notifications), keep new assets grouped in a clear top-level folder (for example, `assets/`) and document any new directories here.

## Build, Test, and Development Commands
This is a static site with no build step. For local development, run a simple static server from the repo root:

- `python3 -m http.server 8000`: serve the site at `http://localhost:8000`.

## Coding Style & Naming Conventions
Keep the codebase lightweight and readable:

- Indentation: 2 spaces.
- Files: plain HTML/CSS/JS; avoid build tooling unless needed.
- Naming: `kebab-case` for CSS classes, `camelCase` for JS functions.
- Language strings: keep Norwegian/English copy in `app.js` and reuse keys.

## Testing Guidelines
No automated tests are configured. If you add tests later, document the framework, file locations, and naming conventions here.

## Commit & Pull Request Guidelines
No commit message conventions or PR requirements are recorded in this repository. If you establish a standard, document it here (for example, Conventional Commits like `feat:`, `fix:`), along with PR expectations such as linked issues, screenshots for UI changes, and a brief testing note.

## Configuration & Secrets
This app uses public APIs (met.no, OpenStreetMap/Overpass) and does not require API keys. If you add providers that require keys, keep secrets out of the repo and document required environment variables here.
