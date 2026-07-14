---
title: Add minimal route stubs for frontend endpoints to prevent 404s
---

This pull request adds temporary route stubs to the backend so the frontend stops receiving 404 responses while the full backend handlers are implemented.

Files added:

- backend/src/routes/meters.js
- backend/src/routes/transactions.js
- backend/src/routes/ota.js
- backend/src/routes/p2p.js
- backend/src/routes/reversal.js
- backend/src/routes/itvm.js
- Updated backend/src/server.js to mount the new route handlers

Notes:
- These are intentionally minimal JSON-returning stubs. They do not perform database writes or business logic.
- After merging, monitor production logs and replace stubs with real implementations.
