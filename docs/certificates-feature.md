# Certificates — earning one, and the document it produces

> **Scope:** the certificate button in the player's header, `POST /api/me/certificates`,
> `GET /api/me/certificates/:id`, and `/dashboard/certificates/[certificateId]`.
>
> Related: [`learn-layout.md`](./learn-layout.md) — the header the button lives
> in · [`dashboard-restructure.md`](./dashboard-restructure.md) — where the
> certificate page sits · [`student-dashboard.md`](./student-dashboard.md) §5 —
> how progress is computed · [`folder-structure.md`](./folder-structure.md)

---

## 1. What was built

| Area | Outcome |
|---|---|
| Button | `PathCertificateButton` in the player header — four states |
| Issue | `POST /api/me/certificates` — guarded, idempotent, server-decided |
| Read | `GET /api/me/certificates/:id` — owner-scoped |
| Page | `/dashboard/certificates/[certificateId]` — the document |
| Redirect | Issuing sends the learner straight to their certificate |
| List | Rows in "شهاداتي" now link to the certificate they name |

The `Certificate` table existed and the dashboard counted rows in it, but
**nothing in the app had ever written one**. This is the write path.

No schema changes. No new dependencies.

---

## 2. Request flow

```text
UI  ── components/app/learn/path-certificate-button.tsx
 ↓        (state from LearnCurriculum.certificate — the server's verdict)
Hook ── hooks/use-certificate.ts                    (React Query)
 ↓
Axios ── lib/axios.ts                               (the only HTTP caller)
 ↓
API ── app/api/me/certificates/route.ts             POST
 ↓        requireUser(); zod-parses { pathId }; no business rules
Service ── services/certificate.service.ts          (all the rules)
 ↓
Repository ── repositories/certificate.repository.ts
 ↓
Prisma ── lib/db.ts
 ↓
PostgreSQL
```

No layer skips another, exactly as on every other feature.

---

## 3. The rule, in one place

Eligibility is a pure function in `utils/certificate.ts`:

```ts
canIssue =
  certificateId === null &&        // not already held
  isCertificationActivated &&      // the admin turned it on for this path
  lessonsCount > 0 &&              // an empty curriculum certifies nothing
  isPathCompleted                  // every lesson done
```

It is pure — no database, no React — so **both** sides can call it:

- `learnService.getCurriculum` calls it and ships the verdict on the curriculum
  payload as `LearnCurriculum.certificate`. That is what the button reads.
- `certificateService.issue` calls it again, on figures it re-read from the
  database, before writing anything.

The client's copy decides what the button *looks like*. It never decides whether
the row is written. A learner who posts to the endpoint directly gets the same
refusal the button was showing — from `toCertificateBlockReason`, the same
function that fills the disabled button's tooltip, so the two sentences cannot
drift apart.

### "Completed" means what the player says it means

This is the load-bearing detail of the whole feature.

`student-dashboard.md` §5 records that progress is **reconciled** from two
records: the `LessonProgress` rows, and the `Enrollment.progress` column that
predates them. Most enrolments in the database carry a stored percentage with no
lesson rows to account for it, and the learner is shown whichever is higher.

If the certificate gate counted only ticked lessons, a learner looking at a
100% bar would press a button that answered *"you have not finished"*.

So the reconciliation was extracted to `utils/progress.ts` —

```ts
reconcileProgress(computed, stored)   // → { progress, usesStoredProgress }
isPathComplete({ enrollmentIsCompleted, lessonsCount, progress })
```

— and `student.service.ts`, `learn.service.ts` and `certificate.service.ts` all
call it instead of each keeping an inline copy. The gate now reads the figure
the learner is actually looking at.

This is not theoretical. Replayed against the live database, one of the four
enrolments is `0/1` lessons ticked with `Enrollment.progress = 100`. Under a
tick-only rule its button would be disabled while its progress bar read 100%.
See §8.

### Why `isPathComplete` honours `Enrollment.isCompleted`

An admin — or the old system — may have marked an enrolment complete without the
lesson rows to prove it. Demoting such a learner would take back something they
were already told they had.

### Why an empty path is never complete

