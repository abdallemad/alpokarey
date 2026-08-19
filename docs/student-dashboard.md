# Student Dashboard — the learner shell and `/dashboard`

> **Scope:** the `(app)` route group — the shell every learner-facing page
> renders inside — and the page that tells a learner where they are and what to
> do next. Plus the certificates list, and a placeholder for the path list.
>
> Related: [`folder-structure.md`](./folder-structure.md) ·
> [`admin-dashboard.md`](./admin-dashboard.md) ·
> [`design-system.md`](./design-system.md) ·
> [`business-analysis.md`](./business-analysis.md) §4.4

> ### ⚠️ The URLs in this document have moved
>
> This document describes the shell and the pages as they were built, and all
> of that still holds — but every route named below has since changed:
>
> | Here | Now |
> |---|---|
> | `/dashboard` | `/dashboard/home` |
> | `/paths` | `/dashboard/paths` |
> | `/account/certificates` | `/dashboard/certificates` |
> | `/learn/[pathId]/[lessonId]` | `/learn/[pathId]/lesson/[lessonId]`, in its own shell |
>
> See [`dashboard-restructure.md`](./dashboard-restructure.md) for the move and
> why, and [`learn-layout.md`](./learn-layout.md) for the player. §9 and §12
> below are also partly superseded — noted inline.

---

## 1. What was built

| Area | Outcome |
|---|---|
| Shell | `(app)` route group: sidebar on the RTL start edge, sticky header |
| Dashboard | `/dashboard` — resume card, four figures, per-path progress, attempts, certificates |
| Certificates | `/account/certificates`, backed by the same query |
| Catalog | `/paths` placeholder, so every nav destination resolves |
| API | `GET /api/me/dashboard`, guarded by the new `requireUser()` |
| Sign-in | Students now land on `/dashboard` instead of the marketing home |
| Refactor | The page shell and error states moved to `components/shared` — the learner app renders the same ones |

Before this, the learner side of the product did not exist: `/` was still the
Next.js starter template and every route lived under `/admin`.

---

## 2. Request flow

```text
UI  ── components/app/dashboard/*
 ↓
Hook ── hooks/use-student-dashboard.ts                 (React Query)
 ↓
Axios ── lib/axios.ts                                  (the only HTTP caller)
 ↓
API ── app/api/me/dashboard/route.ts
 ↓        requireUser(); no business rules
Service ── services/student.service.ts                 (all the computation)
 ↓
Repository ── repositories/student.repository.ts       (the only Prisma importer)
 ↓
Prisma ── lib/db.ts
 ↓
PostgreSQL
```

No layer skips another, exactly as on the admin side.

---

## 3. Files

```text
src/
├── types/student.ts                 # StudentDashboard, EnrolledPath,
│                                    #   NextLesson, StudentStats, …
├── repositories/student.repository.ts
├── services/student.service.ts
├── services/auth.service.ts         # + requireUser()
│
├── app/api/me/dashboard/route.ts    # GET
│
├── hooks/use-student-dashboard.ts
│
├── constants/
│   ├── app-navigation.ts            # the learner sidebar
│   ├── routes.ts                    # + ROUTES.app
│   └── query-keys.ts                # + queryKeys.student
│
├── components/app/
│   ├── layout/
│   │   ├── app-sidebar.tsx
│   │   ├── app-header.tsx
│   │   └── index.ts
│   └── dashboard/
│       ├── student-dashboard-view.tsx
│       ├── student-stat-cards.tsx
│       ├── continue-learning-card.tsx
│       ├── enrolled-path-card.tsx
│       ├── recent-attempts.tsx        # + EarnedCertificates
│       └── student-certificates-view.tsx
│
├── components/shared/                # ← moved here, see §7
│   ├── account-menu.tsx
│   ├── page-container.tsx
│   ├── page-header.tsx
│   ├── error-state.tsx
│   └── api-error-state.tsx
│
└── app/(app)/
    ├── layout.tsx
    ├── dashboard/page.tsx  ·  loading.tsx
    ├── paths/page.tsx                 # placeholder
    └── account/certificates/page.tsx
```

No new dependencies. No schema changes.

---

## 4. The shell — `(app)/layout.tsx`

