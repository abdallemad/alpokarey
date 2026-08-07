# Folder Structure

## Related documents

- [`business-analysis.md`](./business-analysis.md) — product scope, tracks system, and open requirements
- [`erd.md`](./erd.md) — entity relationships (Path, Stage, Lesson, Quiz, Enrollment, Certificate...)
- [`tech-stack.md`](./tech-stack.md) — Next.js (App Router), Clerk auth, shadcn/ui, TanStack React Query, Axios, Prisma ORM, PostgreSQL
- [`storefront-layout.md`](./storefront-layout.md) — the two learner-facing shells (`(marketing)` header, `(app)` sidebar), the shared brand lockup, the database-driven nav, the account menu
- [`landing-page.md`](./landing-page.md) — `/` and `/about`, the public marketing routes
- [`tracks-catalog-feature.md`](./tracks-catalog-feature.md) — `/paths`, the public catalog of learning tracks and its category/audience facets
- [`path-detail-feature.md`](./path-detail-feature.md) — `/paths/[pathId]`, the curriculum view: stages, lessons, and enrollment call-to-action
- [`learning-feature.md`](./learning-feature.md) — `/learn/[pathId]/[lessonId]`, the player: video/text content, attachments, and progress tracking
- [`quiz-feature.md`](./quiz-feature.md) — `/learn/[pathId]/quiz/[quizId]`, question flow, attempts, and pass/fail scoring
- [`enrollment-feature.md`](./enrollment-feature.md) — enroll/unenroll actions and `/account/my-paths`
- [`certificates-feature.md`](./certificates-feature.md) — issuance rules and `/account/certificates`
- [`admin-dashboard.md`](./admin-dashboard.md) — the `/admin` console and its reusable components
- [`admin-access-control.md`](./admin-access-control.md) — how `/admin` is locked down (Clerk role + middleware + server-side guard)
- [`dashboard-feature.md`](./dashboard-feature.md) — the `/admin` landing figures (enrollments, completion rates, certificate counts)
- [`paths-feature.md`](./paths-feature.md) — the reference CRUD feature, layer by layer
- [`stages-feature.md`](./stages-feature.md) — the same pattern, nested under a path, with `order`
- [`lessons-feature.md`](./lessons-feature.md) — the same pattern with a content-type switch (video/text) and attachments
- [`quizzes-feature.md`](./quizzes-feature.md) — the same pattern with a nested question/option editor
- [`users-feature.md`](./users-feature.md) — read-first: accounts mirrored from Clerk, with the STUDENT/ADMIN role guard
- [`database-seeding.md`](./database-seeding.md) — mock data for development

## Overview

The project follows a **Layer-Based Architecture**, extended with an internal
**API layer**. The API layer exists so the same backend can later be reused by
a mobile application — the web app is simply the first consumer of it.

The goal is to separate responsibilities between presentation, data fetching,
transport, business logic, and data access while keeping the project scalable
and maintainable.

Each feature follows the same development flow:

```text
UI
↓
Hook (React Query + Axios)
↓
API Route (app/api)
↓
Service
↓
Repository
↓
Prisma
↓
Database
```

Unlike a Server Actions setup, **every** mutation and query — web or future
mobile — goes through the same `app/api` HTTP boundary. Hooks never call
Services directly; they only ever call Axios, which only ever calls `app/api`.

---

# Project Structure

```text
src/
│
├── app/
│
├── components/
│
├── repositories/
│
├── services/
│
├── hooks/
│
├── validation/
│
├── forms/
│
├── lib/
│
├── types/
│
├── utils/
│
└── constants/
```

---

# app/

Contains all application routes (pages) **and** the HTTP API, using the
Next.js App Router.

