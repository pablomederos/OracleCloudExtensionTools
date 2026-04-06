## 1. UI Updates (HTML & CSS)

- [x] 1.1 In `src/tasks/templates/tasks-tab.html`, add the "Filter" `🔎` button with `popovertarget="localFilterPopover"` and the "Clear" `🧹` button in the `.controls` section.
- [x] 1.2 In the same file, add the `<div id="localFilterPopover" popover>` block containing the input fields (Task ID, Title, Changed Date, Status).

## 2. Logic Implementation (JavaScript)

- [x] 2.1 In `src/tasks/azure-devops-dialog.js`, implement a dynamic update mapping where changing `startDate` or `endDate` also updates `min` and `max` respectively on the popover's `Changed Date` input field.
- [x] 2.2 In `createTasksContent`, wire up an `oninput` (with a ~300ms debounce) for the inputs inside the local filter popover that calls `renderTable()`.
- [x] 2.3 Implement the `onclick` handler for the clear `🧹` button to reset the popover inputs and instantly call `renderTable()`.

## 3. Filtration Engine Update

- [x] 3.1 In the `renderTable` function of `azure-devops-dialog.js`, update the `workItems.filter` logic. It should read the current values of the popover inputs (if any) and logically AND them with the preexisting `showToDo` logic.
- [x] 3.2 Ensure string comparisons (Title, Status, ID) are case-insensitive and allow partial matching where applicable.
- [x] 3.3 Add logic into `renderTable` (or a helper function triggered when the data loads) to dynamically extract all unique status values from `workItems` and populate the `<select>` Status dropdown options.
- [x] 3.4 In `renderTable`, when rendering the `tr` rows, if there is an active local Title filter, inject a `<mark>` tag wrapper around the matching substring within the title string before assigning it to the row's innerHTML/textContent.
