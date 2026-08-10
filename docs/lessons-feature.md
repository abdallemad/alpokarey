# Lessons Feature — the list, the editor, and file attachments

> **Scope:** `/admin/lessons` (list), `/admin/lessons/new` (create),
> `/admin/lessons/[lessonId]` (edit + attachments), the upload pipeline behind
> them, and the full stack underneath.
>
> This follows the pattern set by [`paths-feature.md`](./paths-feature.md) and
> [`stages-feature.md`](./stages-feature.md). Where it departs — a flat table,
> a full-page editor, and a new storage layer — the reason is given.
>
> Related: [`folder-structure.md`](./folder-structure.md) ·
> [`admin-dashboard.md`](./admin-dashboard.md) ·
> [`design-system.md`](./design-system.md) ·
> [`business-analysis.md`](./business-analysis.md) §4.4

---

## 1. Request flow

```text
UI  ── components/admin/lessons/*, forms/lesson-form.tsx
 ↓
Hook ── hooks/use-lessons.ts · use-lesson.ts · use-attachments.ts
 ↓
Axios ── lib/axios.ts                                   (the only HTTP caller)
 ↓
API ── app/api/lessons/** · app/api/attachments/** · app/api/uploads
 ↓        guards + parses + shapes; no business rules
Service ── services/lesson.service.ts                   (all business rules)
 ↓
Repository ── repositories/lesson.repository.ts         (the only Prisma importers)
              repositories/attachment.repository.ts
 ↓                            ↘
Prisma ── lib/db.ts             lib/storage.ts          (the filesystem)
 ↓
PostgreSQL
```

`lib/storage.ts` is the one new box. It sits beside Prisma rather than above
it: the Service owns both the row and the object, because deleting one without
the other leaves either a broken link or an orphaned file.

---

## 2. Files

```text
src/
├── types/
│   └── lesson.ts                    # LessonListItem, LessonDetail,
│                                    #   LessonAttachment, UploadedFile,
│                                    #   LessonsQueryState
│
├── validation/
│   └── lesson.schema.ts             # shared by the forms AND the API routes
│
├── lib/
│   └── storage.ts                   # save()/remove() — server-only
│
├── repositories/
│   ├── lesson.repository.ts
│   └── attachment.repository.ts
│
├── services/
│   └── lesson.service.ts            # lessons + attachments
│
├── app/api/
│   ├── lessons/
│   │   ├── route.ts                 # GET (list) · POST (create)
│   │   └── [lessonId]/
│   │       ├── route.ts             # GET · PATCH · DELETE
│   │       └── attachments/route.ts # POST
│   ├── attachments/[attachmentId]/route.ts   # DELETE
│   └── uploads/route.ts             # POST (multipart)
│
├── hooks/
│   ├── use-lessons.ts               # list query
│   ├── use-lesson.ts                # detail + create/update/delete
│   ├── use-attachments.ts           # upload+attach, detach
│   └── use-stages.ts                # + useStageOptions(pathId)
│
├── constants/
│   ├── lesson.ts                    # Arabic labels + page size
│   ├── upload.ts                    # limits, shared client ↔ server
│   └── query-keys.ts                # + queryKeys.lessons
│
├── forms/
│   └── lesson-form.tsx
│
├── components/admin/lessons/
│   ├── lessons-view.tsx             # list screen: filters + table + pager
│   ├── lessons-table.tsx
│   ├── lesson-badges.tsx
│   ├── new-lesson-view.tsx
│   ├── lesson-detail-view.tsx       # the editor
│   └── lesson-attachments.tsx       # upload + list + delete
│
└── app/(admin)/admin/lessons/
    ├── page.tsx  ·  loading.tsx
    ├── new/page.tsx
    └── [lessonId]/page.tsx  ·  loading.tsx
```

`.gitignore` gained `/public/uploads`. No new dependencies.

---

## 3. Validation — `validation/lesson.schema.ts`

```ts
lessonCreateSchema      // stageId, title, description, type, contentType,
                        //   videoUrl, content, duration, order
lessonUpdateSchema      // = lessonCreateSchema.omit({ stageId }).partial()
lessonListQuerySchema   // search, pathId, stageId, type, status, sort, page, pageSize
attachmentCreateSchema  // name, type, content | url + storageKey
```

Four decisions worth keeping:

- **An empty `order` means "last".** Same rule, same reasoning, and the same
  `z.literal("")`-before-`z.coerce.number()` ordering as `stageCreateSchema` —
  `Number("") === 0` would otherwise fail `.min(1)` with a confusing message.
