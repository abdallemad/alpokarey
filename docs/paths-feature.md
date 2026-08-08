# Paths Feature — the reference CRUD implementation

> **Scope:** `/admin/paths` (list), `/admin/paths/[pathId]` (detail + edit),
> `/admin/paths/new` (create), and the full stack behind them.
>
> This is the pattern stages, lessons, quizzes and users should copy.
>
> Related: [`folder-structure.md`](./folder-structure.md) ·
> [`admin-dashboard.md`](./admin-dashboard.md) ·
> [`design-system.md`](./design-system.md)

---

## 1. A note on the transport layer

The request was phrased as *"ui → react query hook → server action → service
layer → repositories → db"*, alongside "use the folder structure that came in
the folder-structure.md file".

`folder-structure.md` is explicit that this project does **not** use Server
Actions:

> Unlike a Server Actions setup, **every** mutation and query — web or future
> mobile — goes through the same `app/api` HTTP boundary. Hooks never call
> Services directly; they only ever call Axios, which only ever calls `app/api`.

The stated reason is that the backend has to be reusable by a future mobile app,
which cannot call a Server Action. **API routes were used**, per the document.
Everything else about the layering is exactly as requested. If you do want
Server Actions instead, the Service layer downward is unchanged — only the
`app/api` routes and `lib/axios.ts` would be replaced.

---

## 2. Request flow

```text
UI  ── components/admin/paths/*, forms/path-form.tsx
 ↓
Hook ── hooks/use-paths.ts, hooks/use-path.ts        (React Query)
 ↓
Axios ── lib/axios.ts                                 (the only HTTP caller)
 ↓
API ── app/api/paths/route.ts, app/api/paths/[pathId]/route.ts
 ↓        parses + validates + guards; no business rules
Service ── services/path.service.ts                   (all business rules)
 ↓
Repository ── repositories/path.repository.ts         (the only Prisma importer)
 ↓
Prisma ── lib/db.ts
 ↓
PostgreSQL
```

No layer skips another in either direction.

---

## 3. Files

```text
src/
├── types/
│   ├── api.ts                       # ApiResponse<T>, Paginated<T>
│   └── path.ts                      # PathListItem, PathDetail, PathsQueryState
│
├── validation/
│   └── path.schema.ts               # shared by the form AND the API route
│
├── repositories/
│   ├── path.repository.ts
│   └── user.repository.ts           # for the admin guard
│
├── services/
│   ├── path.service.ts
│   └── auth.service.ts              # requireAdmin()
│
├── app/api/paths/
│   ├── route.ts                     # GET (list) · POST (create)
│   └── [pathId]/route.ts            # GET · PATCH · DELETE
│
├── lib/
│   ├── errors.ts                    # AppError + subclasses
│   ├── api-response.ts              # ok/created/handleRouteError
│   ├── axios.ts                     # apiClient + apiRequest<T>
│   └── query-client.ts
│
├── hooks/
│   ├── use-paths.ts                 # list query
│   └── use-path.ts                  # detail query + create/update/delete
│
├── constants/
│   ├── path.ts                      # Arabic labels + category colours
│   └── query-keys.ts
│
├── forms/
│   ├── form-field.tsx               # TextField, TextareaField, SelectField,
│   │                                #   SwitchField, FormAlert
│   └── path-form.tsx
│
├── components/admin/paths/
│   ├── paths-view.tsx               # list screen: filters + table + pager
│   ├── paths-table.tsx
│   ├── path-detail-view.tsx
│   ├── new-path-view.tsx
│   └── path-badges.tsx
│
├── utils/format.ts                  # Arabic dates and numbers
│
└── app/(admin)/admin/paths/
    ├── page.tsx  ·  loading.tsx
    ├── new/page.tsx
    └── [pathId]/page.tsx  ·  loading.tsx
```

### Dependencies added

`@tanstack/react-query`, `axios`, `zod`, `react-hook-form`,
`@hookform/resolvers` — all four named by `folder-structure.md`; none were
installed yet.

---

## 4. Validation — `validation/path.schema.ts`

One schema, imported by the form and by the route. The browser and the server
therefore enforce identical rules by construction.

```ts
pathCreateSchema      // title 3–120, description ≤2000, category, status, flags, URLs
pathUpdateSchema      // = pathCreateSchema.partial() — a PATCH may carry one field
pathListQuerySchema   // search, status, category, featured, sort, page, pageSize
```

Two details that matter:

- **Empty strings are not errors.** An untouched `<select>` submits `""` and an
  empty URL field submits `""`. Both are `.transform`ed to `null` rather than
  rejected, so the form does not have to pre-clean its payload.
- **`PathsQueryState` is declared by hand** in `types/path.ts` instead of reusing
  `z.input<typeof pathListQuerySchema>`. Zod 4 widens `z.coerce.number()`'s input
  to `unknown`, which makes a poor React Query cache key.

Messages are Arabic because they render directly under the fields.

---

## 5. Repository — `repositories/path.repository.ts`

