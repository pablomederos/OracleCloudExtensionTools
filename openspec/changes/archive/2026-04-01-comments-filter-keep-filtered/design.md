## Context

Oracle Cloud reconstructs the DOM inside the comments panel dynamically. When reopening the previously initialized panel or as it handles lazy loading / scrolling, it renders the raw DOM nodes (comments) without our previously applied CSS classes (`.hidden`). However, our specific node `#commentsDayFilter` remains initialized because it's inserted directly alongside the drawer's header which persists across simple hide/show toggles. The filter retains its state ("Day: Mon"), but the comments do not reflect it.

## Goals / Non-Goals

**Goals:**
- Visually synchronize the actual content of the list with the selected filter dynamically.
- Implement Option A: Leverage the existing polling interval.

**Non-Goals:**
- We are not implementing a `MutationObserver` right now, prioritizing speed, simplicity, and leveraging the existing interval without adding complex lifecycle management hooks.

## Decisions

**1. Re-apply the filter continuously instead of observing mutations**
- *Rationale:* Since `initCommentsFilter` maintains a `setInterval(..., 500)`, we are already querying the DOM. If our `#commentsDayFilter` element exists, we will simply execute the standard `filterComments()` routine with the internally preserved `currentDayFilter` state string. This applies the filter twice a second over the comments list, hiding newly rendered elements instantaneously and ensuring old ones stay hidden when the panel is reopened.
- *Alternatives considered:* We discussed implementing a `MutationObserver` on the list wrapper or resetting the filter on close. `MutationObserver` requires DOM lifecycle tracking to disconnect when the panel actually unmounts totally to avoid leaks, and resetting the filter state on unmount creates a bad UX if the user opens and closes panels quickly. Option A provides the most robust state retention.

## Risks / Trade-offs

- **Risk: Re-filtering DOM nodes that are already filtered consumes CPU.** 
  - *Trade-off:* Iterating over a small subset of DOM elements every 500ms using a `classList.add`/`.remove` operation is extremely lightweight relative to the entire V8 runtime baseline and negligible across modern machines, therefore avoiding the overengineering of `MutationObserver` is a worthwhile trade.