```text
app/
│
├── (marketing)/            # header only — see storefront-layout.md
│   ├── layout.tsx
│   ├── page.tsx             #   /       — landing-page.md
│   └── about/                #   /about  — landing-page.md
│
├── (app)/                  # sidebar only — see storefront-layout.md
│   ├── layout.tsx
│   ├── paths/                #   /paths                — tracks-catalog-feature.md
│   │   └── [pathId]/          #   /paths/[pathId]        — path-detail-feature.md
│   ├── learn/
│   │   └── [pathId]/
│   │       ├── [lessonId]/     #   /learn/[pathId]/[lessonId]      — learning-feature.md
│   │       └── quiz/
│   │           └── [quizId]/    #   /learn/[pathId]/quiz/[quizId]  — quiz-feature.md
│   └── account/
│       ├── my-paths/          #   /account/my-paths      — enrollment-feature.md
│       └── certificates/      #   /account/certificates  — certificates-feature.md
│
├── (admin)/                 # the dashboard — admin-dashboard.md
│   └── admin/
│       ├── paths/
│       ├── stages/
│       ├── lessons/
│       ├── quizzes/
│       └── users/
│
├── api/                     # the HTTP boundary — reused later by mobile
│   ├── paths/
│   │   ├── route.ts           # GET (list) / POST (create)
│   │   └── [pathId]/
│   │       ├── route.ts        # GET (one) / PATCH / DELETE
│   │       ├── stages/
│   │       │   └── route.ts
│   │       └── enroll/
│   │           └── route.ts    # POST — create Enrollment
│   ├── lessons/
│   │   └── [lessonId]/
│   │       ├── route.ts
│   │       └── progress/
│   │           └── route.ts    # POST — mark LessonProgress complete
│   ├── quizzes/
│   │   └── [quizId]/
│   │       ├── route.ts
│   │       └── attempts/
│   │           └── route.ts    # POST — submit QuizAttempt + QuizAnswers
│   ├── certificates/
│   │   └── route.ts
│   ├── users/
│   │   └── route.ts
│   └── webhooks/
│       └── clerk/
│           └── route.ts        # keeps User in sync with Clerk
│
├── sign-in/  sign-up/  auth-callback/
│
├── layout.tsx               # <html>, <body>, Clerk + Query providers
│
└── not-found.tsx
```

Route groups (the parenthesised folders) organise pages without appearing in
the URL, so each group can own a layout without nesting the URL a level
deeper. `app/api` is the one top-level folder that is **not** a route group —
its segments are the real, versionable HTTP contract.

### Responsibilities

- Pages: Routing, Layouts, Server Components (read-only, first paint), Metadata
- `api/`: request parsing, calling the Service layer, shaping the HTTP response
- Route Groups
- Error Pages

Business logic should never live in `app/`, on either side (pages or API
routes).

---

# components/

Reusable UI components.

```text
components/
│
├── ui/
│
├── shared/
│
├── layout/
│
├── paths/
│
├── stages/
│
├── lessons/
│
├── quizzes/
│
├── certificates/
│
├── enrollment/
│
└── admin/
```

### ui/

Reusable shadcn/ui wrappers.

Examples:

- Button
- Input
- Card
- Dialog
- Badge
- Progress

---

### shared/

Domain-neutral components used across multiple pages — they take data and
callbacks and know nothing about any entity.

```text
shared/
│
├── empty-state.tsx
├── logo-avatar.tsx
├── pagination.tsx
├── search-input.tsx
├── status-badge.tsx
├── progress-ring.tsx
└── index.ts
```

All are used by **both** the learner-facing app and the admin console.
`components/admin/shared/index.ts` re-exports them, so admin features keep
importing from a single path:

```ts
import { PageContainer, Pagination } from "@/components/admin/shared" // admin
import { EmptyState, Pagination } from "@/components/shared"          // learner app
```

---

### paths/, stages/, lessons/, quizzes/

The learning-experience surfaces.

`paths/` holds the catalog grid (`PathsView`, `PathCard`) and the filter panel
`PathFilters` (category, audience, featured).

`lessons/` holds the lesson player (`LessonPlayer`, `VideoContent`,
`TextContent`, `AttachmentList`) and the "mark as complete" control that
drives `LessonProgress`.

`quizzes/` holds the question flow (`QuizRunner`, `QuestionCard`,
`OptionList`) and the result screen (`QuizResult`), which reads
`passingScore` from the quiz to decide pass/fail messaging.

See [`learning-feature.md`](./learning-feature.md) and
[`quiz-feature.md`](./quiz-feature.md) for why the player and the quiz runner
are separate state machines.

---

### enrollment/ and certificates/

`enrollment/` holds `EnrollButton` — used on both the catalog card and the
path detail page, so enrolling behaves identically everywhere — and
`MyPathsView`.

`certificates/` holds `CertificateCard` and the printable certificate
template. See [`certificates-feature.md`](./certificates-feature.md).

---

### layout/

Application layout components.

Examples:

- Navbar
- Footer
- Sidebar
- Header

---

### admin/

