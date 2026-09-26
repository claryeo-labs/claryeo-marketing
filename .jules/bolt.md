## 2026-08-22 - O(1) Slug Indexing for Static Dataset Lookup
**Learning:** `SalaryPages::find($slug)` and `SalaryPages::slugs()` executed linear $O(N)$ scans over array items loaded from JSON on every call. Indexing by `slug` in a static `$bySlug` hash map during dataset load converts lookups to $O(1)$ constant time while preserving strict typing for PHPStan level 9.
**Action:** When working with static JSON-backed datasets or lookup helpers, build slug/ID indexed associative maps during initial load rather than searching linearly on demand.

## 2026-08-23 - O(1) Month Label Lookup for Date Formatting
**Learning:** Calling `new Date(y, m).toLocaleDateString()` inside frequent render or tooltip loops incurs huge `Intl.DateTimeFormat` overhead (~9.5s per 100k calls). Static array lookups (`MONTHS[index] + ' ' + y.slice(-2)`) execute in ~34ms per 100k calls (~270x faster) without object instantiation.
**Action:** Replace `toLocaleDateString` in high-frequency React render cycles or chart tooltips with direct array index lookups or string slicing when formatting known date patterns like "YYYY-MM".
