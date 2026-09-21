## 2026-08-22 - O(1) Slug Indexing for Static Dataset Lookup
**Learning:** `SalaryPages::find($slug)` and `SalaryPages::slugs()` executed linear $O(N)$ scans over array items loaded from JSON on every call. Indexing by `slug` in a static `$bySlug` hash map during dataset load converts lookups to $O(1)$ constant time while preserving strict typing for PHPStan level 9.
**Action:** When working with static JSON-backed datasets or lookup helpers, build slug/ID indexed associative maps during initial load rather than searching linearly on demand.

## 2026-09-22 - Static Map Memoization for Middleware Key Truncation
**Learning:** `CaptureUtmParameters::extractAndNormalize()` called `array_flip(self::ALL_KEYS)` on every middleware pass and parameter resolution call, creating redundant array allocations in memory. Caching the flipped key lookup map in a static property (`self::$flippedKeys ??= array_flip(...)`) converts runtime array creation into $O(1)$ static memory access.
**Action:** For hot-path middleware or request helpers operating on fixed class constant arrays, memoize pre-flipped lookup maps in static properties.
