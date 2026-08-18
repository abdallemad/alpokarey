# Learn Layout — the player's own shell, with the curriculum as its sidebar

> **Scope:** the `(learn)` route group. `/learn/[pathId]/…` no longer renders
> inside the dashboard shell; it has a shell of its own where the sidebar is the
> path's curriculum and the header carries the certificate button.
>
> Related: [`dashboard-restructure.md`](./dashboard-restructure.md) ·
> [`certificates-feature.md`](./certificates-feature.md) ·
> [`student-dashboard.md`](./student-dashboard.md) §4 — the dashboard shell this
> one deliberately mirrors · [`design-system.md`](./design-system.md)

---

## 1. What changed

Before, the player lived in `(app)` and had to build its own two-column grid
inside the dashboard's content area:

```text
┌ dashboard sidebar ┬ dashboard header ─────────────────┐
│ لوحتي              │ ┌ lesson ──────────┬ curriculum ┐ │
│ مساراتي            │ │                  │  (a card)  │ │
│ شهاداتي            │ │                  │            │ │
└───────────────────┴─┴──────────────────┴────────────┴─┘
```

Two navigations side by side, and the curriculum — the thing a learner inside a
path actually navigates with — got whatever width was left. Below `lg` it was
not a column at all but a `<Sheet>` drawer opened from a button in the content,
a third pattern for the same job.

Now:

```text
┌ curriculum sidebar ┬ learn header (+ certificate) ────┐
│ ▾ المرحلة 1        │                                   │
│   ✓ الدرس ١        │            lesson                 │
│   ○ الدرس ٢        │                                   │
│   ◆ اختبار المرحلة │                                   │
└────────────────────┴───────────────────────────────────┘
```

One navigation, at full sidebar width, using the same primitive as the rest of
the product — so it collapses, it has a rail, it has a mobile drawer, and it
remembers its state, all for free.

---

## 2. Why a route group rather than a nested layout

`/learn` needs a **different sidebar**, not a different page inside the same
sidebar. A nested layout under `(app)` cannot replace what `(app)/layout.tsx`
already rendered — it can only add to it.

So `(learn)` is a sibling route group of `(app)`. Both still sit under the real
root layout (`app/layout.tsx`, which owns `<html>`, Clerk and the query
provider), so **neither is a root layout** and moving between them is an
ordinary client-side navigation — not the full page reload that
`route-groups.md` warns about for multiple root layouts.

The URL is unchanged: route groups do not appear in the path, so `/learn/:pathId`
is still `/learn/:pathId`. Nothing linking to the player had to move.

### Why the player is not under `/dashboard/*`

[`dashboard-restructure.md`](./dashboard-restructure.md) put every learner
screen under one prefix. The player is the exception on purpose: `/dashboard/*`
means "renders in the dashboard shell", and the whole point of this change is
that the player does not. A `/dashboard/learn/…` URL would promise chrome that
is deliberately absent.

---

## 3. Files

```text
src/app/(learn)/
├── layout.tsx                          # NEW — providers, sidebar width
└── learn/[pathId]/
    ├── layout.tsx                      # moved; now renders the full shell
    ├── page.tsx                        # moved, unchanged
    ├── loading.tsx                     # moved, unchanged
    ├── lesson/[lessonId]/page.tsx      # moved, unchanged
    └── quiz/[quizId]/page.tsx          # moved, unchanged

src/components/app/learn/
├── learn-shell.tsx                     # rewritten — sidebar + inset + header
├── learn-sidebar.tsx                   # NEW
├── learn-header.tsx                    # NEW
├── curriculum-tree.tsx                 # NEW — extracted from curriculum-panel
├── path-certificate-button.tsx         # NEW — certificates-feature.md
├── learn-skeletons.tsx                 # LearnShellSkeleton reshaped
└── curriculum-panel.tsx                # DELETED
```

`curriculum-lesson-item.tsx` and `curriculum-quiz-item.tsx` are untouched — the
rows were always right; only the container around them changed.

---

## 4. The two layouts, and why there are two

**`(learn)/layout.tsx`** owns the providers and nothing else:

```tsx
<TooltipProvider>
  <SidebarProvider defaultOpen={defaultOpen} style={{ "--sidebar-width": "21rem" }}>
    {children}
  </SidebarProvider>
</TooltipProvider>
```

**`(learn)/learn/[pathId]/layout.tsx`** owns the shell:

```tsx
const { pathId } = await params;
return <LearnShell pathId={pathId}>{children}</LearnShell>;
```

The split exists because the sidebar cannot be built without a path id, and
`params` only carries one a segment lower. The group's layout supplies what is
true for every player route; the path's layout supplies the path.

`LearnShell` stays a **layout**, not a piece of each page, for the reason it
always was: Next does not unmount a layout when its children change, so moving
from a lesson to the next swaps the content column while the sidebar — and the
curriculum request behind it — stays exactly as it was. One fetch per visit to a
path, not one per lesson.

### `--sidebar-width: 21rem`

Raised from the dashboard's 16rem. The dashboard sidebar holds three labels;
this one holds lesson titles, which are sentences. At 16rem nearly every row
truncated.

### `defaultOpen` and the shared cookie

