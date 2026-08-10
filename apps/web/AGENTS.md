# BookNest Angular agent instructions

These rules apply to `apps/web` and are mandatory for Angular code. They supplement the repository-level `AGENTS.md`.

## Observables

- Use RxJS `Observable` for asynchronous operations and workflows.
- `HttpClient` services must return Observables.
- Do not convert `HttpClient` Observables to Promises or introduce Promise-based service APIs where Observable is appropriate.
- Avoid `firstValueFrom()` and `lastValueFrom()` unless there is a clearly justified exceptional case.
- Use RxJS operators to compose asynchronous workflows.
- Never use nested `subscribe()` calls.

Preferred:

```typescript
getBooks(): Observable<Book[]> {
  return this.httpClient.get<Book[]>(...);
}
```

Do not prefer:

```typescript
async getBooks(): Promise<Book[]> {
  // ...
}
```

## Angular Signals

- Use Angular Signals for local synchronous reactive state.
- Prefer `signal()` and `computed()`.
- Use `effect()` only when an actual side effect is required.
- Suitable Signal state includes loading state, selected filters, search input, selected books, local UI state, and derived UI state.
- Prefer Signals over `Subject` or `BehaviorSubject` when the purpose is only local synchronous component state.
- Preserve this distinction: Observable means HTTP, asynchronous streams, and RxJS workflows; Signal means synchronous reactive UI or application state.
- Do not replace `HttpClient` Observables with Signals inside API services.
- When Observable-to-Signal interoperability is useful, prefer official Angular RxJS interoperability utilities.

## Subscriptions

- Avoid manual subscriptions when a declarative reactive approach works.
- Never use nested `subscribe()` calls.
- Never leave unmanaged subscriptions.
- When an explicit subscription is necessary, use lifecycle-safe cleanup such as `takeUntilDestroyed()`.

## Components

- Keep components small and focused.
- Components should primarily coordinate presentation and UI state.
- Do not put backend or domain implementation details in components.
- Route all API communication through dedicated services.
- Do not put complex transformations or business logic in templates.
- Extract complex component logic into well-named methods or computed Signals.
- Split overly large components into smaller focused components.

## Templates

- Use separate HTML template files for normal application components.
- Prefer a structure such as `book-card.component.ts`, `book-card.component.html`, and `book-card.component.scss`.
- Avoid large inline templates.
- Do not place complex expressions in templates.

## Styles

- Never use inline `style="..."` attributes.
- Do not put CSS or SCSS in the component decorator's `styles` property.
- Component styles must live in separate stylesheet files.
- Use the project's established stylesheet format.

## Shared Angular code

- Place genuinely reusable Angular functionality under an appropriate shared structure such as `apps/web/src/app/shared/`.
- Appropriate categories may include `shared/components`, `shared/pipes`, `shared/directives`, `shared/utils`, `shared/validators`, and `shared/models`.
- Keep feature-specific functionality inside its feature.
- Move code to shared only after reuse is genuine, not merely anticipated.

## Angular architecture

- Prefer standalone components, lazy-loaded feature routes, and feature-based organization.
- Keep API services separate from UI components.
- Centralize HTTP access and consistent API error handling.
- Do not expose persistence entities directly as frontend contracts.
- Use reactive forms for reservation and administration forms.
- Do not introduce NgRx or another global state-management library without a demonstrated need and explicit user approval.
- Prefer Angular's built-in reactive primitives for the MVP.
- Treat backend authorization and availability decisions as authoritative; frontend state must never enforce reservation exclusivity.

## Angular testing and verification

- Add behavioral tests for new components, services, routes, interactions, and UI states as appropriate.
- Test loading, empty, error, and success states when a feature exposes them.
- Run the web formatting check, lint, tests, production build, and `git diff --check` for Angular implementation tasks.
