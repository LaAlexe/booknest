# BookNest agent instructions

These instructions apply to the entire repository unless a more specific `AGENTS.md` adds instructions for a subdirectory. They are permanent project conventions and must be followed automatically for future BookNest tasks.

## Working approach

- Prefer small, incremental changes that are easy to review and verify.
- Explain important backend decisions briefly, including why the chosen approach fits BookNest.
- Do not change the approved architecture or domain lifecycle without explicit user approval.
- Avoid unrelated refactors, formatting churn, dependency changes, and speculative abstractions.
- Preserve existing user work and inspect the worktree before editing overlapping files.
- Keep documentation synchronized when approved behavior or contracts change.

## Code quality

- Write clean, readable, maintainable code.
- Prefer clarity over cleverness or overly compact code.
- Follow SOLID principles where they improve the design without over-engineering simple functionality.
- Avoid duplicated logic, unnecessary abstractions, and unnecessary nesting.
- Prefer early returns when they improve readability.
- Keep functions and classes focused on one responsibility.

## Naming

- All names must clearly describe their purpose.
- Never use meaningless or single-letter names such as `x`, `y`, `i`, `e`, `r`, `d`, `a`, or `b`. This applies to callback parameters, collection-operation parameters, error variables, and test variables.
- Single-letter names are allowed only in genuinely mathematical code where the notation is universally understood.
- Avoid generic names such as `data`, `item`, `obj`, `arr`, `res`, `tmp`, or `value` when a more domain-specific name is available.
- Prefer names such as `book`, `reservation`, `availableBooks`, `apiResponse`, `selectedGenre`, and `normalizedTelegramUsername`.
- Boolean names should preferably begin with `is`, `has`, `can`, or `should`, such as `isAvailable`, `isLoading`, `hasReservations`, `canReserve`, or `shouldDisplayPagination`.
- Method names must describe actions, such as `loadBooks()`, `createReservation()`, `normalizeTelegramUsername()`, or `validateBookAvailability()`.

## Method complexity

- Give each method one clear responsibility.
- Split complex methods into smaller, well-named methods.
- Do not create large methods containing multiple unrelated operations.
- Extract complex conditions into descriptive methods or variables.
- Avoid deeply nested conditional blocks and excessive method parameters.
- Use typed parameter objects when appropriate.
- A method's intent should be understandable without mentally decoding its implementation.

## Shared and reusable code

- Do not duplicate genuinely reusable logic.
- Move logic reused across multiple features or modules to an appropriate shared location.
- Do not prematurely move feature-specific code into shared areas.
- Shared code must represent demonstrated reusable functionality, not hypothetical future reuse.

## TypeScript

- Use strict typing.
- Avoid `any`; never use it to bypass TypeScript errors.
- Prefer explicit domain models, interfaces, and types.
- Avoid unsafe type assertions.
- Prefer `readonly` when mutation is not required.
- Use enums or union types for constrained domain values.
- Avoid unnecessary type duplication.

## Error handling

- Never silently swallow errors or create empty catch blocks.
- Handle expected errors explicitly.
- Use meaningful domain-specific errors.
- Do not expose internal implementation details unnecessarily.

## Comments

- Prefer self-explanatory code over comments.
- Comments should explain why something exists, not repeat what the code does.
- Use comments for non-obvious business rules, concurrency guarantees, architectural constraints, or unusual technical decisions.
- Do not add comments to obvious code.

## Tests

- New behavior must have appropriate tests.
- Test names must clearly describe behavior.
- Test code follows the same naming and readability rules as production code.
- Prefer behavioral tests over tests of implementation details.
- Avoid cryptic test setup variables.

## Approved architecture boundaries

- Use a modular monolith, not microservices.
- Keep the Angular web application and NestJS API as separate applications in one monorepo.
- Use PostgreSQL as the source of truth for availability and concurrency.
- Keep controllers thin; put business rules and state transitions in backend services or use cases.
- Validate all external input at the API boundary.
- Do not expose database entities directly as frontend contracts.
- Use server-side sessions in secure, HTTP-only cookies for administrator authentication unless an alternative is explicitly approved.

## Reservation and domain invariants

- Book states are `AVAILABLE`, `RESERVED`, and `BORROWED`.
- Reservation states are `RESERVED`, `BORROWED`, `COMPLETED`, and `CANCELLED`.
- A successful reservation immediately moves a book from `AVAILABLE` to `RESERVED` and creates a `RESERVED` reservation; there is no approval or pending state.
- Every reservation requires both `requesterName` and `telegramUsername`.
- At most one active reservation may exist for a book.
- Concurrent attempts for the same available book must yield exactly one success; losing attempts return HTTP `409 Conflict`.
- Creation must atomically claim the book with a conditional database update and create the reservation in the same PostgreSQL transaction.
- Preserve the defensive partial unique index covering active reservation statuses.
- Handover, return, and cancellation must update the book and reservation together in one transaction.
- State-changing queries must check the expected current state. Stale or invalid transitions return `409 Conflict` and must not partially apply.
- Never rely on frontend state, in-memory locks, or a read-then-write check to enforce reservation exclusivity.
- Treat cancellation and rejection as the same `CANCELLED` outcome. Keep `cancellationReason` optional and do not add `cancellationType` unless approved.

## Scope discipline

- Implement only the current approved phase or requested change.
- Do not make unrelated changes or perform large unrelated refactors while implementing a feature.
- Do not add speculative fields, workflow states, services, or integrations.
- Do not add an administrator approval step to reservations.
- If an architectural change appears necessary, explain it before making it.
- Prefer small, incremental changes.

## Mandatory self-review and verification

Before completing every implementation task, inspect the changed code and verify:

1. Variable names are descriptive and contain no unnecessary single-letter or cryptic names.
2. Method names describe their actions.
3. Complex methods are split appropriately.
4. Duplicated logic is shared only when it is genuinely reusable.
5. TypeScript is strictly typed without unnecessary `any` or unsafe assertions.
6. Angular asynchronous APIs are Observable-based.
7. Angular Signals are used appropriately for synchronous UI state.
8. Angular code contains no nested or unmanaged subscriptions.
9. Angular component styles and normal application templates are in separate files.
10. Complex logic is kept out of Angular templates.
11. NestJS controllers remain thin.
12. Domain and database invariants are preserved.
13. Tests are readable, behavior-focused, and appropriately named.
14. The resulting code is clean and understandable.

Before finishing a coding task, run the relevant formatting checks, lint, tests, build, and `git diff --check`. Fix issues introduced by the task before reporting completion. If a relevant check cannot run, state why.

## Instruction priority

- Follow these rules without requiring them to be repeated in future prompts.
- More specific `AGENTS.md` files add mandatory rules for their directory trees.
- Do not override existing BookNest architecture or domain decisions unless the user explicitly requests a change.