Read from the same `sidebar_state` cookie the dashboard writes, so the first
paint already matches what the learner last chose rather than flashing an open
panel that collapses a moment later.

**The consequence is that the two shells share one preference**: collapsing the
curriculum also collapses the dashboard nav on the next visit, and vice versa.
That is a property of `components/ui/sidebar.tsx`, which writes the cookie
unconditionally inside `setOpen` — a controlled `open` prop would not avoid it.
It was left as is rather than forking the shared primitive: "is the navigation
panel open" is arguably one preference, and a learner who deliberately collapsed
one panel is unlikely to be surprised the other is collapsed too. Changing it
would mean giving the primitive a `cookieName` prop.

---

## 5. The sidebar

`LearnSidebar` uses the same `Sidebar` primitive as `AppSidebar`, with
`side="right"` — the RTL start edge. The player does not move the navigation to
the other side of the screen.

Two deliberate differences:

| | `AppSidebar` | `LearnSidebar` |
|---|---|---|
| `collapsible` | `"icon"` | `"offcanvas"` |
| Contents | three destinations | the whole curriculum |

**`offcanvas`, not `icon`**, because an icon rail works for three destinations
with three icons and cannot represent a forty-row curriculum at all. The panel
slides away whole, and the header's trigger brings it back.

Top to bottom: a back link to مساراتي, the path title (linking to its detail
page) with its category badge, the progress bar with "n من m درس", then the
curriculum, then the account menu.

`SidebarContent` already scrolls, so a long curriculum scrolls **inside** the
panel while the path header above and the account menu below stay put. The old
card had to arrange that by hand with `ScrollArea` and a `max-h-[calc(100dvh-6rem)]`.

### What the mobile drawer replaced

`LearnShell` used to render a `<Sheet>` below `lg`, opened by a "المحتوى"
button in the content column. That is gone: `Sidebar` is already a `Sheet` below
`md`, opened by the header's `SidebarTrigger`. One pattern instead of two, and
the trigger is in the same place it is everywhere else in the product.

Between `md` and `lg` the behaviour actually improves — the curriculum is a real
docked panel there now, where before it was still a drawer.

### `CurriculumTree`

`CurriculumPanel` was a card wrapper plus a tree. The sidebar provides the
wrapper, so the tree was extracted to `curriculum-tree.tsx` and the card
deleted. The extraction is verbatim: same accordion, same active-item derivation
by comparing built `ROUTES` hrefs, same render-phase state adjustment that opens
the stage containing the newly-active lesson without a paint in between.

---

## 6. The header

`LearnHeader` is `AppHeader`'s skeleton, deliberately: same `h-14`, same sticky
`bg-background/85 backdrop-blur-md`, same `SidebarTrigger` on the start edge,
same vertical rule, same truncating title, same `ThemeToggle` at the end.

A learner moving from their dashboard into a lesson should not feel they have
left the product — and the trigger in particular has to stay exactly where their
hand expects it, because once the curriculum is closed it is the only way back
to it.

Two differences:

- **The title is the path**, not the section. It comes from the curriculum the
  shell already holds rather than from the pathname, so no `usePathname` and no
  segment table. The open lesson names itself at the top of the content column
  and again in the sidebar; the one thing the chrome can add is which course all
  of this belongs to.
- **The certificate button** sits before the theme toggle. See
  [`certificates-feature.md`](./certificates-feature.md).

---

## 7. Loading and failure

`LearnShellSkeleton` renders a **real** `Sidebar` and `SidebarInset` with
skeleton contents rather than a pair of plain divs. Those two primitives are
what reserve the sidebar's width; a flat placeholder would paint the lesson
full-bleed and then shove it sideways the moment the curriculum arrived. Both
are safe there because the `SidebarProvider` they read is up in
`(learn)/layout.tsx`, above every route that shows the skeleton.

On failure the shell renders `ApiErrorState` inside a `SidebarInset` with **no
sidebar** — there is no curriculum to put in one. It replaces the page rather
than sitting beside it, because every screen inside is gated on the same
enrolment and showing the lesson's copy of the same error underneath would just
say it twice.

---

## 8. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- `npx next build` — clean; `/learn/[pathId]`, `/learn/[pathId]/lesson/[lessonId]`
  and `/learn/[pathId]/quiz/[quizId]` all still registered at their original
  URLs, confirming the route group did not move them.
- On the running dev server, signed out, `/learn/<uuid>` returns 200, renders
  `dir="rtl"`, and shows the shell's failure branch: a `sidebar-inset` with the
  sign-in state and **no** `data-slot="sidebar"` — and, importantly, none of the
  dashboard's nav either, which is the proof the player left `(app)`.
- Browser console carries no React or hydration errors; only the expected 401s
  from the signed-out curriculum request.

**Not verified:** the populated player — the curriculum rendered in the sidebar,
the stage that auto-expands, the collapse behaviour, and the responsive
breakpoints. All of it is gated on an enrolment, which needs a signed-in
session this agent cannot establish. The data behind it is unchanged by this
work: `useCurriculum`, `learnService.getCurriculum` and the curriculum rows are
the same code at the same endpoint, and only the container around them moved.
