## 2026-03-30 - Route Parameter Input Validation for Session Keys
**Vulnerability:** Unsanitized route parameter string `$id` interpolated directly into session key (`blog_viewed_'.$id`) and passed into tracking operations.
**Learning:** Publicly accessible endpoints accepting arbitrary string parameters can be exploited for session key pollution or unexpected inputs if string length and character set are not bounded.
**Prevention:** Validate route parameters for strict character sets (`/^[a-zA-Z0-9\-_]+$/`) and maximum length before checking session or querying models, and pass validated canonical model IDs (`$entry->id()`) to persistence methods.

## 2026-03-31 - Isolate Host Rewriting to Host Header in Middleware
**Vulnerability:** Global string replacement (`str_replace('://www.', '://', $url)`) on full URLs during canonical domain redirection.
**Learning:** Operating global string replacements across full URLs (scheme + host + path + query string) mangles embedded URLs in query string parameters or paths.
**Prevention:** Parse or slice the canonical host directly from `$request->getHost()` (e.g. `substr($host, 4)`) and construct `$target = $request->getScheme().'://'.$canonicalHost.$request->getRequestUri()` to leave path and query parameters untouched.

## 2026-04-01 - Avoid Redundant In-Memory Route Parameter Length Caps
**Vulnerability:** Attempted in-controller length cap on changelog slug route parameter.
**Learning:** Adding redundant `strlen($slug)` caps in controller actions when route parameters are compared solely in-memory against array entries is unnecessary because Nginx caps request URI length and array comparison naturally returns 404.
**Prevention:** Rely on route constraints or web server URI limits for read-only parameter comparisons; avoid duplicate controller checks unless parameter is forwarded to external APIs or interpolated into session/database keys.