Deliberately the same skeleton as the admin console: the same `Sidebar`
primitive with `side="right"` (the RTL start edge), the same cookie-backed open
state read on the server so the first paint matches what the learner last
chose, and the same `min-w-0` on the inset. Two halves of one product should
feel like one product, and a fix to the shell should benefit both.

### Navigation

Three destinations, flat, from `constants/app-navigation.ts`:

| Item | Route |
|---|---|
| لوحتي | `/dashboard` (exact match) |
| المسارات | `/paths` |
| شهاداتي | `/account/certificates` |

Short on purpose. `business-analysis.md` §3 describes an audience ranging from
a curious Muslim to an advanced researcher, and a long nav is a tax on the
former. Groups are omitted too — three items do not need headings, and group
labels behave poorly in the collapsed icon rail.

**There is no "مساراتي" entry.** The dashboard *is* the learner's paths, with
progress attached; a second list of the same rows would only raise the question
of which one is authoritative.

The footer shows a "لوحة التحكم" link when Clerk's public metadata marks the
account as an admin. That is a **convenience, not a permission** — the local
`User.role` is the authority, and `/admin` guards itself regardless.

### Header

A Client Component, unlike the admin header. Its title derives from the
pathname, and layouts do not re-render on navigation, so a title passed down
from the layout would go stale on the first link click.

---

## 5. Progress is computed, not read

`Enrollment.progress` is a stored integer, but **nothing in the codebase
currently maintains it** — there is no lesson-completion endpoint yet. Reading
it would mean showing a figure that silently stops matching reality the moment
the player ships.

So the dashboard derives everything from `LessonProgress`:

```text
progress        = round(completed lessons ÷ total lessons × 100)
isCompleted     = total > 0 AND completed == total
nextLesson      = first lesson, in stage.order then lesson.order,
                  with no completed LessonProgress row
overallProgress = round(all completed lessons ÷ all lessons × 100)
```

Three details that matter:

- **A path with zero lessons is 0%, not 100%.** Dividing by zero would
  otherwise congratulate a learner for finishing an empty curriculum. The card
  says the content is not published yet rather than showing a dead 0%.
- **Overall progress is averaged over lessons, not over paths.** A 2-lesson
  path and a 60-lesson path should not weigh the same in one headline figure.
- **Completed lesson ids become a `Set` once**, then every curriculum is walked
  against it in memory. The alternative — a query per lesson — is the obvious
  way to make this page slow.

On the live database the computed figure and the stored column agree for the
learner checked (100% vs `progress=100`), which is reassuring but not something
the code relies on.

---

## 6. What the page shows, in the order a learner asks

1. **أكمل من حيث توقفت** — the resume card. A learner returning to the academy
   has one question, and it is not "how am I doing overall"; it is "where was
   I?". It names the lesson, its stage and its path, and it is the only block
   on the page using `--primary` at full strength, so the primary action is
   unambiguous.

   The target is the **furthest-along unfinished path** — the one with momentum
   behind it — rather than whichever was enrolled in most recently.

2. **Four figures** — enrolled paths, overall progress, completed paths,
   certificates. The progress card carries a bar because a percentage alone
   reads as an abstract number while a bar reads as a distance.

3. **مساراتي** — one card per enrolled path: category, completion and
   certificate badges, a progress bar with `done / total` in words, stage and
   lesson counts, and **the next lesson named** with a "متابعة" button. A bare
   "continue" button asks the learner to remember where they were; naming the
   lesson means they do not have to.

   Sorted least-finished first, with completed paths last: the dashboard's job
   is to answer "what should I do now?", and a finished path never is.

4. **آخر الاختبارات** — the last five attempts, each showing the score **and**
   the passing score, because "70%" means nothing without knowing whether 70
   was enough. Failures are stated plainly rather than hidden; the exam can be
   retaken.

5. **شهاداتي** — certificates earned, newest first.

`/account/certificates` reuses `queryKeys.student.dashboard()` rather than
adding an endpoint: the list is already in the payload, React Query has it
cached from the dashboard visit, and one source means the two screens can never
disagree about how many certificates the learner has.

---

## 7. Access control, and the new guard

`authService.requireUser()` joins `requireAdmin()`. It resolves the Clerk
session to a local `User` row and throws `UnauthorizedError` when there is
none — but it does **not** check the role, because an admin is also a learner.

That is safe only because of how the endpoint is shaped:

