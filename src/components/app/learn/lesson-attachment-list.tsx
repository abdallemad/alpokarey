"use client";

import { Download, FileText, Paperclip } from "lucide-react";

import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ATTACHMENT_TYPE_LABELS } from "@/constants/lesson";
import type { LessonAttachment } from "@/types/lesson";

/**
 * A lesson's materials, each rendered as what it actually is.
 *
 * `Attachment.type` is the switch, and the two branches are genuinely different
 * things rather than one thing with a different icon:
 *
 * - **`FILE`** — a slide deck, a PDF, an audio recording. There is nothing to
 *   show inline, so it is a row with a name and a way to open it.
 * - **`TEXT`** — a transcript, a summary, a mind-map outline. The content *is*
 *   the attachment, so it is printed in place. `business-analysis.md` §4.4
 *   lists these as core lesson material, not extras, and making a learner
 *   click to read a summary would bury it.
 */
export function LessonAttachmentList({
  attachments,
}: {
  attachments: LessonAttachment[];
}) {
  if (attachments.length === 0) {
    return (
      <EmptyState
        icon={Paperclip}
        title="لا توجد مرفقات لهذا الدرس"
        description="حين يُضيف المشرف تفريغًا أو ملخصًا أو ملفًا ستجده هنا."
        className="py-10"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {attachments.map((attachment) =>
        attachment.type === "TEXT" ? (
          <li
            key={attachment.id}
            className="rounded-lg border border-border p-3"
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              {attachment.name}
            </p>

            {attachment.content ? (
              <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-muted-foreground">
                {attachment.content}
              </p>
            ) : null}
          </li>
        ) : (
          <li
            key={attachment.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
          >
            <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{attachment.name}</span>
            </p>

            {attachment.url ? (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  // `rel` is not optional on a `_blank` link: without it the
                  // opened tab can reach back through `window.opener`.
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Download />
                فتح {ATTACHMENT_TYPE_LABELS[attachment.type]}
              </Button>
            ) : null}
          </li>
        ),
      )}
    </ul>
  );
}