- **`stageId` is not updatable.** Moving a lesson carries its attachments and
  every student's `LessonProgress` into a different curriculum. That is a
  migration, not an edit, and it should not be one mis-click away.
- **There is no rule forcing a VIDEO lesson to have a `videoUrl`.** A lesson
  under construction is a legitimate state — the same way a path sits in DRAFT
  — so the editor *flags* an empty lesson with a warning banner rather than
  refusing to save it. Blocking the save would mean an author cannot record a
  title before they have the video.
- **`attachmentCreateSchema` uses `superRefine`,** because `type` discriminates
  two different required-field sets: a `FILE` needs a `url`, a `TEXT` needs
  `content`. The Service then stores only the half that belongs to its branch,
  so a file attachment can never carry a stray body from an abandoned draft.
- **An attachment's `url` accepts two forms, and `z.url()` alone is wrong for
  it.** `lib/storage.ts` returns a **root-relative** path (`/uploads/<key>`),
  which `z.url()` rejects outright — it wants an absolute URL. That mismatch
  made every file upload fail with a bare `422 البيانات المُرسلة غير صالحة`
  *after* the bytes had already been written to disk, which is exactly the
  confusing half-success it looks like. The field is now a union of a storage
  path and an absolute URL, with the storage branch pinned to a single path
  segment (`STORAGE_PATH_PATTERN`) so `//evil.example` and `..` cannot pass.
  `storageKey` is pinned to the same pattern, since it is the value that
  becomes a filename.

`duration` is free text (`"12:30"`, `"٤٥ دقيقة"`) because the column is a
`String` and authors write it in whatever form reads best.
`business-analysis.md` §4.4 treats a stage's 5–10 hours as the sum of its
lessons; nothing here parses that sum yet.

---

## 4. The list — `/admin/lessons`

### Filters

| Filter | Values | Applies to |
|---|---|---|
| `search` | free text | lesson title/description, **stage title, path title** |
| `pathId` | uuid · `all` | the grandparent |
| `stageId` | uuid · `all` | the parent |
| `type` | `VIDEO` · `TEXT` · `all` | the lesson |
| `status` | `DRAFT` · `PUBLISHED` · `all` | the **path's** status |
| `sort` | `order` · `newest` · `oldest` · `title` | within each stage |

Path and stage are a **cascade**: the stage select is disabled until a path is
chosen, and changing the path clears `stageId` — a stage belongs to exactly one
path, so a leftover stage filter would contradict the new one. Every stage in
the academy would also be an unusable flat list. `useStageOptions(pathId)` stays
disabled until a real path id arrives.

Filter state lives in the URL, as on every other list screen.

### Flat, not grouped

The stages list groups rows under a path heading. Lessons do not, because a
lesson's place in the curriculum is two levels deep — path ▸ stage — which is
more than a heading row can carry without becoming a tree. It rides in a column
instead, and collapses under the title below `md`.

That also keeps pagination simple: the page is a window over lessons, `total`
counts lessons, and none of the group-integrity machinery from
`stages-feature.md` §6 is needed.

### Ordering

Curriculum-major, so the list reads like a syllabus rather than a pile:

```ts
[{ stage: { path: { title: "asc" } } }, { stage: { order: "asc" } },
 { stageId: "asc" }, <chosen sort>, { id: "asc" }]
```

Sorting by `order` alone would interleave "lesson 1" from every stage in the
academy. The trailing `id` makes paging deterministic when the sort key repeats.

### Columns

