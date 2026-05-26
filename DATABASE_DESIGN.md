# DATABASE DESIGN — Library Management System

## 1. Overview
This system replaces paper ledgers, managing library operations through five core collections, strictly following the Data/Relationship/Problem-Solving field classification (Lecture 21).

---

## 2. Actors & Features
* **Actors:** Member (borrower), Librarian (recorder), Manager (oversight).
* **Core Logic:** * Loan lifecycle management (Fine calculation).
    * Reservation queue (FIFO).
    * Review system (One review per member per material).
    * Inventory management (`availableCopies` control).

---

## 3. Collections & Field Classification

### 3.1 `Users`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `name`, `email`, `phone`, `password` | String | **Data** | Shared fields |
| `role` | String | **Problem-Solving** | member/librarian/manager |
| `registeredAt` | Date | **Data** | Default: now |
| `address`, `dateOfBirth`, `membershipNumber` | — | **Data** | Member-only |
| `responsibleDepartment` | String | **Data** | Librarian-only |

### 3.2 `Materials`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `title`, `author`, `publisher`, `category`, `ISBN`, `coverImageUrl` | — | **Data** | Metadata |
| `totalCopies`, `availableCopies` | Number | **Problem-Solving** | Inventory logic |
| `materialType` | String | **Problem-Solving** | book/magazine/cd/map |

### 3.3 `Loans`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `member`, `material`, `librarian` | ObjectId | **Relationship** | Ref to Users/Materials |
| `loanDate`, `dueDate`, `actualReturnDate` | Date | **Data** | History |
| `status` | String | **Problem-Solving** | active/returned/overdue/cancelled |
| `finePerDay`, `totalFineAmount`, `paymentStatus` | — | **Problem-Solving** | Fine logic |

### 3.4 `Reservations`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `material`, `member` | ObjectId | **Relationship** | Ref to Materials/Users |
| `reservedAt` | Date | **Data** | Timestamp |
| `queuePriority`, `notifiedWhenAvailable`, `autoCancelAfter` | — | **Problem-Solving** | Queue state |

### 3.5 `Reviews`
| Field | Type | Classification | Notes |
|---|---|---|---|
| `member`, `material` | ObjectId | **Relationship** | Ref to Users/Materials |
| `rating`, `reviewText` | — | **Data** | User feedback |

---

## 4. Relationship Map (Restaurant Analogy)
* **Menu (Materials)** are ordered by **Customers (Members)** via **Waiters (Librarians)**.
* **Waitlist (Reservations)** is managed via **QueuePriority** when items are out of stock.
* **Late Fees (Fines)** ensure items are "returned to the table" for other customers.