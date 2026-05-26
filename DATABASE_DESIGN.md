# DATABASE DESIGN — Library Management System

## 1. System Logic Analogy (The Restaurant Pattern)
To simplify the complex logic, we treat the system as a restaurant:
- **Materials** are the **Menu**.
- **Loans** are the **Active Orders**.
- **Reservations** act as the **Waitlist** (activated only when the menu item is out of stock).
- **Fine Calculation** is the **Late Fee** logic, preventing customers from "hogging the table."
- **Notifications** are the **Buzzers** used to alert the next customer in the waitlist.

---

## 2. Actors
* **Member:** Registers, borrows materials, makes reservations, and writes reviews.
* **Librarian:** Records loans, processes returns, manages material inventory, and monitors reservation queues.
* **Manager:** Oversees the system, manages users, and handles reporting.

---

## 3. Collections & Field Classification

### 3.1 `users`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `name`, `email`, `phone` | String | **Data** | Shared profile info |
| `role` | String | **Problem-Solving** | `member`/`librarian`/`manager` |
| `address`, `dob`, `memNum` | — | **Data** | Specific to `member` |
| `department` | String | **Data** | Specific to `librarian` |

### 3.2 `materials`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `title`, `author`, `category` | String | **Data** | Metadata |
| `materialType` | String | **Problem-Solving** | `book`/`magazine`/`cd`/`map` |
| `availableCopies` | Number | **Problem-Solving** | Logic gate (blocks loans if 0) |

### 3.3 `loans`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `member`, `material`, `librarian` | ObjectId | **Relationship** | Links entities |
| `loanDate`, `dueDate` | Date | **Data** | Transaction history |
| `status` | String | **Problem-Solving** | `active`/`returned`/`overdue`/`cancelled` |
| `finePerDay` | Number | **Problem-Solving** | Rate snapshot at checkout |
| `totalFineAmount` | Number | **Problem-Solving** | Computed on return |
| `paymentStatus` | String | **Problem-Solving** | `paid`/`unpaid` |

### 3.4 `reservations`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `member`, `material` | ObjectId | **Relationship** | Target entities |
| `queuePriority` | Number | **Problem-Solving** | Determines position in line (FIFO) |
| `notifiedWhenAvailable` | Boolean | **Problem-Solving** | Notification workflow flag |
| `status` | String | **Problem-Solving** | `pending`/`notified`/`fulfilled` |

### 3.5 `reviews`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `member`, `material` | ObjectId | **Relationship** | Reviewer and target |
| `rating` | Number | **Data** | 1–5 stars |
| `reviewText` | String | **Data** | Optional feedback |

---

## 4. Relationship Map


| Source | Target | Relation Type |
|---|---|---|
| **Member** | **Loans/Reservations/Reviews** | One-to-Many |
| **Material** | **Loans/Reservations/Reviews** | One-to-Many |
| **Librarian** | **Loans** | One-to-Many |

---

## 5. Problem-Solving Logic Summary
* **Review Constraint:** Enforced by a compound unique index on `{ member: 1, material: 1 }`.
* **Overdue Calculation:** Triggered upon `returnLoan` event: `if (actualReturnDate > dueDate) -> status = 'overdue'`.
* **Reservation Trigger:** Upon `returnLoan`, the system queries for the `pending` reservation with the lowest `queuePriority` and updates `notifiedWhenAvailable = true`.