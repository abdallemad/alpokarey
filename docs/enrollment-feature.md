# Enrollment — joining a path, and landing in the first lesson

> **Scope:** `POST /api/paths/:pathId/enroll`, the Service and Repository
> behind it, the `EnrollButton`, and the redirect into
> `/learn/:pathId/lesson/:lessonId` that follows.
>
> Related: [`path-detail-feature.md`](./path-detail-feature.md) — the page the
> button sits on · [`learn-layout.md`](./learn-layout.md) — where it lands ·
> [`student-dashboard.md`](./student-dashboard.md) — where enrolments are read ·
> [`certificates-feature.md`](./certificates-feature.md) — the other learner
> write, and the model this one copies · [`folder-structure.md`](./folder-structure.md)

---

## 1. The shape of the feature

`Enrollment` is the row the entire learning experience rests on.
`learnService.requireEnrollment` refuses the curriculum, every lesson, every
exam and the certificate without it. Until now **nothing in the product could
create one** — rows existed only from seeding — so a learner could look at the
catalog and had no way in.

The interaction is one click, and it ends somewhere:

```text
[التسجيل في المسار]  →  POST /api/paths/:id/enroll  →  201 { startLessonId }
                                                          ↓
                                    router.push(/learn/:id/lesson/:startLessonId)
```

**Enrolling is never the point.** Nobody wants an enrolment row; they want to
start studying. So the endpoint that creates the row also answers "which lesson
do I open", and the client goes straight there rather than leaving the learner
on a page whose only change would be that a button now says something else.

---

## 2. Request flow

```text
UI  ── components/enrollment/enroll-button.tsx
 ↓
Hook ── hooks/use-enrollment.ts → useEnrollInPath()     (mutation + redirect)
 ↓
Axios ── lib/axios.ts
 ↓
API ── app/api/paths/[pathId]/enroll/route.ts           (requireUser)
 ↓
Service ── services/enrollment.service.ts → enroll()
 ↓
Repository ── path.repository.findSummary
              enrollment.repository.findByUserAndPath / upsert
              learn.repository.findLessonIdsByPath
              lesson-progress.repository.findCompletedIds
 ↓
Prisma → PostgreSQL
```

---

## 3. Files

```text
src/
├── app/api/paths/[pathId]/enroll/
│   └── route.ts                        # NEW — POST, no body
│
├── services/enrollment.service.ts      # NEW — the rules
├── repositories/enrollment.repository.ts  # + upsert(), shared enrollmentSelect
├── repositories/learn.repository.ts    # findLessonIdsByPath now ordered (§7)
│
├── hooks/use-enrollment.ts             # NEW — mutation, invalidation, redirect
├── components/enrollment/              # NEW folder
│   ├── enroll-button.tsx
│   └── index.ts
│
├── types/enrollment.ts                 # NEW — EnrollmentResult
└── validation/path.schema.ts           # + pathIdParamSchema (shared)
```

---

## 4. The endpoint

`POST /api/paths/:pathId/enroll` — **no request body.**

The path comes from the URL and the learner comes from the session, so there is
nothing left for a caller to supply, and nothing to tamper with. That is why
there is no `validation/enrollment.schema.ts` even though
`folder-structure.md` lists one: the only input is the id in the path, and it is
validated with the `pathIdParamSchema` this feature shares with the overview
read. A schema file describing an empty object would be ceremony, not a
contract.

`requireUser()`, not `requireAdmin()` — enrolling is the learner's own act, and
an admin is also a learner. Whether they *may* enrol in this particular path is
a question about the path's publication state, answered in the Service, which
re-reads the database rather than trusting the caller.

Always **201**, including when the learner was already enrolled. The Service is
idempotent, and reporting a different status for the second click of one button
would make every client handle a distinction it does not care about. The `isNew`
flag in the body carries that nuance for the toast — the same choice
`POST /api/me/certificates` made.

