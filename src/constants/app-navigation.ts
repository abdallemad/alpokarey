import { Award, LayoutDashboard, Route, type LucideIcon } from "lucide-react";

import { ROUTES } from "@/constants/routes";

export type AppNavItem = {
  href: string;
  /** Arabic label shown in the sidebar. */
  label: string;
  icon: LucideIcon;
  /**
   * `true` for routes that should only light up on an exact match — without
   * it, a parent route stays active on every page beneath it.
   */
  exact?: boolean;
};

/**
 * The learner sidebar, top to bottom.
 *
 * Deliberately short. `business-analysis.md` describes an audience ranging from
 * a curious Muslim to an advanced researcher, and a long nav is a tax on the
 * former. Three destinations answer the three questions a learner has: where
 * am I, what am I studying, and what have I earned.
 *
 * All three now live under `/dashboard/*` — the section is one prefix rather
 * than three unrelated top-level URLs, so a learner reading the address bar can
 * tell where they are. See `docs/dashboard-restructure.md`.
 *
 * `/dashboard/paths` is labelled "مساراتي" rather than "المسارات" because that
 * is what it lists — the learner's own enrolments and their progress in each,
 * not a public catalog. The home screen shows the same paths; this is where
 * they are searched and filtered.
 */
export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: ROUTES.app.home,
    label: "لوحتي",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: ROUTES.app.paths,
    label: "مساراتي",
    icon: Route,
  },
  {
    href: ROUTES.app.certificates,
    label: "شهاداتي",
    icon: Award,
  },
];

/**
 * Arabic labels for the learner-facing URL segments.
 *
 * The fallback for a header title when the pathname does not match a nav item
 * exactly — a certificate id under `/dashboard/certificates/:id`, say. Keyed by
 * the **last named segment**, not the first, because every dashboard URL now
 * starts with `dashboard` and labelling them all "لوحتي" would be worse than
 * no fallback at all.
 */
export const APP_SEGMENT_LABELS: Record<string, string> = {
  dashboard: "لوحتي",
  home: "لوحتي",
  paths: "مساراتي",
  learn: "التعلّم",
  certificates: "شهاداتي",
};
