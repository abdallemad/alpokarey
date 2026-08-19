# Path Detail — `/paths/[pathId]`, the page that turns a reader into a student

> **Scope:** the public path page, its session-aware read
> (`GET /api/paths/:pathId/overview`), and the curriculum outline it renders.
> The enrolment write it hosts has its own document.
>
> Related: [`enrollment-feature.md`](./enrollment-feature.md) — the button and
> what happens after it · [`folder-structure.md`](./folder-structure.md) ·
> [`paths-feature.md`](./paths-feature.md) — the admin side of the same entity ·
> [`learn-layout.md`](./learn-layout.md) — where the button sends people ·
> [`student-dashboard.md`](./student-dashboard.md) §5 — the progress
> reconciliation this page reuses · [`design-system.md`](./design-system.md)

---

## 1. What this page is for

Every path card in the product already linked here — the landing page's catalog
(`components/marketing/paths-section.tsx`) and the learner's own path cards
(`components/app/paths/enrolled-path-card.tsx`) both build
`ROUTES.app.path(id)`. Until now that URL rendered nothing.

It has one job, phrased two ways depending on who is reading:

| Visitor | The question | The answer on the page |
|---|---|---|
| No account | "Is this worth my time?" | The pitch, the syllabus, and a sign-up |
| Signed in, not enrolled | "Do I start this?" | The same, plus **التسجيل في المسار** |
| Enrolled | "Where was I?" | The same, plus their progress and **متابعة التعلّم** |

One page, not three. The difference between those readers is a card in the
aside — not a different document — and building three pages would mean three
descriptions of the same path that could drift apart.

---

## 2. Request flow

```text
UI  ── app/(marketing)/paths/[pathId]/page.tsx → components/paths/*
 ↓
Hook ── hooks/use-path-overview.ts                    (React Query)
 ↓
Axios ── lib/axios.ts
 ↓
API ── app/api/paths/[pathId]/overview/route.ts       (session optional)
 ↓
Service ── services/path.service.ts → getPathOverview()
 ↓
Repository ── path.repository.findOverview
              enrollment.repository.findByUserAndPath
              lesson-progress.repository.findCompletedIds
 ↓
Prisma → PostgreSQL
```

No layer skips another, in either direction.

---

## 3. Files

```text
src/
├── app/(marketing)/paths/[pathId]/
│   ├── page.tsx                       # NEW — thin Server Component
│   └── loading.tsx                    # NEW — the same skeleton the view uses
│
├── app/api/paths/[pathId]/overview/
│   └── route.ts                       # NEW — GET, session optional
│
├── components/paths/                  # NEW folder
│   ├── path-overview-view.tsx         #   the page body
│   ├── path-curriculum-outline.tsx    #   stages → lessons, read-only
│   ├── path-overview-skeleton.tsx
│   └── index.ts
│
├── hooks/use-path-overview.ts         # NEW
│
├── services/path.service.ts           # + getPathOverview(), toOverviewStages()
├── repositories/path.repository.ts    # + overviewSelect, findOverview()
├── types/path.ts                      # + PathOverview, PathOverviewStage,
│                                      #   PathOverviewLesson, PathViewerState
├── validation/path.schema.ts          # + pathIdParamSchema
├── constants/query-keys.ts            # + paths.overview(pathId)
└── constants/marketing.ts             # nav anchors made root-relative (§8)
```

No new dependencies.

---

## 4. Why the page lives in `(marketing)`

Its first audience is a visitor with **no account**: the landing page's catalog
links straight here, and converting that reader is the entire point. So it
renders in the public shell — site header, site footer — the same one `/` uses.

It is deliberately **not** `/dashboard/paths/[pathId]`.
[`dashboard-restructure.md`](./dashboard-restructure.md) made `/dashboard/*`
mean "renders inside the dashboard shell"; this page does not, and a URL that
promises chrome it will not render is the exact mistake that document exists to
prevent. It is the same reasoning that keeps the player in its own `(learn)`
group.

`ROUTES.app.path(pathId)` was already in the route map pointing at
`/paths/:pathId`, so nothing that linked here had to change.

### The consequence: the marketing shell now wraps two routes

