/**
 * Application route map.
 *
 * Every link in the app should come from here rather than a hard-coded string,
 * so a URL change is a one-line edit. Learner-facing routes are added as their
 * features land (see `docs/folder-structure.md`).
 */
export const ROUTES = {
  home: "/",

  admin: {
    dashboard: "/admin",
    paths: "/admin/paths",
    stages: "/admin/stages",
    lessons: "/admin/lessons",
    quizzes: "/admin/quizzes",
    users: "/admin/users",
  },
} as const;

export type AdminRoute = (typeof ROUTES.admin)[keyof typeof ROUTES.admin];
