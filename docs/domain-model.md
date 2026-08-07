# Domain model

## Core concepts

In the MVP, each `Book` represents one physical copy. A `Reservation` records the person currently reserving or borrowing that copy and preserves completed or cancelled history.

Book availability and reservation history are stored separately but changed together. This makes physical state easy to query while retaining who reserved a book and what happened afterward.

## Entities

### Book

- `id`
- `title`
- `author`
- `description`
- `isbn`, optional
- `publicationYear`, optional
- `coverUrl`, optional
- `status`: `AVAILABLE`, `RESERVED`, or `BORROWED`
- `archivedAt`, optional
- `createdAt`
- `updatedAt`

A book with reservation history should be archived rather than physically deleted.

### Genre

- `id`
- `name`, unique
- `slug`, unique
- `createdAt`

### BookGenre

- `bookId`
- `genreId`

`BookGenre` models the many-to-many relationship between books and genres.

### Reservation

- `id`
- `bookId`
- `requesterName`, required
- `telegramUsername`, required
- `status`: `RESERVED`, `BORROWED`, `COMPLETED`, or `CANCELLED`
- `reservedAt`
- `borrowedAt`, optional
- `returnedAt`, optional
- `cancelledAt`, optional
- `cancellationReason`, optional
- `createdAt`
- `updatedAt`

The MVP has no pending or approval status. It also has no `cancellationType` or other speculative reservation fields.

### AdminUser

- `id`
- `username` or `email`, unique
- `passwordHash`
- `isActive`
- `createdAt`
- `updatedAt`
- `lastLoginAt`, optional

### AdminSession

- `id`
- `adminUserId`
- `tokenHash`
- `expiresAt`
- `createdAt`
- `lastUsedAt`

## Relationships

```text
Book 1 -------- many Reservation
Book many ----- many Genre (through BookGenre)
AdminUser 1 --- many AdminSession
```

A book may have many historical reservations but at most one active reservation. A reservation is active while its status is `RESERVED` or `BORROWED`.

## State transitions

```text
Book AVAILABLE
    |
    | successful public reservation
    v
Book RESERVED + Reservation RESERVED
    |
    +-- administrator hands over book
    |       v
    |   Book BORROWED + Reservation BORROWED
    |       |
    |       | administrator records return
    |       v
    |   Book AVAILABLE + Reservation COMPLETED
    |
    +-- administrator cancels/rejects
            v
        Book AVAILABLE + Reservation CANCELLED
```

| Action | Book before | Reservation before | Book after | Reservation after |
|---|---|---|---|---|
| Reserve | `AVAILABLE` | none | `RESERVED` | `RESERVED` |
| Hand over | `RESERVED` | `RESERVED` | `BORROWED` | `BORROWED` |
| Return | `BORROWED` | `BORROWED` | `AVAILABLE` | `COMPLETED` |
| Cancel/reject | `RESERVED` | `RESERVED` | `AVAILABLE` | `CANCELLED` |

No other transition is valid. Invalid or stale transition attempts return HTTP `409 Conflict` and make no changes.

## Domain invariants

- A book is available if and only if it can be newly reserved.
- A successful reservation immediately makes its book `RESERVED`.
- A reservation requires a non-empty requester name and Telegram username.
- A book can have at most one active reservation.
- A reserved book has one active `RESERVED` reservation.
- A borrowed book has one active `BORROWED` reservation.
- Cancelling a reservation releases its book.
- Completing a reservation releases its book.
- Book and reservation state changes must never partially apply.

Application validation should normalize and validate Telegram usernames, while database constraints should still reject missing required values.

## Concurrent reservation creation

The API must not implement reservation as an availability read followed by an unconditional write. Two requests could read `AVAILABLE` before either writes.

Instead, reservation creation uses one PostgreSQL transaction with an atomic conditional claim:

```sql
BEGIN;

UPDATE books
SET status = 'RESERVED',
    updated_at = now()
WHERE id = :bookId
  AND status = 'AVAILABLE'
RETURNING id;

-- Continue only when exactly one row was returned.

INSERT INTO reservations (
    book_id,
    requester_name,
    telegram_username,
    status,
    reserved_at,
    created_at,
    updated_at
)
VALUES (
    :bookId,
    :requesterName,
    :telegramUsername,
    'RESERVED',
    now(),
    now(),
    now()
);

COMMIT;
```

If the conditional update affects zero rows, the transaction does not insert a reservation and the API returns `409 Conflict`. PostgreSQL row locking ensures that when two users race for the same available book, exactly one conditional update succeeds.

The update and insert must share a transaction. If insertion fails, rollback restores the book to `AVAILABLE`.

Add a defensive partial unique index:

```sql
CREATE UNIQUE INDEX one_active_reservation_per_book
ON reservations (book_id)
WHERE status IN ('RESERVED', 'BORROWED');
```

The conditional update is the normal concurrency mechanism. The index independently protects the invariant if another code path later attempts to create a second active reservation.

## Administrative transitions

Handover, return, and cancellation must each run in one transaction and condition updates on their expected source states. For example, handover may update only a `RESERVED` book associated with a `RESERVED` reservation.

If either expected state is absent, the operation must roll back and return `409 Conflict`. This protects against stale admin screens, duplicate submissions, and competing administrative actions.
