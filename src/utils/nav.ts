type NavMatchable = {
  href: string;
  /** Only highlight on an exact match — used by index routes like `/admin`. */
  exact?: boolean;
};

/**
 * Whether a nav item should render as the active one for the current pathname.
 *
 * Non-exact items also match their descendants, so `/admin/paths/123/edit`
 * keeps `المسارات` highlighted. The `/`-suffixed prefix check stops
 * `/admin/paths-archive` from matching `/admin/paths`.
 */
export function isNavItemActive(pathname: string, item: NavMatchable): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
