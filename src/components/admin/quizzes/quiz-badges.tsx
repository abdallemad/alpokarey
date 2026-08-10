import { BookOpen, CircleSlash, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  QUIZ_KIND_LABELS,
  QUIZ_KIND_SHORT_LABELS,
} from "@/constants/quiz";
import { cn } from "@/lib/utils";
import type { QuizKind } from "@/types/quiz";
import { formatNumber } from "@/utils/format";

const KIND_ICONS = {
  FINAL: Trophy,
  LESSON: BookOpen,
  UNLINKED: CircleSlash,
} as const;

/**
 * How the exam is attached — the property the whole screen is organised
 * around.
 *
 * A final exam uses `--gold`, the achievement token, because it is the one a
 * certificate rests on. `UNLINKED` uses `--warning`: it is not an error, but
 * it does mean no student can currently reach the exam, which is something to
 * act on.
 */
const KIND_CLASSES: Record<QuizKind, string> = {
  FINAL: "border-transparent bg-gold/15 text-gold-foreground dark:text-gold",
  LESSON: "border-transparent bg-info/15 text-info",
  UNLINKED: "border-warning/30 bg-warning/10 text-warning",
};

export function QuizKindBadge({
  kind,
  short = false,
}: {
  kind: QuizKind;
  /** Table cells get the short label; headers and detail get the full one. */
  short?: boolean;
}) {
  const Icon = KIND_ICONS[kind];

  return (
    <Badge className={cn("gap-1", KIND_CLASSES[kind])}>
      <Icon />
      {short ? QUIZ_KIND_SHORT_LABELS[kind] : QUIZ_KIND_LABELS[kind]}
    </Badge>
  );
}

/** Whether students can currently sit the exam. */
export function QuizActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        active
          ? "border-success/30 bg-success/10 text-success"
          : "text-muted-foreground",
      )}
    >
      {active ? "مفعّل" : "غير مفعّل"}
    </Badge>
  );
}

/** Questions written so far. Zero is the reason an exam cannot be activated. */
export function QuizQuestionsBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-xs text-warning">بدون أسئلة</span>;
  }

  return <span className="tabular-nums">{formatNumber(count)}</span>;
}
