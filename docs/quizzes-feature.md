# Quizzes Feature — exams, and what each one is attached to

> **Scope:** `/admin/quizzes` (list), `/admin/quizzes/new` (create),
> `/admin/quizzes/[quizId]` (edit + read-only questions), and the full stack
> behind them.
>
> The organising idea: **an exam is either a stage's final or a lesson's** —
> and the console's job is to make which one obvious, filterable, and editable.
>
> This follows the pattern set by [`paths-feature.md`](./paths-feature.md),
> [`stages-feature.md`](./stages-feature.md) and
> [`lessons-feature.md`](./lessons-feature.md).
>
> Related: [`folder-structure.md`](./folder-structure.md) ·
> [`design-system.md`](./design-system.md) ·
> [`business-analysis.md`](./business-analysis.md) §4.4

---

## 1. The two kinds of exam — and the third

`business-analysis.md` §4.4 specifies one final exam per stage, with a
certificate on passing. The data model supports that plus per-lesson exams, but
it spreads the answer across **two tables**:

| Kind | How it is stored | Meaning |
|---|---|---|
| `FINAL` | `Quiz.isFinal = true` | The stage's closing exam |
| `LESSON` | some `Lesson.quizId` points at it | Belongs to that lesson, shown with it |
| `UNLINKED` | neither | Exists, but no student can reach it |

So **`kind` is derived, never stored**. `quizService.toKind()` computes it, and
`isFinal` takes precedence: a stray `Lesson.quizId` pointing at a final exam
must not reclassify it, because the final belongs to the stage.
`quizRepository.kindWhere()` filters with exactly the same precedence, so the
badge on a row and the filter that found it can never disagree.

`UNLINKED` is not an error state, but it is worth surfacing: those exams are
invisible to students. They get the `--warning` token and their own filter
value, because "which exams did I write and forget to attach?" is a real
question. On the live database today: 5 final, 6 lesson-linked, 2 unlinked.

### Why the link is written to `Lesson`, not `Quiz`

There is no `Quiz.lessonId`. The relation is `Lesson.quizId` — one-to-many, so
a quiz *could* be claimed by several lessons. The editor only ever sets one,
and `linkedLessons` is still typed as an array because that is what the schema
permits and hiding it would be a lie. Attaching an exam to a lesson is
therefore a write to the **Lesson** table, performed by `quizService` through
`lessonRepository.setQuizLink()`.

That helper clears and sets in **one transaction**: a half-applied relink would
leave an exam attached to two lessons, or to none while the author believes it
moved.

---

## 2. Request flow

```text
UI  ── components/admin/quizzes/*, forms/quiz-form.tsx
 ↓
Hook ── hooks/use-quizzes.ts (list) · hooks/use-quiz.ts (detail + mutations)
 ↓
Axios ── lib/axios.ts                                  (the only HTTP caller)
 ↓
API ── app/api/quizzes/route.ts · app/api/quizzes/[quizId]/route.ts
 ↓        guards + parses + shapes; no business rules
Service ── services/quiz.service.ts                    (all business rules)
 ↓
Repository ── repositories/quiz.repository.ts          (the only Prisma importers)
              repositories/lesson.repository.ts        ← the link lives here
 ↓
Prisma ── lib/db.ts
 ↓
PostgreSQL
```

---

## 3. Files

