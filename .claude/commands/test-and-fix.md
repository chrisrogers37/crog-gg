---
description: "Run tests and fix any failures"
---

1. Run the test suite from the frontend directory:
   - `cd frontend && npm run test:run` for unit tests
   - Optionally run `npm run test:e2e` for E2E tests
2. If all tests pass, report success
3. If tests fail:
   - Analyze each failure carefully
   - Identify the root cause (is it the test or the implementation?)
   - Fix the issue
   - Re-run tests to verify the fix
   - Repeat until all tests pass

Be methodical: fix one test at a time and verify before moving to the next.
