import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { ROUTES } from "@/constants/routes";
import { userService } from "@/services/user.service";

/**
 * Where Clerk lands a user after sign-in / sign-up.
 *
 * Its job is to mirror the Clerk account into the local `User` table — which is
 * what owns the STUDENT/ADMIN role — and then send the person somewhere useful.
 *
 * Kept thin per the layer rules: no Prisma, no role logic. Both live in
 * `services/user.service.ts`.
 */
export async function GET(request: Request) {
  const signInUrl = new URL("/sign-in", request.url);

  try {
    const clerkUser = await currentUser();

    // No session — the user reached this URL directly, or the session expired
    // between the redirect and this request. Send them to sign in rather than
    // returning a bare 401 body.
    if (!clerkUser) {
      return NextResponse.redirect(signInUrl);
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress;

    // Clerk can be configured for username- or phone-only sign-in, in which
    // case there is no email to key the local row on.
    if (!email) {
      console.error("[auth-callback] Clerk user has no email address", {
        clerkId: clerkUser.id,
      });
      return NextResponse.redirect(new URL(ROUTES.home, request.url));
    }

    const user = await userService.syncFromClerk({
      clerkId: clerkUser.id,
      email,
      name:
        [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || null,
      imageUrl: clerkUser.imageUrl ?? null,
    });

    // Students have nothing to do in the console — sending everyone to /admin
    // meant a student landed on a page where every request returns 403.
    // Students now land on their own dashboard rather than the marketing home,
    // because it is the page that tells them what to do next.
    const destination =
      user.role === "ADMIN" ? ROUTES.admin.dashboard : ROUTES.app.dashboard;

    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    console.error("[auth-callback] failed to sync user", error);

    // The sign-in itself succeeded; only the mirror failed. Let them into the
    // site rather than stranding them on an error page.
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }
}