```text
src/
├── types/quiz.ts                    # QuizListItem, QuizDetail, QuizKind,
│                                    #   QuizQuestion, QuizzesQueryState
├── validation/quiz.schema.ts        # shared by the form AND the API routes
│
├── repositories/
│   ├── quiz.repository.ts
│   └── lesson.repository.ts         # + setQuizLink()
│
├── services/quiz.service.ts
│
├── app/api/quizzes/
│   ├── route.ts                     # GET (list) · POST (create)
│   └── [quizId]/route.ts            # GET · PATCH · DELETE
│
├── hooks/
│   ├── use-quizzes.ts               # list query
│   ├── use-quiz.ts                  # detail + create/update/delete
│   └── use-lessons.ts               # + useLessonOptions(stageId)
│
├── constants/
│   ├── quiz.ts                      # Arabic labels + page size
│   └── query-keys.ts                # + queryKeys.quizzes
│
├── forms/quiz-form.tsx
│
├── components/admin/quizzes/
│   ├── quizzes-view.tsx             # list screen: filters + table + pager
│   ├── quizzes-table.tsx
│   ├── quiz-badges.tsx
│   ├── new-quiz-view.tsx
│   └── quiz-detail-view.tsx         # the editor
│
└── app/(admin)/admin/quizzes/
    ├── page.tsx  ·  loading.tsx
    ├── new/page.tsx
    └── [quizId]/page.tsx  ·  loading.tsx
```

No new dependencies. No schema changes.

---

## 4. Validation — `validation/quiz.schema.ts`

```ts
quizCreateSchema     // stageId, title, description, passingScore, duration,
                     //   order, isFinal, active, lessonId
quizUpdateSchema     // = quizCreateSchema.omit({ stageId }).partial()
quizListQuerySchema  // search, pathId, stageId, kind, active, status, sort, page, pageSize
```

- **`lessonId` is in the schema even though it is not a `Quiz` column.** It is
  part of what an author *decides* about an exam, so it travels with the form
  and the Service writes it to the other table. Keeping it out would mean a
  second request and a second form.
- **`order` follows the same rule as stages and lessons:** `""` means "append",
  with `z.literal("")` before `z.coerce.number()` so `Number("") === 0` cannot
  fail `.min(1)` with a confusing message.
- **`passingScore` is 1–100**, defaulting to 70 — the column's own default.
- **`stageId` is not updatable.** An exam's attempts and its lesson link both
  belong to the curriculum it sits in.

---

## 5. Service rules — `services/quiz.service.ts`

The rules here are mostly about *attachment*, because that is the one thing the
data model cannot enforce on its own.

| Rule | Reason |
|---|---|
| A `FINAL` exam cannot also be linked to a lesson → **409** | It would appear twice in a student's path with two different meanings |
| A stage may have **one** final exam → **409** | `business-analysis.md` §4.4. The error names the exam already holding the slot |
| A linked lesson must be **in the same stage** → **409** | Otherwise the exam is shown inside one stage's lesson and counted in another stage's quizzes |
| A new exam cannot be created `active` → **409** | It has no questions yet by definition |
| `active` cannot be turned on with zero questions → **409** | An active exam with nothing to ask is one a student opens and cannot answer |
| Two exams in one stage may not share an `order` → **409** | No unique constraint on `(stageId, order)` exists |
| An exam with attempts **cannot be deleted** → **409** | The cascade reaches `QuizAttempt` and `QuizAnswer` — the record certificates rest on. Unpublishing (`active = false`) is the reversible alternative, and the error says so |
| Deleting clears `Lesson.quizId` first | The relation is optional, so the database would happily leave a dangling id |
| Promoting an exam to `FINAL` detaches it from its lesson | The two are mutually exclusive; doing it silently beats a 409 for a change the author clearly intended |

One subtlety in `updateQuiz`: `lessonId === undefined` means "not submitted"
and leaves the link alone, while `lessonId === null` means "unlink". Without
that distinction a PATCH that changed only a title would silently detach the
exam.

---

## 6. API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/quizzes` | Filtered, paginated list |
| `POST` | `/api/quizzes` | Create (parent as `stageId` in the body) |
| `GET` | `/api/quizzes/:quizId` | One exam with its questions |
| `PATCH` | `/api/quizzes/:quizId` | Partial update, including the lesson link |
| `DELETE` | `/api/quizzes/:quizId` | Delete |

Top-level for the same reason as `/api/lessons`. Envelope, error mapping and
`requireAdmin()` are unchanged from `paths-feature.md` §7. Dynamic routes use
Next 16's `RouteContext<…>` helper and await `params`.

---

