## 2026-08-22 - O(1) Slug Indexing for Static Dataset Lookup
**Learning:** `SalaryPages::find($slug)` and `SalaryPages::slugs()` executed linear $O(N)$ scans over array items loaded from JSON on every call. Indexing by `slug` in a static `$bySlug` hash map during dataset load converts lookups to $O(1)$ constant time while preserving strict typing for PHPStan level 9.
**Action:** When working with static JSON-backed datasets or lookup helpers, build slug/ID indexed associative maps during initial load rather than searching linearly on demand.

## 2026-09-02 - Static Key Map Caching and Early Return for Attribution Middleware
**Learning:** `CaptureUtmParameters::extractAndNormalize()` ran on every web request, executing `array_flip(self::ALL_KEYS)` and `array_intersect_key()` even for clean requests with empty query strings. Adding an early return `$values === []` bypasses array processing for non-query requests, and static caching `self::$flippedKeys ??= array_flip(self::ALL_KEYS)` eliminates redundant array key flipping across middleware invocations.
**Action:** In global or web-group middleware, check for empty parameter arrays early and statically cache constant key lookup maps to minimize allocations per request.
