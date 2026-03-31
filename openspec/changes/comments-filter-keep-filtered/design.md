## Context
When the Oracle Cloud SPA comments sidebar is closed, the main drawer header is hidden, and the comment `<li>` items are destroyed/reset. When reopened, the sidebar is populated with fresh, unfiltered comments. Since our extension uses a polling interval, and our UI filter wrapper persists, the UI filter button persists with its visual state unchanged ("Day: Mon"), but the newly injected comments are no longer filtered.

## Goals / Non-Goals
**Goals:**
- Automatically re-apply the previous filter logic when the comments sidebar reveals itself again.
- Keep the solution lightweight and avoid adding a `MutationObserver` since lazy-loading isn't present.

**Non-Goals:**
- We are not resetting the UI. The user's intent is respected.

## Decisions

**Tracker Variables in Polling:**
- *Rationale:* Since the extension already checks every 500ms for `commentsDrawerHeader`, we can add a simple state machine: `let wasPanelOpen = false`.
- If the header is found, but `wasPanelOpen` is false, it means a Open transition occurred. We set it to true and immediately call `filterComments(currentFilterDay)` (which we will track globally).
- If the header is NOT found, but `wasPanelOpen` is true, we set it to false.
- *Alternatives Considered:* Re-applying the filter unconditionally every 500ms. Rejected due to wasting CPU cycles by continuously querying and looping through the DOM.

## Risks / Trade-offs
- **Risk:** Timing mismatches. The SPA might inject the new comment items asynchronously slightly *after* the header reappears.
  **Mitigation:** If this happens, we could add a short delay `setTimeout` or a tiny observer on just that event. However, typically Oracle Cloud renders the drawer contents concurrently, so the synchronous approach via polling should be sufficient.
