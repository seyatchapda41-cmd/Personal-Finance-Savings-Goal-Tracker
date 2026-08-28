# Tempora — Software Requirements Specification

**Product:** Personal Finance & Savings Goal Tracker  
**Version:** 2.0  
**Date:** 27 August 2026  
**Status:** Authoritative for current development

This document replaces the original client-only SRS. Version 2 adds a first-class **Admin Control Panel** so the founder and designated staff can view, correct, reverse, and oversee every client transaction without sharing a client login.

---

## 1. Purpose

People track money in paper notes and spreadsheets. Tempora is a web product that:

1. Lets a client record income and expenses, set savings goals, and see monthly totals.
2. Lets the company operate Standard (free) and Premium ($20.99 / month) accounts.
3. Lets founders and moderators **manage the books of every client** from a separate, privileged staff surface.

The company website (brand, pricing, legal) and the signed-in product share one codebase.

---

## 2. Actors

| Actor | Who | Access |
|---|---|---|
| Visitor | Anyone not signed in | Public site, signup, checkout, client login |
| Standard client | Free account, phone login | Own books only. Moderate (3-star) customer service. Monthly transaction cap. |
| Premium client | Paid account, phone login | Own books only. Priority (4–5 star) customer service. Unlimited savings goals. CSV export. |
| Moderator | Staff, staff login | All clients' records. Cancel a mistaken client row. Flag a row for review. Answer support. Suspend a client. Cannot rewrite figures, post corrections, refund, or change platform settings. |
| Founder | Super-admin, staff login | Everything a moderator can do, plus edit a client row, reverse a row (keeping history), post a staff correction, export the platform books, change plans, delete accounts, refund Premium payments, manage the admin team, and toggle platform settings. |

A client never signs in at `/admin/login`. Staff never use `/login` to open the panel. Roles are decided after authentication by `ADMIN_PHONES` (founders) and the `admin_users` table (moderators).

---

## 3. Surfaces