The same reason `toProgressPercent` calls it 0%: an empty curriculum is the
academy's gap, not the learner's achievement. Certifying it would be absurd.

---

## 4. The button — four states

`PathCertificateButton`, in the player's header. It sits in the chrome rather
than at the foot of the final lesson because a learner does not know which
lesson is the last one until they are past it, and a button that appears once,
on one screen, is a button most people never see. Here it is visible from the
first lesson onwards, so finishing the path has a destination the whole way
through.

| State | When | Renders |
|---|---|---|
| **Absent** | `certificationActivated = false` | nothing |
| **Disabled** | lessons outstanding | greyed, `--gold` icon, tooltip with the reason |
| **Enabled** | every lesson done, none held | `bg-gold` — the achievement token |
| **"عرض الشهادة"** | already held | outline link to the certificate |

**Absent, not permanently disabled**, when the admin never activated
certification: there is no certificate to earn on that path, ever, and a dead
button in the header of every lesson of every uncertified path is noise.

The tooltip's trigger is a `<span>` wrapper, not the button. A disabled button
gets `pointer-events-none` from the button variants, so hovering it would never
open a tooltip — and the reason it is disabled is the only thing worth saying.

`--gold` throughout: [`design-system.md`](./design-system.md) §2.2 reserves that
token for achievement.

---

## 5. Issuing

`POST /api/me/certificates`, body `{ pathId }`.

Under `/me`, like the dashboard and the player: the recipient is always whoever
holds the session. The body names the **path**, never the person, so there is no
id here that could issue someone else a certificate. `requireUser()`, not
`requireAdmin()` — earning a certificate is the learner's own act.

The Service checks, in this order:

1. `requireEnrollment(user.id, pathId)` — the same guard the rest of the
   learning experience uses, imported from `learn.service.ts` rather than
   copied. Not enrolled → **403 `NOT_ENROLLED`**.
2. The path exists → else **404**.
3. A certificate is already held → return it. Not an error.
4. Recompute completion, run the rule → **409** with the reason if it refuses.
5. Create.

Step 3 before step 4 is deliberate: the common case of a learner clicking a
button that should have said "view" costs three index lookups and no completion
arithmetic.

**409, not 403**, on refusal: nothing about *who* is asking is wrong. The path is
simply not in a state where a certificate exists to be given yet.

### Idempotence

`Certificate` is unique on `(userId, pathId)`. Two requests can both pass the
step-3 check and arrive at the create together — a double click is the ordinary
way that happens.

The repository resolves it with an `upsert` and an empty `update`:

```ts
db.certificate.upsert({
  where: { userId_pathId: { userId, pathId } },
  create: { userId, pathId },
  update: {},
  …
})
```

One atomic statement instead of a create, a `P2002` catch and a re-read — and it
keeps Prisma out of the Service layer, which `folder-structure.md` requires. The
empty `update` means the original `issuedAt` survives: a learner who clicks twice
does not get their certificate re-dated. The same pattern as
`lessonProgressRepository.upsert`.

The endpoint answers **201 in every success case**, including the "already held"
one. Reporting a different status for the second click of the same button would
only make the client handle a distinction it does not care about.

### After a successful issue

`useIssueCertificate` does three things, then the button redirects:

1. **Seeds** `queryKeys.student.certificate(id)` with the payload the endpoint
   just returned — so the redirect lands on a page that is already populated. The
   learner presses a button and sees their certificate, with no second spinner.
2. **Invalidates `student.all`** — the dashboard's certificate count and the
   certificates list are both wrong the instant this succeeds.
3. **Invalidates `learn.path(pathId)`** — the curriculum carries the eligibility
   verdict that drove the button, so without this the button would still offer to
   issue a certificate that now exists.

Then `router.push(ROUTES.app.certificate(id))`.

---

## 6. Reading one

`GET /api/me/certificates/:certificateId`.

The id in the URL narrows the search; it does not authorise it. The repository
query filters by `userId` too:

```ts
db.certificate.findFirst({ where: { id: certificateId, userId }, … })
```

so the ownership check is part of the query rather than something the Service
has to remember afterwards. A certificate belonging to someone else is **404**,
indistinguishable from an id that was never real — a 403 would itself confirm
that a given certificate exists.

