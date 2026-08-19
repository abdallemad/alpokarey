# Tracks Catalog — `/paths`, the public index of everything the academy teaches

> **Scope:** the public catalog page, the parameterised read behind it
> (`GET /api/paths/published`), the search / category / certificate filters, the
> sort, the pager, and the card shared with the landing page.
>
> Related: [`path-detail-feature.md`](./path-detail-feature.md) — where a card
> leads · [`enrollment-feature.md`](./enrollment-feature.md) — what happens
> there · [`about-page.md`](./about-page.md) — the sibling public route ·
> [`paths-feature.md`](./paths-feature.md) §10 — the URL-filter pattern this
> copies · [`student-dashboard.md`](./student-dashboard.md) — `/dashboard/paths`,
> the page this one is deliberately *not* · [`folder-structure.md`](./folder-structure.md)

---

## 1. Two path lists, and why both exist

| Route | Question it answers | Guard |
|---|---|---|
| `/paths` | "What does the academy teach?" | none — public |
| `/dashboard/paths` | "Where am I in what I'm studying?" | `requireUser` |

They are different pages for different questions, which is why the catalog is
**session-blind**: no enrolment badges, no "متابعة" buttons, nothing that
varies per visitor. One response serves everyone, and the question "am I in this
one?" is answered by the path page a single click away, which already resolves
the viewer's own state.

`ROUTES.paths` is the catalog; `ROUTES.app.paths` is the learner's own list. The
two constants sit in different halves of the route map for exactly this reason —
see §7.

---

## 2. Request flow

```text
UI  ── app/(marketing)/paths/page.tsx → components/paths/paths-catalog-view.tsx
 ↓
Hook ── hooks/use-public-paths.ts → usePublicPaths(query)     (keepPreviousData)
 ↓
Axios ── lib/axios.ts
 ↓
API ── app/api/paths/published/route.ts                        (no session)
 ↓
Service ── services/path.service.ts → listPublicPaths()
 ↓
Repository ── path.repository.findPublishedMany                (page + count)
 ↓
Prisma → PostgreSQL
```

---

## 3. Files

```text
src/
├── app/(marketing)/paths/
│   ├── page.tsx                       # NEW — Suspense + the view
│   └── loading.tsx                    # NEW
│
├── app/api/paths/published/route.ts   # REWRITTEN — now takes a query
│
├── components/paths/
│   ├── paths-catalog-view.tsx         # NEW — filters, grid, pager
│   ├── paths-catalog-skeleton.tsx     # NEW
│   └── public-path-card.tsx           # NEW — extracted from paths-section.tsx
│
├── components/shared/data-pagination.tsx   # MOVED from components/admin/shared
│
├── hooks/use-public-paths.ts          # NEW — replaces use-published-paths.ts
│
├── services/path.service.ts           # listPublishedPaths → listPublicPaths
├── repositories/path.repository.ts    # findPublished → findPublishedMany,
│                                      #   + publicSelect, buildPublicWhere
├── types/path.ts                      # + PublicPathsQueryState
├── validation/path.schema.ts          # + publicPathsQuerySchema, PUBLIC_PATH_SORTS
├── constants/path.ts                  # + catalog labels, defaults, page size
├── constants/query-keys.ts            # + paths.publishedList(query)
└── constants/routes.ts                # + ROUTES.paths (see §7)
```

No new dependencies.

---

## 4. One endpoint for the catalog **and** the landing teaser

`GET /api/paths/published` used to take no parameters and return
`PublicPathSummary[]` — six featured paths for the landing page. It now takes a
query and returns `Paginated<PublicPathSummary>`.

The teaser did not get an endpoint of its own, because **the teaser is the first
page of the featured ordering**:

```ts
usePublishedPaths()  → ?sort=featured&page=1&pageSize=6   // the landing section
usePublicPaths(q)    → ?…the visitor's filters…           // /paths
```

Two code paths would eventually give two answers to "what is published?" — the
exact drift `PublicPathCard` was extracted to prevent on the rendering side.

