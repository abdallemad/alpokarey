# Admin Dashboard — the `/admin` shell

> **Scope:** the layout that every admin screen renders inside — sidebar,
> header, responsive behaviour, loading and error states — plus the RTL
> foundation the whole site now sits on.
>
> Related: [`folder-structure.md`](./folder-structure.md) ·
> [`design-system.md`](./design-system.md) ·
> [`paths-feature.md`](./paths-feature.md)

---

## 1. What was built

| Area | Outcome |
|---|---|
| Direction | The whole app switched from `dir="ltr"` to **`dir="rtl"`**, Arabic-first |
| Shell | `(admin)` route group with a collapsible sidebar and a sticky header |
| Navigation | Sidebar and breadcrumbs — both from one config |
| Responsive | Icon rail on desktop, drawer below `md`, columns shed progressively |
| Loading | `loading.tsx` per segment, shaped like the content it replaces |
| Errors | Segment boundary with `retry`, an admin `not-found`, a `global-error` |

---

## 2. Route structure

```text
src/app/
├── global-error.tsx              # last-resort boundary (renders its own <html>)
│
└── (admin)/
    └── admin/
        ├── layout.tsx            # the shell — sidebar + header + content slot
        ├── page.tsx              # dashboard landing
        ├── loading.tsx           # dashboard skeleton
        ├── error.tsx             # boundary for the whole /admin subtree
        ├── not-found.tsx         # unknown /admin/* URLs, inside the shell
        │
        ├── paths/                # see paths-feature.md
        ├── stages/               # see stages-feature.md
        ├── lessons/              # see lessons-feature.md
        ├── quizzes/              # placeholder + table skeleton
        └── users/                # placeholder + table skeleton
```

`(admin)` is a route group: it lets the console own a layout without adding a
segment to the URL. `/admin` stays `/admin`.

### Why the sections exist as placeholders

Every sidebar destination resolves to a real page. A nav item that 404s makes
the shell impossible to review, so each section renders its page header and an
`EmptyState` explaining that the feature is not wired yet. `paths/`, `stages/`
and `lessons/` have since been built out for real.

---

## 3. The shell — `(admin)/admin/layout.tsx`

```tsx
const cookieStore = await cookies();
const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

<TooltipProvider>
  <SidebarProvider defaultOpen={defaultOpen}>
    <AdminSidebar />
    <SidebarInset className="min-w-0">
      <AdminHeader />
      {children}
    </SidebarInset>
  </SidebarProvider>
</TooltipProvider>
```

Three decisions worth keeping:

- **The sidebar's open state is read from a cookie on the server.** The sidebar
  component writes `sidebar_state` whenever it is toggled; reading it here means
  the first paint already matches what the admin last chose. Without it, every
  page load would flash an open sidebar that snaps shut after hydration.
  `SIDEBAR_COOKIE_NAME` is exported from `ui/sidebar.tsx` so the writer and the
  reader can never drift apart.
- **`min-w-0` on `SidebarInset`.** It is a flex child; without a zero min-width
  a wide table stretches the whole shell instead of scrolling inside its own
  column.
- **Metadata sets `robots: { index: false }`** and a title template, so every
  admin page reads `<section> | لوحة تحكم أكاديمية الإمام البخاري`.

> Reading `cookies()` makes the layout dynamic, which is why every `/admin`
> route builds as `ƒ`. Per the Next.js 16 docs, `loading.tsx` cannot show a
> fallback for the layout's own data — but layouts do not re-render on
> navigation, so this costs one render on first load only.

---

## 4. Sidebar — `components/admin/layout/admin-sidebar.tsx`

```tsx
<Sidebar side="right" variant="sidebar" collapsible="icon">
```

`side="right"` is the RTL start edge — where an Arabic reader expects primary
navigation.

### Navigation source of truth

The sidebar renders from `constants/admin-navigation.ts`, and so do the
breadcrumb labels. Adding a section is a single entry:

```ts
{
  href: ROUTES.admin.paths,
  label: "المسارات",
  icon: Route,
  keywords: ["paths", "tracks", "masarat"],   // reserved for search
}
```

Groups: **نظرة عامة** (dashboard) · **إدارة المحتوى** (paths, stages, lessons,
quizzes) · **الإدارة** (users). Flat groups rather than collapsible ones —
with six destinations, an accordion adds interaction cost for no gain, and
collapsible groups behave poorly in the icon rail.

### Active state

`utils/nav.ts`:

```ts
isNavItemActive(pathname, item)
// exact: true      → pathname === href          (/admin only)
// otherwise        → href, or anything under href/
```

The `/`-suffixed prefix check is deliberate: it keeps `/admin/paths/123/edit`
highlighting `المسارات` without letting a hypothetical `/admin/paths-archive`
match too. `/admin` is marked `exact` or it would stay lit on every page.

### Footer

Back-to-site link, then `AdminUserMenu`, which renders three states: a skeleton
while Clerk boots, a sign-in link when there is no session, and the account menu
(profile, sign out) once a user exists.

---

