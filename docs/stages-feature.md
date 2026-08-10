# Stages Feature — the list, grouped by path

> **Scope:** `/admin/stages` — the filtered, grouped, paginated list of every
> stage in the academy, plus create/edit/delete through dialogs, and the full
> stack behind them.
>
> This follows the pattern set by [`paths-feature.md`](./paths-feature.md), and
> departs from it in exactly two places — pagination and the edit surface —
> both explained below (§6, §11).
>
> Related: [`folder-structure.md`](./folder-structure.md) ·
> [`admin-dashboard.md`](./admin-dashboard.md) ·
> [`design-system.md`](./design-system.md) ·
> [`admin-access-control.md`](./admin-access-control.md)

---

## 1. Request flow

```text
UI  ── components/admin/stages/*, forms/stage-form.tsx
 ↓
Hook ── hooks/use-stages.ts (list), hooks/use-stage.ts (mutations)
 ↓
Axios ── lib/axios.ts                                  (the only HTTP caller)
 ↓
API ── app/api/stages/route.ts, app/api/stages/[stageId]/route.ts
 ↓        guards + parses + shapes; no business rules
Service ── services/stage.service.ts                   (all business rules)
 ↓
Repository ── repositories/stage.repository.ts         (the only Prisma importer)
 ↓
Prisma ── lib/db.ts
 ↓
PostgreSQL
```

No layer skips another in either direction.

---

## 2. Files

```text
src/
├── types/
│   └── stage.ts                     # StageListItem, StagePathSummary,
│                                    #   StageGroup, StagesPage, StagesQueryState
│
├── validation/
│   └── stage.schema.ts              # shared by the form AND the API routes
│
├── repositories/
│   ├── stage.repository.ts          # new
│   └── path.repository.ts           # + findSummary()
│
├── services/
│   └── stage.service.ts
│
├── app/api/stages/
│   ├── route.ts                     # GET (list) · POST (create)
│   └── [stageId]/route.ts           # GET · PATCH · DELETE
│
├── hooks/
│   ├── use-stages.ts                # list query
│   ├── use-stage.ts                 # create / update / delete
│   └── use-paths.ts                 # + usePathOptions()
│
├── constants/
│   ├── stage.ts                     # Arabic labels + page size
│   ├── path.ts                      # + PATH_OPTIONS_LIMIT
│   └── query-keys.ts                # + queryKeys.stages
│
├── forms/
│   └── stage-form.tsx
│
├── components/admin/stages/
│   ├── stages-view.tsx              # list screen: filters + table + pager
│   ├── stages-table.tsx             # the grouped table
│   └── stage-form-dialog.tsx        # create + edit
│
├── components/admin/shared/
│   └── data-pagination.tsx          # + itemLabel / details props
│
├── components/ui/dialog.tsx         # RTL fix (see §12)
│
├── utils/stage.ts                   # groupStagesByPath()
│
└── app/(admin)/admin/stages/
    ├── page.tsx
    └── loading.tsx
```

No new dependencies.

---

## 3. Validation — `validation/stage.schema.ts`

One module, imported by the form and by both routes.

```ts
stageCreateSchema     // pathId (uuid, required), title 3–120, order 1–999 | ""
stageUpdateSchema     // = stageCreateSchema.omit({ pathId }).partial()
stageListQuerySchema  // search, pathId, status, category, content, sort, page, pageSize
```

Three decisions worth keeping:

- **An empty `order` is not an error, it means "last".** A number input that was
  never touched submits `""`. The union lists `z.literal("")` *before*
  `z.coerce.number()`, because `Number("") === 0` would otherwise be coerced
  first and then fail `.min(1)` with a confusing message. The Service turns the
  resulting `null` into `max(order) + 1`.
- **`pathId` is not updatable.** `stageUpdateSchema` omits it. Moving a stage
  carries its lessons, its quizzes and every student's progress into a different
  curriculum — that is a migration, not an edit, and it should not be one
  mis-click away in a dropdown.
- **`StagesQueryState` is declared by hand** in `types/stage.ts` rather than
  derived from the query schema, for the same reason as `PathsQueryState`: Zod 4
  widens `z.coerce.number()`'s input to `unknown`, which makes a poor React
  Query cache key.

Messages are Arabic because they render directly under the fields.

---

## 4. Filters

Six, all mirrored in the URL:

| Filter | Values | Applies to |
|---|---|---|
| `search` | free text | stage title **or parent path title** |
| `pathId` | uuid · `all` | the parent |
| `status` | `DRAFT` · `PUBLISHED` · `all` | the **parent path's** status |
| `category` | the five `PathCategory` values · `all` | the **parent path's** category |
| `content` | `withLessons` · `empty` · `all` | whether the stage has any lessons |
| `sort` | `order` · `newest` · `oldest` · `title` | ordering *within* each path |

