## 1. Implement State Variables

- [x] 1.1 Add a module-level `currentFilterDay` variable to `src/tasks/comments-filter.js` (defaulting to `'All'`)
- [x] 1.2 Modify `createFilterContainer` so clicks on `menuItems` update the `currentFilterDay` variable
- [x] 1.3 Add a module-level `wasPanelOpen` variable inside or alongside `initCommentsFilter` to track panel state

## 2. Re-apply Filter Mechanism

- [x] 2.1 Update the `pollingInterval` loop to detect when the panel transitions from closed `(!wasPanelOpen)` to open 
- [x] 2.2 Trigger `filterComments(currentFilterDay)` when the panel opens to synchronize the fresh comments with the existing filter state
- [x] 2.3 Add logic into the loop to revert `wasPanelOpen` back to `false` when the panel is no longer found