## 5. Header — `components/admin/layout/admin-header.tsx`

A **Server Component**. It holds no state, so only its two interactive
children ship JavaScript.

| Element | Behaviour |
|---|---|
| `SidebarTrigger` | Collapses the rail on desktop, opens the drawer on mobile (⌘/Ctrl+B) |
| `AdminBreadcrumbs` | Derived from `usePathname()` |
| `ThemeToggle` | Light / dark / system |

It is `sticky top-0`, not `fixed`, so it never overlaps content.

### Breadcrumbs

Layouts do not re-render on navigation, so a trail passed down from the layout
would go stale. It is computed client-side from the pathname instead. Segments
resolve through `ADMIN_SEGMENT_LABELS`; anything unknown — a UUID — renders as
`تفاصيل` rather than dumping a raw ID at the user. The separator is a
`ChevronLeft`, because in RTL the trail advances leftward.

---

## 6. Responsive behaviour

| Width | Sidebar | Header | Tables |
|---|---|---|---|
| `< 768px` | Off-canvas `Sheet` drawer, opens from the right; closes on navigation | Breadcrumbs show current page only | Title + status + row menu |
| `≥ 768px` (`md`) | Persistent, collapsible to a 3rem icon rail with tooltips | Full trail | `+ التصنيف` |
| `≥ 1024px` (`lg`) | — | — | `+ المراحل، التسجيلات` |
| `≥ 1280px` (`xl`) | — | — | `+ تاريخ الإنشاء` |

The `md` breakpoint comes from `useIsMobile()` (768px), which is what the
sidebar component swaps on. Below it, `AdminSidebar` closes the drawer itself on
navigation via `setOpenMobile(false)` — otherwise the drawer would sit on top of
the page the admin just asked for.

Verified at 1280px (rail collapses 256px → 48px, content expands to fill) and at
735px (sidebar becomes a closed drawer). No horizontal overflow at either width.

---

## 7. Loading states

`loading.tsx` sits *below* `layout.tsx` in the hierarchy, so the sidebar and
header stay rendered and interactive while only the content column streams.

| File | Shows |
|---|---|
| `admin/loading.tsx` | Page header + 4 stat cards + a chart block |
| `admin/paths/loading.tsx` | Page header + 4-column table skeleton |
| `admin/paths/[pathId]/loading.tsx` | Page header + stat cards + form block |
| `admin/stages/loading.tsx` | Page header **without** an action + table skeleton — the real header's create button is a dialog trigger, not a link |
| `admin/lessons/loading.tsx` | Page header + 5-column table skeleton |
| `admin/lessons/[lessonId]/loading.tsx` | Page header + 3 stat cards + form block |
| `admin/quizzes\|users/loading.tsx` | Table skeletons, column counts matched to each screen |

Each segment gets its own rather than inheriting one generic fallback: a
dashboard skeleton flashing while navigating to a table page reads as a bug.

Skeleton components live in `components/admin/shared/skeletons.tsx`
(`PageHeaderSkeleton`, `StatCardsSkeleton`, `DataTableSkeleton`) and mirror the
real layout's heights and grids so nothing shifts when content swaps in.

---

## 8. Error states

### `admin/error.tsx` — the segment boundary

**Next.js 16.3 uses `retry`, not `reset`.** The prop stabilised in 16.3; `retry()`
re-fetches and re-renders the boundary's children, where `reset()` only clears
error state without re-fetching.

```tsx
export default function AdminError({ error, retry }: {
  error: Error & { digest?: string };
  retry: () => void;
}) { … }
```

It lives *beside* `layout.tsx`, not above it, so the shell survives the error and
the admin can navigate away instead of landing on a bare page.

The UI is `ErrorState` (`components/admin/shared/error-state.tsx`): a neutral
Arabic explanation, a retry button, and `error.digest` in small print. It never
shows `error.message` from a Server Component — in production Next.js replaces
that with a generic string precisely to avoid leaking server internals, and the
digest is what matches a line in the server log.

### `admin/not-found.tsx`

Unknown `/admin/*` URLs and `notFound()` calls, rendered inside the shell with a
route back to the dashboard.

### `app/global-error.tsx`

Catches throws from the **root layout itself**. It replaces the root layout when
active, so it declares its own `<html lang="ar" dir="rtl">` and `<body>`. Global
styles and the theme class are not available at that point, which is why its
styling is inline rather than Tailwind — a documented constraint, not an
oversight.

---

## 9. RTL implementation

`design-system.md` §10 described RTL as a future step. It is now done.

### Foundation

| Change | File |
|---|---|
| `dir="ltr"` → `dir="rtl"` | `src/app/layout.tsx` |
| `"rtl": false` → `"rtl": true` | `components.json` |
| `ThemeProvider` + `Toaster dir="rtl"` added | `src/app/layout.tsx` |
| Scaffolding Clerk header removed | `src/app/layout.tsx` |

The `components.json` flag only affects components generated **from now on**; it
does not rewrite the 33 already installed. Those needed manual fixes.

### Logical-property fixes in `components/ui/*`

