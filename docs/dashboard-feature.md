# Dashboard Feature — The admin console home page

> **Scope:** `/admin` (dashboard landing page), and the full stack behind it.
>
> Related: [`admin-dashboard.md`](./admin-dashboard.md) ·
> [`folder-structure.md`](./folder-structure.md)

---

## 1. Request flow

The dashboard retrieves aggregate statistics about the platform's usage, including the number of published paths, enrollments, completion rates, granted certificates, and rankings of the top paths.

Unlike previous drafts of the architecture which proposed bypassing the API layer for the dashboard, this feature follows the standard **Layer-Based Architecture** required for all data-fetching in the application:

```text
UI  ── components/admin/dashboard/dashboard-view.tsx
 ↓
Hook ── hooks/use-dashboard.ts                       (React Query)
 ↓
Axios ── lib/axios.ts                                 (the only HTTP caller)
 ↓
API ── app/api/dashboard/route.ts
 ↓        guards (requireAdmin); no business rules
Service ── services/dashboard.service.ts              (aggregates repository calls)
 ↓
Repository ── repositories/dashboard.repository.ts    (the only Prisma importer)
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
│   └── dashboard.ts                 # DashboardStats, TopPathMetric, DashboardData
│
├── repositories/
│   └── dashboard.repository.ts      # Prisma aggregations and top-N queries
│
├── services/
│   └── dashboard.service.ts         # Coordinates data shaping
│
├── app/api/dashboard/
│   └── route.ts                     # GET (admin guarded)
│
├── hooks/
│   └── use-dashboard.ts             # useGetAdminData()
│
├── components/admin/dashboard/
│   └── dashboard-view.tsx           # client component that renders the data
│
└── app/(admin)/admin/
    ├── page.tsx                     # server component rendering <DashboardView />
    └── loading.tsx                  # fallback skeletons
```

---

## 3. Data Aggregations

The repository aggregates the following figures:

- **Published Paths:** `db.path.count({ where: { status: "PUBLISHED" } })`
- **Enrollments:** `db.enrollment.count()`
- **Completion Rate:** `db.enrollment.aggregate({ _avg: { progress: true } })`
- **Granted Certificates:** `db.certificate.count()`
- **Most Enrolled Paths:** `db.path.findMany({ orderBy: { enrollments: { _count: "desc" } }, take: 5 })`
- **Most Completed Paths:** `db.path.findMany({ orderBy: { certificates: { _count: "desc" } }, take: 5 })`

---

## 4. UI Rendering

The `/admin` page is a simple server component that drops the client-side `<DashboardView />` into the `PageContainer`. 

`<DashboardView />` relies on `useGetAdminData()` to fetch the payload from the backend. 
- While `isPending` is true, it renders the `StatCardsSkeleton` and local pulse animations for the Top Paths tables.
- If `isError` is true, it falls back to the `ErrorState` component.
- The Top Paths section replaces the placeholder "أحدث النشاطات" with two side-by-side lists indicating the highest-performing paths by enrollments and certificates.
