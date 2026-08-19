# Users Feature — the accounts console, and the one field it owns

> **Scope:** `/admin/users` — the accounts table, its search / role filter /
> sort / pagination, the detail sheet, and the role change behind it.
>
> Related: [`admin-access-control.md`](./admin-access-control.md) — where
> accounts come from and what `role` actually gates ·
> [`paths-feature.md`](./paths-feature.md) — the CRUD pattern this copies ·
> [`admin-dashboard.md`](./admin-dashboard.md) §6 — table conventions ·
> [`design-system.md`](./design-system.md) §8.6 — confirmation dialogs

---

## 1. Read-first, by construction

This feature is not CRUD. Accounts are created **by Clerk** and mirrored into
the local `User` table on sign-in — `syncFromClerk`, see
[`admin-access-control.md`](./admin-access-control.md) §2 — so the console has
no business making one.

| Operation | Exists? | Why |
|---|---|---|
| List / read | yes | that is the point |
| Change `role` | yes | the one thing the academy owns rather than Clerk |
| Create | **no** | a second way to make a `User` row, disagreeing with the mirror |
| Edit name / email / avatar | **no** | mirrored from Clerk; any edit here is overwritten on their next sign-in |
| Delete | **no** | cascades to enrolments, progress, attempts and certificates — a learner's whole history — and Clerk would recreate the row anyway. Removing someone is a Clerk-side action |

So there is no "new user" button, no row menu, and no delete dialog. There is a
table, a panel, and one switch.

---

## 2. Request flow

```text
UI  ── components/admin/users/*
 ↓
Hook ── hooks/use-users.ts                     (list · detail · role mutation)
 ↓
Axios ── lib/axios.ts
 ↓
API ── app/api/users/route.ts                  GET   (list)
       app/api/users/[userId]/route.ts         GET · PATCH
 ↓        requireAdmin() first, always
Service ── services/user.service.ts            listUsers · getUser · updateRole
 ↓
Repository ── user.repository.findMany · findDetailById · countByRole · update
 ↓
Prisma → PostgreSQL   (+ a best-effort write to Clerk, §6)
```

---

## 3. Files

```text
src/
├── app/(admin)/admin/users/page.tsx    # was a placeholder EmptyState
├── app/api/users/
│   ├── route.ts                        # NEW — GET (list)
│   └── [userId]/route.ts               # NEW — GET · PATCH
│
├── components/admin/users/             # NEW folder
│   ├── users-view.tsx                  #   filters, table, pager, sheet state
│   ├── users-table.tsx                 #   identity · role · counts · joined
│   ├── user-detail-sheet.tsx           #   the panel and the role control
│   ├── user-role-badge.tsx             #   one badge, three places
│   └── index.ts
│
├── hooks/use-users.ts                  # NEW
├── types/user.ts                       # NEW
├── validation/user.schema.ts           # NEW
├── constants/user.ts                   # NEW
├── constants/query-keys.ts             # + users.list / users.detail
├── repositories/user.repository.ts     # + findMany, findDetailById, countByRole
└── services/user.service.ts            # + listUsers, getUser, updateRole
```

No new dependencies.

---

## 4. The list

`GET /api/users` behind `requireAdmin()` — including the read. A list of who
studies here, with their email addresses, is privileged whether or not anything
is written.

| Control | Values |
|---|---|
| Search | one box, matching **name OR email** — an admin has one of the two and should not have to know which |
| Role | `all` · `ADMIN` · `STUDENT` |
| Sort | `newest` (default) · `oldest` · `name` · `email` |
| Page size | 10, fixed |

Sorting by name uses `{ sort: "asc", nulls: "last" }`: Clerk allows an account
with no name at all, and without it the list would open on a column of blanks.

Filter state lives in the URL exactly as on `/admin/paths` — refreshing keeps
the view, the back button steps through filters, and React Query caches each
combination independently. Any filter change resets `page`.

### The open account is in the URL too

`?user=<id>` is what opens the sheet. A panel held in component state
disappears on refresh and cannot be linked; in the query string it survives
both, and an admin can send a colleague the exact account they are looking at.
It is stripped when the sheet closes.

---

## 5. The detail sheet

A `Sheet`, not a page. Reviewing accounts is a scanning job — open three in a
row looking for the one you mean — and a detail page would cost a navigation
each way and lose the table's scroll position and filters every time.

`side="left"`, because physical left is the **end** edge in RTL: it opens away
from the navigation rather than over it, the same reasoning
`marketing-mobile-nav.tsx` records for the public drawer.

It is controlled by the **id**, not by a boolean, so one mounted sheet serves
every row — and `useUser` only fires once a row is picked, rather than
pre-fetching a panel for every row of a table.

What it shows: avatar, display name, email, role badge · four figures
(enrolments · completed lessons · quiz attempts · certificates) · joined and
last-synced dates · their most recent enrolments with each one's progress bar ·
the role control.

### The figures are the stored columns

`_count` over the relations, and `Enrollment.progress` as written. The learner's
own dashboard *reconciles* that column against `LessonProgress` before showing a
percentage ([`student-dashboard.md`](./student-dashboard.md) §5); this panel
deliberately does not. An admin looking at an account should see what the
database holds — which is what the rest of the console reads too — rather than a
figure derived for a different audience. The two can differ on legacy rows, and
that difference is a fact about the data worth being able to see.

The enrolment list is capped at `USER_PATHS_LIMIT` (8) and says so when there
are more, so "8 paths" cannot be misread off a panel belonging to a learner with
twenty.

---

## 6. The role change