Admin dashboard components, organised by feature rather than by type.

```text
admin/
│
├── layout/     # sidebar, header, mobile nav, breadcrumbs, user menu
│
└── shared/     # page container, page header, section card,
                # data table wrapper, search input, toolbar,
                # pagination, empty/loading states, status badge,
                # delete confirmation dialog
```

`shared/` re-exports through an `index.ts` barrel, so feature folders import
from a single stable path:

```ts
import { PageContainer, PageHeader } from "@/components/admin/shared"
```

See [`admin-dashboard.md`](./admin-dashboard.md) for the full component
catalog and usage examples.

---

# forms/

All forms in the application, plus the shared field primitives they are built
from. Kept separate from `components/` so a form's markup, its validation
schema, and its submit contract are easy to find in one place.

```text
forms/
│
├── form-field.tsx        # TextField, SwitchField, SelectField, FormAlert
│
├── path-form.tsx          # one file per entity form
├── stage-form.tsx
├── lesson-form.tsx
├── quiz-form.tsx
├── question-form.tsx
└── enrollment-form.tsx    # rarely needed — enroll is usually a single click
```

Forms stay presentational: they receive `defaultValues` and an `onSubmit`,
and the caller (a hook's mutation) owns the request. That keeps the same
component usable in a dialog and on a full page.

State is managed by **react-hook-form**, validated by the entity's Zod schema
through `standardSchemaResolver`, so the form and the API route enforce
identical rules — the same schema is imported on both sides.

---

# hooks/

React Query hooks. This is the **only** layer allowed to call Axios, and
Axios is the **only** thing allowed to talk to `app/api`.

```text
hooks/
│
├── use-paths.ts
├── use-path.ts
├── use-stages.ts
├── use-lessons.ts
├── use-lesson-progress.ts
├── use-quizzes.ts
├── use-quiz-attempt.ts
├── use-enrollment.ts
├── use-certificates.ts
└── use-users.ts
```

### Responsibilities

- Queries (`useQuery`)
- Mutations (`useMutation`)
- Cache Management (query keys, invalidation)
- Optimistic Updates (e.g. lesson-complete toggle)
- Loading / error states surfaced to the UI

UI components must consume hooks instead of calling Axios or `fetch`
directly.

---

# validation/

Zod validation schemas — the single source of truth for shape and rules,
imported by both `forms/` (client-side) and `app/api/**/route.ts`
(server-side).

```text
validation/
│
├── path.schema.ts
├── stage.schema.ts
├── lesson.schema.ts
├── quiz.schema.ts
├── question.schema.ts
├── enrollment.schema.ts
└── user.schema.ts
```

Examples:

- `pathCreateSchema` / `pathUpdateSchema`
- `quizAttemptSubmitSchema` (array of `{ questionId, optionId }`)
- `lessonProgressSchema`

---

# services/

Business Logic Layer. Only this layer decides *what* a request is allowed to
do — API routes just parse and delegate.

```text
services/
│
├── auth.service.ts
├── path.service.ts
├── stage.service.ts
├── lesson.service.ts
├── quiz.service.ts
├── enrollment.service.ts
├── progress.service.ts
├── certificate.service.ts
└── user.service.ts
```

### Responsibilities

- Business Rules (e.g. a quiz attempt below `passingScore` never issues a
  Certificate; a Stage's total lesson duration should stay within the 5–10
  hour range from `business-analysis.md`)
- Transactions (e.g. `QuizAttempt` + `QuizAnswer[]` written atomically)
- Complex Queries (e.g. recomputing `Enrollment.progress` from
  `LessonProgress`)
- Domain Logic

Services never touch `request`/`response` objects and know nothing about
HTTP — they are equally callable from an API route today or a queue worker
later.

---

# repositories/

Data Access Layer. The **only** layer allowed to import the Prisma client.

```text
repositories/
│
├── path.repository.ts
├── stage.repository.ts
├── lesson.repository.ts
├── quiz.repository.ts
├── question.repository.ts
├── enrollment.repository.ts
├── lesson-progress.repository.ts
├── quiz-attempt.repository.ts
├── certificate.repository.ts
└── user.repository.ts
```

### Responsibilities

- Prisma queries (`findMany`, `create`, `update`, nested writes)
- Mapping Prisma models to plain return shapes
- Nothing else — no business rules, no validation

Services call Repositories; Repositories call Prisma; nothing skips a layer
in either direction.

---

# lib/

Application libraries and shared clients.

Examples:

- `prisma.ts` — Prisma Client singleton
- `axios.ts` — configured Axios instance (base URL, interceptors, auth header)
- `query-client.ts` — React Query client
- `clerk.ts` — Clerk configuration / server helpers
- `cloudflare-r2.ts` — R2 client for lesson attachments and certificate assets

---

# prisma/

Prisma configuration.

```text
prisma/
│
├── schema.prisma
│
├── migrations/
│
└── seed.ts
```

Contains the database schema, migrations, and seed scripts. See
[`erd.md`](./erd.md) for the entity relationships and
[`database-seeding.md`](./database-seeding.md) for seed data.

---

# types/

Global TypeScript types.

Examples:

- `Path`, `Stage`, `Lesson`, `Quiz`, `Question`, `Option`
- `Enrollment`, `LessonProgress`, `QuizAttempt`, `Certificate`
- `User`
- `ApiResponse<T>` — the shared envelope every `app/api` route returns

---

# utils/

Pure utility functions.

Examples:

- Format Duration (hours/minutes for a Stage or Lesson)
- Format Date (certificate `issuedAt`)
- Slug Generator
- Progress Calculator (percentage from completed vs. total lessons)
- Pagination Helpers

Utilities should not depend on React or the database.

---

# constants/

Application constants.

Examples:

- Routes
- Query Keys
- Roles (`STUDENT`, `ADMIN`)
- Permissions
- Pagination Limits
- Quiz Defaults (default `passingScore`)

---

# Development Flow

Every feature should follow the same implementation order.

```text
1. Build UI

↓

2. Build Form (if needed)

↓

3. Create Zod Schema (in validation/)

↓

4. Create API Route (app/api)

↓

5. Create Service

↓

6. Create Repository

↓

7. Connect Prisma

↓

8. Create React Query Hook (Axios call to the API route)

↓

9. Wire Hook into UI

↓

10. Test

↓

11. Refactor
```

---

# Architecture Rules

- UI must never communicate with Axios, Prisma, or Services directly.
- UI should communicate only with React Query hooks.
  - *One documented exception:* the `/admin` dashboard landing page is a
    read-only Server Component tree that calls Services directly, because
    there is nothing to cache or mutate and the figures belong in the first
    paint. See [`dashboard-feature.md`](./dashboard-feature.md).
- Hooks should call Axios.
- Axios should call `app/api` routes — never a Service or a Repository
  directly. This is what keeps the backend reusable for the future mobile
  app: the mobile client will call the exact same `app/api` contract.
- API routes should call Services, never Repositories or Prisma directly.
- Services should call Repositories, never Prisma directly.
- Repositories are the only layer that imports the Prisma client.
- Business logic belongs only inside Services.
- Validation belongs inside `validation/` and is shared by Forms and API
  routes.
- Shared UI belongs inside Components.
- Helpers belong inside Utils.

---

# Feature Example

```text
Quiz Attempt Feature

UI
│
├── app/(app)/learn/[pathId]/quiz/[quizId]/page.tsx
│
├── components/quizzes/quiz-runner.tsx
│
├── hooks/use-quiz-attempt.ts
│
├── lib/axios.ts
│
├── app/api/quizzes/[quizId]/attempts/route.ts
│
├── services/quiz.service.ts
│
├── repositories/quiz-attempt.repository.ts
│
├── validation/quiz.schema.ts   # imported by both the route and the UI form
│
└── prisma
```

Workflow:

```text
Quiz Runner (UI)

↓

useQuizAttempt() — mutate()

↓

axios.post("/api/quizzes/:quizId/attempts")

↓

POST /api/quizzes/[quizId]/attempts/route.ts
   — parses body, validates with quizAttemptSubmitSchema

↓

quizService.submitAttempt()
   — computes score, decides isPassed, may trigger certificate.service

↓

quizAttemptRepository.create() (+ quizAnswerRepository, in a transaction)

↓

Prisma

↓

Database
```

---

# Benefits

This architecture provides:

- Clear separation of responsibilities
- A stable, versionable HTTP contract (`app/api`) shared by web today and
  mobile tomorrow — no logic duplicated between clients
- Consistent project structure
- Scalable feature development
- Easier testing (Services and Repositories are pure and framework-agnostic)
- Better maintainability
- Reusable business logic
- Predictable development workflow
