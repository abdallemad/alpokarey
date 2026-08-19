import { PathOverviewSkeleton } from "@/components/paths";

/**
 * Shown while the route segment itself loads.
 *
 * The same skeleton the view renders for its own pending state, so the
 * transition from "Next is fetching the page" to "React Query is fetching the
 * path" is invisible — one picture, not two.
 */
export default function PathDetailLoading() {
  return <PathOverviewSkeleton />;
}
