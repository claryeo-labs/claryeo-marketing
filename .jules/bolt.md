## 2026-08-22 - O(1) Slug Indexing for Static Dataset Lookup
**Learning:** `SalaryPages::find($slug)` and `SalaryPages::slugs()` executed linear $O(N)$ scans over array items loaded from JSON on every call. Indexing by `slug` in a static `$bySlug` hash map during dataset load converts lookups to $O(1)$ constant time while preserving strict typing for PHPStan level 9.
**Action:** When working with static JSON-backed datasets or lookup helpers, build slug/ID indexed associative maps during initial load rather than searching linearly on demand.

## 2026-08-22 - Memoization of Shared Presentation Accordions Across Interactive Islands
**Learning:** Shared presentation components such as `FaqSection` and `FaqAccordion` rendered at the bottom of interactive pages (e.g. `TaxCalculatorPage`) re-render on every state update or keystroke unless wrapped with `React.memo()`.
**Action:** Wrap purely prop-driven, heavy static presentation trees in `React.memo()` when consumed within highly interactive parent components.
## 2026-09-02 - Module-Level Intl.NumberFormat Instance Caching
**Learning:** Calling `Number.prototype.toLocaleString()` inside hot utility functions like `formatCurrency()` repeatedly parses locale options and instantiates internal `Intl.NumberFormat` objects on every call, creating unnecessary CPU work and garbage collection churn during interactive UI re-renders.
**Action:** Pre-instantiate static `Intl.NumberFormat` instances at module scope for common locales (`en-NG`, `en-US`) and reuse them via `.format(amount)`.
## 2026-09-02 - Static Key Map Caching and Early Return for Attribution Middleware
**Learning:** `CaptureUtmParameters::extractAndNormalize()` ran on every web request, executing `array_flip(self::ALL_KEYS)` and `array_intersect_key()` even for clean requests with empty query strings. Adding an early return `$values === []` bypasses array processing for non-query requests, and static caching `self::$flippedKeys ??= array_flip(self::ALL_KEYS)` eliminates redundant array key flipping across middleware invocations.
**Action:** In global or web-group middleware, check for empty parameter arrays early and statically cache constant key lookup maps to minimize allocations per request.
## 2026-08-23 - O(1) Month Label Lookup for Date Formatting
**Learning:** Calling `new Date(y, m).toLocaleDateString()` inside frequent render or tooltip loops incurs huge `Intl.DateTimeFormat` overhead (~9.5s per 100k calls). Static array lookups (`MONTHS[index] + ' ' + y.slice(-2)`) execute in ~34ms per 100k calls (~270x faster) without object instantiation.
**Action:** Replace `toLocaleDateString` in high-frequency React render cycles or chart tooltips with direct array index lookups or string slicing when formatting known date patterns like "YYYY-MM".

## 2026-10-01 - Encapsulation of High-Frequency Timer State in Subcomponents
**Learning:** High-frequency intervals (e.g. an 85ms typewriter cycle running ~11.7 Hz) placed at the root level of large container components like `LandingHero` trigger re-renders of the entire container tree and all child elements every tick. Encapsulating the animated state and interval inside a dedicated leaf subcomponent (`TypewriterWord`) isolates state updates and eliminates re-renders of parent JSX trees.
**Action:** Isolate high-frequency interval or animation state into dedicated leaf subcomponents rather than declaring state at container scope.

## 2026-10-02 - State Guarding in Scroll Handlers and Document Computation Memoization
**Learning:** Calling `setState` directly on every native scroll event (e.g. `setScrolled(window.scrollY > 32)`) dispatches React state update checks on every single scroll frame (~60-120 Hz). Tracking local threshold state in closure variables prevents invoking `setState` except when crossing threshold boundaries. Furthermore, in scroll-driven components like `LegalDocumentPage`, active section changes trigger re-renders; memoizing document computations (`deriveToc`, string replacements, date formatting) prevents executing regexes over large text bodies on every scroll section update.
**Action:** Guard `setState` calls in scroll event listeners with local threshold comparisons, and memoize string/regex parsing in components with scroll-driven state updates.
