# Repository Guidelines

## Project Structure & Module Organization
This repo currently contains a single spec file: `updated prompt.txt` in the root. When implementing the app, keep the web entrypoint at the root (for example `index.html`) unless a `src/` directory is introduced. If you add assets (icons, screenshots), place them under `assets/` and reference them with relative paths.

## Build, Test, and Development Commands
There is no build system configured yet. For local development once an `index.html` exists, a simple static server is sufficient:
- `npx serve` — serves the repository root for local testing.
If you add a build tool (e.g. Vite), document the exact commands in this section.

## Coding Style & Naming Conventions
Match the formatting of existing files. If you introduce new HTML/CSS/JS, prefer:
- 2-space indentation and consistent spacing.
- Kebab-case for filenames (e.g. `golf-score.js`) and CSS class names.
- Short, descriptive function names in English (e.g. `computeGolfScore`).
Use plain HTML/CSS/vanilla JS unless the repository explicitly adopts a framework.

## Testing Guidelines
No test framework is configured. If you add tests:
- Place them under `tests/` and name them `*.test.js`.
- Document the runner and commands here (for example `npm test`).

## Commit & Pull Request Guidelines
Commit messages in history are short, imperative, and sentence case (e.g. “Create updated prompt”). Keep that style.
Pull requests should include:
- A brief summary of changes and reasoning.
- Links to relevant issues or specs (like `updated prompt.txt`).
- Screenshots/GIFs for UI changes when applicable.

## Configuration & Notes
Keep project-level instructions in the root for easy discovery. If you add environment-specific settings, document defaults and safe values in this file or a `README.md`.