A stage has no status and no category of its own — those live on the path — but
"show me the stages of my unpublished fiqh paths" is a question admins actually
ask, so the two filters act on the parent. The same reasoning explains the
search: an admin hunting for content usually remembers the path it belongs to,
not the stage's exact wording.

`content` exists because a stage with no lessons is an unfinished stage, and
finding those is otherwise a manual scan.

**Filter state lives in the URL**, not component state. Refreshing keeps the
view, the back button steps through filters, and a filtered list can be pasted
to a colleague. Defaults are stripped from the query string so it stays
readable, and changing any filter resets `page`.

Because the view reads `useSearchParams`, the page wraps it in `<Suspense>`.

---

## 5. The path filter — `usePathOptions()`

The "المسار" select needs every path, not just the ones on the current page, so
it reuses `GET /api/paths` with `pageSize: PATH_OPTIONS_LIMIT` and `select`s the
response down to `{ id, title }`.

Reusing the ordinary list endpoint rather than adding a dedicated one keeps a
single place deciding what an admin may read. `select` narrows per observer, so
the cache entry stays shareable. `staleTime` is five minutes — the set of paths
changes rarely, and re-fetching it on every filter change would be pure noise.

> **Limit:** `pathListQuerySchema` caps `pageSize` at 100. Past 100 paths this
> select has to become a searchable combobox with its own endpoint.
> `PATH_OPTIONS_LIMIT` in `constants/path.ts` is the single place that number
> is written down.

---

## 6. Pagination pages **paths**, not stages

This is the one structural difference from `/admin/paths`.

The list renders each path as a block. If the page were a window over stages,
a path with five stages could show three at the bottom of page 1 and two at the
top of page 2 — the heading would appear twice and each block would read as
missing data. **A group is either shown whole or not shown at all.**

So `stageRepository.findGroupedPage` pages over the *paths that have a matching
stage*, then fetches every matching stage belonging to them:

```ts
const pathsWithMatches = { stages: { some: where } };

db.path.findMany({ where: pathsWithMatches, orderBy: [{title:"asc"},{id:"asc"}],
                   skip, take, select: { id: true } })   // ← the page
db.path.count({ where: pathsWithMatches })               // ← totalPages source
db.stage.count({ where })                                // ← totalStages
db.stage.findMany({ where: { AND: [where, { pathId: { in: pathIds } }] } })
```

Consequences, all deliberate:

- `pageSize` counts **paths**. `STAGES_PAGE_SIZE` is therefore `5`, which puts a
  typical page at 10–20 rows.
- A page's row count varies. A path with 40 stages brings all 40.
- The response needs two totals, so `StagesPage` is
  `Paginated<StageGroup> & { totalStages: number }`. The pager reads
  `إجمالي N مسار · M مرحلة`, for which `DataPagination` gained `itemLabel` and
  `details` props.
- The API returns **groups**, not a flat list. The server is what decides which
  paths fit on a page, so it is also what does the grouping —
  `groupStagesByPath` in `utils/stage.ts` is pure and is called from the
  Service.

### Ordering

Ordering is always **path-major**, so a group is contiguous by construction:

```ts
[{ path: { title: "asc" } }, { pathId: "asc" }, <chosen sort>, { id: "asc" }]
```

`pathId` breaks ties between two paths that happen to share a title — without
it, their stages would interleave and one heading would be drawn twice. The
trailing `id` makes paging deterministic when the sort key repeats. The `sort`
filter therefore orders stages *inside* each path; the blocks themselves are
always alphabetical by path title, which is also the order
`db.path.findMany` returns them in, so the two agree.

---

## 7. Service — `services/stage.service.ts`

Where the rules live. Knows nothing about HTTP; throws domain errors.

| Rule | Reason |
|---|---|
| Creating under a non-existent path → **404** | The `pathId` came from a select that may be stale |
| An omitted `order` becomes `max(order) + 1` | An admin building a curriculum top-to-bottom means "add it at the end" |
| Two stages in one path may not share an `order` → **409** | The database has no unique constraint on `(pathId, order)`, and a duplicated position makes the study sequence ambiguous. The error names the stage already sitting there |
| A `PATCH` with an empty `order` leaves the position alone | On create, blank means "append"; on edit, blank means "I did not touch this" — silently renumbering would be a surprise |
| A stage with student progress in its lessons **cannot be deleted** → **409** | Deletion cascades to lessons and from there to `LessonProgress`. The count is quoted in the message |
| The **last** stage of a `PUBLISHED` path cannot be deleted → **409** | Mirrors the path rule that a published path must have at least one stage. The error says to unpublish first |

