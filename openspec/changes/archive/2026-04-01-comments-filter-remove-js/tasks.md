## 1. Setup

- [x] 1.1 Create `src/styles/comments-filter.js` structure

## 2. Core Implementation

- [x] 2.1 Migrate CSS rules from `src/tasks/comments-filter.js` to `src/styles/comments-filter.js` using the standard `injectFilterStyles()` pattern
- [x] 2.2 Define the static `FILTER_TEMPLATE` string literal in `src/tasks/comments-filter.js`
- [x] 2.3 Refactor `createFilterHTML` to inject `FILTER_TEMPLATE` via `innerHTML` instead of `document.createElement`
- [x] 2.4 Update manifest.json to include `src/styles/comments-filter.js` under `web_accessible_resources`

## 3. Hydration & Testing

- [x] 3.1 Implement hydration logic to bind click events to the statically injected dropdown menu items and main button
- [x] 3.2 Ensure the fallback UI and functionality for filtering by day remain identical
- [x] 3.3 Test opening and closing the comments drawer multiple times to verify no memory leaks or duplicate style injections occur
