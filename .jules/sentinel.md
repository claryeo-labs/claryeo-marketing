## 2026-03-31 - Dot-Notation Config Array Key Traversal
**Vulnerability:** Untrusted route parameters directly interpolated into `config("prefix.{$input}")` allowed arbitrary dot-notation array key traversal into nested configuration arrays.
**Learning:** Laravel's `config()` helper evaluates dot notation in string keys, so passing input containing dots like `invoicing.highlights` navigates into nested keys rather than looking for exact string key matches on top-level configuration.
**Prevention:** Fetch the top-level configuration array via `Config::array('prefix', [])` and perform explicit key validation using `array_key_exists($input, $configArray)` before accessing elements.