The two hooks differ in one deliberate way: the teaser sets a five-minute
`staleTime` (an admin publishes perhaps weekly, and a slightly old teaser costs
nothing), while the catalog sets none — someone actively filtering expects the
grid to answer *their* filter, not a cache.

---

## 5. Why it is still safe to leave unauthenticated

This is the only open read in the API, and it now accepts input. The safety
never rested on the absence of parameters:

| Guarantee | Where it lives |
|---|---|
| `status: "PUBLISHED"` cannot be overridden — there is no `status` field in the schema and the repository writes it | `buildPublicWhere` |
| `category` and `certification` are **closed enums** — anything else is a 422 | `publicPathsQuerySchema` |
| `pageSize` has a ceiling of 24, so the endpoint cannot be asked to dump the table | `publicPathsQuerySchema` |
| `search` is length-capped at 120 and reaches Prisma as a parameterised `contains` | schema + Prisma |
| The response shape carries no editorial state and no enrolment figures | `PublicPathSummary` |

A draft path is unreachable through this endpoint by construction, not by
convention.

### Sorting

`featured` (default) · `newest` · `title`. There is deliberately **no
"most enrolled"**: `PublicPathSummary` carries no enrolment count — the type was
narrowed for exactly that reason — and a sort ranking by a number the page will
not print is a sort nobody can check.

`featured` is the default because `isFeatured` is the admin's own "show this
one" switch, and a visitor with no stated preference should see what the academy
puts forward.

---

## 6. Repository — one query builder, one page-and-count

`findPublishedMany` runs the page query and its `count` against the **same
`where`** in one `Promise.all`, so the total can never describe a different set
of paths from the cards beneath it — the same construction `findMany` uses on
the admin side.

`publicSelect` is shared by the catalog and the teaser, and carries
`stages.select._count.lessons` rather than the enrolment count: a card says how
much there is to study, and an enrolment total on a newly-launched path is a
number better left unsaid.

---

## 7. Routes — the public site moved out of `ROUTES.app`

`ROUTES.app.path(id)` became `ROUTES.path(id)`, and `ROUTES.paths` and
`ROUTES.about` joined it at the top level.

`app` is documented as the learner's screens inside the dashboard shell.
`/paths`, `/paths/:id` and `/about` are none of those: they render in the
`(marketing)` shell and are readable with no session. Leaving the detail route
under `app` was already the odd one out when it was built; adding two more
public routes beside it made it worth correcting. Three call sites moved
(`learn-sidebar`, `enrolled-path-card`, `paths-section`) and no URL changed.

### Links that now resolve

| Where | Before | Now |
|---|---|---|
| Header nav "المسارات" | `/#paths` | `/paths` |
| Header nav "عن الأكاديمية" | `/#about` | `/about` |
| Footer "الأكاديمية" column | anchors only | `/about`, `/paths`, + anchors |
| Footer "المسارات" column | four unlinked names | the names, plus **كل المسارات** → `/paths` |
| Hero "تصفّح المسارات" | `#paths` | `/paths` |
| Landing catalog section | — | **استعرض كل المسارات** → `/paths` |
| Path page back link | `/#paths` | `/paths` |

The footer's four path names stay **unlinked** on purpose: they are the planned
curriculum of `business-analysis.md` §3.4 and no `Path` row backs them. The
catalog is the one real destination in that column, so it is the one link.

---

## 8. UI

### Filter state lives in the URL

Exactly as on `/admin/paths` and `/dashboard/paths`: refreshing keeps the view,
the back button steps through filters, a filtered catalog can be pasted to
someone, and React Query caches each combination independently. Defaults —
including `page=1` — are stripped so the URL stays readable.

**Every filter change resets `page`.** Leaving a visitor on page 3 of a
two-page result is the classic way a filtered list appears empty. Sorting and
paging do not reset each other, and "إزالة عوامل التصفية" clears the three
filters while leaving the sort alone — a sort is not something that hides
results.

Because the view reads `useSearchParams`, the page wraps it in `<Suspense>`.

### The grid dims instead of collapsing