| Surface | Routes | Audience |
|---|---|---|
| Public site | `/`, `/features`, `/how-it-works`, `/security`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms` | Visitors |
| Client auth | `/login`, `/signup`, `/forgot-password`, `/checkout` | Visitors becoming clients |
| Client app | `/app/*` | Standard and Premium clients |
| Staff auth | `/admin/login` | Founders and moderators |
| Admin panel | `/admin/*` | Founders and moderators |

---

## 4. Client functional requirements (v1 retained)

- **FR-C1** Phone number is the login credential. Password must be at least 8 characters, include one capital letter and one number.
- **FR-C2** A client records income and expense transactions with category, amount, date, and optional description. Totals update immediately.
- **FR-C3** A client manages their own categories (income / expense).
- **FR-C4** A client sets savings goals (title, target, current amount, date) and sees progress.
- **FR-C5** The dashboard shows all-time balance, this month's income and expenses, and goal progress.
- **FR-C6** Standard and Premium limits are enforced (monthly transaction cap and goal cap on Standard; unlimited goals and CSV export on Premium).
- **FR-C7** A client may contact customer service in-app. Premium requests are marked priority.
- **FR-C8** A client may change plan, sign out, or permanently delete their account.
- **FR-C9** Row Level Security isolates each client's rows. A client can read staff corrections posted on their account, but cannot edit or delete a row whose origin is `admin` or `reversal`.

---

## 5. Admin functional requirements (v2)

### 5.1 Access and roles

- **FR-A1** Staff sign in at `/admin/login` with phone and password. The account must hold a founder or moderator role. A correct password on a non-admin account must not open the panel, and the wording of a refusal must not reveal whether the number is an admin number.
- **FR-A2** Every admin mutation, successful or denied, is written to the audit trail.
- **FR-A3** A suspended admin account cannot sign in to the panel.
- **FR-A4** Maintenance mode hides the public site and client app. The staff door stays reachable so a founder can switch it off.

### 5.2 Client transaction management (core of v2)

The original SRS had no operator. Without this section the company cannot correct a client's books, investigate a dispute, or undo a bad record.

- **FR-T1 View.** Staff with `transactions.view` see every client transaction, newest first, with client name, phone, category, type, amount, date, description, origin, and review state. Search by name, phone, category, or detail. Filter by type, origin, and flagged state.
- **FR-T2 Client ledger.** Staff open one client's books (`/admin/clients/{id}`) and see that client's income, expenses, net, goals, and full transaction list.
- **FR-T3 Cancel.** A moderator or founder may delete a **client-origin** row that has not been reversed. This is for a clear mistake (duplicate, wrong client). It is audited. Staff-origin and reversal rows cannot be cancelled this way.
- **FR-T4 Reverse.** A founder may post a **reversal** row against a live transaction. The original stays visible. The reversal carries the same category and amount, `origin = reversal`, and `reverses_id` pointing at the original. Totals treat a reversal as the opposite sign of the original, so the net effect is zero, and history is preserved.
- **FR-T5 Edit.** A founder may change amount, date, category, or description on a **client-origin** row that has not been reversed. The edit is audited with before/after values.
- **FR-T6 Adjust.** A founder may post a **staff correction** (`origin = admin`) onto a client's books: category, amount, date, description. The client sees it and cannot delete it.
- **FR-T7 Review.** A moderator or founder may flag or clear a flag on any row, with a private reason. The flag is invisible to the client.
- **FR-T8 Export.** A founder may download the platform transaction list as CSV.
- **FR-T9 Totals.** Dashboard and admin figures include staff corrections and apply the opposite sign to reversals, so a reversed expense no longer reduces the client's net.

### 5.3 Other admin capabilities

- **FR-A5** View, search, filter, suspend, restore, change plan, reset password, and delete client accounts (plan change and deletion are founder-only).
- **FR-A6** View Premium payments and mark a payment refunded (founder).
- **FR-A7** Answer the support queue (open / answered / closed).
- **FR-A8** Founder-only: manage the admin team, maintenance mode, announcements, and signup switch.

---

## 6. Data model (admin-relevant)

```
profiles            id, phone, email, full_name, plan, suspended, suspended_reason
categories          id, user_id, name, type
transactions        id, user_id, category_id, amount, date, description,
                    origin ('client' | 'admin' | 'reversal'),
                    reverses_id, created_by
transaction_reviews transaction_id, flagged, flag_reason, note, reviewed_by
                    (no client policies — staff only)
savings_goals       id, user_id, title, target_amount, current_amount, target_date
payments            ref, user_id, phone, amount, status
support_messages    ref, user_id, plan, priority, subject, message, status
admin_users         phone, role ('founder' | 'moderator')
admin_audit_log     actor_phone, actor_role, action, target, detail, outcome
platform_settings   maintenance_mode, announcement, signups_enabled
```

Amounts are always stored positive. Sign is derived from the category type, then flipped when `origin = reversal`.

---

## 7. Non-functional requirements

- Page load under 3 seconds on a typical connection.
- HTTPS in production. Service role key never shipped to the browser.
- Parameterised queries only (Supabase client). No string-built SQL from staff input.
- Rendered text is not injected as HTML (XSS).
- Phone numbers and card data: card numbers are never stored; only last four digits. CVC is never stored.
- Staff login page is `noindex, nofollow`.

---

## 8. Out of scope (unchanged)

Bank sync, multi-currency, crypto, native mobile apps, joint accounts, live card acquiring (checkout is currently a recorded mock payment).

---

## 9. Acceptance — client transaction management

A founder signed in at `/admin/login` can:

1. Open `/admin/transactions` and see every client's records.
2. Open a named client's ledger and read income, expense, and net.
3. Cancel a mistaken client row; it disappears from that client's books.
4. Reverse a row; both halves remain visible and net to zero.
5. Edit a client row's amount or category; the client's dashboard totals change.
6. Post a staff correction; the client can see it and cannot delete it.
7. Flag a row; the flag is visible in the panel and absent from the client app.
8. Export CSV of the platform books.

A moderator can do 1–3 and 7, and is refused on 4–6 and 8 with an audit entry of `denied`.
