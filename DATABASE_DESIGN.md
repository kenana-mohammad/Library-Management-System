# DATABASE DESIGN — Library Management System

## 1. Overview

This document describes the database design for a Library Management System built with MongoDB and Mongoose. It follows the actors → features → collections → relationships approach.

---

## 2. Actors

| Actor | Description |
|---|---|
| **Member** | Registers, borrows materials, makes reservations, writes reviews |
| **Librarian** | Records loans and returns, manages materials |
| **Manager** | Oversees the system, manages users and reports |

---

## 3. main action

- User management (member / librarian / manager)
- Books & library materials catalog
- Loan (checkout) management with fine calculation
- Reservation queue for unavailable materials
- Ratings & reviews (one per member per material)

---

## 4. Collections

---

### 4.1 `users`

Stores all system users. Role is stored in a single collection using a `role` discriminator field.

| Field | Type | Label | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | Auto-generated |
| `name` | String | **data** | Full name |
| `email` | String | **data** | Unique, required |
| `phone` | String | **data** | |
| `password` | String | **data** | Hashed (design only, not used for auth in code) |
| `role` | String (enum) | **problem-solving** | `member` / `librarian` / `manager` — controls access logic |
| `registeredAt` | Date | **data** | Default: now |
| **Member-only** | | | |
| `address` | String | **data** | Members only |
| `dateOfBirth` | Date | **data** | Members only |
| `membershipNumber` | String | **data** | Unique, members only |
| **Librarian-only** | | | |
| `responsibleDepartment` | String | **data** | Librarians only (e.g. "Fiction", "Science") |

---

### 4.2 `materials`

Single collection for all library materials using `materialType` to differentiate.

| Field | Type | Label | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | Auto-generated |
| `materialType` | String (enum) | **problem-solving** | `book` / `magazine` / `cd` / `map` |
| `title` | String | **data** | Shared across all types |
| `category` | String | **data** | fiction / science / history / … |
| `totalCopies` | Number | **data** | Total physical copies |
| `availableCopies` | Number | **problem-solving** | Decremented on loan, incremented on return — used to block loans when 0 |
| `coverImageUrl` | String | **data** | Optional image link |
| **Book-only** | | | |
| `author` | String | **data** | |
| `publisher` | String | **data** | |
| `publicationYear` | Number | **data** | |
| `ISBN` | String | **data** | Unique |
| **Magazine-only** | | | |
| `issueNumber` | Number | **data** | |
| `month` | String | **data** | |
| `year` | Number | **data** | |
| **Timestamps** | | | |
| `createdAt` | Date | **data** | Auto (Mongoose timestamps) |
| `updatedAt` | Date | **data** | Auto (Mongoose timestamps) |

---

### 4.3 `loans`

Records every checkout event. Links member, material, and the librarian who recorded the loan.

| Field | Type | Label | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | Auto-generated |
| `member` | ObjectId → users | **relationship** | The member borrowing the material |
| `material` | ObjectId → materials | **relationship** | The material being borrowed |
| `librarian` | ObjectId → users | **relationship** | Librarian who recorded the loan |
| `loanDate` | Date | **data** | Default: now |
| `dueDate` | Date | **data** | Typically loanDate + 14 days |
| `actualReturnDate` | Date | **data** | Optional; set when returned |
| `status` | String (enum) | **problem-solving** | `active` / `returned` / `overdue` / `cancelled` — updated by cron or on return |
| `finePerDay` | Number | **problem-solving** | Set at loan creation (e.g. 0.5 SAR/day) |
| `totalFineAmount` | Number | **problem-solving** | Calculated: `(today - dueDate) * finePerDay` when overdue |
| `paymentStatus` | String (enum) | **problem-solving** | `unpaid` / `paid` — default: unpaid |

**Business Rules:**
- On loan creation → `availableCopies--`
- On return → `availableCopies++`, set `actualReturnDate`, update `status` to `returned`
- If `today > dueDate` and `status === 'active'` → set `status = 'overdue'`, calculate `totalFineAmount`

---

