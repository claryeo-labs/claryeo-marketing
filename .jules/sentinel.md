## 2026-03-30 - Route Parameter Input Validation for Session Keys
**Vulnerability:** Unsanitized route parameter string `$id` interpolated directly into session key (`blog_viewed_'.$id`) and passed into tracking operations.
**Learning:** Publicly accessible endpoints accepting arbitrary string parameters can be exploited for session key pollution or unexpected inputs if string length and character set are not bounded.
**Prevention:** Validate route parameters for strict character sets (`/^[a-zA-Z0-9\-_]+$/`) and maximum length before checking session or querying models, and pass validated canonical model IDs (`$entry->id()`) to persistence methods.

## 2026-03-30 - Waitlist Proxy Input Validation Avoidance
**Vulnerability:** Attempted local input validation on same-origin proxy endpoint (`WaitlistController::store`).
**Learning:** The proxy relays response bodies verbatim from the main app's internal API, which uses `{ detail }` error responses expected by the waitlist UI island. Adding local Laravel validation returns `{ message, errors }`, breaking frontend error display.
**Prevention:** Do not duplicate full validation in same-origin proxy controllers if the upstream API owns validation and uses custom error response shapes (`{ detail }`). Rely on the main app's internal API validation for payload rules and response formatting.