Each `ConflictError` carries an Arabic message that surfaces verbatim in the
form's alert and in a toast.

### DTO mapping

Prisma rows never reach the client. `toListItem` flattens `_count` into
`lessonsCount` / `quizzesCount`, nests the parent as `path: { id, title, status,
category }`, and converts `Date` to ISO strings — JSON has no date type.

---

## 8. API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/stages` | Filtered, grouped, paginated list |
| `POST` | `/api/stages` | Create (parent as `pathId` in the body) |
| `GET` | `/api/stages/:stageId` | One stage |
| `PATCH` | `/api/stages/:stageId` | Partial update (`title`, `order`) |
| `DELETE` | `/api/stages/:stageId` | Delete |

Every handler is the same four lines: guard, parse, delegate, shape. Dynamic
routes use Next 16's `RouteContext<"/api/stages/[stageId]">` helper, and
`params` is awaited — it is a Promise in v16.

### Why `/api/stages` and not `/api/paths/:pathId/stages`

`folder-structure.md` sketches stages nested under their path, which stays the
right shape for a per-path editor. But this console lists **every** stage in the
academy and narrows to one path with a filter, so the collection lives at the
top level. `POST` follows it there for symmetry: one address for reading and
writing the collection, with the parent as a required uuid in the body. The
nested route remains available to add later without breaking this one.

### Envelope, error mapping and access control

Unchanged from `paths-feature.md` §7 — `ok`/`created`/`handleRouteError`, and
`authService.requireAdmin()` first in every handler, including `GET`. Read
access to the console's data is itself privileged.

---

## 9. Hooks

| Hook | Notes |
|---|---|
| `useStages(query)` | `keepPreviousData` — rows stay on screen while the next page or a new search loads, so the table never collapses to a skeleton mid-typing |
| `useCreateStage()` | Invalidates stages **and paths**, toasts, leaves the dialog to close itself |
| `useUpdateStage(id)` | Same |
| `useDeleteStage()` | Same |

**Every mutation invalidates `queryKeys.paths.all` as well as
`queryKeys.stages.all.`** A path row carries `stagesCount` and a path detail
page lists its stages, so both go stale the moment a stage is added, renamed or
removed. Missing this is the classic way a count in one screen drifts from the
rows in another.

None of them navigate. All three are driven from dialogs on the list screen, and
the point of a dialog is that the admin keeps their filters, their page and
their scroll position.

---

## 10. UI — `/admin/stages`

Toolbar: debounced search + path / status / category / content / sort selects.
Header action: `مرحلة جديدة`, disabled while there are no paths to attach a
stage to.

Four render states, as on `/admin/paths`:

- **pending** → `DataTableSkeleton`
- **error** → `ApiErrorState`, which branches on status: a 401 offers sign-in, a
  403 explains the account is a student, anything else gets a retry button
- **empty** → different copy and action depending on whether filters are active;
  with no paths at all, the only useful action is a link to `/admin/paths`
- **loaded** → the grouped table plus its pager

### The grouped table

Each path renders a heading row spanning the table, carrying the path title,
its status and category badges, a `N مرحلة` count, `مرحلة هنا` (create with that
path pre-selected) and `عرض المسار`. Its stages follow underneath.

Because the heading holds the path, the rows do not repeat it. Columns:

| Width | Columns |
|---|---|
| base | order chip + title (+ lesson/quiz counts inline underneath) · row menu |
| `md` | `+ الدروس` |
| `lg` | `+ الاختبارات` |
| `xl` | `+ تاريخ الإنشاء` |

Below `md` the count columns are hidden, so the numbers ride along under the
title rather than disappearing. A stage with zero lessons shows `بدون دروس` in
the `--warning` token instead of a `0`, because that is a state to act on, not a
measurement.

---

## 11. Create and edit — dialogs, not pages

A stage is three fields: parent, title, position. A dedicated page would cost a
navigation, a re-fetch, and the admin's place in a filtered, grouped list in
order to edit one line of text. So both open in a dialog:

- **Row click** opens the edit dialog. The row menu offers `تعديل`,
  `عرض المسار` and `حذف`; the menu's wrapper stops propagation so using it does
  not also trigger the row.
- **`مرحلة جديدة`** in the page header opens create with no path chosen;
  **`مرحلة هنا`** on a group heading opens it with that path pre-selected.

`StageFormDialog` holds create and edit as two inner components, because each
owns a different mutation hook and hooks cannot be called conditionally. Each is
`key`ed so re-opening for a different stage resets the fields.