| Case | Status | Body |
|---|---|---|
| New enrolment | 201 | `EnrollmentResult` with `isNew: true` |
| Already enrolled | 201 | `EnrollmentResult` with `isNew: false`, progress untouched |
| Path not published | 409 | `هذا المسار لم يُنشر بعد، ولا يمكن التسجيل فيه حاليًا.` |
| Unknown path | 404 | `المسار المطلوب غير موجود` |
| Malformed id | 422 | `{ pathId: ["معرّف المسار غير صالح"] }` |
| No session | 401 | `يجب تسجيل الدخول للمتابعة` |

---

## 5. Service rules

```ts
enrollmentService.enroll(user, pathId): Promise<EnrollmentResult>
```

**1. Only a published path may be joined.** A draft is the admin's workspace.
`pathService` already refuses to publish a path with no stages, so "published"
is the academy's own signal that there is something here to study.

**2. The enrolment is checked *before* the publication rule.** The two reads run
in parallel, but the order of the *checks* is deliberate: a learner who joined a
path that has since been unpublished must never be told they may not join the
course they are already studying. It is the same asymmetry
`pathService.getPathOverview` applies to the page this button sits on — the
admin's editorial decision does not reach backwards into an existing enrolment.

**3. Enrolling twice is not an error.** A double-clicked button, a retried
mutation on a flaky connection, two open tabs — all return the enrolment already
held. The learner cannot tell the difference, which is the point.

---

## 6. Why the write is an `upsert` with an empty `update`

```ts
db.enrollment.upsert({
  where:  { userId_pathId: { userId, pathId } },
  create: { userId, pathId },
  update: {},                    // already enrolled — change nothing
  select: enrollmentSelect,
})
```

Two separate hazards, one statement:

- **The race.** A double click fires two requests. Both read "not enrolled",
  both write. A `create` loses that race with a unique-constraint violation,
  which `handleRouteError` would surface to the learner as a 500 on a button
  that actually worked. The unique `(userId, pathId)` index resolves it inside
  the database instead.
- **The reset.** `update: {}` means a repeat enrolment cannot touch `progress`
  or `isCompleted`. A learner returning to the path page after finishing half of
  it — and pressing a button a stale cache still labelled "التسجيل" — would
  otherwise erase their own history with it.

`enrollmentSelect` is shared by `findByUserAndPath` and `upsert`, so the Service
handles a found row and a created row identically.

---

## 7. Where to start — `resolveStartLesson`

```text
lessonIds = learnRepository.findLessonIdsByPath(pathId)   // curriculum order
  empty            → null   → client falls back to /learn/:pathId
  new enrolment    → lessonIds[0]
  existing         → first id not in LessonProgress, else lessonIds[0]
```

Three things worth naming:

- **The order is the curriculum's order.** `findLessonIdsByPath` now sorts by
  `stage.order`, then `lesson.order`, then `id` — the identical tie-break
  `learn.repository.ts`'s `curriculumSelect` and
  `path.repository.ts`'s `overviewSelect` use. All three have to agree, or the
  lesson this endpoint names is not the lesson at the top of the syllabus the
  learner just read. The function already existed for the certificate gate,
  which only counts the ids; ordering costs it nothing, and one query with a
  guarantee beats two without.
- **A fresh enrolment skips the progress read entirely.** Nothing can be
  completed in a row that did not exist a moment ago.
- **A repeat resumes.** Same rule as `/learn/:pathId` and the dashboard's resume
  card: the first unfinished lesson. A learner who has finished everything gets
  the first lesson back, because "review" is the only remaining meaning of
  "open this path".
- **`null` means the path has no lessons.** That is the academy's gap, not the
  learner's. The client redirects to `/learn/:pathId`, whose `LearnEntryView`
  says so properly, rather than to a lesson URL built out of nothing.

---

## 8. The client

### `useEnrollInPath(pathId)` — the mutation owns the redirect

**Not optimistic**, unlike `useLessonProgress`. That one toggles a tick the user
can watch fail and be put back; this one *navigates*, and navigating on a write
that has not landed would drop the learner into a player that refuses them —
the curriculum behind it is gated on the very row the request is creating.

`push`, not `replace`: the path page is a real place they came from, and the
back button should return them to it.

Three caches are invalidated, because three screens are now wrong:

