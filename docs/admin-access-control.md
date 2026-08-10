# Admin Access Control

> **Scope:** how a Clerk account becomes an academy `User`, how roles are
> decided, and what actually stops a non-admin from touching admin data.
>
> Related: [`admin-dashboard.md`](./admin-dashboard.md) ·
> [`paths-feature.md`](./paths-feature.md)

---

## 1. The three pieces

| Piece | File | Job |
|---|---|---|
| Session | `src/proxy.ts` | `clerkMiddleware()` — makes the session readable server-side |
| Mirror | `src/app/auth-callback/route.ts` | Copies the Clerk account into the local `User` table on sign-in |
| Guard | `src/services/auth.service.ts` | `requireAdmin()` — the check every admin endpoint runs |

Clerk owns **authentication**. The local `User.role` column owns
**authorization**. A valid Clerk session proves who someone is; it says nothing
about whether they administer this academy.

---

## 2. The sign-in flow

```text
Clerk sign-in
   ↓  (NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL)
/auth-callback
   ↓
userService.syncFromClerk()      ← creates or updates the local User row
   ↓
ADMIN → /admin        ·        STUDENT → /dashboard
```

> Students were sent to `/` until the learner dashboard existed. They now land
> on `/dashboard` — see [`student-dashboard.md`](./student-dashboard.md) §7.

`auth-callback/route.ts` stays thin — no Prisma, no role logic. Both belong to
`services/user.service.ts`, per the layer rules in `folder-structure.md`.

---

## 3. `syncFromClerk` — reconciliation rules

Three cases, in order:

1. **Known `clerkId`** → refresh `email`, `name`, `imageUrl`. Without this the
   local row drifts whenever someone edits their Clerk profile.
2. **Known email, new `clerkId`** → the Clerk account was deleted and
   re-created. **Re-link** the existing row rather than inserting a second one.
3. **Neither** → create the row.

### Role resolution

```text
existing ADMIN                     → stays ADMIN, always
email listed in ADMIN_EMAILS       → ADMIN
first user in an empty database    → ADMIN   (bootstrap)
everyone else                      → STUDENT
```

**Roles are only ever raised here, never lowered.** A promotion made by hand in
Prisma Studio has to survive the next sign-in; if this function reset roles from
config it would silently undo manual grants.

### Configuration

`.env` (git-ignored):

```bash
# Comma-separated emails always granted ADMIN on sign-in.
ADMIN_EMAILS=someone@example.com,another@example.com
```

Config rather than a hard-coded address in source, so adding an administrator
does not need a code change. **Next.js reads `.env` at server start — restart
`next dev` after editing it.**

---

## 4. Bugs fixed in `/auth-callback`

The original implementation had five problems:

| # | Problem | Consequence | Fix |
|---|---|---|---|
| 1 | `user.create()` with no check on the unique `email` | A Clerk account re-created under a new `clerkId` hit a **P2002 unique violation**, caught by the generic `catch`, returning `500 Internal Error`. Sign-in appeared to succeed, then dumped the user on an error page | Look up by email and re-link (case 2 above) |
| 2 | Everyone redirected to `/admin/paths` | Students landed in the console, where every request 403s | Redirect by role |
| 3 | Admin email hard-coded in source | Adding an admin required editing and redeploying code | `ADMIN_EMAILS` env var |
| 4 | Profile fields written only on insert | Name/email/avatar drifted from Clerk forever after | Refreshed on every sign-in |
| 5 | `db` imported directly in `app/` | Broke the layer rule that only repositories touch Prisma | Moved to `user.repository` + `user.service` |

Also: an unauthenticated hit now redirects to `/sign-in` (**307**) instead of
returning a bare `401 Unauthorized` body, and a sync failure lets the user into
the site with a server-side log rather than stranding them.

> Verified: `GET /auth-callback` with no session → `307 → /sign-in`.
> Verified: `findByEmail("alisoliman2125@gmail.com")` resolves to the existing
> row, which is exactly what prevents the duplicate insert from case 1.

---

## 5. The guard — `requireAdmin()`

```ts
const user = await authService.getCurrentUser();   // Clerk session → local row
if (!user) throw new UnauthorizedError();          // 401
if (user.role !== "ADMIN") throw new ForbiddenError(); // 403
```

It **throws** rather than returning a boolean, so a route cannot accidentally
ignore the result. `handleRouteError` maps the throw to 401/403 with an Arabic
message.

Every `/api/paths` handler calls it first — including `GET`. Read access to the
console's data is itself privileged.

### What the client does with it

`ApiErrorState` (`components/admin/shared/api-error-state.tsx`) branches on
status, because a 401 or 403 is not a malfunction and a retry button would be a
lie:

| Status | UI |
|---|---|
| 401 | "يجب تسجيل الدخول" + a sign-in link |
| 403 | "لا تملك صلاحية الوصول" — explains the account is a student |
| other | Generic error + working retry |

---

## 6. Current gaps

- **`/admin` pages are not guarded server-side.** A non-admin can load the
  shell; every data request inside it returns 401/403, so **no data leaks**, but
  they should be redirected rather than shown an empty console. Fix: call
  `requireAdmin()` in `(admin)/admin/layout.tsx` and `redirect()` on throw.
- **`proxy.ts` runs `clerkMiddleware()` without route protection** — it makes
  the session available but does not gate `/admin`.
- **No Clerk webhook.** `User` rows are reconciled only when someone signs in.
  A profile edited in the Clerk dashboard is not reflected until their next
  sign-in, and a deleted Clerk account leaves an orphaned row.

---

## 7. Granting yourself admin

Either:

1. Add the address to `ADMIN_EMAILS` in `.env`, **restart the dev server**, and
   sign out and back in — `syncFromClerk` promotes on the way through; or
2. Edit `User.role` directly in Prisma Studio. The promotion will not be undone
   by a later sign-in.
