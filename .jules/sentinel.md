## 2026-03-30 - Route Parameter Input Validation for Session Keys
**Vulnerability:** Unsanitized route parameter string `$id` interpolated directly into session key (`blog_viewed_'.$id`) and passed into tracking operations.
**Learning:** Publicly accessible endpoints accepting arbitrary string parameters can be exploited for session key pollution or unexpected inputs if string length and character set are not bounded.
**Prevention:** Validate route parameters for strict character sets (`/^[a-zA-Z0-9\-_]+$/`) and maximum length before checking session or querying models, and pass validated canonical model IDs (`$entry->id()`) to persistence methods.