| Key | Why |
|---|---|
| `paths.overview(pathId)` | The page the button is on derives its whole call to action from `viewer` |
| `student.all` | `/dashboard` and `/dashboard/paths` both count enrolments, and there is one more |
| `learn.path(pathId)` | The player may hold a cached refusal from a visit made before this enrolment existed |

The redirect lives in the hook rather than the component, following
`useCreatePath`, so the catalog card can reuse the same button later and land in
exactly the same place.

### `EnrollButton` — one control, three renders

| Viewer | Renders | Goes to |
|---|---|---|
| Signed out | `أنشئ حسابك للتسجيل` | `/sign-up` |
| Signed in, not enrolled | `التسجيل في المسار` | the resolved lesson, after the write |
| Enrolled | `متابعة التعلّم` | `/learn/:pathId/lesson/:startLessonId` |

Which one is decided **entirely by the `viewer` object the server sent**, never
by asking Clerk on the client. That matters because the server is also what the
enrolment endpoint will check: a button drawn from the same answer the API will
give cannot offer something the API then refuses.

The enrolled case is a plain link, not a mutation. The row already exists, and
re-posting an enrolment on the way into a lesson would be a write nobody asked
for.

The button is **disabled when the path has no lessons**. Enrolling would
succeed and then strand the learner in a player with nothing to play; refusing
on the page that can explain it is kinder than explaining it there.

---

## 9. What is deliberately not here

- **Unenrolment.** `folder-structure.md` names the feature "enroll/unenroll",
  but deleting an enrolment cascades to nothing useful and destroys
  `LessonProgress` and any certificate trail — the same reasoning that makes
  `pathService.deletePath` refuse a path with enrolments. If it is ever wanted,
  it should be a soft "hide from my paths", not a delete.
- **`/account/my-paths`**, which that document also names, already exists as
  `/dashboard/paths` — see
  [`dashboard-restructure.md`](./dashboard-restructure.md) and
  [`student-dashboard.md`](./student-dashboard.md).
- **Returning to the path page after signing up.** Clerk lands new accounts on
  `/auth-callback`, which sends learners to their dashboard. Carrying an
  intended destination through sign-up would mean teaching that route to honour
  a redirect parameter, which is an auth change rather than an enrolment one.
  Today the visitor signs up, lands on their dashboard, and has to find the path
  again.

---

## 10. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- **The guard, from the browser, signed out:** `POST /api/paths/<real id>/enroll`
  → `401 {"success":false,"error":{"message":"يجب تسجيل الدخول للمتابعة","code":"UNAUTHORIZED"}}`.
  A malformed id → `422` with `details.pathId`; an unknown id → `404`.
- **`resolveStartLesson` rehearsed read-only against the live database**, over
  every real enrolment in it: for each, the ordered lesson ids and the learner's
  completed rows were fetched and the resume target computed exactly as the
  Service computes it. Each produced a real lesson and a well-formed
  `/learn/:pathId/lesson/:lessonId` URL, including the finished-path case, which
  correctly fell back to the first lesson. The reconciled percentage matched the
  stored column where the column was ahead — the `usesStoredProgress` branch.
- **Ordering invariant checked against the database:** the flattened lesson
  order from `overviewSelect` is byte-identical to `findLessonIdsByPath`'s
  ordered query, which is what guarantees the redirect target is the first row
  of the outline the learner just read.
- **The button, signed out**, renders the sign-up branch on the real page and
  links to `/sign-up`.

**Not verified:** the authenticated happy path — pressing التسجيل, the row being
written, the toast, and the redirect landing in the player. It needs a signed-in
Clerk session, which this agent cannot establish, and it would write a real
enrolment into the live database. Everything under it was exercised as far as it
can be without a session: the guard returns 401, the Service's reads run against
real rows, and the redirect URL it would produce was computed from them.

**Recommended first manual test:** sign in as a STUDENT, open a published path
from the landing page, press التسجيل في المسار, and confirm (1) the toast, (2)
the URL becomes `/learn/<pathId>/lesson/<first lesson id>`, (3) the player's
sidebar shows the curriculum, and (4) returning to `/paths/<pathId>` now shows
the progress bar and متابعة التعلّم. Then press the button twice quickly on a
second path to confirm the idempotent branch reports "أنت مسجّل في هذا المسار"
rather than failing.