shadcn's base-nova components ship physical-direction classes that break when
`dir="rtl"`. These were swapped for logical equivalents:

| File | Change |
|---|---|
| `sidebar.tsx` | `text-left`→`text-start`, `pr-8`→`pe-8`, `right-1/3`→`end-1/3`, `border-l`→`border-s`, `ml-0/ml-2`→`ms-0/ms-2`; trigger icon gets `rtl:rotate-180` |
| `table.tsx` | `text-left`→`text-start`, `pr-0`→`pe-0` |
| `dialog.tsx` | close button `right-2`→`end-2` — in RTL the physical `right` is the *start* edge, so the button sat on top of the title |
| `select.tsx` | `text-left`→`text-start`, `pr-2 pl-2.5`→`pe-2 ps-2.5`, item padding and the check indicator's `right-2`→`end-2` |
| `alert-dialog.tsx` | `sm:…text-left`→`text-start` |

Also exported `SIDEBAR_COOKIE_NAME` from `sidebar.tsx` so the layout can read the
same cookie the component writes.

### Direction-aware details

- Sidebar `side="right"` — the RTL start edge.
- Collapsed-rail tooltips use `side="inline-end"`, so they open over the content
  in RTL and would open the other way in LTR. Verified: with the rail at
  x≈745–777, the tooltip renders to its left.
- Breadcrumb separator is `ChevronLeft`; pagination uses `ChevronRight` for
  "previous" and `ChevronLeft` for "next".
- New code uses `ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*` throughout — never
  `ml-*`/`pl-*`/`left-*`.

> **Verified:** `document.documentElement.dir === "rtl"`, sidebar occupying the
> right edge (x: 1024→1280 at a 1280px viewport) with content at 0→1024, and
> every menu button computing `text-align: start`.

---

## 10. Component catalog

```text
components/
├── shared/                     # domain-neutral, used by admin + learner app
│   ├── brand-lockup.tsx        # mark + wordmark; `textClassName` lets the
│   │                           #   caller hide the text in an icon rail
│   ├── empty-state.tsx
│   ├── search-input.tsx        # debounced
│   ├── theme-toggle.tsx
│   └── index.ts
│
├── providers/
│   └── query-provider.tsx      # React Query cache
│
└── admin/
    ├── layout/
    │   ├── admin-sidebar.tsx
    │   ├── admin-header.tsx
    │   ├── admin-breadcrumbs.tsx
    │   ├── admin-user-menu.tsx
    │   └── index.ts
    │
    └── shared/
        ├── section-card.tsx             # titled panel; `flush` for tables
        ├── skeletons.tsx
        ├── data-pagination.tsx
        ├── delete-confirmation-dialog.tsx
        └── index.ts                     # also re-exports components/shared
```

> **Moved since:** `page-container`, `page-header`, `error-state`,
> `api-error-state` and the account menu now live in `components/shared`,
> because the learner shell renders the same ones — see
> [`student-dashboard.md`](./student-dashboard.md) §8. The admin barrel
> re-exports all of them, so no admin import changed.

`components/admin/shared/index.ts` re-exports the domain-neutral components, so
admin features import from one path as `folder-structure.md` specifies:

```ts
import { PageContainer, PageHeader, EmptyState } from "@/components/admin/shared";
```

`components/providers/` is a new folder not in the original structure — it holds
context providers mounted in the root layout.

---

## 11. Access control

Full write-up: [`admin-access-control.md`](./admin-access-control.md).

In short: `services/auth.service.ts` provides `requireAdmin()`, which checks the
Clerk session **and** the local `User.role`, and it guards every `/api/paths`
endpoint. A valid Clerk session is not enough — the account must be `ADMIN`.
`/auth-callback` mirrors the Clerk account into the `User` table on sign-in and
resolves the role from `ADMIN_EMAILS`.

`/admin` **pages** are not yet guarded server-side: a non-admin can load the
shell, but every request inside it returns 401/403, so no data leaks. See
`admin-access-control.md` §6 for the remaining gaps.

---

## 12. Verification performed

- `npx tsc --noEmit` — clean.
- `npx next build` — clean; 14 routes.
- Rendered on a production build: sidebar groups, active state (`data-active` on
  the current section with the accent background), breadcrumb trail, metadata
  template, theme toggle.
- Sidebar collapse measured at 256px → 48px with content expanding to fill.
- Mobile: below 768px the sidebar becomes a closed drawer.
- No console errors; no horizontal overflow.

> One caveat about tooling, not the app: screenshots were unavailable because the
> browser pane was not displayed, and a non-compositing page never advances CSS
> transitions. Mid-transition measurements were therefore misleading; the
> geometry above was confirmed with transitions disabled.

---

## 13. Next steps

1. Guard `/admin` pages server-side and document it in `admin-access-control.md`.
2. Build the Clerk webhook so `User` rows and roles stay in sync.
3. Replace the dashboard's placeholder figures — see `dashboard-feature.md`.
4. Apply the `paths` pattern to quizzes and users — stages and lessons are
   done, see `stages-feature.md` and `lessons-feature.md`.
