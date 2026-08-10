"use client";

import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, Save } from "lucide-react";

import { FormAlert, SelectField, TextField } from "@/forms/form-field";
import { Button } from "@/components/ui/button";
import type { PathOption } from "@/hooks/use-paths";
import {
  stageCreateSchema,
  type StageCreateInput,
  type StageCreateValues,
} from "@/validation/stage.schema";

export type StageFormProps = {
  defaultValues?: Partial<StageCreateInput>;
  /** Paths the stage may be attached to. Ignored when `lockedPathLabel` is set. */
  pathOptions: PathOption[];
  /**
   * Edit mode: the parent path is fixed, so it is shown as static text instead
   * of a select. Moving a stage between paths is not an edit — see
   * `stageUpdateSchema`.
   */
  lockedPathLabel?: string;
  onSubmit: (values: StageCreateValues) => void;
  isPending?: boolean;
  /** Form-level failure (a 409 from the Service, for example). */
  errorMessage?: string;
  submitLabel?: string;
  /** Rendered beside the submit button — a cancel action when in a dialog. */
  secondaryAction?: React.ReactNode;
};

/**
 * Create / edit form for a stage.
 *
 * Presentational by contract: it owns validation and field state, but the
 * caller owns the request. The same component therefore serves the create
 * dialog and the edit dialog.
 *
 * Validation comes from `stageCreateSchema` — the exact schema the API route
 * parses — so the browser and the server can never disagree. In edit mode the
 * locked `pathId` still travels through the form so that one schema keeps
 * covering both cases; the caller sends only the editable fields.
 */
export function StageForm({
  defaultValues,
  pathOptions,
  lockedPathLabel,
  onSubmit,
  isPending = false,
  errorMessage,
  submitLabel = "حفظ المرحلة",
  secondaryAction,
}: StageFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<StageCreateInput, unknown, StageCreateValues>({
    resolver: standardSchemaResolver(stageCreateSchema),
    defaultValues: {
      pathId: "",
      title: "",
      order: "",
      ...defaultValues,
    },
  });

  const pathSelectOptions = pathOptions.map((path) => ({
    value: path.id,
    label: path.title,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormAlert message={errorMessage} />

      {lockedPathLabel ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">المسار</p>
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {lockedPathLabel}
          </p>
        </div>
      ) : (
        <Controller
          control={control}
          name="pathId"
          render={({ field }) => (
            <SelectField
              id="pathId"
              label="المسار"
              required
              value={field.value ?? ""}
              onValueChange={field.onChange}
              options={pathSelectOptions}
              placeholder="اختر المسار"
              error={errors.pathId?.message}
            />
          )}
        />
      )}

      <TextField
        id="title"
        label="عنوان المرحلة"
        required
        placeholder="مثال: أركان الإسلام"
        error={errors.title?.message}
        {...register("title")}
      />

      <TextField
        id="order"
        label="الترتيب داخل المسار"
        type="number"
        min={1}
        max={999}
        placeholder="تلقائي"
        hint="اتركه فارغًا لإضافة المرحلة في نهاية المسار."
        error={errors.order?.message}
        {...register("order")}
      />

      <div className="flex items-center justify-end gap-2 pt-1">
        {secondaryAction}
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