- The route is `/api/me/dashboard`, not `/api/students/:id/dashboard`. There is
  no id in the URL to tamper with.
- The Service is handed the `user` object the guard resolved, and every
  repository query filters by that `userId`. There is no "all enrolments" read
  in `student.repository.ts` at all, so a caller cannot serve one learner
  another's history even by mistake.

Verified: unauthenticated `GET /api/me/dashboard` returns
`401 {"success":false,"error":{"message":"يجب تسجيل الدخول للمتابعة","code":"UNAUTHORIZED"}}`.

### The sign-in redirect changed

`/auth-callback` sent students to `ROUTES.home`. They now land on
`/dashboard` — the page that tells them what to do next — while admins still go
to `/admin`. This supersedes the flow drawn in
[`admin-access-control.md`](./admin-access-control.md) §2.

---

## 8. Shared components — a refactor, not a duplication

Building a second shell surfaced four components that were never
admin-specific:

| Moved to `components/shared/` | Why |
|---|---|
| `page-container.tsx` | The padded column any page renders into |
| `page-header.tsx` | Title + description + actions |
| `error-state.tsx` | A failed render, with retry |
| `api-error-state.tsx` | Branches on 401 / 403 / other |

`components/admin/shared/index.ts` re-exports all four, so **no admin import
changed**. `folder-structure.md` already described `components/shared/` as the
domain-neutral layer used by both surfaces; this makes that true.

`AdminUserMenu` became `components/shared/account-menu.tsx` (`AccountMenu`,
with a `signOutRedirect` prop). "Who am I and how do I sign out" is the same
question in both shells, and the alternative was a hundred duplicated lines.

### One bug this surfaced

`ApiErrorState`'s 401 copy read *"sign in with an account that has admin
permission to view the console"* — correct on an admin screen, wrong on a
learner's own dashboard, where it was the first thing a signed-out visitor saw.
It is now neutral: **"انتهت جلستك أو لم تسجّل الدخول بعد. سجّل الدخول
للمتابعة."** The 403 branch stays admin-specific, because only admin endpoints
ever return 403.

---

## 9. Placeholders, and links that lead nowhere yet

> **Partly superseded.** `/paths` is no longer a placeholder — it is the
> learner's own enrolment list, now at `/dashboard/paths`. The player at
> `/learn/…` exists, so the "متابعة" buttons resolve. What remains true is
> `ROUTES.app.path(pathId)` → `/paths/:pathId`, the public catalog's detail
> page, which is still unbuilt.

`/paths` renders a page header and an `EmptyState` explaining the catalog is
being prepared. It exists because every sidebar destination must resolve to a
real page — a nav item that 404s makes the shell impossible to review, the same
reasoning recorded in `admin-dashboard.md` §2.

The dashboard links to two routes that **do not exist yet**:

- `ROUTES.app.lesson(pathId, lessonId)` → `/learn/[pathId]/[lessonId]` — every
  "متابعة" button and the resume card.
- `ROUTES.app.path(pathId)` → `/paths/[pathId]` — "تفاصيل المسار".

Both are centralised in `constants/routes.ts` as functions, so the player and
the path detail page can land without touching a single component. Until then
those links 404 — a known and deliberate state, not an oversight.

---

## 10. Design-system conformance

- Stat grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, per §4.3.
- Category badges reuse `PATH_CATEGORY_CLASSES`; certificates use `--gold`;
  completion uses `--success`; failed attempts use `--destructive`.
- Headings use `font-heading` (Amiri); numbers are `tabular-nums`.
- Dates and numbers go through `utils/format.ts` (`ar-EG-u-nu-latn`).
- Logical properties throughout (`ms-*`, `ps-*`, `end-*`).
- Fixed `ProgressValue`'s physical `ml-auto` → `ms-auto` in
  `components/ui/progress.tsx`, joining the RTL fixes listed in
  `design-system.md` §10.

---

## 11. Verification performed

- `npx tsc --noEmit` — clean for every file in this feature.
- `npx eslint` on every new file — clean.
- `npx next build` — clean; `/dashboard`, `/paths`, `/account/certificates` and
  `/api/me/dashboard` all registered.
