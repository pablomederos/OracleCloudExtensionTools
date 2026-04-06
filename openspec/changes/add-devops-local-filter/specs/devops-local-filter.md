## ADDED Requirements

### Requirement: DevOps Dialog Local Filtering
Users must be able to filter cached Azure DevOps tasks without further remote API requests by toggling a popover filter UI. 

#### Scenario: Displaying the Local Filter Modal
- **WHEN** the user is viewing the DevOps tasks tab
- **THEN** they should see two new action buttons: `🔎` (Filter) and `🧹` (Clear) near the current `Show To Do` toggle.
- **AND WHEN** the user clicks the Filter `🔎` button
- **THEN** a local HTML `popover` appears allowing filtering by Task ID, Title, Changed Date, and Status.
- **AND THEN** the "Changed Date" input inherits the `min` and `max` constraints from the Start Date and End Date search inputs.

#### Scenario: Debounced Text Filtering
- **WHEN** the user types characters into any local filter text field (Title, Task ID, Status)
- **THEN** a debounce timer of ~300ms initiates.
- **AND WHEN** the timer expires without further keystrokes
- **THEN** the task table automatically cross-filters against the local values, updating the UI accordingly.

#### Scenario: Clearing the Local Filter
- **WHEN** the user clicks the Clear `🧹` button
- **THEN** all filter inputs inside the popover are cleared.
- **AND THEN** the table result reverts back to its unfiltered cached dataset (whilst honoring the "Show To Do" toggle).

#### Scenario: State Persistence
- **WHEN** the user focuses away from the filter popover, causing it to dismiss
- **THEN** the applied filters continue affecting the displayed rows appropriately until they are explicitly cleared.
