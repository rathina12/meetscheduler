# Contributing

Contributions to the Meeting Scheduler are welcome.

## Local setup
- Backend: Java 17 and Maven, then `cd backend && mvn test`.
- Frontend: Node.js, then `cd frontend && npm ci && npm run build`.
- Configure local database and application properties without committing secrets.

## What makes a good change
Prefer focused fixes or features around scheduling, authentication, validation, calendar integration, and API correctness. For scheduling changes, test overlapping times, boundary timestamps, authorization, and failure paths.

## Pull request checklist
- [ ] Backend tests pass.
- [ ] Frontend builds successfully.
- [ ] API changes are documented.
- [ ] Time/date behavior and conflict cases are tested.
- [ ] No secrets or local-only configuration are committed.
