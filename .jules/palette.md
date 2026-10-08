## 2026-03-30 - Collapsible Control Accessibility
**Learning:** Custom button triggers for expandable lists or details disclosure sections must include `aria-expanded` and `aria-controls` pointing to the collapsible container ID. Without these, assistive technologies cannot inform users whether the region is expanded or controls a target section.
**Action:** Always add `aria-expanded={boolean}`, `aria-controls={containerId}`, and `focus-visible:ring-2` focus indicators to disclosure buttons.

## 2026-03-30 - Toggle Buttons Accessibility State
**Learning:** Toggle button controls (such as Monthly/Annual billing interval switchers) using standard `<button>` tags without ARIA attributes fail to convey selected/pressed state to screen reader users. Adding `aria-pressed={boolean}` explicitly communicates active selection state to assistive technology.
**Action:** When building custom toggle controls or mode switchers, always include `aria-pressed` or appropriate ARIA toggle attributes (`aria-selected`, `aria-checked`).

## 2026-08-22 - Accordion headers and icon button accessibility in interactive islands
**Learning:** Custom collapsible section triggers (such as group summary headers in complex interactive tools) and icon-only action buttons (such as line item removal icons) missing `aria-expanded` and descriptive `aria-label` attributes leave screen reader users unaware of toggle state or button purpose.
**Action:** Always provide `aria-expanded={isOpen}` on collapsible section trigger buttons and contextual `aria-label` attributes on icon-only buttons.

## 2026-08-22 - Mobile Navigation Drawer Accessibility and Focus Ring Indicators
**Learning:** Mobile header menu toggle buttons and dropdown menu triggers without `aria-expanded`, `aria-controls`, and `focus-visible` focus indicators prevent keyboard and screen reader users from identifying expanded drawer regions or tracking keyboard focus on header controls.
**Action:** Ensure navigation toggle buttons specify `aria-expanded`, target `aria-controls` for drawer containers, and include visible `focus-visible:ring-2` focus states.

## 2026-09-30 - Plan Selection Card Focus States & Grouping
**Learning:** Interactive option selection cards (such as plan selection choices in onboarding) implemented as custom buttons require explicit `focus-visible:ring-2` focus indicators and container `role="group"` with descriptive `aria-label`. Without focus visible styling and semantic grouping, keyboard users cannot visually locate active focus and screen readers cannot announce choice options in group context.
**Action:** Always wrap interactive selection card lists in `<div role="group" aria-label="...">` and apply `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` focus ring classes.

## 2026-10-15 - Double-click Editable Triggers Accessibility
**Learning:** Requiring double-click (`onDoubleClick`) on buttons/triggers to activate inline editing renders the action inaccessible to keyboard and screen reader users because native button activation (Enter/Space keys) triggers `onClick`, not `onDoubleClick`.
**Action:** Use single click (`onClick`) for editable text triggers or provide explicit edit icon buttons, and include `focus-visible:ring-2` along with informative `aria-label` instructions (`Click to edit`).

## 2026-11-20 - WAI-ARIA Tablist Keyboard Navigation
**Learning:** Interactive tab controls using `role="tablist"` and `role="tab"` elements require standard arrow key navigation (Left/Right/Up/Down, Home, End) and roving `tabIndex` management (`tabIndex={0}` on active tab, `-1` on inactive tabs). Without keydown event handlers to update selection and move DOM focus, keyboard users are forced to tab through every inactive tab individually.
**Action:** Always attach `onKeyDown` handlers on `role="tab"` buttons that capture arrow keys/Home/End to cycle `active` tab state and explicitly call `focus()` on the newly selected tab element.

## 2026-10-16 - Header Navigation Link Focus Rings
**Learning:** Custom header navigation links, brand logo triggers, and action links in site header bars missing explicit `focus-visible:ring-2` focus indicators prevent keyboard users from tracking keyboard navigation when tabbing through site header links.
**Action:** Always include `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on all interactive header navigation links and brand logo elements.

## 2026-10-16 - Dynamic Multi-Line Form Field Accessibility
**Learning:** Form inputs and select dropdowns inside dynamically added multi-line item cards (such as custom earnings/deductions lists) rendered without visible `<label htmlFor>` tags leave screen reader users without context when tabbing between fields.
**Action:** Always provide contextual `aria-label={`[Field] for ${item.label || '[Default]'}`}` on dynamic list inputs and select dropdowns.
