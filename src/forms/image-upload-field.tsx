"use client";

import * as React from "react";
import Image from "next/image";
import { ImageUp, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
} from "@/constants/upload";
import { useUploadFile } from "@/hooks/use-upload";
import type { ApiRequestError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { isStoredUploadPath } from "@/utils/upload";

type ImageUploadFieldProps = {
  id: string;
  label: string;
  /** The stored URL, or `""`/`null` when there is no image. */
  value: string | null | undefined;
  /** Called with the new URL, or `""` when the image is removed. */
  onChange: (value: string) => void;
  hint?: string;
  /** Validation error from the form's schema. */
  error?: string;
  disabled?: boolean;
};

/**
 * A picture, chosen from the admin's machine and uploaded before the form is
 * saved.
 *
 * ### Why the upload happens on selection, not on submit
 *
 * The form field's value is a **URL**, not a `File`. Uploading when the file is
 * picked means the schema, the API route and the database all keep dealing in
 * strings, and the "save" button still sends one small JSON body. The
 * alternative — carrying a `File` through `react-hook-form` and posting
 * multipart on submit — would make `pathCreateSchema` describe two different
 * shapes depending on which side of the wire it is validating, which is exactly
 * what sharing one schema between the form and the route exists to prevent.
 *
 * The cost is an orphaned object when an admin uploads and then abandons the
 * form. That is the cheaper failure: a stray file costs disk, a mismatched
 * schema costs correctness. `pathService` deletes the previous object whenever
 * a cover is replaced or removed, so the leak does not compound — see
 * `docs/path-cover-images.md` §6.
 *
 * ### Two kinds of value
 *
 * It renders a preview for whatever it is given. A `/uploads/<key>` path is
 * this app's own object and goes through the Next.js image optimiser; an
 * absolute URL is a link entered before this field existed, and is rendered
 * `unoptimized` so no `remotePatterns` entry is needed for a host nobody
 * configured. Both can be replaced or removed the same way.
 *
 * Client-side type and size checks mirror `lib/storage.ts` rather than replace
 * it: the server still refuses, and this only saves the round trip.
 */
export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  disabled = false,
}: ImageUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const upload = useUploadFile({
    onSuccess: (uploaded) => {
      setLocalError(null);
      onChange(uploaded.url);
    },
    onError: (uploadError: ApiRequestError) =>
      setLocalError(uploadError.message),
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.type)) {
      setLocalError(
        `نوع الصورة غير مدعوم. الأنواع المسموحة: ${ALLOWED_IMAGE_EXTENSIONS.join("، ")}`,
      );
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setLocalError(`حجم الصورة يتجاوز الحد المسموح (${MAX_UPLOAD_MB} ميجابايت)`);
      return;
    }

    setLocalError(null);
    upload.mutate(file);
  };

  const handleRemove = () => {
    setLocalError(null);
    onChange("");
    // Without this the same file cannot be picked twice in a row: the input
    // holds the previous selection and firing `change` with an identical value
    // is not a change.
    if (inputRef.current) inputRef.current.value = "";
  };

  const message = error ?? localError;
  const isBusy = upload.isPending || disabled;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ALLOWED_IMAGE_MIME_TYPES}
        className="sr-only"
        disabled={isBusy}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {value ? (
        <div className="space-y-3">
          <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
            <Image
              src={value}
              alt=""
              fill
              sizes="384px"
              className="object-cover"
              unoptimized={!isStoredUploadPath(value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload />
              )}
              تغيير الصورة
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isBusy}
              onClick={handleRemove}
            >
              <Trash2 />
              إزالة
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          // No `aria-invalid` here: the role is implicit on a button and does
          // not support it. The failure is announced by the message below,
          // which carries `role="alert"`, and shown by the destructive border.
          className={cn(
            "flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-muted/40 text-center transition-colors",
            "hover:border-primary/60 hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-60",
            message && "border-destructive",
          )}
        >
          {upload.isPending ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <ImageUp className="size-6 text-muted-foreground" />
          )}

          <span className="text-sm font-medium">
            {upload.isPending ? "جارٍ الرفع…" : "اختر صورة الغلاف"}
          </span>

          <span className="px-4 text-xs text-muted-foreground">
            {ALLOWED_IMAGE_EXTENSIONS.join("، ")} · حتى {MAX_UPLOAD_MB} ميجابايت
          </span>
        </button>
      )}

      {message ? (
        <p className="text-xs text-destructive" role="alert">
          {message}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
