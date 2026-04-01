## Context

The Oracle Cloud Tools extension runs within a Single Page Application (SPA). The `comments-filter` component currently injects a dropdown to filter comments by day of the week. Because the comments drawer is dynamically rendered by the SPA, the extension continuously polls for its presence and injects the filter UI when it appears.
Currently, this injection relies heavily on programmatic DOM creation (`document.createElement`) and inline CSS. This makes the code verbose, memory-intensive per render, and mixes the view logic with business logic.

## Goals / Non-Goals

**Goals:**
- Decouple CSS into a separate file (`src/styles/comments-filter.js`).
- Pre-bake the HTML structure into a static string template instead of generating it programmatically.
- Maintain identical business logic and user experience.

**Non-Goals:**
- We are not changing the polling mechanism (`initCommentsFilter`).
- We are not adding new features to the comments filter itself.

## Decisions

**1. Inject `<style>` via dedicated JS file:**
- *Rationale:* Following the pattern established in `src/styles/dialog.js`, we will create `src/styles/comments-filter.js`. This file will contain an exported `injectFilterStyles()` function that appends a `<style>` tag to the document `<head>`. This function will be called once per polling success, with an ID check to guarantee it only injects once per session. This entirely decouples the CSS from the HTML markup and ensures it survives SPA page navigations natively.
- *Alternatives considered:* Generating a literal `.css` file and adding it to `web_accessible_resources`, then doing `<link rel="stylesheet">`. Rejected because the current approach of programmatic CSS injection via a dedicated script (`dialog.js` style) fits the repo's existing patterns perfectly without modifying the manifest or dealing with asynchronous stylesheet loading delays.

**2. Static Template Literal for HTML over localStorage:**
- *Rationale:* We initially considered dynamically generating the HTML once and caching it in `localStorage`. However, the HTML for the days of the week is fundamentally immutable (`Mon`, `Tue`...). Therefore, reading from `localStorage` introduces an unnecessary synchronous I/O operations. A static JS template string (`const FILTER_TEMPLATE = \`<div...>\``) is instantaneously available in memory (`O(1)`), and injecting it via `innerHTML` is cleaner and significantly faster.

## Risks / Trade-offs

- **Risk: DOM Event bindings lost on `innerHTML` replacement.** 
  **Mitigation:** We will ensure that after setting `innerHTML`, we select the newly created nodes (`querySelector`) and attach the Javascript `onclick` event listeners (hydration).
- **Risk: CSP (Content Security Policy) blocking `<style>` injection.**
  **Mitigation:** The extension is already injecting `<style>` tags in `src/styles/dialog.js` inside this environment without issue, so it's a proven pattern.
