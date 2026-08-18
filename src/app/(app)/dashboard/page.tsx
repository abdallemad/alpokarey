import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/**
 * `/dashboard` — not a screen, a signpost.
 *
 * The learner section is three sibling pages under one prefix
 * (`home`, `paths`, `certificates`) rather than a page at `/dashboard` with two
 * children. That keeps the three destinations symmetrical: none of them is
 * secretly the parent of the others, and adding a fourth is a folder rather
 * than a decision about what the prefix "really" means.
 *
 * The cost is that the bare prefix has to resolve to something, because links
 * to it exist — the sidebar brand lockup, the sign-in redirect, and any
 * bookmark made before the restructure. It resolves here, and this sends the
 * learner to the page that answers "where was I?".
 *
 * A redirect rather than a rewrite, so the address bar ends up saying what the
 * learner is actually looking at.
 */
export default function DashboardIndexPage() {
  redirect(ROUTES.app.home);
}
