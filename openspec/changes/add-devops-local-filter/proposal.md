## Why

The DevOps dialog fetches tasks from Azure DevOps and displays them in a table. However, there is no way for the user to filter these retrieved results locally without making another API request. Adding a local filter will allow users to quickly refine what they are seeing in the cached list, making searches by Title, Task ID, Status, or exact Changed Date much more responsive and efficient.

## What Changes

- Add a new "Filter" button (🔎) to the DevOps dialog's tasks tab that uses the native HTML `popover` API to show a local filtering popup.
- Add a new "Clear" button (🧹) to reset the local filters.
- Build a popover modal containing inputs for Title, Task ID, Changed Date, and a Status `<select>` that dynamically populates based on available states in the results, avoiding free text.
- Highlight the matching portion of the task Title in the table results when filtering by Title (e.g., wrapping highlights in a `<mark>` tag or applying specific CSS).
- The Date input inside the popover will be constrained by the Start Date and End Date from the main search area.
- Add debounce filtering logic (`keyup`/`input` tracking) out of the popover inputs.
- Read from `sessionStorage` task cache and update the `renderTable` logic in `azure-devops-dialog.js` to intersectionally apply these new local filters alongside the existing "Show To Do" toggle.

## Capabilities

### New Capabilities
- `devops-local-filter`: Local filtering of the cached loaded tasks in the DevOps dialog UI.

### Modified Capabilities
- `<existing-name>`: 

## Impact

- **UI**: `src/tasks/templates/tasks-tab.html` gets new controls (2 buttons) and the HTML `<div popover>`.
- **Logic**: `src/tasks/azure-devops-dialog.js` will include the debouncing logic and expanded logic within `renderTable`.
- **API**: Unaffected.
- **Dependencies**: Unaffected.
