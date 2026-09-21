## 2026-03-29 - Restrict dynamic config lookup to top-level keys
**Vulnerability:** Interpolating route parameter `$slug` directly into `config("feature_pages.{$slug}")` enabled dot-notation array key traversal into nested config structures, causing 500 errors when sub-keys were requested.
**Learning:** Laravel's `config()` helper parses dots as array traversal paths. Passing untrusted input to `config()` allows accessing nested data structures unexpectedly.
**Prevention:** Fetch the top-level array using `Config::array()` and use `array_key_exists($slug, $array)` to strictly validate keys before access.
