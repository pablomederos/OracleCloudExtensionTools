## 1. Setup

- [x] 1.1 Declare a module-scoped variable `let currentDayFilter = 'All'` in `src/tasks/comments-filter.js` to track the current state.

## 2. Core Implementation
- [x] 2.1 Update the `item.onclick` function inside `createFilterContainer()` to store the selected day to `currentDayFilter` every time a user changes the filter.
- [x] 2.2 Modify `injectFilterUI()` so instead of simply returning `if (document.getElementById('commentsDayFilter'))`, it invokes `filterComments(currentDayFilter)` before returning early, reapplying the active filter immediately when polled by the 500ms heartbeat.

## 3. Hydration & Testing

- [x] 3.1 Verify closing the comments panel and reopening retains the selected day on the button and successfully refilters the SPA's reconstructed DOM nodes.
- [x] 3.2 Ensure scrolling down (which triggers SPA lazy-loading of newer comments) correctly hides them according to the retained filter.
