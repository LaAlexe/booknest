# BookNest

BookNest is a small community-library web application for sharing books from a personal collection. Visitors can discover books and reserve an available copy by providing their name and Telegram username. An administrator manages the catalog and records handover, return, and cancellation events.

## Product goal

Make a small physical library easy to browse and operate while ensuring that one physical book can never be reserved successfully by two people at the same time.

## MVP scope

Public users can:

- browse a paginated catalog;
- browse and filter books by genre;
- search by title, author, and optionally ISBN;
- view details and current availability;
- reserve an available book using a required requester name and Telegram username;
- receive a clear conflict response if another user reserved the book first.

Administrators can:

- sign in and out;
- add and edit books;
- archive books instead of destroying records with history;
- view reservations and requester contact information;
- mark a reserved book as borrowed at handover;
- mark a borrowed book as returned;
- cancel or reject a reservation, with an optional reason.

Public accounts, notifications, waitlists, reviews, fines, multiple branches, and automatic Telegram integration are outside the MVP.

## Approved technical direction

- Angular and TypeScript for the web application.
- Node.js, TypeScript, NestJS, and Prisma for the REST API.
- PostgreSQL as the authoritative data store and concurrency boundary.
- Docker Compose for local services and deployment-oriented development.
- A modular monolith in a monorepo, with separate web and API applications.
- Server-side admin sessions carried in secure, HTTP-only cookies.

Phase 1 scaffolds the Angular and NestJS applications, PostgreSQL development configuration, and repository quality tooling. Phase 2A adds the catalog schema and public read-only API; reservation and administration features remain deferred.

## Development foundation

Prerequisites:

- Node.js 22.12 or newer;
- npm 10 or newer;
- Docker with Docker Compose.

Initial setup:

```bash
cp .env.example .env
npm install
```

Start local development in this order:

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Start the NestJS API in a second terminal. It listens on `http://localhost:3000/api/v1`:

```bash
npm run start:dev --workspace @booknest/api
```

3. Start the Angular development server in a third terminal:

```bash
npm run start --workspace @booknest/web
```

Open `http://localhost:4200`. The Angular development server automatically proxies relative `/api` requests to the NestJS API on port `3000`; no frontend API URL configuration or browser CORS setup is required for local development.

### Create the initial administrator

Apply database migrations, then set `ADMIN_EMAIL` and a unique 12–128 character `ADMIN_PASSWORD` in the local `.env` file. Create the first administrator explicitly:

```bash
npm exec --workspace @booknest/api prisma migrate deploy
npm run prisma:seed-admin --workspace @booknest/api
```

The command normalizes the email, stores an Argon2id password hash, and refuses to run when an administrator already exists. Never commit real administrator credentials to an environment file or source code.

Quality commands:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

The backend exposes `GET /api/v1/health`, which returns `{ "status": "ok" }`. The public catalog API provides `GET /api/v1/books`, `GET /api/v1/books/:id`, and `GET /api/v1/genres`.

## Core lifecycle

```text
AVAILABLE --reserve--> RESERVED --hand over--> BORROWED --return--> AVAILABLE
                         |
                         +--cancel/reject--------------------------> AVAILABLE
```

A successful public reservation changes the book to `RESERVED` immediately. There is no pending reservation and no administrator approval step.

## Correctness requirement

Reservation creation will use a PostgreSQL transaction containing an atomic conditional update from `AVAILABLE` to `RESERVED`, followed by insertion of the reservation. If the update affects no row, the API returns `409 Conflict`. A partial unique database index will additionally prevent more than one active reservation for a book.

See [architecture](docs/architecture.md) and [domain model](docs/domain-model.md) for the full approved design.

## Planned implementation phases

1. Establish the workspace, quality tooling, configuration validation, and local services.
2. Add the PostgreSQL schema, migrations, seed data, and catalog API.
3. Build the public Angular catalog and book details.
4. Implement and concurrency-test transactional reservation creation.
5. Add administrator authentication and session security.
6. Build administrator catalog management.
7. Build reservation handover, return, and cancellation workflows.
8. Add end-to-end tests, security hardening, backups, and deployment configuration.

Implementation should proceed in small, independently verifiable increments.