### 4.4 `reservations`

Allows a member to queue for a material that is currently unavailable (`availableCopies === 0`).

| Field | Type | Label | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | Auto-generated |
| `member` | ObjectId → users | **relationship** | Member who reserved |
| `material` | ObjectId → materials | **relationship** | Material being reserved |
| `reservedAt` | Date | **data** | Default: now |
| `queuePriority` | Number | **problem-solving** | Auto-assigned based on reservation order (1 = first in queue) |
| `notifiedWhenAvailable` | Boolean | **problem-solving** | Set to true when material becomes available and member is notified |
| `autoCancelAfter` | Date | **problem-solving** | Reservation expires if member does not pick up within N days of notification |
| `status` | String (enum) | **problem-solving** | `pending` / `notified` / `fulfilled` / `cancelled` |

---

### 4.5 `reviews`

Members rate and optionally review materials.

| Field | Type | Label | Notes |
|---|---|---|---|
| `_id` | ObjectId | — | Auto-generated |
| `member` | ObjectId → users | **relationship** | Reviewer |
| `material` | ObjectId → materials | **relationship** | Reviewed material |
| `rating` | Number (1–5) | **data** | Required |
| `reviewText` | String | **data** | Optional |
| `createdAt` | Date | **data** | Auto (Mongoose timestamps) |

**Business Rule:** A compound unique index on `{ member, material }` enforces one review per member per material at the database level.

---

## 5. Relationship Map

```
users (role: member)
  │
  ├──< loans >── materials
  │      └── (recorded by) users (role: librarian)
  │
  ├──< reservations >── materials
  │
  └──< reviews >── materials


users (role: librarian)
  └── records loans

users (role: manager)
  └── (manages system — no exclusive collection, extends shared user fields)
```

### Relationship Summary

| From | To | Type | Via |
|---|---|---|---|
| users (member) | loans | one-to-many | `loans.member` |
| users (librarian) | loans | one-to-many | `loans.librarian` |
| materials | loans | one-to-many | `loans.material` |
| users (member) | reservations | one-to-many | `reservations.member` |
| materials | reservations | one-to-many | `reservations.material` |
| users (member) | reviews | one-to-many | `reviews.member` |
| materials | reviews | one-to-many | `reviews.material` |

---

## 6. Problem-Solving Fields Summary

| Field | Collection | Problem it solves |
|---|---|---|
| `role` | users | Determines permissions and which extra fields apply |
| `availableCopies` | materials | Blocks new loans when 0; drives reservation trigger |
| `materialType` | materials | Allows one collection to store books, magazines, CDs, maps |
| `status` | loans | Tracks lifecycle; used to detect overdue loans |
| `finePerDay` | loans | Locked-in rate at time of loan (rate may change later) |
| `totalFineAmount` | loans | Precomputed fine to avoid repeated calculation |
| `paymentStatus` | loans | Tracks whether overdue fine has been settled |
| `queuePriority` | reservations | Ensures FIFO order for reservation queue |
| `notifiedWhenAvailable` | reservations | Prevents double-notification; tracks workflow state |
| `autoCancelAfter` | reservations | Releases material back to queue if member doesn't respond |
| `status` | reservations | Tracks reservation lifecycle |

---

## 7. Indexes

| Collection | Index | Reason |
|---|---|---|
| users | `{ email: 1 }` unique | Fast login lookup, prevent duplicates |
| users | `{ membershipNumber: 1 }` unique | Member ID lookup |
| materials | `{ ISBN: 1 }` unique (sparse) | Book deduplication |
| materials | `{ materialType: 1, category: 1 }` | Filter by type and category |
| loans | `{ member: 1, status: 1 }` | Fetch active loans per member |
| loans | `{ dueDate: 1, status: 1 }` | Overdue detection job |
| reservations | `{ member: 1, material: 1 }` | Prevent duplicate reservations |
| reservations | `{ material: 1, queuePriority: 1 }` | Queue ordering |
| reviews | `{ member: 1, material: 1 }` **unique** | Enforce one review per member per material |