The payload is the row plus what the document needs: the recipient's name
(through `toDisplayName`, moved to `utils/user.ts` so the greeting on the
dashboard and the name on the certificate cannot disagree), the path, and how
much curriculum it stands for.

---

## 7. The page

`/dashboard/certificates/[certificateId]` — laid out as a certificate rather
than as a detail record. A framed `--gold` panel: the academy above, "شهادة
إتمام", the recipient's name large in the heading face (Amiri), the path
beneath it, then stages, lessons and the issue date, then the certificate id in
a monospace face so it can be read aloud or typed without ambiguity.

The reward for months of study should not look like a table row.

A print button is included, and the action bar carries `print:hidden` — a
printed certificate should carry the document and nothing else. The page usually
renders with **no request at all**, from the cache the mutation seeded.

The rows in "شهاداتي" now link here. Before this feature there was nowhere for
them to point, so they were inert text.

---

## 8. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- `npx next build` — clean; `/api/me/certificates`,
  `/api/me/certificates/[certificateId]` and
  `/dashboard/certificates/[certificateId]` all registered.
- Both endpoints return **401** unauthenticated, with the shared Arabic body:
  `{"success":false,"error":{"message":"يجب تسجيل الدخول للمتابعة","code":"UNAUTHORIZED"}}`.
- **The eligibility rule was replayed against the live database** for every
  enrolment, computing exactly what `utils/progress.ts` and
  `utils/certificate.ts` compute:

  ```text
  learner       path                      lessons  stored  progress  src     done  certOn  held  button
  Abdalla Emad  مسار بعد ما مسحت الدات      0/1     100      100     enrol   yes   yes     no    ENABLED
  Abdalla Emad  مسار                        2/2     100      100     lesson  yes   no      no    HIDDEN
  جمبري فينو    مسار                        2/2     100      100     lesson  yes   no      no    HIDDEN
  جمبري فينو    مسار بعد ما مسحت الدات      1/1     100      100     lesson  yes   yes     no    ENABLED
  ```

  Invariants asserted and holding across all rows: no button is enabled on an
  unfinished path, no button is enabled where a certificate is already held, no
  "view" state without a row behind it, and every progress figure inside 0–100.

  Row 1 is the case §3 is about: `0/1` lessons ticked, stored progress 100. A
  tick-only gate would have disabled its button against a 100% progress bar.
  Rows 2 and 3 are complete but uncertified paths — correctly hidden, with
  "لم تُفعَّل شهادة هذا المسار." as the reason.

**Not verified:**

- **The issue and read endpoints against a real session.** Both need a signed-in
  learner, which this agent cannot establish. Their guards are verified (401),
  and the rule they enforce is verified against the data (above), but the
  round trip is not.
- **The "عرض الشهادة" state and the certificate page with real data.** The
  `Certificate` table is currently empty, so no learner holds one to render.
- **The disabled-with-tooltip state against real data.** No enrolment in the
  database is partially complete on a certified path, so that branch is
  exercised by the rule but not by any current row.

---

## 9. Known gaps

1. **A certificate is issued on lessons alone.** The stage final exams are not
   required to have been passed. `business-analysis.md` §7 already flags that
   the certificate *level* is unresolved — a certificate per stage versus
   `Certificate(userId, pathId)` — and requiring finals is the same open
   question. The rule lives in one pure function, so tightening it is one edit.
2. **No public verification page.** The certificate prints its id, but there is
   no route where a third party can check one — every read is owner-scoped by
   design. A public `/certificates/verify/:id` returning only the name, the path
   and the date would be the natural addition.
3. **No PDF.** "Print" is `window.print()` against the page's own styles.
4. **A certificate survives its path changing.** If an admin adds a stage after
   a learner is certified, the certificate stands and the learner's progress
   drops below 100%. That is arguably correct — they completed what existed —
   but nothing records *what* the path looked like when it was earned.
5. **`certificationActivated` is not re-checked after issue.** An admin turning
   it off does not revoke certificates already granted. Also arguably correct,
   also undocumented policy until now.
