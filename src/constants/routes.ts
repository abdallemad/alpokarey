/**
 * Application route map.
 *
 * Every link in the app should come from here rather than a hard-coded string,
 * so a URL change is a one-line edit. Learner-facing routes are added as their
 * features land (see `docs/folder-structure.md`).
 */
export const ROUTES = {
  home: "/",

  /** The learner-facing app — the `(app)` route group. */
  app: {
    dashboard: "/dashboard",
    paths: "/paths",
    certificates: "/account/certificates",
    /** The lesson player. Not built yet — see `docs/student-dashboard.md` §9. */
    lesson: (pathId: string, lessonId: string) =>
      `/learn/${pathId}/${lessonId}`,
    path: (pathId: string) => `/paths/${pathId}`,
  },

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
