# Comments Filter

## Requirements

### Requirement: DOM-Based Filter Injection
The extension must inject the comments filter into the drawer header based on the header's continuous presence in the DOM rather than a click event.

#### Scenario: User opens the comments drawer
- **WHEN** the comments drawer header (`querySelectors.commentsDrawerHeader`) becomes available in the DOM
- **THEN** the extension reliably detects it within max 500ms and injects the filter UI
- **AND** the filter UI is not injected multiple times if it already exists

#### Scenario: Comments drawer is closed and reopened
- **WHEN** the user closes the drawer and it gets removed from the DOM, and later reopens it
- **THEN** the extension detects the new header element and injects the filter UI correctly
