import type { AppUser } from "@/repositories/user.repository";

/**
 * How a person is named in the interface.
 *
 * Clerk can be configured so an account has no name at all — sign-in by email,
 * by phone, or by username — and the local `User` row mirrors whatever Clerk
 * had. So every screen that greets someone needs the same fallback, and a
 * second copy of it is how the dashboard eventually greets "أهلًا" while the
 * certificate beside it is issued to an empty string.
 *
 * The email's local part rather than the whole address: a certificate is a
 * document a learner may show someone, and it should not carry their mail
 * provider.
 */
export function toDisplayName(user: Pick<AppUser, "name" | "email">): string {
  return user.name?.trim() || user.email.split("@")[0];
}