The header and footer navigation were bare anchors — `#paths`, `#about` — which
worked while `/` was the only page in the shell. On this page they scroll
nowhere. They are now root-relative (`/#paths`), which behaves identically on
`/` and navigates home-then-scrolls from anywhere else.
`constants/marketing.ts` had predicted exactly this ("when `/about` and the
public catalog land, the `href`s change here"). The hero's own `#paths` button
is untouched — the hero only ever renders on `/`.

---

## 5. The read — `GET /api/paths/:pathId/overview`

**The only endpoint in the API that serves a visitor and a learner from one
handler.** Everything else is behind `requireAdmin()` or `requireUser()`; this
one calls `authService.getCurrentUser()`, which returns `null` rather than
throwing.

It is a **separate segment** from `GET /api/paths/:pathId` rather than a branch
inside it, for the reason `/api/paths/published` is separate from `/api/paths`:
the sibling above is admin-only and returns editorial state, and *a handler that
sometimes checks a session is a handler that eventually stops checking*. Two
files, two guards, two response shapes — neither can quietly become the other.

What keeps it safe to leave open:

- **The session is read, never accepted.** There is no user id in the URL, the
  query or a body, so `viewer` can only ever describe whoever holds the cookie.
- **The shape is narrow.** `PathOverview` has no `isFeatured`, no enrolment or
  certificate totals, and no lesson content — titles and durations only.
- **Drafts 404.** See below.

| Case | Status | Body |
|---|---|---|
| Published path | 200 | `PathOverview` |
| Draft, viewer enrolled | 200 | `PathOverview` with `status: "DRAFT"` |
| Draft, viewer not enrolled | 404 | `المسار المطلوب غير موجود` |
| Unknown id | 404 | same message |
| Malformed id | 422 | `{ pathId: ["معرّف المسار غير صالح"] }` |

The draft rule is a **404, not a 403**. A path that was never published is not
something the public has been refused; it is something that does not exist yet,
and a 403 would confirm to anyone guessing ids that a real record sits behind
it.

`pathIdParamSchema` lives in `validation/path.schema.ts` and is shared with the
enrolment route. The admin routes under `/api/paths/[pathId]` do not use it:
they are behind `requireAdmin()` and their ids come from links the console
itself rendered.

---

## 6. Repository — `overviewSelect`

A third select shape beside `listSelect` and `detailSelect`, carrying lesson
titles where the admin's carries counts and editorial state.

Two details are load-bearing:

- **Lessons are ordered `order` then `id`** — byte for byte the tie-break
  `learn.repository.ts` uses for the curriculum. The first lesson in this
  outline has to be the first lesson the player opens, or "ابدأ المسار" lands
  somewhere other than the top of the syllabus it was pressed beside.
- **Only `active` exams are counted** (`quizzes: { where: { active: true } }`).
  An inactive exam is one still being written; `learnService` hides it from the
  curriculum, so advertising it here would promise something the player will not
  show.

`findOverview` does **not** filter on status. Whether a draft may be seen is a
question about *who is asking*, which is the Service's call, not the query's.

---

## 7. Service — `pathService.getPathOverview(pathId, user)`

`user` is nullable, and that is the whole design: the two audiences read the
same document.

Three rules:

1. **A draft is a 404 for anyone not enrolled in it.**
2. **An enrolled learner keeps their path when it is unpublished.** The
   enrolment outlives the admin's decision, so the page still renders and
   `status` lets the UI show a `قيد الإعداد` badge — the same courtesy
   `EnrolledPathCard` already extends.
3. **Progress is reconciled, not recomputed.** It runs through
   `utils/progress.ts` — `toProgressPercent` → `reconcileProgress` →
   `isPathComplete` — exactly like the dashboard, the player and the certificate
   gate. A learner whose player says 67% must not read 0% here, and
   `completedLessonsCount` follows whichever record drove the percentage so the
   caption cannot contradict the bar. See
   [`student-dashboard.md`](./student-dashboard.md) §5.

`viewer.startLessonId` is the first lesson **not** completed, falling back to
the first lesson of the path — the same rule `/learn/:pathId` and the
dashboard's resume card apply, derived here from the outline's own order. For an
anonymous visitor nothing is completed, so it is simply the first lesson, which
is what "start" means before enrolling.

### Cost

Two queries in parallel (path + enrolment), then one more for the completed
lesson ids — and that third one only when there **is** an enrolment. An
anonymous visitor pays for a single `findUnique`.

---

## 8. UI

### `PathOverviewView` — a Client Component

Because the response varies per session, the page could not be static anyway,
and fetching on the client keeps the enrolment mutation, its cache invalidation
and its redirect on one side of the boundary.

Top to bottom: a back link to `/#paths` · badges (category · certificate ·
"أتممت هذا المسار" · "قيد الإعداد") · the title as `h1` · the description · the
size facts · then a `lg:grid-cols-3` split.

- **Main column (2/3)** — the promo video when `promoUrl` is a YouTube link,
  rendered through the same `toYouTubeEmbedUrl` + `AspectRatio` pairing the
  lesson player uses, then `محتوى المسار` and the outline.
- **Aside (1/3)** — progress (enrolled only), the `EnrollButton`, what the path
  includes, and a link to مساراتي. `sticky` only from `lg` up: on a phone it is
  simply the last block, and pinning it would cover the syllabus it is asking
  the visitor to judge.

Three states, as everywhere else in the product: `PathOverviewSkeleton` while
pending · `ApiErrorState` on failure (which already renders 401 and
`NOT_ENROLLED` specially) · the page.

### `PathCurriculumOutline` — a table of contents, not navigation

The counterpart of the player's `CurriculumTree`, and deliberately **not** the
same component. That one is navigation: every row is a link, and it only ever
renders for someone already enrolled. This one is read-only, because for most of
its audience nothing is open yet, and a link that leads to a refusal is worse
than no link.

Lesson titles are shown to everyone. A course page that hides its syllabus asks
a visitor to buy something unseen; the titles *are* the pitch, and the content
behind them is what enrolling is for.

The first stage is expanded by default and the rest are closed — enough to show
the shape of the thing without opening on forty rows. For an enrolled viewer
each row gains a tick or an empty circle and the stage header switches from
"n درس" to "n من m درس".

---

## 9. Trade-offs left open

1. **The tab title is generic.** `تفاصيل المسار | أكاديمية الإمام البخاري`,
   not the path's name. Naming it means a database read in `generateMetadata`,
   and `folder-structure.md` is explicit that pages do not call Services — the
   same trade-off `/dashboard/certificates/[id]` made. It costs more here,
   because this is a public page a crawler may index. Resolving it properly is a
   decision about the layer rule, not a code change to make quietly.
2. **A missing path renders a 200 with an error state**, since the page is
   client-fetched. For SEO a real 404 status would be better, which is the same
   decision as (1).
3. **`/paths` — the public catalog — does not exist yet.** The back link and the
   nav both point at the landing page's `#paths` section, which is where the
   catalog currently lives. When the catalog lands, both change in
   `constants/marketing.ts` and `path-overview-view.tsx`.

---

## 10. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- **Repository shapes executed against the live Neon database.**
  `overviewSelect` returned ordered stages with their lessons and active-exam
  counts for two real paths; the flattened lesson order it produces was compared
  against `findLessonIdsByPath`'s ordered query and matched exactly, which is
  the invariant §6 rests on.
- **The page, signed out, on the running dev server.** `/paths/<real id>`
  renders the header, back link, category and certificate badges, the title,
  description, size facts, the promo video, the outline with the first stage
  expanded, and the sign-up CTA. No console errors, no hydration warnings; the
  overview request returns `200`.
- **The outline's accordion, in the browser.** The first stage renders expanded
  and the second collapsed; clicking the second stage's trigger expands it to
  reveal its lesson row while the first stays open — `multiple`, as intended.
- **The guards, from the browser.** `POST …/enroll` signed out → `401`
  `يجب تسجيل الدخول للمتابعة`; `GET /api/paths/not-a-uuid/overview` → `422` with
  `details.pathId`; a well-formed but unknown id → `404`
  `المسار المطلوب غير موجود` — all in the standard envelope.
- **Navigation after the anchor change.** On the path page the header renders
  `/#paths`, `/#audiences`, `/#methodology`, `/#about` and the footer likewise,
  so the marketing nav works from a page that has none of those sections.

**Not verified:**

- **The enrolled and signed-in branches of the page** — the progress bar, the
  ticks in the outline, the `قيد الإعداد` badge, and "متابعة التعلّم". All of
  them need a signed-in session, which this agent cannot establish. The data
  behind them was rehearsed read-only against real enrolments instead — see
  [`enrollment-feature.md`](./enrollment-feature.md) §10.
- **`npx next build`** was not run: a dev server is running on port 3000 and
  both write to `.next`, so building would have disrupted it. Types, lint and
  the live dev server cover the same ground.
