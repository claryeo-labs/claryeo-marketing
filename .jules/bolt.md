## 2026-08-22 - O(1) Slug Indexing for Static Dataset Lookup
**Learning:** `SalaryPages::find($slug)` and `SalaryPages::slugs()` executed linear $O(N)$ scans over array items loaded from JSON on every call. Indexing by `slug` in a static `$bySlug` hash map during dataset load converts lookups to $O(1)$ constant time while preserving strict typing for PHPStan level 9.
**Action:** When working with static JSON-backed datasets or lookup helpers, build slug/ID indexed associative maps during initial load rather than searching linearly on demand.

## 2026-09-02 - Module-Level Intl.NumberFormat Instance Caching
**Learning:** Calling `Number.prototype.toLocaleString()` inside hot utility functions like `formatCurrency()` repeatedly parses locale options and instantiates internal `Intl.NumberFormat` objects on every call, creating unnecessary CPU work and garbage collection churn during interactive UI re-renders.
**Action:** Pre-instantiate static `Intl.NumberFormat` instances at module scope for common locales (`en-NG`, `en-US`) and reuse them via `.format(amount)`.
## 2026-09-02 - Static Key Map Caching and Early Return for Attribution Middleware
**Learning:** `CaptureUtmParameters::extractAndNormalize()` ran on every web request, executing `array_flip(self::ALL_KEYS)` and `array_intersect_key()` even for clean requests with empty query strings. Adding an early return `$values === []` bypasses array processing for non-query requests, and static caching `self::$flippedKeys ??= array_flip(self::ALL_KEYS)` eliminates redundant array key flipping across middleware invocations.
**Action:** In global or web-group middleware, check for empty parameter arrays early and statically cache constant key lookup maps to minimize allocations per request.
## 2026-08-23 - O(1) Month Label Lookup for Date Formatting
**Learning:** Calling `new Date(y, m).toLocaleDateString()` inside frequent render or tooltip loops incurs huge `Intl.DateTimeFormat` overhead (~9.5s per 100k calls). Static array lookups (`MONTHS[index] + ' ' + y.slice(-2)`) execute in ~34ms per 100k calls (~270x faster) without object instantiation.
**Action:** Replace `toLocaleDateString` in high-frequency React render cycles or chart tooltips with direct array index lookups or string slicing when formatting known date patterns like "YYYY-MM".
