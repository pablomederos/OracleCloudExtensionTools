## Why
When the comments sidebar is closed and reopened in the Oracle Cloud SPA, the comments components are unmounted and regenerated. However, our extension's filter container is kept alive (not destroyed). As a result, when the new comments are injected by the SPA, they are shown without the `hidden` class, but the user's filter UI still shows the previously selected day. This leads to an inconsistent visual state.

## What Changes
We will maintain the state of the user's filter choice (e.g. "Day: Wed") and re-apply the filter immediately when the panel is reopened. This keeps the comments list synchronized with the existing filter button.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None.

## Impact
- `src/tasks/comments-filter.js`: We will add state-tracking logic to the existing `pollingInterval` to detect when the panel transitions from closed to open, storing the current choice in memory to trigger `filterComments()` on reopen.
