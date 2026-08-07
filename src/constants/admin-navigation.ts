import {
  ClipboardCheck,
  FileText,
  Layers,
  LayoutDashboard,
  Route,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";

export type AdminNavItem = {
  /** Destination URL. */
  href: string;
  /** Arabic label shown in the sidebar, breadcrumbs, and command menu. */
  label: string;
  icon: LucideIcon;
  /** Extra words the command menu matches on (transliterations, English names). */
  keywords?: string[];
  /**
   * `true` for routes that should only light up on an exact match. Without it,
   * `/admin` would stay active on every single admin page.
   */
  exact?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

/**
 * The admin sidebar, top to bottom. This is the single source of truth — the
 * sidebar, the breadcrumb labels, and the ⌘K command menu are all derived from it.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "نظرة عامة",
    items: [
      {
        href: ROUTES.admin.dashboard,
        label: "لوحة التحكم",
        icon: LayoutDashboard,
        keywords: ["dashboard", "home", "الرئيسية"],
        exact: true,
      },
    ],
  },
  {
    label: "إدارة المحتوى",
    items: [
      {
        href: ROUTES.admin.paths,
        label: "المسارات",
        icon: Route,
        keywords: ["paths", "tracks", "masarat"],
      },
      {
        href: ROUTES.admin.stages,
        label: "المراحل",
        icon: Layers,
        keywords: ["stages", "marahel"],
      },
      {
        href: ROUTES.admin.lessons,
        label: "الدروس",
        icon: FileText,
        keywords: ["lessons", "doros"],
      },
      {
        href: ROUTES.admin.quizzes,
        label: "الاختبارات",
        icon: ClipboardCheck,
        keywords: ["quizzes", "exams", "ekhtebarat"],
      },
    ],
  },
  {
    label: "الإدارة",
    items: [
      {
        href: ROUTES.admin.users,
        label: "المستخدمون",
        icon: Users,
        keywords: ["users", "students", "mostakhdemeen"],
      },
    ],
  },
];

/** Flat list of every nav item, for lookups that don't care about grouping. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (group) => group.items,
);

/**
 * Arabic labels for URL segments that are not nav destinations — the trailing
 * parts of `/admin/paths/new` or `/admin/lessons/[id]/edit`. Segments missing
 * from this map (record IDs, for instance) fall back to `تفاصيل`.
 */
export const ADMIN_SEGMENT_LABELS: Record<string, string> = {
  admin: "لوحة التحكم",
  paths: "المسارات",
  stages: "المراحل",
  lessons: "الدروس",
  quizzes: "الاختبارات",
  users: "المستخدمون",
  new: "إضافة جديد",
  edit: "تعديل",
  questions: "الأسئلة",
};

export const ADMIN_FALLBACK_SEGMENT_LABEL = "تفاصيل";
