# BookNest NestJS API agent instructions

These rules apply to `apps/api` and are mandatory for backend code. They supplement the repository-level `AGENTS.md`.

## NestJS architecture

- Keep controllers thin.
- Controllers receive HTTP input, rely on DTO validation, call application or domain services, and return HTTP responses.
- Controllers must not contain substantial business logic.
- Business rules and state transitions belong in services, use cases, or domain logic.
- Keep the API within the approved modular monolith; do not introduce microservices.

## Prisma and database access

- Use the established Prisma and database layer for database access.
- Keep PostgreSQL as the authoritative source for availability and concurrency.
- Do not unnecessarily expose Prisma-specific structures or database entities through public API contracts.
- Use migrations for schema changes.
- Do not manually modify production database structure outside migrations.

## Validation

- Validate all external input at the API boundary.
- Use DTOs for request bodies, query parameters, and route parameters where appropriate.
- Do not trust client input.
- Return appropriate HTTP status codes and meaningful, stable errors without exposing internal implementation details.

## Transactions and concurrency

- Preserve all BookNest transactional invariants.
- Reservation creation must remain atomic.
- The `AVAILABLE` to `RESERVED` transition must allow exactly one winner among concurrent reservation attempts.
- Concurrent losing attempts for the same book must return HTTP `409 Conflict` without partially applying changes.
- Atomically claim the book with a conditional database update and create the reservation in the same PostgreSQL transaction.
- Never replace the atomic conditional claim with a read-then-write check, frontend state, or an in-memory lock.
- Preserve the defensive partial unique index for active reservation statuses.
- Administrative transitions that modify both `Book` and `Reservation` must be transactional.
- Handover, return, and cancellation must check expected source states; stale or invalid transitions return `409 Conflict` and do not partially apply.
- Never weaken these guarantees while refactoring.

## Domain rules

- Book states are `AVAILABLE`, `RESERVED`, and `BORROWED`.
- Reservation states are `RESERVED`, `BORROWED`, `COMPLETED`, and `CANCELLED`.
- Do not introduce `PENDING` or an approval state unless the user explicitly changes the product requirements.
- A successful public reservation immediately changes the book from `AVAILABLE` to `RESERVED` and creates the reservation as `RESERVED`.
- Every reservation requires `requesterName` and `telegramUsername`.
- A book may have at most one active reservation.
- Treat cancellation and rejection as the same `CANCELLED` outcome.
- Keep `cancellationReason` optional and do not add `cancellationType` unless explicitly approved.

## Backend method design

- Keep services focused.
- Split complex service methods into well-named private helpers where useful.
- Avoid giant transaction callbacks.
- Keep domain transition logic explicit and readable.
- Avoid duplicating state-transition logic.
- Prefer descriptive domain terminology over generic names.

## Authentication

- Use server-side administrator sessions carried in secure, HTTP-only cookies unless an alternative is explicitly approved.
- Do not expose password hashes, session hashes, or other sensitive persistence details.

## Backend testing and verification

- Add unit and integration tests appropriate to new behavior.
- Concurrency-sensitive reservation behavior must be verified against PostgreSQL, including exactly one successful simultaneous claim and `409 Conflict` for losing attempts.
- Test invalid and stale transitions to ensure they do not partially apply.
- Run the API formatting check, lint, relevant unit and end-to-end tests, build, and `git diff --check` for backend implementation tasks.
