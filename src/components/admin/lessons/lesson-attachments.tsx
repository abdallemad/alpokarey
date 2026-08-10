"use client";

import * as React from "react";
import {
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import {
  DeleteConfirmationDialog,
  EmptyState,
  SectionCard,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/forms/form-field";
import { ATTACHMENT_TYPE_LABELS } from "@/constants/lesson";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
} from "@/constants/upload";
import {
  useAddAttachment,
  useDeleteAttachment,
  type AttachmentDraft,
} from "@/hooks/use-attachments";
import type { LessonAttachment } from "@/types/lesson";
import { formatDate } from "@/utils/format";
import { ATTACHMENT_TYPES } from "@/validation/lesson.schema";

const TYPE_OPTIONS = ATTACHMENT_TYPES.map((type) => ({
  value: type,
  label: ATTACHMENT_TYPE_LABELS[type],
}));

/**
 * The lesson's attachments: upload a file, or store a note inline.
 *
 * `business-analysis.md` §4.4 lists a lesson's materials as transcripts,
 * summaries, mind maps and exercises — a mix of files and prose — which is
 * exactly the `FILE` / `TEXT` split the `Attachment` model already carries.
 *
 * Only rendered on the editor, never on the create page: an attachment needs a
 * lesson id to hang from, so it cannot be collected before the lesson exists.
 */
export function LessonAttachments({
  lessonId,
  attachments,
}: {
  lessonId: string;
  attachments: LessonAttachment[];
}) {
  const deleteAttachment = useDeleteAttachment(lessonId);
  const [pendingDelete, setPendingDelete] =
    React.useState<LessonAttachment | null>(null);

  return (
    <>
      <SectionCard
        title="مرفقات الدرس"
        description="التفريغات والملخصات والتشجيرات والتدريبات — كملف مرفوع أو كنص مكتوب."
      >
        {attachments.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title="لا توجد مرفقات بعد"
            description="أضف أول مرفق للدرس من النموذج أدناه."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex flex-wrap items-start gap-3 p-3"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  {attachment.type === "FILE" ? (
                    <Paperclip className="size-4 text-muted-foreground" />
                  ) : (
                    <FileText className="size-4 text-muted-foreground" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{attachment.name}</p>

                  {attachment.type === "TEXT" && attachment.content ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {attachment.content}
                    </p>
                  ) : null}

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ATTACHMENT_TYPE_LABELS[attachment.type]} ·{" "}
                    {formatDate(attachment.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {attachment.url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={
                        // `rel` is not optional on a `_blank` link to a file an
                        // admin uploaded — it keeps the opened tab from
                        // reaching back through `window.opener`.
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <ExternalLink />
                      فتح
                    </Button>
                  ) : null}

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`حذف ${attachment.name}`}
                    onClick={() => setPendingDelete(attachment)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <AddAttachmentForm lessonId={lessonId} />
      </SectionCard>

      <DeleteConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        entityName={pendingDelete?.name ?? ""}
        description={
          pendingDelete?.type === "FILE"
            ? "سيتم حذف المرفق والملف المرفوع معه نهائيًا. لا يمكن التراجع عن هذا الإجراء."
            : "سيتم حذف المرفق نهائيًا. لا يمكن التراجع عن هذا الإجراء."
        }
        isPending={deleteAttachment.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;

          deleteAttachment.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}

/**
 * Hand-rolled rather than react-hook-form, because a `<input type="file">` is
 * an uncontrolled element by nature and the whole form is three fields whose
 * shape changes with one toggle.
 *
 * The size and type checks here are a courtesy — they save a round trip and
 * give an instant message. `lib/storage.ts` enforces the same rules on the
 * server, which is the check that counts.
 */
function AddAttachmentForm({ lessonId }: { lessonId: string }) {
  const addAttachment = useAddAttachment(lessonId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [type, setType] = React.useState<AttachmentDraft["type"]>("FILE");
  const [name, setName] = React.useState("");
  const [content, setContent] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setName("");
    setContent("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);

    if (selected && selected.size > MAX_UPLOAD_BYTES) {
      setError(`حجم الملف يتجاوز الحد المسموح (${MAX_UPLOAD_MB} ميجابايت)`);
      setFile(null);
      event.target.value = "";
      return;
    }

    setFile(selected);
    // An untouched name field takes the file's own name — the common case.
    if (selected && !name) setName(selected.name);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (type === "FILE") {
      if (!file) {
        setError("اختر ملفًا للرفع");
        return;
      }

      addAttachment.mutate(
        { type: "FILE", name: name.trim() || file.name, file },
        { onSuccess: reset },
      );
      return;
    }

    if (!name.trim()) {
      setError("أدخل اسمًا للمرفق");
      return;
    }

    if (!content.trim()) {
      setError("أدخل نص المرفق");
      return;
    }

    addAttachment.mutate(
      { type: "TEXT", name: name.trim(), content: content.trim() },
      { onSuccess: reset },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-lg border border-dashed border-border p-4"
    >
      <div className="flex items-center gap-2">
        <Plus className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">إضافة مرفق</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="attachmentType"
          label="نوع المرفق"
          value={type}
          onValueChange={(value) => {
            setType(value as AttachmentDraft["type"]);
            setError(null);
          }}
          options={TYPE_OPTIONS}
        />

        <div className="space-y-2">
          <Label htmlFor="attachmentName">اسم المرفق</Label>
          <Input
            id="attachmentName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثال: تفريغ الدرس"
          />
        </div>
      </div>

      {type === "FILE" ? (
        <div className="space-y-2">
          <Label htmlFor="attachmentFile">الملف</Label>
          <Input
            id="attachmentFile"
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_UPLOAD_MIME_TYPES}
            onChange={handleFileChange}
            className="file:me-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            حتى {MAX_UPLOAD_MB} ميجابايت ·{" "}
            {ALLOWED_UPLOAD_EXTENSIONS.join("، ")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="attachmentContent">النص</Label>
          <Textarea
            id="attachmentContent"
            rows={5}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="ملخص، تفريغ، أو تدريب عملي…"
          />
        </div>
      )}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={addAttachment.isPending}>
        {addAttachment.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Upload />
        )}
        {addAttachment.isPending ? "جارٍ الرفع…" : "إضافة المرفق"}
      </Button>
    </form>
  );
}
