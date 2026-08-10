import type { StageGroup, StageListItem } from "@/types/stage";

/**
 * Collapses a flat list of stages into one block per parent path.
 *
 * Pure and framework-free, so the Service can use it to shape the API payload
 * and any other consumer can reuse it on already-fetched rows.
 *
 * `stageRepository` orders results path-major, so rows of the same path always
 * arrive contiguously and groups come out in the same order as the paths that
 * were paginated; keying by path id regardless means an out-of-order row joins
 * its existing group instead of opening a duplicate heading.
 *
 * Because the repository pages over paths rather than stages, a group always
 * holds **every** matching stage of its path — never a fragment.
 */
export function groupStagesByPath(stages: StageListItem[]): StageGroup[] {
  const groups = new Map<string, StageGroup>();

  for (const stage of stages) {
    const group = groups.get(stage.path.id);

    if (group) {
      group.stages.push(stage);
    } else {
      groups.set(stage.path.id, { path: stage.path, stages: [stage] });
    }
  }

  return [...groups.values()];
}