## 7. The list — `/admin/quizzes`

### Filters

| Filter | Values |
|---|---|
| `search` | exam title/description, **stage title, path title** |
| `kind` | `FINAL` · `LESSON` · `UNLINKED` · `all` |
| `pathId` → `stageId` | a cascade; the stage select stays disabled until a path is chosen, and changing the path clears it |
| `active` | `true` · `false` · `all` |
| `status` | the **parent path's** `DRAFT`/`PUBLISHED` |
| `sort` | `order` · `newest` · `oldest` · `title` |

Ordering is curriculum-major (path ▸ stage ▸ chosen sort ▸ `id`), as on the
lessons list — sorting by `order` alone would interleave "exam 1" from every
stage in the academy.

### Columns

| Width | Columns |
|---|---|
| base | order chip + title (+ `path ▸ stage` underneath) · **النوع** · الحالة · row menu |
| `md` | `+ المسار` (with its status badge), `+ المرحلة` (with the stage's own order) |
| `lg` | `+ الأسئلة`, `+ درجة النجاح` |
| `xl` | `+ المحاولات` |

The **النوع** cell is the point of the screen: it carries the kind badge and,
for a lesson-linked exam, the **lesson's title directly underneath** — a badge
saying "درس" without naming which lesson raises a question it does not answer.

Zero questions renders as `بدون أسئلة` in `--warning` rather than a `0`,
because it is the reason the exam cannot be activated.

Four render states as everywhere else: skeleton · `ApiErrorState` · empty state
whose action depends on whether filters are active and whether any path exists
· table + pager.

---

## 8. The single exam page

Both create and edit are full pages, not dialogs — an exam carries its
attachment, its scoring, its activation state and a list of questions, and the
question editor will land in the same place.

### `/admin/quizzes/new`

Accepts `?pathId=`, `?stageId=` and `?lessonId=` so "add an exam here" can be
linked from a stage or a lesson later. A banner states up front that the exam
is created inactive, because activation needs questions.

### `/admin/quizzes/[quizId]`

Badges (kind, active, path status) and the curriculum breadcrumb · a sentence
naming exactly what the exam is attached to, with a link to the lesson when
there is one · a warning banner when it has no questions · four stat cards
(questions, attempts, passing score, duration) · the edit form · the read-only
question list · delete.

### The form's one piece of logic

`QuizForm` is presentational by contract, with one exception: switching on
**اختبار نهائي للمرحلة** hides the lesson select and clears it. The two
attachments are mutually exclusive and the Service returns a 409 for the pair —
better to make the combination unrepresentable in the form than to explain the
rejection afterwards. Changing the stage clears the lesson link for the same
reason.

The `active` switch is hidden entirely on create, and on edit it is only
offered once the exam has questions.

The path ▸ stage cascade is owned by the **caller**, not the form, because
loading options is a request. The stage is a form field, though, so the form
reports it upward through `onStageChange` — that is what keeps
`useLessonOptions(stageId)` pointing at the right stage.

### Questions are read-only here

The editor lists every question with its options and marks the correct one with
`--success`. Authoring them is a nested create/update/delete over
`Question` + `Option` with a "exactly one correct answer" rule — a feature of
its own, and out of scope for this pass. The screen says so rather than
pretending the section is unfinished.

---

## 9. Hooks

| Hook | Notes |
|---|---|
| `useQuizzes(query)` | `keepPreviousData`, so the table never collapses mid-typing |
| `useQuiz(id)` | Detail query, feeds the editor |
| `useCreateQuiz()` | Invalidates, toasts, redirects to the editor |
| `useUpdateQuiz(id)` | Seeds the detail cache with the server's response, then invalidates |
| `useDeleteQuiz({ redirectToList })` | Same flag, same reasoning, as the others |
| `useLessonOptions(stageId)` | The stage's lessons, in study order; disabled until a real stage id arrives |

**Every quiz mutation invalidates `quizzes`, `lessons`, `stages` and `paths`.**
The lessons cache matters especially: a lesson row's `hasQuiz` column *is* the
link this feature moves.

---

## 10. Design-system conformance

- `FINAL` uses `--gold`, the achievement token — it is the exam a certificate
  rests on. `LESSON` uses `--info`. `UNLINKED` uses `--warning`.
- Path status badges are reused from `components/admin/paths/path-badges`.
- Arabic labels for the derived kind live in `constants/quiz.ts`; path enums
  are not re-translated there.
- Delete flows through `AlertDialog` (§8.6), toasts via `sonner` (§8.7).
- Correct options use `--success`; headings use `font-heading`.
- Logical properties throughout (`ms-*`, `ps-*`, `end-*`).

---

## 11. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every touched file — clean.
- `npx next build` — clean; `/admin/quizzes`, `/admin/quizzes/new`,
  `/admin/quizzes/[quizId]`, `/api/quizzes` and `/api/quizzes/[quizId]`
  registered.
- **The `kind` partition was checked against the live Neon database** — this is
  the invariant the whole screen rests on:

  ```text
  FINAL: 5   LESSON: 6   UNLINKED: 2
  sum=13 total=13 → partition is complete and disjoint
  ```

  Every exam falls into exactly one kind, so no row can be missed or
  double-counted by the filter.
- Other filters exercised against live data: `active` true/false, parent-path
  status, and the search across exam / stage / path titles.
- **Create, link, unlink and delete executed against the live database inside a
  transaction that was deliberately rolled back**, so nothing persisted:

  ```text
  stage already has a final: "…" → second final must be refused
  maxOrder=2 → nextOrder=3
  created: #3 "اختبار آلي" active=false
  order 1 taken by: "…"                      ← the 409 rule sees the collision
  same-stage lesson: "…" · other-stage lesson: "…"  (must be refused)
  after linking → kind=LESSON, lessons=[…]
  after unlinking → kind=UNLINKED
  activation guard reads questions=0 → activation must be refused
  delete guard reads attempts=0
  deleted=true
  ```

  Counts before and after: 13 quizzes, 6 linked lessons.
- `/admin/quizzes` and `/admin/quizzes/new` render on the running dev server:
  all six filters with their Arabic labels, the stage select correctly showing
  `اختر مسارًا أولًا`, and the full create form including the
  final-exam switch and the lesson select. The `active` switch is correctly
  absent on create. No console errors beyond the expected 401s.

**Not verified:** the authenticated happy path — creating an exam, linking it to
a lesson and activating it through the browser — because that needs a signed-in
ADMIN session, which this agent cannot establish.

---

## 12. Known gaps

1. **No question editor.** `Question` and `Option` are read-only here. The
   editor needs nested create/update/delete plus a "exactly one correct option"
   rule, and `Question.correctAnswer` (a string id) duplicates
   `Option.isCorrect` — those two can disagree today, and the editor is where
   that has to be resolved.
2. **`Quiz.duration` is free text**, like a lesson's. Nothing enforces or sums
   it.
3. **No reordering UI.** `order` is typed by hand, as for stages and lessons.
4. **A quiz can still be claimed by several lessons** at the database level.
   The editor sets one; a hand-written row could set more, and the UI would
   list them all rather than hide the fact.
5. **The certificate question is still open.** `business-analysis.md` §7 flags
   the contradiction between "a certificate per stage" in the requirements and
   `Certificate(userId, pathId)` in the schema. Final exams are per stage, so
   this feature does not resolve it either way.

---

## 13. Next steps

1. Sign in as an ADMIN and walk create → link to a lesson → promote to final →
   activate → delete, including the four 409 paths.
2. Build the question/option editor on `/admin/quizzes/[quizId]`, and reconcile
   `Question.correctAnswer` with `Option.isCorrect`.
3. Users — the last admin section, read-first per `folder-structure.md`.
4. "Add an exam here" links from a stage and from a lesson, using the
   `?pathId=`/`?stageId=`/`?lessonId=` parameters the create page already
   accepts.
