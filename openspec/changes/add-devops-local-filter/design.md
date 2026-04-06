## Context

The extension fetches Azure DevOps tasks and displays them in a table based on user-selected "Start Date" and "End Date". The dataset can get large depending on the date range, and the current UI lacks an inline method to quickly find a particular task by title, ID, or specific state, forcing users to make additional network calls or lose time scrolling.

## Goals / Non-Goals

**Goals:**
- Provide instant local filtering over the loaded data using `sessionStorage`.
- Make it accessible without reloading the results.
- Incorporate a clean, invisible UI footprint until invoked using an HTML popover.
- Keep standard extension logic and CSS requirements simple.

**Non-Goals:**
- Calling Azure DevOps APIs to perform these secondary local filters.
- Re-architecting the caching mechanism of the extension.

## Decisions

- **Popover API Structure**: We chose the native HTML `popover` attribute to show/hide the advanced filters. This prevents us from writing boilerplate JavaScript for tracking outside-clicks and absolute positioning logic.
- **Trigger Icons**: We decided on the magnifying glass emoji (`🔎`) for showing the popover, and the broom emoji (`🧹`) for clearing filters. They will be placed near the "Show To Do" toggle within the generic control container.
- **Dynamic Status Select**: The Status filter will be an HTML `<select>` element. Its options will be dynamically populated based on the distinct status states found in the currently loaded `workItems`, preventing invalid free-text searches.
- **Match Highlighting**: When the user types in the Title filter, matching substring portions within the task titles will be visually highlighted in the results table rendering using `<mark>` tags or specific CSS highlighting (`::target-text` included as CSS characteristic).
- **Debounced Input**: Instead of forcing the user to press a secondary "Search" button for the popup filter, we will bind `input` events with a ~300ms debounce to automatically trigger `renderTable()` with active filters.
- **Date Inputs Constraint**: To ensure logic consistency, the `min` and `max` limits for the filter's "Changed Date" target will mirror the top-level main "Start Date" and "End Date" query selectors.
- **Combined Filters**: The updated `renderTable` algorithm will logically AND local filters (Title, Task ID, Date, Status) and the preexisting "Show To Do" filter.

## Risks / Trade-offs

- **Risk**: None related to performance. The dataset typically filters tasks for a specific user within a daily range (usually yielding 10 to 15 tasks), with an absolute maximum of around 500 tasks per week. This small volume makes local filtering extremely fast, and debouncing provides a smooth UX.
- **Trade-off**: Using the native HTML `popover` API offers great simplicity without third-party libraries, but lacks out-of-the-box styling. *Mitigation*: We will write custom CSS for the popover element so that it perfectly matches the established design system and aesthetics of the other existing elements in the extension.
