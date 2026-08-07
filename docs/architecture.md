# Architecture

## System context

BookNest is a small community-library system with a public catalog and a protected administration area. The approved architecture is a modular monolith: one Angular client, one Node.js API, and one PostgreSQL database.

```text
Browser
  |
  +-- Angular public and admin UI
          |
          +-- REST/JSON API
                  |
                  +-- NestJS modular monolith
                          |
                          +-- PostgreSQL
```

Docker Compose will eventually coordinate the web application, API, and PostgreSQL for local development. A reverse proxy may be added for production deployment, but is not required for initial implementation.

## Why a modular monolith

The catalog, books, and reservations form one small domain and need reliable database transactions. Keeping them in one API and one database makes consistency rules direct and testable. Microservices would introduce network failure handling and distributed consistency without an MVP benefit.

## Frontend architecture

Use one Angular application with route-level, feature-oriented areas:

```text
Public shell
  Catalog
  Genre browsing
  Search
  Book details
  Reservation form

Admin shell
  Login
  Book management
  Reservation management
```

Conventions:

- Prefer standalone components and lazy-loaded feature routes.
- Use reactive forms for reservation and administration forms.
- Use signals and focused Angular services for MVP state; do not add NgRx without a demonstrated need.
- Centralize HTTP access and consistent API error handling.
- Use an admin route guard for navigation, while treating backend authorization as authoritative.
- On reservation conflict, handle HTTP `409`, refresh the book, and show that it is unavailable.

The frontend may present current availability, but it must never decide whether a reservation succeeds.

## Backend architecture

The recommended backend is NestJS with Prisma and PostgreSQL. NestJS provides modules, dependency injection, guards, and controllers that offer familiar structure to an Angular developer. Prisma provides type-safe database access and migration tooling, while PostgreSQL remains the final authority for constraints and concurrency.

Initial backend modules:

- authentication;
- books/catalog;
- genres;
- reservations;
- administration;
- database and shared infrastructure.

Controllers translate HTTP input and output. Services or use cases own business rules and transactions. Runtime DTO validation is required because TypeScript types do not validate untrusted HTTP input.

## Authentication

Only administrators authenticate in the MVP. There is no public account registration.

Recommended approach:

- create administrator accounts through a controlled seed or CLI process;
- hash passwords with Argon2id;
- use opaque server-side sessions;
- send the session token in a `Secure`, `HttpOnly`, appropriately `SameSite` cookie;
- store only a hash of the session token in PostgreSQL;
- support expiration and logout invalidation;
- rate-limit login attempts and protect state-changing requests against CSRF;
- use HTTPS in production.

Server-side sessions are recommended over JWTs because this is one first-party web application. They make logout and revocation straightforward and avoid exposing credentials to Angular code.

## REST API outline

All endpoints are versioned under `/api/v1`.

### Public catalog

```http
GET /api/v1/books
GET /api/v1/books/:bookId
GET /api/v1/genres
GET /api/v1/genres/:genreSlug/books
```

Catalog filtering and search use query parameters:

```http
GET /api/v1/books?q=tolkien&genre=fantasy&status=AVAILABLE&page=1&pageSize=20
```

### Public reservations

```http
POST /api/v1/books/:bookId/reservations
```

Both body fields are required:

```json
{
  "requesterName": "Anna",
  "telegramUsername": "@reader_name"
}
```

A successful reservation returns `201 Created`. An unavailable or concurrently claimed book returns `409 Conflict` with a stable error code such as `BOOK_NOT_AVAILABLE`.

### Administrator authentication

```http
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/logout
GET  /api/v1/admin/auth/me
```

### Administrator books

```http
GET    /api/v1/admin/books
POST   /api/v1/admin/books
GET    /api/v1/admin/books/:bookId
PATCH  /api/v1/admin/books/:bookId
DELETE /api/v1/admin/books/:bookId
```

Delete should archive books that have history rather than physically remove them.

### Administrator reservations

```http
GET  /api/v1/admin/reservations
GET  /api/v1/admin/reservations/:reservationId
POST /api/v1/admin/reservations/:reservationId/mark-borrowed
POST /api/v1/admin/reservations/:reservationId/mark-returned
POST /api/v1/admin/reservations/:reservationId/cancel
```

There is no approval endpoint. Explicit action endpoints express intent and let the API enforce each required source state.

## API conventions

- Use JSON request and response bodies.
- Validate bodies, route parameters, and query parameters.
- Paginate collection endpoints and cap page sizes.
- Return `400` for malformed input, `401` for missing authentication, `403` for insufficient permission, `404` for missing resources, and `409` for availability or state-transition conflicts.
- Return stable machine-readable error codes with human-readable messages.
- Never return password hashes, session hashes, or internal persistence details.

## Repository direction

The intended monorepo layout has `apps/web`, `apps/api`, `packages/contracts`, `docs`, and `docker` areas. API contracts may later be generated from OpenAPI. Database models must not be shared directly with the browser because persistence and public API contracts have different security and evolution requirements.

## Implementation phases

1. Workspace and quality tooling, environment validation, health checks, and Docker Compose.
2. Database schema, migrations, seed data, and public catalog API.
3. Public Angular catalog, filters, details, and availability presentation.
4. Transactional reservation creation and simultaneous-request integration tests.
5. Administrator authentication, sessions, CSRF protection, and login throttling.
6. Administrator book and genre management.
7. Transactional handover, return, and cancellation workflows.
8. End-to-end testing, security hardening, backups, observability, and deployment configuration.

Each phase should be delivered in small changes with tests and linting for the touched area.
