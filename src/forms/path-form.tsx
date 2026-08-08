"use client";

import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, Save } from "lucide-react";

import {
  FormAlert,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "@/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  PATH_CATEGORY_LABELS,
  PATH_STATUS_LABELS,
} from "@/constants/path";
import {
  PATH_CATEGORIES,
  PATH_STATUSES,
  pathCreateSchema,
  type PathCreateInput,
  type PathCreateValues,
} from "@/validation/path.schema";

const CATEGORY_OPTIONS = [
  { value: "", label: "بدون تصنيف" },
  ...PATH_CATEGORIES.map((category) => ({
    value: category,
    label: PATH_CATEGORY_LABELS[category],
  })),
];

const STATUS_OPTIONS = PATH_STATUSES.map((status) => ({
  value: status,
  label: PATH_STATUS_LABELS[status],
}));

export type PathFormProps = {
  defaultValues?: Partial<PathCreateInput>;
  onSubmit: (values: PathCreateValues) => void;
  isPending?: boolean;
  /** Form-level failure (a 409 from the Service, for example). */
  errorMessage?: string;
  submitLabel?: string;
};

/**
 * Create / edit form for a learning path.
 *
 * Presentational by contract: it owns validation and field state, but the
 * caller owns the request. That keeps the same component usable on the "new"
 * page and inside the detail page.
 *
 * Validation comes from `pathCreateSchema` — the exact schema the API route
 * parses — so the browser and the server can never disagree.
 */
export function PathForm({
  defaultValues,
  onSubmit,
  isPending = false,
  errorMessage,
  submitLabel = "حفظ المسار",
}: PathFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PathCreateInput, unknown, PathCreateValues>({
    resolver: standardSchemaResolver(pathCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      status: "DRAFT",
      isFeatured: false,
      certificationActivated: false,
      imageUrl: "",
      promoUrl: "",
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl space-y-6"
      noValidate
    >
      <FormAlert message={errorMessage} />

      <TextField
        id="title"
        label="عنوان المسار"
        required
        placeholder="مثال: السنة والأسرة"
        error={errors.title?.message}
        {...register("title")}
      />

      <TextareaField
        id="description"
        label="الوصف"
        rows={4}
        placeholder="نبذة مختصرة عن محتوى المسار وأهدافه"
        hint="يظهر الوصف في بطاقة المسار ضمن كتالوج المسارات."
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectField
              id="category"
              label="التصنيف"
              value={field.value ?? ""}
              onValueChange={field.onChange}
              options={CATEGORY_OPTIONS}
              // Base UI treats "" as "nothing selected" and falls back to the
              // placeholder, so the placeholder has to carry the real label.
              placeholder="بدون تصنيف"
              error={errors.category?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <SelectField
              id="status"
              label="حالة النشر"
              value={field.value ?? "DRAFT"}
              onValueChange={field.onChange}
              options={STATUS_OPTIONS}
              hint="لا يمكن النشر قبل إضافة مرحلة واحدة على الأقل."
              error={errors.status?.message}
            />
          )}
        />
      </div>

      <TextField
        id="imageUrl"
        label="رابط صورة الغلاف"
        placeholder="https://…"
        error={errors.imageUrl?.message}
        {...register("imageUrl")}
      />

      <TextField
        id="promoUrl"
        label="رابط الفيديو التعريفي"
        placeholder="https://…"
        error={errors.promoUrl?.message}
        {...register("promoUrl")}
      />

      <div className="space-y-3">
        <Controller
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <SwitchField
              id="isFeatured"
              label="مسار مميز"
              hint="يظهر المسار ضمن المسارات المميزة في الصفحة الرئيسية."
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="certificationActivated"
          render={({ field }) => (
            <SwitchField
              id="certificationActivated"
              label="تفعيل الشهادة"
              hint="تُمنح شهادة إتمام للطالب عند إنهاء المسار بنجاح."
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
        {submitLabel}
      </Button>
    </form>
  );
}
