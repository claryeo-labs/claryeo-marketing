## 2026-03-30 - Route Parameter Input Validation for Session Keys
**Vulnerability:** Unsanitized route parameter string `$id` interpolated directly into session key (`blog_viewed_'.$id`) and passed into tracking operations.
**Learning:** Publicly accessible endpoints accepting arbitrary string parameters can be exploited for session key pollution or unexpected inputs if string length and character set are not bounded.
**Prevention:** Validate route parameters for strict character sets (`/^[a-zA-Z0-9\-_]+$/`) and maximum length before checking session or querying models, and pass validated canonical model IDs (`$entry->id()`) to persistence methods.

## 2026-03-31 - Isolate Host Rewriting to Host Header in Middleware
**Vulnerability:** Global string replacement (`str_replace('://www.', '://', $url)`) on full URLs during canonical domain redirection.
**Learning:** Operating global string replacements across full URLs (scheme + host + path + query string) mangles embedded URLs in query string parameters or paths.
**Prevention:** Parse or slice the canonical host directly from `$request->getHost()` (e.g. `substr($host, 4)`) and construct `$target = $request->getScheme().'://'.$canonicalHost.$request->getRequestUri()` to leave path and query parameters untouched.