One button that flips the role, behind an `AlertDialog` — not a select that
applies on change. Promoting someone hands them the entire console, and a
permission changed by brushing past a dropdown is the kind of accident
discovered later. `design-system.md` §8.6 puts consequential actions behind a
confirmation, and this is one.

### Three refusals, decided on the server

| Rule | Status | Why |
|---|---|---|
| You cannot change **your own** role | 409 | an admin who demotes themselves is locked out of the console that would undo it |
| The **last** administrator cannot be demoted | 409 | an academy with no admin has no way back in short of editing the database by hand — the same reasoning that makes `syncFromClerk` bootstrap the first account |
| Unknown account | 404 | a stale panel gets the honest answer |

Setting the role an account already holds is a **no-op**, not an error: two
tabs, a double click and a stale cache all end in the same state.

`isSelf` is computed by the Service from the actor the guard resolved, and
travels on the DTO. That is why the UI can be trusted to disable the button: the
flag it renders and the rule the endpoint enforces are the same answer, not two
implementations of it.

### The `ADMIN_EMAILS` interaction, surfaced

`syncFromClerk` re-promotes an allowlisted address on **every** sign-in and
never demotes. So demoting an account whose email sits in `ADMIN_EMAILS` holds
only until that person signs in again.

Rather than silently letting an admin discover that later, `UserDetail` carries
`isAllowlistedAdmin` and the panel says it out loud above the button. The
console does not try to edit `.env`.

### The Clerk mirror

After the local write, the new role is copied into Clerk's `publicMetadata` —
**best effort, and deliberately not fatal.**

The local `User.role` column is the authority; `requireAdmin()` reads it and
nothing else. A failed Clerk write therefore leaves authorisation *correct* and
one convenience stale, which is why it is logged rather than thrown: a
promotion that succeeded in the database must not report itself as a failure, or
the admin presses the button again on a row that is already right.

What the copy buys: the learner shell reads `publicMetadata.role` to decide
whether to show the "لوحة التحكم" shortcut, and the marketing header does the
same. Without it a freshly promoted admin would have to type `/admin` by hand.
This is the **first write this app makes to Clerk** — until now the sync ran one
way only.

---

## 7. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- **Every query executed against the live Neon database**, with the exact
  select, `where` and `orderBy` shapes the repository uses:

  | Query | Result (4 accounts: 3 ADMIN, 1 STUDENT) |
  |---|---|
  | default | 4, newest first |
  | `role=ADMIN` / `role=STUDENT` | 3 and 1 — they sum to the unfiltered 4 |
  | `sort=name` | Latin names, then Arabic; `nulls: last` accepted |
  | `sort=email` / `sort=oldest` | distinct, correct orderings |
  | `search=جمبري` | 1 — Arabic name matching works |
  | `search=gmail` | 4 — email substring matching works |
  | `pageSize=2&page=2` | `totalPages: 2`, the last two rows |
  | detail select | filtered `_count` on `lessonProgress` accepted; counts and enrolment rows returned |

- **The refusal matrix rehearsed read-only** over the real accounts: with a real
  admin as actor, their own row resolves to `409 self`, the student resolves to
  *allowed → ADMIN*, and the other two admins resolve to *allowed → STUDENT*
  (three admins exist, so the last-admin rule correctly does not fire). No row
  is allowlisted in the current `.env`.
- **The page renders.** `/admin/users` shows the header, the search box and both
  filter selects ("كل الصلاحيات", "الأحدث انضمامًا"). Signed out, the table area
  renders `ApiErrorState`'s 401 branch — "يجب تسجيل الدخول" with a sign-in link
  — which is the documented behaviour for an unguarded admin page.
- **The guard holds.** `GET /api/users`, every filter combination, and
  `GET /api/users/:id` all return `401` in the standard envelope with no
  session. Note that `?role=SUPERUSER` also returns 401 rather than 422: the
  guard runs before the schema parse, the same order the paths routes use.

**Not verified:**

- **The authenticated screens** — the populated table, the sheet opening, and a
  role actually changing. All of it needs a signed-in ADMIN session, which this
  agent cannot establish. The queries and the decision rules underneath were
  exercised against real rows instead.
- **The Clerk `publicMetadata` write**, for the same reason. It is wrapped in
  `try/catch` and logged, so its failure mode is a stale convenience rather than
  a failed promotion.
- `npx next build` — a dev server holds `.next` on port 3000.

**Recommended first manual test:** sign in as an ADMIN, open `/admin/users`,
confirm the four accounts list; open your own row and confirm the button is
disabled with the "هذا حسابك" note; open the student and promote them; confirm
the toast, the badge moving in the table behind the panel, and `?user=<id>`
surviving a refresh. Then demote them back.

---

## 8. Open items

1. **`/admin` is still not guarded server-side.**
   [`admin-access-control.md`](./admin-access-control.md) §6 records this: a
   non-admin can load the console shell and every request inside returns 401/403.
   No data leaks — this page is proof, since signed out it renders nothing but
   the sign-in state — but a redirect would be better than an empty console.
2. **No Clerk webhook.** A profile edited in the Clerk dashboard, or an account
   deleted there, is not reflected until the person next signs in. The list can
   therefore show a stale name or an orphaned row. Same gap as §6 of that
   document, unchanged by this feature.
3. **No audit trail.** Who promoted whom, and when, is not recorded anywhere. For
   the one permission in the system that matters, that is worth adding before
   the academy has more than a handful of administrators.
4. **Search is `contains`, not full text.** Fine at four accounts and at four
   thousand; a real index becomes worthwhile well after that.