The only module importing Prisma. Two `select` shapes:

- `listSelect` — table columns plus `_count: { stages, enrollments }`
- `detailSelect` — adds `promoUrl`, `_count.certificates`, and ordered `stages`
  each with `_count: { lessons, quizzes }`

`findMany` runs the page query and its `count` in one `Promise.all`, against the
same `where`, so the total always matches the filters.

Search is a case-insensitive `contains` across title and description.

> Both select shapes were executed against the live database to confirm they
> match the schema — including the nested `_count` on stages.

---

## 6. Service — `services/path.service.ts`

Where the rules live. Knows nothing about HTTP; throws domain errors.

### Business rules

| Rule | Reason |
|---|---|
| A path cannot be **created** as `PUBLISHED` | A path with no stages has nothing to teach |
| A path cannot **transition** to `PUBLISHED` with zero stages | Same, checked on the transition rather than on every save of an already-published path |
| `certificationActivated` cannot be turned on with zero stages | Otherwise certificates would be issued for an empty path |
| A path with enrollments **cannot be deleted** | Deletion cascades to stages, lessons and `LessonProgress`; that would destroy student history. Unpublishing is the reversible alternative, and the error says so |

Each throws a `ConflictError` carrying an Arabic message that surfaces verbatim
in a toast.

### DTO mapping

Prisma rows never reach the client. `toListItem` / `toDetail` flatten `_count`
into plain fields and convert `Date` to ISO strings — JSON has no date type, and
`PathListItem.createdAt: string` is the honest signature.

`toDetail` also derives `lessonsCount` by summing across stages, so the UI does
not have to.

---

## 7. API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/paths` | Filtered, paginated list |
| `POST` | `/api/paths` | Create |
| `GET` | `/api/paths/:pathId` | One path with stages |
| `PATCH` | `/api/paths/:pathId` | Partial update |
| `DELETE` | `/api/paths/:pathId` | Delete |

Every handler is the same four lines: guard, parse, delegate, shape.

```ts
export async function GET(request: NextRequest) {
  try {
    await authService.requireAdmin();
    const query = pathListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return ok(await pathService.listPaths(query));
  } catch (error) {
    return handleRouteError(error);
  }
}
```

Dynamic routes use Next 16's `RouteContext<"/api/paths/[pathId]">` helper, and
`params` is awaited — it is a Promise in v16.

### The response envelope

```jsonc
{ "success": true,  "data": { … } }
{ "success": false, "error": { "message": "…", "code": "…", "details": { "title": ["…"] } } }
```

`handleRouteError` is the single place status codes are decided:

| Thrown | Status |
|---|---|
| `ZodError` | 422 with per-field `details` |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| anything else | 500, logged server-side, generic message to the client |

That last row matters: an unexpected throw never leaks a stack trace.

### Access control

`authService.requireAdmin()` checks the Clerk session **and** the local
`User.role`. A valid session is not sufficient — the account must be `ADMIN`.
Verified: unauthenticated `GET` and `DELETE` both return
`401 {"success":false,"error":{"message":"يجب تسجيل الدخول للمتابعة","code":"UNAUTHORIZED"}}`.

---

## 8. Transport — `lib/axios.ts`

`apiRequest<T>()` unwraps the envelope so hooks receive `T` directly, and
normalises every failure into an `ApiRequestError` carrying `message`, `code`,
`status` and `details`. Because the server's messages are already Arabic, a hook
can pass `error.message` straight to a toast.

Network failures get their own Arabic message rather than surfacing
`ERR_NETWORK`.

`baseURL` is the relative `/api`: these requests originate in the browser, so the
current origin is always right.

---

## 9. Hooks

| Hook | Notes |
|---|---|
| `usePaths(query)` | `keepPreviousData` — rows stay on screen while the next page or a new search loads, so the table never collapses to a skeleton mid-typing |
| `usePath(pathId)` | Detail query |
| `useCreatePath()` | Invalidates all path queries, toasts, redirects to the new path |
| `useUpdatePath(id)` | Seeds the detail cache with the server's response (`setQueryData`), then invalidates lists in the background |
| `useDeletePath({ redirectToList })` | Removes the detail entry, invalidates lists. The flag exists because deleting from the table should leave the admin where they are with filters intact, while deleting from a detail page must navigate away |

Query keys are hierarchical (`constants/query-keys.ts`), so a mutation can
invalidate `queryKeys.paths.lists()` without knowing which filter combinations
happen to be cached.

`makeQueryClient()` never retries 4xx — a 403 or a 422 fails identically next
time — and disables refetch-on-focus, since admin data does not change under you
mid-session.

---

## 10. UI

### List — `/admin/paths`

Toolbar: debounced search + status / category / featured / sort selects +
`مسار جديد`.

**Filter state lives in the URL**, not component state. Refreshing keeps the
view, the back button steps through filters, and a filtered list can be pasted to
a colleague. Defaults are stripped from the query string so it stays readable,
and changing any filter resets `page`.

