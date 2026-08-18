/**
 * Application route map.
 *
 * Every link in the app should come from here rather than a hard-coded string,
 * so a URL change is a one-line edit. Learner-facing routes are added as their
 * features land (see `docs/folder-structure.md`).
 */
export const ROUTES = {
  home: "/",

  /**
   * The learner-facing app — the `(app)` route group.
   *
   * Every learner screen that renders inside the dashboard shell lives under
   * `/dashboard/*`, one segment per destination. `/dashboard` itself is not a
   * page: it redirects to `/dashboard/home`, so the sidebar's brand link and
   * any bookmark of the bare prefix still land somewhere real. Keeping the
   * section flat under one prefix is what lets the shell decide "am I in the
   * dashboard?" from the first URL segment alone.
   *
   * See `docs/dashboard-restructure.md`.
   */
  app: {
    /** Not a page — redirects to `home`. Kept so links to the section work. */
    dashboard: "/dashboard",
    home: "/dashboard/home",
    paths: "/dashboard/paths",
    certificates: "/dashboard/certificates",
    /** One issued certificate — where the player sends a learner after it is
     * granted. See `docs/certificates-feature.md`. */
    certificate: (certificateId: string) =>
      `/dashboard/certificates/${certificateId}`,
    /**
     * The player, and the two things it can open.
     *
     * Both carry a **named segment** — `/lesson/` or `/quiz/` — rather than
     * hanging the id straight off the path. A bare `/learn/:pathId/:id` cannot
     * say what the id refers to: the router would have to guess, and a lesson
     * and an exam are two different screens with two different endpoints
     * behind them. The segment makes the URL self-describing and leaves room
     * for whatever the player gains next.
     *
     * The player sits **outside** `/dashboard` on purpose: it renders in its
     * own shell, where the sidebar is the curriculum rather than the app's
     * navigation. Nesting it under the dashboard prefix would promise a
     * dashboard chrome that is deliberately not there — see
     * `docs/learn-layout.md`.
     */
    learn: (pathId: string) => `/learn/${pathId}`,
    lesson: (pathId: string, lessonId: string) =>
      `/learn/${pathId}/lesson/${lessonId}`,
    quiz: (pathId: string, quizId: string) => `/learn/${pathId}/quiz/${quizId}`,
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
