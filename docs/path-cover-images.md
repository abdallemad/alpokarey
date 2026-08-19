# Path Cover Images — uploading a picture instead of pasting a link

> **Scope:** the cover-image field on `/admin/paths/new` and
> `/admin/paths/[pathId]`, the storage it writes to, the validation that
> accepts both an upload and a legacy link, the cleanup that follows a replaced
> image, and the two public surfaces that render it.
>
> Related: [`paths-feature.md`](./paths-feature.md) — the form this changes ·
> [`lessons-feature.md`](./lessons-feature.md) §6 — `lib/storage.ts`, the driver
> reused here · [`tracks-catalog-feature.md`](./tracks-catalog-feature.md) — the
> card the image lands on · [`path-detail-feature.md`](./path-detail-feature.md)
> · [`design-system.md`](./design-system.md)

---

## 1. What changed

`Path.imageUrl` was a text field: an admin pasted a URL and hoped it stayed
alive. Every row in the database today holds an absolute Cloudinary link typed
in by hand, and nothing in the product ever rendered them.

Now:

- The form field is a **file picker** that uploads to `public/uploads` and
  stores `/uploads/<key>`.
- The **catalog card shows the cover at the top**, on `/paths` and on the
  landing page's teaser.
- The **path page** shows it too, when there is no promo video to show instead.
- Replacing or clearing a cover **deletes the object it replaced**.

No new dependency, no new endpoint: `POST /api/uploads` and `lib/storage.ts`
already existed for lesson attachments, and the upload route's own comment
anticipated this exactly — *"the same endpoint serves a path cover image or a
certificate asset later"*.

---

## 2. Files

```text
src/
├── forms/
│   ├── image-upload-field.tsx      # NEW — preview, picker, upload, remove
│   └── path-form.tsx               # the URL TextField became this field
│
├── hooks/
│   ├── use-upload.ts               # NEW — uploadFile() + useUploadFile()
│   └── use-attachments.ts          # now imports uploadFile from there
│
├── utils/upload.ts                 # NEW — isStoredUploadPath, toStorageKey
├── types/upload.ts                 # NEW — UploadedFile, moved out of lesson.ts
│
├── constants/upload.ts             # + the image subset of the allowlist
├── validation/path.schema.ts       # imageUrl: optionalUrl → coverImage
├── services/path.service.ts        # deletes the previous object on replace
│
└── components/paths/
    ├── public-path-card.tsx        # the cover, as the Card's first child
    └── path-overview-view.tsx      # the cover when there is no promo video
```

---

## 3. The field uploads on selection, not on submit

The form value stays a **string**. When a file is chosen, `ImageUploadField`
posts it to `/api/uploads` and writes the returned `/uploads/<key>` into the
form; "save" then sends the same small JSON body it always sent.

The alternative — carrying a `File` through `react-hook-form` and posting
multipart on submit — would make `pathCreateSchema` describe two different
shapes depending on which side of the wire is validating, and that schema being
*one* shape shared by the form and the route is the property
[`paths-feature.md`](./paths-feature.md) §4 exists to protect.

**The cost is an orphan.** An admin who uploads a cover and then abandons the
form leaves a file with nothing pointing at it. That is the cheaper failure: a
stray file costs disk, a divided schema costs correctness — and §6 keeps the
leak from compounding.

### What the field enforces before it uploads

Type and size are checked client-side against `constants/upload.ts` and then
**again** by `lib/storage.ts`, which is the one that matters. The client check
only saves a round trip; it is not the gate.

`IMAGE_UPLOAD_MIME_TYPES` is derived by filtering the existing allowlist for
`image/*` rather than written out again — a second list is a second place to add
a format, and the one the server enforces would not be it. Filtering also
excludes `image/svg+xml` for free: it is not in the allowlist at all, because an
SVG is a document that can carry script and this driver serves what it stores
from the app's own origin.

---

## 4. Validation accepts two kinds of value

`imageUrl` used to be `optionalUrl`, which is `z.url()` plus an empty-string
escape. A stored cover is `/uploads/<key>` — **relative**, which `z.url()`
rejects outright.

`coverImage` accepts either:

| Value | Why it must pass |
|---|---|
| `/uploads/<key>` | what `storage.save()` returns, and what every new cover is |
| an absolute URL | what existing rows hold; rejecting them would mean an admin could not save an unrelated edit to any of those paths without re-uploading the image first |
| `""` / `null` | no cover |

It is one `.refine()` with one message rather than a `z.union`, whose branch
errors would surface as two contradictory complaints under a single field.

The stored-path test is `STORAGE_PATH_PATTERN`, which allows exactly one path
segment after the prefix and no leading dot — so `/uploads/../../etc/passwd` is
not a stored path, and §6's cleanup can never be handed it.

---

## 5. `UploadedFile` moved

It lived in `types/lesson.ts`. `POST /api/uploads` knows nothing about lessons,
and now that a path's cover goes through it, filing its response shape under
lessons was describing the wrong thing. It is `types/upload.ts` now, and
`lib/storage.ts` and the upload hook import it from there.

`hooks/use-upload.ts` is a related extraction: `use-attachments.ts` held a
private `uploadFile` with the FormData-and-clear-the-content-type-header dance,
and a second copy of that in the image field would be a second place to get it
wrong.

