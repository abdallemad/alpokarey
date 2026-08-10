import type { ContentType, LessonType } from "@prisma/client";
import { FileText, Paperclip, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  LESSON_CONTENT_TYPE_LABELS,
  LESSON_TYPE_LABELS,
} from "@/constants/lesson";
import { formatNumber } from "@/utils/format";

/** VIDEO vs TEXT — the one property that changes what a lesson *is*. */
export function LessonTypeBadge({ type }: { type: LessonType }) {
  const Icon = type === "VIDEO" ? PlayCircle : FileText;

  return (
    <Badge variant="outline" className="gap-1">
      <Icon />
      {LESSON_TYPE_LABELS[type]}
    </Badge>
  );
}

/** Where a video lesson's content comes from. Meaningless for a text lesson. */
export function LessonSourceBadge({
  type,
  contentType,
}: {
  type: LessonType;
  contentType: ContentType;
}) {
  if (type !== "VIDEO") return null;

  return (
    <Badge variant="secondary">{LESSON_CONTENT_TYPE_LABELS[contentType]}</Badge>
  );
}

/** Attachment count. Zero renders as a muted dash rather than a loud "0". */
export function LessonAttachmentsBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm tabular-nums">
      <Paperclip className="size-3.5 text-muted-foreground" />
      {formatNumber(count)}
    </span>
  );
}
