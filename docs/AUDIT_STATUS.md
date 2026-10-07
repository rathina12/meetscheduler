# MeetScheduler audit status (2026-10-08)

## Changes made
- Enforced organizer/invitee authorization for individual meeting reads.
- Prevented strangers from adding themselves as participants through RSVP.
- Enforced notification ownership for single-item read updates.
- Added time interval validation on create and update.
- Rejects an edit that overlaps a separate existing meeting.
- Displays rescheduled meetings in upcoming results.
- Added JUnit Mockito regression cases for the above meeting behavior.
- Improved responsive visual system and dashboard error handling.
- Replaced simulated external calendar synchronization with downloadable iCalendar export; fake token generation and fake success are disabled.

## Verification limits
GitHub repository content was inspected through an authenticated GitHub connector. The execution container could not clone GitHub because DNS resolution failed. Maven, npm, MySQL, OAuth, Docker Compose, and full UI browser tests were **not run** in this environment. The new JUnit tests have been committed but have not been executed. This is not a certified production release.

## Remaining high-priority engineering work
1. End-to-end compile/build and unit/integration test execution in CI.
2. Atomic scheduling conflict prevention under concurrent requests (transaction locking or DB-backed constraints).
3. Reliable reminder deduplication, retry/backoff and persistent delivery state.
4. Time-zone-safe persisted meeting instants and correctly interpreted iCalendar exports.
5. Secure Google OAuth 2.0 authorization code + PKCE/state/token storage, actual calendar API integration (or remove unused integration scaffolding).
6. Refresh token lifecycle/revocation, WebSocket authorization, rate limiting and security regression tests.
7. Recurrence edits/deletions and cancellation semantics, including individual instances.
8. Password reset flow, API request validation and malformed payload handling.
9. Production configuration, migrations, observability, backup/restore, load testing and accessibility testing.
10. Remove obsolete dependencies and unreferenced code only after complete dependency graph and build verification.

## Suggested local checks
```bash
cd backend
mvn test
mvn -DskipTests package
cd ../frontend
npm ci
CI=true npm run build
```

Do not merge into `main` until these checks and integration scenarios have passed.
