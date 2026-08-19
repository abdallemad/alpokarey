export { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
export { SectionCard } from "./section-card";
export {
  DataTableSkeleton,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "./skeletons";

/**
 * Re-exported from `components/shared` so admin features import everything from
 * one path — see `docs/folder-structure.md`.
 *
 * The page shell (`PageContainer`, `PageHeader`) and the error states live in
 * `components/shared` because the learner app renders the same ones; they are
 * re-exported here so no admin import had to change when they moved.
 */
export {
  ApiErrorState,
  BrandLockup,
  DataPagination,
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
  SearchInput,
  ThemeToggle,
} from "@/components/shared";