The dialog's target is kept in state *after* it closes, so the exit animation
does not flash the "create" copy over the stage that was being edited.

In edit mode the parent path renders as static text rather than a disabled
select — it is context, not a control. The locked `pathId` still travels through
the form so one schema covers both modes; the caller drops it before the PATCH.

`StageForm` is presentational by contract: it takes `defaultValues` and an
`onSubmit`, and the caller owns the request. Submit is disabled until the form
is dirty, so "save" cannot fire a no-op PATCH. Server messages surface twice —
inline via `FormAlert` (a toast can end up behind a modal) and as a toast.

Delete goes through the shared `DeleteConfirmationDialog`, whose copy quotes the
lesson and quiz counts that will go with the stage.

---

## 12. RTL fix applied

`components/ui/dialog.tsx` positioned its close button with the physical
`right-2`, which in `dir="rtl"` puts it at the **start** edge, on top of the
title. Changed to the logical `end-2`, matching the fixes already recorded in
`design-system.md` §10 and `admin-dashboard.md` §9.

All new markup uses logical utilities (`ms-*`, `ps-*`, `end-*`) throughout.

---

## 13. Design-system conformance

- Path status/category badges are reused from `components/admin/paths/path-badges`
  rather than re-implemented, so a stage heading and a path row agree.
- Arabic labels for DB enums stay in `constants/path.ts`; `constants/stage.ts`
  holds only what is new (sort and content labels) and deliberately does not
  re-translate status or category.
- `بدون دروس` uses `--warning`; headings use `font-heading` (Amiri).
- Delete flows through `AlertDialog`, per §8.6. Toasts via `sonner`, per §8.7.
- Dates and numbers use `ar-EG-u-nu-latn` through `utils/format.ts`.

---

## 14. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every touched file — clean.
- `npx next build` — clean; `/api/stages` and `/api/stages/[stageId]`
  registered.
- **Repository queries executed against the live Neon database.** The list
  `select`, the path-major ordering, the search across both titles, and the
  status / category / content filters all returned the expected rows and counts.
- **The no-split-group invariant was walked end to end** on the live data, for
  three filter combinations. Every page was fetched in turn and each group
  checked against a direct count of that path's matching stages:

  ```text
  === no filter ===
  page 1/2: 5 path(s), 9 stage(s) — totals: 6 paths / 13 stages
    ok "824367": 2/2   ok "الفقه": 1/1   ok "تجربة": 2/2
    ok "عتبات العبودية": 2/2   ok "مسار جديد تجربة": 2/2
  page 2/2: 1 path(s), 4 stage(s)
    ok "مصار مصار مصارم": 4/4  [#1 #2 #3 #4]
  walked every page → 13 distinct stages seen, 13 expected: match
  ```

  No path appeared on two pages, no group was partial, and no stage was
  unreachable.
- **Create / update / delete queries executed against the live database inside a
  transaction that was deliberately rolled back**, so nothing persisted:
  `findMaxOrder → nextOrder`, create, the order-collision lookup (correctly
  reporting position 1 as taken and 998 as free), update, the
  `lessonProgress`/sibling delete guards, and delete. Stage count before and
  after: 11 and 11.
- API guard: unauthenticated `GET /api/stages` returns 401, and the UI renders
  the Arabic "يجب تسجيل الدخول" state with a sign-in link — verified in the
  browser, with the request going out as
  `?search=&pathId=all&status=all&category=all&content=all&sort=order&page=1&pageSize=5`.
- Page renders with all six filter triggers showing their Arabic labels.

**Not verified:** the authenticated happy path — actually creating, editing and
deleting a stage through the browser — because that needs a signed-in ADMIN
session, which this agent cannot establish. The database holds several ADMIN
accounts (`abdallaemad1.3.2.0.0.5@gmail.com` among them);
`alisoliman2125@gmail.com` is still `STUDENT`.

---

## 15. Next steps

1. Sign in as an ADMIN and walk create → reorder → delete, including the two
   409 paths (duplicate `order`, last stage of a published path).
2. Drag-and-drop reordering. The `order` field is currently typed by hand; the
   collision rule in the Service is what a reorder endpoint would have to
   replace with a transactional renumber.
3. Apply this pattern to quizzes. Lessons are done —
   [`lessons-feature.md`](./lessons-feature.md) records why they use a flat
   table and a full-page editor instead of a grouped table and a dialog.
4. A per-path stage editor at `/admin/paths/[pathId]` — the same dialogs, seeded
   with that path, so a curriculum can be built without leaving the path.