Because the view reads `useSearchParams`, the page wraps it in `<Suspense>`.

Four render states: table skeleton while pending · `ErrorState` with retry on
failure · `EmptyState` when empty — with different copy and actions depending on
whether filters are active — · the table plus its pager.

Columns shed progressively (see `admin-dashboard.md` §6). Rows are clickable,
and the row menu stops propagation so using the menu does not also navigate.

### Detail — `/admin/paths/[pathId]`

Header with the title, status/category/featured badges and last-updated · four
stat cards (stages, lessons, enrollments, certificates) · the ordered stage list
with per-stage lesson and quiz counts · the edit form · delete.

The delete dialog reads the enrollment count and, when it is non-zero, explains
up front that the server will refuse and suggests unpublishing — rather than
letting the admin discover the 409 after confirming.

### Form — `forms/path-form.tsx`

`react-hook-form` + `standardSchemaResolver(pathCreateSchema)`. Presentational by
contract: it takes `defaultValues` and `onSubmit`; the caller owns the request.
That is what lets the same component serve the create page and the detail page.

Submit is disabled until the form is dirty, so "save" cannot fire a no-op PATCH.

Field primitives live in `forms/form-field.tsx` so a form file reads as a list of
fields and error styling is identical everywhere.

---

## 11. Design-system conformance

- Category badges use the `--category-*` tokens via `PATH_CATEGORY_CLASSES`.
- Status uses `--success` for published; draft stays muted.
- Featured uses `--gold`, the achievement token.
- Stat grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, per §4.3.
- Headings use `font-heading` (Amiri); body uses the sans stack.
- Delete flows through `AlertDialog`, per §8.6. Toasts via `sonner`, per §8.7.
- Arabic labels for DB enums live only in `constants/path.ts`.
- Dates and numbers use `ar-EG-u-nu-latn` — Arabic month names, Latin digits,
  the usual convention in Arabic admin interfaces.

---

## 12. Verification performed

- `npx tsc --noEmit` — clean.
- `npx next build` — clean; `/api/paths` and `/api/paths/[pathId]` registered.
- Repository `select` shapes executed against the live Neon database: list with
  search + status filter + pagination returned 3 of 3 matching rows with correct
  `_count`s; detail returned ordered stages with per-stage lesson/quiz counts.
- API guard: unauthenticated `GET` and `DELETE` return 401 in the documented
  envelope.
- UI on a production build: page renders, filter triggers show their Arabic
  labels, the query fires, and the 401 propagates through Axios → React Query →
  `ErrorState` with the Arabic message and a working retry.

**Not verified:** the authenticated happy path — creating, editing and deleting
through the browser — because that needs a signed-in ADMIN session, and signing
in is not something this agent does. Note that `alisoliman2125@gmail.com` is
currently `STUDENT`; an `ADMIN` account is needed to exercise the console.

---

## 13. Base UI gotchas hit while building this

Two runtime issues surfaced on first render and are worth knowing before writing
the next feature, because both are silent trap-doors in `@base-ui/react`.

### `nativeButton` when a Button renders a Link

`Button` extends `NativeButtonProps`, whose `nativeButton` **defaults to
`true`**. Rendering an anchor through it logs a console error and drops button
semantics:

> Base UI: A component that acts as a button expected a native `<button>`
> because the `nativeButton` prop is true.

```tsx
// wrong — Button assumes it is rendering a <button>
<Button render={<Link href="…" />}>مسار جديد</Button>

// right
<Button nativeButton={false} render={<Link href="…" />}>مسار جديد</Button>
```

Not every primitive needs it. `MenuItem` extends `NonNativeButtonProps`
(defaults to `false`), so `DropdownMenuItem render={<Link/>}` is already
correct. `MenuTrigger` extends `NativeButtonProps`, but we render a real
`Button` into it, so it is fine too. **Rule of thumb: check whether the
primitive extends `NativeButtonProps` or `NonNativeButtonProps` before passing
`render`.**

### `Select` treats `""` as "no value"

A `<SelectItem value="">` is selectable, but the trigger still reports
`data-placeholder` and shows the placeholder text rather than that item's label.
So the "no category" option rendered as `اختر…` instead of `بدون تصنيف`.

The fix is to let the placeholder carry the real label, since `""` *means* "no
category":

```tsx
<SelectField … value={field.value ?? ""} placeholder="بدون تصنيف" />
```

The alternative — a `"NONE"` sentinel mapped at the form boundary — was rejected
because it puts a value in the form that the shared Zod schema does not accept,
which is exactly the drift the shared schema exists to prevent.

---

## 14. Next steps

1. Sign in as an ADMIN and walk create → edit → publish → delete.
2. Apply this pattern to stages (adds `order`), lessons (content-type switch),
   quizzes (nested question editor), and users (read-first).
3. Guard `/admin` pages server-side — see `admin-dashboard.md` §11.
4. Consider `updateTag`/`revalidateTag` if any of this data ever moves to a
   Server Component read path.
