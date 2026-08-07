# BookNest agent instructions

These instructions apply to the entire repository unless a more specific `AGENTS.md` adds instructions for a subdirectory.

## Working approach

- Prefer small, incremental changes that are easy to review and verify.
- Explain important backend decisions briefly, including why the chosen approach fits BookNest.
- Do not change the approved architecture or domain lifecycle without explicit user approval.
- Avoid unrelated refactors, formatting churn, dependency changes, and speculative abstractions.
- Preserve existing user work and inspect the worktree before editing overlapping files.
- Run relevant tests and lint checks for every touched area. If a check cannot run, state why.
- Keep documentation synchronized when approved behavior or contracts change.

## Approved architecture boundaries

- Use a modular monolith, not microservices.
- Keep the Angular web application and NestJS API as separate applications in one monorepo.
- Use PostgreSQL as the source of truth for availability and concurrency.
- Keep controllers thin; put business rules and state transitions in backend services or use cases.
- Validate all external input at the API boundary.
- Do not expose database entities directly as frontend contracts.
- Use server-side sessions in secure, HTTP-only cookies for administrator authentication unless an alternative is explicitly approved.

## Reservation invariants

- A successful reservation immediately moves a book from `AVAILABLE` to `RESERVED`; there is no approval or pending state.
- Every reservation requires both `requesterName` and `telegramUsername`.
- At most one active reservation may exist for a book.
- Concurrent attempts for the same available book must yield exactly one success; losing attempts return HTTP `409 Conflict`.
- Creation must atomically claim the book with a conditional database update and create the reservation in the same PostgreSQL transaction.
- Preserve the defensive partial unique index covering active reservation statuses.
- Handover, return, and cancellation must update the book and reservation together in one transaction.
- State-changing queries must check the expected current state. Stale or invalid transitions return `409 Conflict` and must not partially apply.
- Never rely on frontend state, in-memory locks, or a read-then-write check to enforce reservation exclusivity.

## Scope discipline

- Implement only the current approved phase or requested change.
- Do not add speculative fields, workflow states, services, or integrations.
- Do not add an administrator approval step to reservations.
- Treat cancellation and rejection as the same `CANCELLED` outcome. Keep `cancellationReason` optional and do not add `cancellationType` unless approved.
