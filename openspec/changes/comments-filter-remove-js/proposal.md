## Why

Generating HTML dynamically via JavaScript with `document.createElement` and loops in the `comments-filter` component is inefficient and makes the code difficult to maintain by mixing view logic with business logic. The CSS styles are also mixed with the JS structure. In this high-frequency SPA extension (where DOM elements might be repeatedly mounted/unmounted), an initial static string template assignment is much faster and cleaner. 

## What Changes

1. **Decouple CSS**: The inline/inline-JS styles from `comments-filter` will be migrated to a dedicated file `src/styles/comments-filter.js` which injects a `<style>` block in the head once per session.
2. **Static Template HTML**: The creation of DOM elements inside `src/tasks/comments-filter.js` will stop using programmatic DOM instantiation and will adopt a hardcoded static template string (`FILTER_TEMPLATE`); the days of the week (`Mon`, `Tue` etc.) are static and do not need dynamic array mapping.
3. This creates a highly performant O(1) rendering cycle.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. This is purely a structural and architectural performance refactor. The behavior remains identical.

## Impact

- **Affected code**: `src/tasks/comments-filter.js` will be heavily refactored.
- **New code**: `src/styles/comments-filter.js` will be created to contain the styles.
