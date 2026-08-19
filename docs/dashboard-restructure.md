# Dashboard Restructure — every learner screen under `/dashboard/*`

> **Scope:** the URL layout of the `(app)` route group. `/dashboard` became a
> section rather than a page; `/paths` and `/account/certificates` moved into
> it.
>
> Related: [`student-dashboard.md`](./student-dashboard.md) — the shell and the
> pages themselves · [`learn-layout.md`](./learn-layout.md) — the player, which
> deliberately stayed outside · [`certificates-feature.md`](./certificates-feature.md)
> · [`folder-structure.md`](./folder-structure.md)

---

## 1. What changed

| Before | After |
|---|---|
| `/dashboard` | `/dashboard/home` |
| `/paths` | `/dashboard/paths` |
| `/account/certificates` | `/dashboard/certificates` |
| — | `/dashboard/certificates/[certificateId]` *(new — see `certificates-feature.md`)* |
| `/dashboard` (page) | `/dashboard` (redirect → `/dashboard/home`) |
| `/learn/[pathId]` inside `(app)` | `/learn/[pathId]` inside `(learn)` — its own shell |

No component was rewritten to move. `StudentDashboardView`, `MyPathsView` and
`StudentCertificatesView` are the same files doing the same work at new
addresses.

---

## 2. Why a section instead of a page

The three learner destinations were three unrelated top-level URLs that happened
to share a shell. Reading the address bar told you nothing about which product
you were in — `/paths` could as easily have been the public catalog, and
`/account/certificates` implied an `/account` area that had exactly one child.

They are now siblings under one prefix:

```text
/dashboard/home          لوحتي
/dashboard/paths         مساراتي
/dashboard/certificates  شهاداتي
```

Three consequences, in order of how much they matter:

1. **The prefix is now a fact the shell can rely on.** "Am I in the learner
   dashboard?" is a question about the first URL segment, not a list of three
   paths to keep in sync.
2. **Adding a fourth destination is a folder**, not a decision about whether it
   belongs under `/account`, at the top level, or somewhere else.
3. **`/dashboard/home` is a sibling, not a parent.** Had the home screen stayed
   at `/dashboard` with the other two beneath it, the home screen would have
   been implicitly the parent of the certificates list, which it is not.

### The cost, and how it is paid

The bare prefix has to resolve to something — the sidebar's brand lockup, the
sign-in redirect, and any bookmark made before this change all point at
`/dashboard`. So `app/(app)/dashboard/page.tsx` is a redirect to
`/dashboard/home` and nothing else.

A redirect rather than a rewrite, so the address bar ends up saying what the
learner is actually looking at. Verified: `GET /dashboard` follows to
`/dashboard/home`.

---

## 3. Files

```text
src/app/(app)/
├── layout.tsx                              # unchanged
└── dashboard/
    ├── page.tsx                            # NEW — redirect to home
    ├── home/
    │   ├── page.tsx                        # was dashboard/page.tsx
    │   └── loading.tsx                     # was dashboard/loading.tsx
    ├── paths/
    │   ├── page.tsx                        # was (app)/paths/page.tsx
    │   └── loading.tsx                     # was (app)/paths/loading.tsx
    └── certificates/
        ├── page.tsx                        # was (app)/account/certificates/page.tsx
        ├── loading.tsx                     # NEW — the other two had one
        └── [certificateId]/
            └── page.tsx                    # NEW — certificates-feature.md
```

`(app)/paths/` and `(app)/account/` are gone. `(app)/learn/` moved out entirely
— see [`learn-layout.md`](./learn-layout.md).

---

## 4. `constants/routes.ts` absorbed the whole change

Every link in the app comes from `ROUTES`, which is what made this a
one-file edit rather than a search for hard-coded strings:

```ts
app: {
  dashboard: "/dashboard",            // not a page — redirects to home
  home: "/dashboard/home",
  paths: "/dashboard/paths",
  certificates: "/dashboard/certificates",
  certificate: (id) => `/dashboard/certificates/${id}`,
  …
}
```

`ROUTES.app.dashboard` was **kept**, pointing at the redirect. It is the honest
name for "the learner section", and the sign-in flow has a legitimate reason to
name a section rather than a page.

Every call site that meant *the home screen* was repointed at `ROUTES.app.home`,
so no in-app navigation pays for a redirect hop:

| File | Was |
|---|---|
| `app/auth-callback/route.ts` | where students land after sign-in |
| `components/app/layout/app-sidebar.tsx` | the brand lockup |
| `components/app/dashboard/student-certificates-view.tsx` | "لوحتي" button |
| `components/app/paths/my-paths-view.tsx` | two buttons |

---

## 5. Two things in the shell had to follow

### The nav

`APP_NAV_ITEMS` now points at `ROUTES.app.home`, `ROUTES.app.paths`,
`ROUTES.app.certificates`. The labels and the order are unchanged. `exact: true`
stays on the home entry — without it, `/dashboard/home` would light up on
nothing, but the entry would also need to not match its own children, and it has
none.

### The header title — a real bug the move created

`AppHeader` derives its title from the pathname. It used to read the **first**
URL segment as a fallback:

```ts
const segment = pathname.split("/").filter(Boolean)[0] ?? "";
```

That was fine when the three screens started with three different segments. It
is broken the moment they all start with `dashboard`: every learner page would
fall back to "لوحتي".

It now scans **from the end** and takes the last segment that has a label:

```ts
pathname.split("/").filter(Boolean).reverse()
  .map((segment) => APP_SEGMENT_LABELS[segment]).find(Boolean)
```

So `/dashboard/certificates/<uuid>` skips the id and answers "شهاداتي".
`APP_SEGMENT_LABELS` lost its `account` and `my-paths` keys — neither segment
exists any more — and gained `home`.

Verified in the browser: on `/dashboard/certificates` the header reads
"شهاداتي", and the sidebar's four links resolve to `/dashboard/home` (×2, brand
plus nav), `/dashboard/paths` and `/dashboard/certificates`.

---

## 6. What did *not* change

- **`ROUTES.app.path(pathId)` still points at `/paths/:pathId`.** That is the
  public path page — moving the learner's *own* path list did not make it this
  feature's business.

  > **Since built.** It no longer 404s: `/paths/[pathId]` renders in the
  > `(marketing)` shell and hosts the enrol button. See
  > [`path-detail-feature.md`](./path-detail-feature.md). The point stands —
  > the URL never had to change for it to land, which is what centralising it
  > in `ROUTES` bought.
- **The `(app)` layout.** Same sidebar, same header, same cookie-backed open
  state.
- **Every API route.** `/api/me/dashboard`, `/api/me/paths` and the rest are
  untouched; the HTTP contract has no opinion about which URL renders it.

---

## 7. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every changed file — clean.
- `npx next build` — clean. All five dashboard routes registered:
  `/dashboard`, `/dashboard/home`, `/dashboard/paths`, `/dashboard/certificates`,
  `/dashboard/certificates/[certificateId]`.
- On the running dev server, signed out:
  - `GET /dashboard` follows the redirect to `/dashboard/home` (200).
  - All four pages return 200, render the sidebar (`data-slot="sidebar"`),
    `dir="rtl"`, and their own `<title>`.
  - The header title on `/dashboard/certificates` reads "شهاداتي" — the
    end-first segment scan working.
  - No console errors beyond the expected 401s from the signed-out API calls.

**Not verified:** the populated pages. That needs a signed-in session, which
this agent cannot establish — the same limitation recorded in
[`student-dashboard.md`](./student-dashboard.md) §11. The pages' data layer is
unchanged by this work, so what could break here is routing, and routing is
covered above.