| Width | Columns |
|---|---|
| base | order chip + title (+ `path ▸ stage` underneath) · النوع · row menu |
| `md` | `+ المسار` (with its status badge), `+ المرحلة` (with the stage's own order) |
| `lg` | `+ المدة`, `+ المرفقات` |
| `xl` | `+ تاريخ الإنشاء` |

Path and stage get **a column each** from `md` up rather than being stacked in
one cell: they are two different questions ("which track?" / "where in it?"),
they are the two filters an admin reaches for most, and the stage column can
then carry the stage's own `order` — which is the context that makes the
lesson's `order` chip mean something. Below `md` both collapse into the single
`path ▸ stage` line under the title.

Four render states as everywhere else: skeleton · `ApiErrorState` (401 offers
sign-in, 403 explains, else retry) · empty state, whose action depends on
whether filters are active and whether any path exists at all · table + pager.

Rows are clickable and open the editor; the row menu's wrapper stops
propagation so using the menu does not also navigate.

> **Deliberately not fetched:** whether a lesson has a body. The flag would
> need `content` — up to 20 000 characters per row — in a list query. The
> editor shows it instead, where one row is being read anyway.

---

## 5. The editor — a page, not a dialog

Stages are edited in a dialog (`stages-feature.md` §11). Lessons are not: a
lesson carries a body of text or a video, a duration, a type switch **and** a
list of attachments, which is more than a modal holds, and it is the surface an
author spends real time in.

- `/admin/lessons/new` — the form alone. It accepts `?pathId=`/`?stageId=` so
  "add a lesson here" can be linked from a stage without making the admin
  re-pick a curriculum they were already looking at. A banner says up front that
  attachments come after saving.
- `/admin/lessons/[lessonId]` — badges and the curriculum breadcrumb, a warning
  banner when the lesson has no body yet, three stat cards (attachments,
  completions, duration), the edit form, the attachments panel, and delete.

Creating redirects straight to the editor, because attachments can only hang
off a lesson that exists — creation is only ever half the job.

### The form

`LessonForm` serves both pages. Its fields swap with `type`: a TEXT lesson gets
a content textarea, a VIDEO lesson gets a source select and a URL — showing both
would ask for the content twice. The swap reads `useWatch({ control, name })`
rather than `watch()`; the latter returns a function, which makes React Compiler
skip memoising the whole component.

The path ▸ stage cascade is **owned by the caller**, not the form: loading
options is a request, and `folder-structure.md` keeps forms out of the request
business. The form takes `pathOptions`, `stageOptions`, `pathId`,
`onPathChange`. In edit mode it takes `lockedStageLabel` instead and renders the
parent as static text — context, not a control.

Submit is disabled until the form is dirty, so "save" cannot fire a no-op PATCH.

---

## 6. Attachments and the upload pipeline

### Two endpoints, one action

```text
POST /api/uploads                        → { key, url, name, size, contentType }
POST /api/lessons/:lessonId/attachments  → the attachment row
```

`/api/uploads` moves bytes and knows nothing about lessons. The attachments
endpoint records a row and knows nothing about bytes. Keeping them apart is what
lets a `TEXT` attachment — a summary, a transcript — reuse the same endpoint
untouched, and lets the upload endpoint be reused for a path cover image later.
`useAddAttachment` chains them, so it is still one click for the admin.

Both are `requireAdmin()`-guarded. An unguarded upload endpoint is an open file
host.

### Storage — `lib/storage.ts`

Files are written to **`public/uploads`**, which Next serves statically, so an
attachment's URL is simply `/uploads/<key>`. This is local-disk storage by
choice: the Prisma schema names Cloudinary and `folder-structure.md` names R2,
but neither is configured in `.env`.

| Rule | Where |
|---|---|
| 20 MB ceiling | `constants/upload.ts`, enforced in `storage.save` |
| MIME allowlist (pdf, images, audio, mp4, office, txt, zip) | same |
| Stored filename is a generated UUID + an extension **derived from the allowlisted MIME type** | `storage.save` |
| A key is one path segment, never starting with a dot (`STORAGE_KEY_PATTERN`) | `constants/upload.ts`, enforced by the schema |
| Deletes resolve the path and refuse anything outside the upload root | `storage.remove` |

`STORAGE_KEY_PATTERN` and `STORAGE_PATH_PATTERN` are built from one shared
fragment, so the rule the schema accepts and the rule the driver produces
cannot drift apart.

The generated filename is the important one: `file.name` is attacker-controlled,
and letting it decide a path on disk is how a traversal or an executable
`.html`/`.svg` gets served back. The original name is kept in
`Attachment.name` for display only.

`constants/upload.ts` exists so the file input can advertise the same limits the
server enforces — `lib/storage.ts` reaches for `node:fs`, and importing it into
a Client Component would break the build.

> **Deployment note.** A serverless host gives each invocation a fresh, usually
> read-only filesystem, so these files would not survive there. Everything above
> `storage` only knows `save()`/`remove()` and an opaque `key`, so moving to R2
> or Cloudinary later is those two functions plus a backfill — no route, service
> or component changes.

### Lifecycle

- **Add:** upload → create row. The key is stored so the object can be found
  again.
- **Delete one:** row first, then the file. A failed unlink leaves a stray file,
  not a broken attachment.
- **Delete the lesson:** storage keys are read **before** the row cascade
  removes them, then the files are unlinked after the lesson is gone —
  otherwise the objects would be orphaned with nothing pointing at them.

A missing object is never an error on delete: the row is the record that
matters, and refusing to remove it because its file already vanished would
strand the row forever.

### Where the key is stored

`Attachment.cloudinaryPublicId`. The column is named for a provider the project
does not currently use; it holds whatever `lib/storage.ts`'s driver calls an
object key. Renaming it needs a migration, and this feature changed no schema —
see §12.

`CloudinaryResource` is left untouched on purpose: it declares **both**
`lessonId` and `attachmentId` as `@unique`, which permits exactly one resource
per lesson and therefore cannot represent a lesson with several attachments.

---

## 7. Service rules — `services/lesson.service.ts`

| Rule | Reason |
|---|---|
| Creating under a non-existent stage → **404** | The `stageId` came from a select that may be stale |
| An omitted `order` becomes `max(order) + 1` | An author building a stage top-to-bottom means "add it at the end" |
| Two lessons in one stage may not share an `order` → **409** | No unique constraint on `(stageId, order)` exists; a duplicate makes the study sequence ambiguous. The error names the lesson already there |
| A `PATCH` with an empty `order` leaves the position alone | On create blank means "append"; on edit it means "I did not touch this" |
| A lesson with `LessonProgress` **cannot be deleted** → **409** | The cascade would erase student history and silently change the progress percentage of every enrollment in the path. The count is quoted |
| Attachment branches never mix | A `FILE` row stores `url` + key and nulls `content`; a `TEXT` row does the reverse |

Attachments live in this service rather than one of their own because an
attachment is not an independent entity — the rules about it are rules about
the lesson it belongs to.

---

## 8. API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/lessons` | Filtered, paginated list |
| `POST` | `/api/lessons` | Create (parent as `stageId` in the body) |
| `GET` | `/api/lessons/:lessonId` | One lesson with its attachments |
| `PATCH` | `/api/lessons/:lessonId` | Partial update |
| `DELETE` | `/api/lessons/:lessonId` | Delete, with its files |
| `POST` | `/api/lessons/:lessonId/attachments` | Attach a file or a note (JSON) |
| `DELETE` | `/api/attachments/:attachmentId` | Detach, with its file |
| `POST` | `/api/uploads` | Multipart upload |

Top-level `/api/lessons` for the same reason as `/api/stages`: the console lists
every lesson in the academy and narrows with filters. Attachments are created
under their lesson (they have no meaning without one) but deleted by their own
id (which is unique, and which the client already holds).

Envelope, error mapping and access control are unchanged from
`paths-feature.md` §7. Dynamic routes use Next 16's `RouteContext<…>` helper and
await `params`.

---

## 9. Hooks

| Hook | Notes |
|---|---|
| `useLessons(query)` | `keepPreviousData`, so the table never collapses mid-typing |
| `useLesson(id)` | Detail query, feeds the editor |
| `useCreateLesson()` | Invalidates, toasts, redirects to the editor |
| `useUpdateLesson(id)` | Seeds the detail cache with the server's response, then invalidates lists |
| `useDeleteLesson({ redirectToList })` | Same flag, same reasoning, as `useDeletePath` |
| `useAddAttachment(id)` | Uploads then attaches; invalidates the detail **and** the lists (`attachmentsCount` is a column) |
| `useDeleteAttachment(id)` | Same invalidation |
| `useStageOptions(pathId)` | The stages of one path, flattened out of the grouped payload; disabled until a path is chosen |

**Every lesson mutation invalidates `lessons`, `stages` *and* `paths`.** A stage
row carries `lessonsCount` and a path detail carries `lessonsCount` too, so all
three go stale the moment a lesson is added or removed.

### One axios detail worth knowing

The shared client defaults to `Content-Type: application/json`, and axios v1
**converts a FormData body to JSON** when it sees that content type
(`transformRequest` → `hasJSONContentType`). The upload would have silently sent
`{}`. `useAddAttachment` clears the header (`"Content-Type": null`) so the
browser sets `multipart/form-data` with its boundary.

---

## 10. Design-system conformance

- Path status badges are reused from `components/admin/paths/path-badges`, so a
  lesson row and a path row agree.
- Arabic labels for DB enums live in `constants/lesson.ts`; path enums are not
  re-translated there.
- The "no content yet" banner uses `--warning`; headings use `font-heading`.
- Delete flows through `AlertDialog` (§8.6), toasts via `sonner` (§8.7).
- Dates use `ar-EG-u-nu-latn` through `utils/format.ts`.
- Logical properties throughout (`ms-*`, `ps-*`, `end-*`).
- Attachment links open with `rel="noopener noreferrer"`.

---

## 11. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every touched file — clean.
- `npx next build` — clean; all eight new routes registered.
- **Repository queries executed against the live Neon database** (20 lessons,
  12 attachments): the list `select`, the detail `select` with nested
  attachments and progress count, the curriculum-major ordering, the search
  across lesson/stage/path titles, and the type / status / stage / path
  filters.
- **Create, update, attach and delete executed against the live database inside
  a transaction that was deliberately rolled back**, so nothing persisted:

  ```text
  maxOrder=2 → nextOrder=3
  created lesson #3 "درس اختبار آلي"
  order 1 taken by: 41223                     ← the 409 rule sees the collision
  updated: … [TEXT] contentChars=2            ← type switch persists
  attachments created: FILE "ملخص.pdf" key=… · TEXT "تفريغ"
  lesson now reports 2 attachment(s)
  storage keys to clean on delete: …
  lessonProgress guard reads: 0
  deleted lesson=true; attachments cascaded away: true
  ```

  Counts before and after: 20 lessons, 12 attachments.
- **`attachmentCreateSchema` exercised directly**, against the exact payload
  `useAddAttachment` builds. Ten cases, all as expected: the uploaded-PDF
  payload that was returning 422 now parses (`url=/uploads/…pdf`,
  `key=…pdf`); an uploaded image, an external absolute URL and a text note all
  parse; and `FILE` with no url, `TEXT` with no content, `//evil.example/a.pdf`,
  `/uploads/../../etc/passwd`, a traversal in `storageKey`, and a nested
  `/uploads/a/b.pdf` are all rejected with Arabic messages.
- **Static serving of `public/uploads` confirmed** — a probe file written there
  was fetched over HTTP as `200 text/plain` with its exact body, which is the
  half of the local-disk driver most worth doubting. The probe was removed
  afterwards.
- **Both new write endpoints are guarded:** unauthenticated `POST /api/uploads`
  and `GET /api/lessons` return
  `401 {"success":false,"error":{"message":"يجب تسجيل الدخول للمتابعة","code":"UNAUTHORIZED"}}`.
- `/admin/lessons` and `/admin/lessons/new` render on the running dev server:
  all five filters with their Arabic labels, the stage select correctly showing
  `اختر مسارًا أولًا` before a path is picked, and the full create form
  including the video-only fields. No console errors beyond the expected 401s.

**Not verified:** the authenticated happy path — creating a lesson, uploading a
real file through the browser, and deleting it — because that needs a signed-in
ADMIN session, which this agent cannot establish, and the Chrome extension that
would carry an existing session is not connected. The upload's server half is
covered by the storage checks above; its client half (FormData → multipart) is
reasoned about in §9 but has not been exercised end to end.

---

## 12. Known gaps

1. **`Attachment.cloudinaryPublicId` is a misnomer** — it holds the current
   driver's object key. A migration renaming it to `storageKey` would make the
   model honest.
2. **`CloudinaryResource` is unusable as modelled** (one resource per lesson and
   per attachment) and is untouched.
3. **`Lesson.quizId` is not editable here.** The list shows whether a lesson
   points at a quiz; wiring the link belongs with the quizzes feature.
4. **No reordering UI.** `order` is typed by hand. A drag-and-drop reorder would
   replace the collision rule with a transactional renumber — the same
   follow-up stages have.
5. **Duration is not summed.** `business-analysis.md` §4.4 constrains a stage to
   5–10 hours; nothing computes or validates that total.
6. **Uploads are local-disk.** See §6 — fine for development, not a production
   object store.
7. **A failed attach leaves the uploaded file behind.** The two-step design
   means the bytes land before the row does, so if the second request fails the
   object stays in `public/uploads` with nothing pointing at it. Cleaning that
   up needs a "discard upload" endpoint the client can call on failure, or a
   periodic sweep of keys with no matching `Attachment`.

---

## 13. Next steps

1. Sign in as an ADMIN and walk create → upload → edit → delete, including the
   two 409 paths (duplicate `order`, a lesson with student progress).
2. Quizzes, using this same pattern plus a nested question editor.
3. A per-stage lesson editor inside `/admin/stages`, so a curriculum can be
   built without leaving the stage.
4. Swap the storage driver when a deployment target is chosen.