`keepPreviousData` in the hook holds the current cards while the next page
loads, and the grid takes `data-pending` → `opacity-60` while `isFetching`.
Without it the grid would collapse to skeletons on every keystroke and the page
would appear to flicker rather than filter. The full skeleton is for the first
load only.

Paging scrolls back to the top: a new page of cards under the same filters
should not leave the reader at the pager they just clicked.

### Three empty states, not one

| Situation | What renders |
|---|---|
| Filters match nothing | `SearchX` · "لا توجد مسارات مطابقة" · a button that clears them |
| Nothing published at all | `Compass` · the honest "المناهج قيد الإعداد" · sign-up |
| Request failed | `ApiErrorState` with retry |

The first two are genuinely different: one is a filter the visitor can undo, the
other is the academy's own state.

### `PublicPathCard`, extracted

The landing section's private card became `components/paths/public-path-card.tsx`
and both screens now render it — the same reasoning that makes
`EnrolledPathCard` shared by `/dashboard` and `/dashboard/paths`. It ships its
own skeleton so the placeholder cannot drift from the shape it stands in for.

### `DataPagination`, moved

It was domain-neutral but lived in `components/admin/shared`. It now lives in
`components/shared` and is re-exported from the admin barrel — the same route
`PageHeader`, `SearchInput` and `ApiErrorState` already took, so no admin import
changed.

---

## 9. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- **The endpoint, against the live database**, through the browser:

  | Query | Result |
  |---|---|
  | *(none)* | 200 · 3 paths, featured ordering |
  | `?pageSize=1&page=2` | 200 · `totalPages: 3`, the second path |
  | `?pageSize=1&page=4` | 200 · empty page, `total` still 3 |
  | `?category=AQEEDA` | 200 · 1 |
  | `?certification=true` / `false` | 200 · 2 and 1 — they sum to the unfiltered 3 |
  | `?sort=title` | 200 · alphabetical |
  | `?search=مسودة` | 200 · 1 |
  | `?category=WHATEVER` | **422** with `details.category` |
  | `?pageSize=500` | **422** `Too big: expected number to be <=24` |

- **The page, in the browser.** `/paths` renders the heading, the search box,
  three filter selects, the card grid and the pager ("صفحة 1 من 1 · إجمالي 3
  مسار").
- **URL → state:** opening `/paths?category=AQEEDA&sort=title` directly renders
  one card, and the selects read "العقيدة" and "حسب العنوان".
- **State → URL:** typing in the search box wrote
  `?category=AQEEDA&sort=title&search=مسودة` after the debounce and, since the
  two filters intersect to nothing, rendered the "لا توجد مسارات مطابقة" state.
  Its clear button returned the URL to `?sort=title` and the grid to 3 cards —
  filters cleared, sort kept.
- **The landing page still works** on the new response shape: the teaser renders
  its three cards from `?pageSize=6` and the "استعرض كل المسارات" button links
  to `/paths`.
- **No console errors** on either page; the only 422s in the log are the two
  deliberate probes above.

**Not verified:** a genuinely multi-page catalog in the UI — the database holds
three published paths and a page is nine, so the pager was exercised through the
API (`pageSize=1`) rather than by clicking. `npx next build` was not run: a dev
server is running on port 3000 and both write to `.next`.

---

## 10. Open items

1. **Audience is not a facet.** `business-analysis.md` §3.1 describes seven
   audience segments and §3.4 a topical split, but `Path` has one `category`
   enum with five values and no audience column at all — §7.1's gap 5 flags
   exactly this and recommends replacing the enum with tags. Until the schema
   changes, the catalog can only filter by what exists.
2. **No server-side rendering of the first page.** The grid is client-fetched,
   so a crawler sees the skeleton. The page's own `<title>` and description are
   static and real, which is most of the SEO value, but indexing the cards would
   need a server read — the same layer question recorded in
   `path-detail-feature.md` §9.
3. **`pageSize` is fixed at 9 in the UI.** The schema accepts up to 24 for a
   future client; the page does not offer a control, because a page-size select
   on a catalog with three items is furniture.