---

## 6. The object follows the record

`pathService` deletes stored objects that nothing points at any more:

| Action | What happens |
|---|---|
| Cover replaced | the previous object is removed, **after** the update succeeds |
| Cover cleared | same |
| Path deleted | the cover is removed, **after** the row is deleted |
| Cover was an absolute URL | nothing — `toStorageKey` returns `null` |

The order matters and is the same one `lessonService.removeAttachment` already
uses: the row is the record that matters, so the file goes second. A failed
unlink leaves a stray file; unlinking first would leave a saved record pointing
at a file that is already gone.

That last row is the important one. `toStorageKey` returns `null` for anything
that is not `/uploads/<key>`, which is what stops a cleanup pass from trying to
delete somebody else's Cloudinary asset.

---

## 7. Rendering: why some images are `unoptimized`

Both public surfaces render with `next/image`, and both pass
`unoptimized={!isStoredUploadPath(url)}`.

- **A stored cover** (`/uploads/<key>`) is same-origin, so it goes through the
  Next.js image optimiser with no configuration at all. Verified: a request to
  `/_next/image?url=%2Fuploads%2F…&w=640&q=75` returns `200 image/png`.
- **A legacy absolute URL** is rendered as-is. Optimising it would require a
  `next.config.ts` `remotePatterns` entry for every host anyone has ever pasted
  — and the honest version of that rule is "any host", which turns the app into
  an open image proxy. `unoptimized` skips the loader entirely, so no
  configuration is needed and no host list can be outgrown.

The card puts the image as the **Card's first child**, which is an affordance
`components/ui/card.tsx` already provides: `has-[>img:first-child]:pt-0` drops
the top padding and `*:[img:first-child]:rounded-t-xl` rounds the corners, so
the picture is full-bleed with no override. Verified in the browser: computed
`padding-top: 0px`, image 390×219 at ratio 1.78.

A path with no cover gets a muted placeholder rather than nothing, so a row of
cards keeps one baseline while the catalog is still filling up.

`alt=""` on both surfaces: the title sits directly beneath the image, and a
screen reader announcing the cover as well would only repeat the path's name.

---

## 8. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- **The form renders the field.** On `/admin/paths/new` the label is
  "صورة الغلاف", the hidden input carries
  `accept="image/png,image/jpeg,image/webp,image/gif"` — note the absent SVG —
  and the dropzone advertises `png، jpg، webp، gif · حتى 20 ميجابايت`. There is
  no longer an `imageUrl` text input on the page.
- **The upload fires and its failure surfaces.** Selecting a real 1×1 PNG
  through the file input (`DataTransfer` + a `change` event) triggered the
  mutation; signed out, the server answered `401` and the field rendered
  **"يجب تسجيل الدخول للمتابعة"** in its `role="alert"` message. That exercises
  the whole client chain — validation, `FormData`, the cleared content-type
  header, the error branch — short of an authenticated write.
- **The storage location serves.** A probe PNG written to `public/uploads` was
  served at `/uploads/<name>` as `200 image/png`, and through the Next.js
  optimiser at `/_next/image?url=…` as `200 image/png`. The probe was deleted
  afterwards.
- **The guard holds.** `POST /api/uploads` with no session → `401` in the
  standard envelope.
- **The card shows the cover.** All three published paths render their image as
  the Card's first child at 16∶9, full width, with the card's top padding
  collapsed — including the three legacy Cloudinary URLs, which load through the
  `unoptimized` branch (`naturalWidth: 820`).
- `/`, `/paths`, `/paths/[id]`, `/about` and `/admin/paths/new` all return 200
  with no console errors.

**Not verified:**

- **The authenticated happy path** — picking a file as an ADMIN, the file
  landing in `public/uploads`, the URL being saved, and the old object being
  deleted on replace. It needs a signed-in ADMIN session, which this agent
  cannot establish. Everything under it was exercised as far as it can be
  without one.
- **The path page's cover fallback**, because all three seeded paths have a
  YouTube `promoUrl` and the cover only renders when there is no playable
  promo. The branch is type-checked and its sibling branch renders correctly.
- `npx next build` — a dev server holds `.next` on port 3000.

---

## 9. Open items

1. **Orphaned uploads from abandoned forms.** §3 accepts them deliberately.
   A sweep — "objects under `public/uploads` that no row references" — is a
   maintenance job, not a request-time one.
2. **No image dimensions or crop.** The card and the page both use `object-cover`
   at 16∶9, so a tall portrait cover is centre-cropped. Enforcing a ratio at
   upload time would need image processing the project does not have a
   dependency for.
3. **The driver is still local disk.** `lib/storage.ts` says it: a serverless
   host gives each invocation a fresh, often read-only filesystem, so covers
   would not survive there. The seam is `save()`/`remove()`, and the schema
   already carries Cloudinary fields for whenever that move happens.
4. **`Path.cloudinaryAttachmentId` is unused.** The schema has a
   `CloudinaryAttachment` relation on `Path` that nothing reads or writes; the
   cover lives in `imageUrl` alone. Worth resolving when the storage driver
   changes, not before.