- **The whole computation was replicated against the live Neon database** for
  the learner with the most progress rows (12 enrolments, 35 completed lessons,
  5 certificates and 21 attempts in the database overall):

  ```text
  learner: Abdulrahman Wael  role=ADMIN
    "824367":            2/2 lessons = 100%  (stored progress=100)  cert=false
    "مسار جديد تجربة":     6/6 lessons = 100%  (stored progress=100)  cert=true
    "عتبات العبودية":      6/6 lessons = 100%  (stored progress=100)  cert=true
    stats: enrolled=3 inProgress=0 completed=3 · lessons 14/14 → 100% · certificates=2
    continueLesson → none
  ```

  Computed progress matched the stored column in all three cases, and the
  certificate-to-path matching was correct.
- **The next-lesson logic was checked across every learner with partial
  progress**, which is the case the above learner cannot exercise:

  ```text
  … | "تجربة"          2/6 = 33% | next → المرحلة 1: مرجلية ▸ #3 درس جديد يا إخوة
  … | "تجربة"          5/6 = 83% | next → المرحلة 2: مرحلة جديدة … ▸ #2 شرح اي شيء
  … | "عتبات العبودية"  0/6 =  0% | next → المرحلة 1: الإسلام ▸ #1 العتبة الأولى
  … | "مسار جديد تجربة" 1/6 = 17% | next → المرحلة 1: مرحلة 1 ▸ #2 درس 2
  ```

  A 0% path resolves to the very first lesson, and the 83% case correctly
  crosses into the second stage — so the walk follows curriculum order rather
  than stopping at a stage boundary. Progress stayed within 0–100 everywhere.
- `/dashboard` and `/account/certificates` render on the running dev server
  with the shell, the header title and the signed-out state.
- The server-rendered HTML for `/dashboard` contains the sidebar
  (`data-slot="sidebar"`), all three nav labels and hrefs, the brand subtitle,
  and `dir="rtl"`.
- `/paths` renders its placeholder copy.

**Not verified:** the populated dashboard in a browser — the resume card, the
progress bars and the path cards with real data — because that needs a
signed-in session, which this agent cannot establish. Its inputs are covered by
the database checks above, but the rendering is not.

> **Tooling caveat, not an app problem:** the browser pane reports a 0×0
> viewport, so `read_page` returns empty and any width-dependent behaviour
> (the sidebar collapsing to a drawer below 768px) could not be measured. The
> same limitation is recorded in `admin-dashboard.md` §12. Verification used
> `get_page_text` and the server-rendered HTML instead.

---

## 12. Known gaps

> **Partly resolved.** Gap 1 is closed: `progressService` now writes
> `Enrollment.progress` when a lesson is completed. Gap 3 is closed: the player
> exists. Gap 6 — the certificate level — is still open, and
> [`certificates-feature.md`](./certificates-feature.md) §9 carries it forward
> alongside the issuance rules built on top of it. Gaps 2, 4 and 5 stand.

1. **`Enrollment.progress` is never written.** The dashboard computes around
   it, but the column will keep drifting until a lesson-completion endpoint
   maintains it — or it is dropped in favour of the computed value.
2. **No enrolment flow.** A learner cannot enrol from the app yet; the rows in
   the database were created elsewhere. `/paths` is the placeholder where that
   lands.
3. **The lesson player does not exist**, so every "متابعة" button currently
   404s. See §9.
4. **`(app)` pages are not guarded server-side**, exactly as `/admin` is not:
   an unauthenticated visitor sees the shell and a "sign in" state rather than
   being redirected. No data leaks — the API returns 401 — but a redirect would
   be better. `admin-access-control.md` §6 tracks the same gap.
5. **No pagination on attempts or certificates.** Five and all, respectively.
   Fine now; a long-running learner will eventually want more.
6. **The certificate level is still unresolved** — `business-analysis.md` §7
   flags the contradiction between a certificate per stage and
   `Certificate(userId, pathId)`. This page reports whatever the table holds.

---

## 13. Next steps

1. The lesson player at `/learn/[pathId]/[lessonId]`, which turns every
   "متابعة" button into a working link and gives `LessonProgress` something to
   write.
2. The catalog at `/paths` and the detail page at `/paths/[pathId]`, with the
   enrol action.
3. Guard `(app)` pages server-side and redirect signed-out visitors to
   `/sign-in`.
4. Recompute and persist `Enrollment.progress` when a lesson is completed, so
   the admin console's figures agree with the learner's.
