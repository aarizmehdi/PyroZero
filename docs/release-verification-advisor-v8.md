# Advisor request lifecycle — 15 November 2026

No result panels, evidence map, connected records, method notes, or prefilled query appear before a question is sent. Blank sends are disabled. Editing/clearing the question clears previous results. Provider/method badges are removed; settings and response labels use plain language.

Submitting clears previous data and shows animated skeleton panels with an accessible progress status. The question, starter prompts and settings are locked while the request is active. Stop remains available. Successful completion scrolls/focuses the answer start. Failed, interrupted or truncated responses discard result data and show a retry/settings state. Stopped and stale responses cannot become a ready answer.

API-key settings use a hydration-safe browser store, confirmation messaging, reload persistence, and cross-tab updates. An invalid/failed provider request does not erase the saved key. The UI distinguishes saved configuration from remote key validation. Backend/provider contracts, physical calculations and retrieval data are unchanged.

Verification: production build, TypeScript, ESLint,121 tests and32 module/theme/viewport checks passed. Additional headless lifecycle checks used delayed provider fixtures to verify skeletons, input locking, duplicate sends, persistence across reload, success/auto-scroll/focus, credential failure, retry, Stop/stale-response rejection and incomplete-stream rejection. The actual local reference endpoint was also exercised. Provider fixtures are test data only; no live provider success is claimed.

Screenshots show idle, pending, ready, error, desktop and mobile states. Machine-readable results are in advisor-flow-results.json and browser-results-v8.json.
