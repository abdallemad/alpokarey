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
 * `/paths` is labelled "مساراتي" rather than "المسارات" because that is what it
 * lists — the learner's own enrolments and their progress in each, not a public
 * catalog. The dashboard shows the same paths; this is the screen for searching
 * and filtering them. See `docs/my-paths-feature.md`.
 */
export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: ROUTES.app.dashboard,
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

/** Arabic labels for the learner-facing URL segments. */
export const APP_SEGMENT_LABELS: Record<string, string> = {
  dashboard: "لوحتي",
  paths: "مساراتي",
  learn: "التعلّم",
  account: "حسابي",
  certificates: "شهاداتي",
  "my-paths": "مساراتي",
};
