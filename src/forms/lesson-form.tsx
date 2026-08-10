"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, Save } from "lucide-react";

import {
  FormAlert,
  SelectField,
  TextField,
  TextareaField,
} from "@/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  LESSON_CONTENT_TYPE_LABELS,
  LESSON_TYPE_LABELS,
} from "@/constants/lesson";
import type { PathOption } from "@/hooks/use-paths";
import type { StageOption } from "@/hooks/use-stages";
import {
  LESSON_CONTENT_TYPES,
  LESSON_TYPES,
  lessonCreateSchema,
  type LessonCreateInput,
  type LessonCreateValues,
} from "@/validation/lesson.schema";

const TYPE_OPTIONS = LESSON_TYPES.map((type) => ({
  value: type,
  label: LESSON_TYPE_LABELS[type],
}));

const CONTENT_TYPE_OPTIONS = LESSON_CONTENT_TYPES.map((type) => ({
  value: type,
  label: LESSON_CONTENT_TYPE_LABELS[type],
}));

export type LessonFormProps = {
  defaultValues?: Partial<LessonCreateInput>;
  /**
   * The parent picker is a two-step cascade — path, then stage — and the
   * caller owns it, because loading the options is a request and forms stay
   * out of the request business.
   */
  pathOptions?: PathOption[];
  stageOptions?: StageOption[];
  pathId?: string;
  onPathChange?: (pathId: string) => void;
  isLoadingStages?: boolean;
  /**
   * Edit mode: the parent stage is fixed, so it is shown as static text.
   * Moving a lesson between stages is not an edit — see `lessonUpdateSchema`.
   */
  lockedStageLabel?: string;
  onSubmit: (values: LessonCreateValues) => void;
  isPending?: boolean;
  /** Form-level failure (a 409 from the Service, for example). */
  errorMessage?: string;
  submitLabel?: string;
};

/**
 * Create / edit form for a lesson.
 *
 * Presentational by contract: it owns validation and field state, but the
 * caller owns the request. The same component therefore serves
 * `/admin/lessons/new` and the editor at `/admin/lessons/[lessonId]`.
 *
 * Validation comes from `lessonCreateSchema` — the exact schema the API route
 * parses — so the browser and the server can never disagree. In edit mode the
 * locked `stageId` still travels through the form so one schema keeps covering
 * both cases; the caller sends only the editable fields.
 */
export function LessonForm({
  defaultValues,
  pathOptions = [],
  stageOptions = [],
  pathId = "",
  onPathChange,
  isLoadingStages = false,
  lockedStageLabel,
  onSubmit,
  isPending = false,
  errorMessage,
  submitLabel = "حفظ الدرس",
}: LessonFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LessonCreateInput, unknown, LessonCreateValues>({
    resolver: standardSchemaResolver(lessonCreateSchema),
    defaultValues: {
      stageId: "",
      title: "",
      description: "",
      type: "VIDEO",
      contentType: "YOUTUBE",
      videoUrl: "",
      content: "",
      duration: "",
      order: "",
      ...defaultValues,
    },
  });

  // The content fields swap with the lesson's type: a text lesson has no video
  // URL to give, and showing both would ask for content twice.
  //
  // `useWatch` rather than `watch()` — the latter returns a function, which
  // makes React Compiler skip memoising this whole component.
  const type = useWatch({ control, name: "type" });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl space-y-6"
      noValidate
    >
      <FormAlert message={errorMessage} />

      {lockedStageLabel ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">المرحلة</p>
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {lockedStageLabel}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            id="pathId"
            label="المسار"
            required
            value={pathId}
            onValueChange={(value) => onPathChange?.(value)}
            options={pathOptions.map((path) => ({
              value: path.id,
              label: path.title,
            }))}
            placeholder="اختر المسار"
            hint="اختر المسار أولًا لعرض مراحله."
          />

          <Controller
            control={control}
            name="stageId"
            render={({ field }) => (
              <SelectField
                id="stageId"
                label="المرحلة"
                required
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={stageOptions.map((stage) => ({
                  value: stage.id,
                  label: `${stage.order}. ${stage.title}`,
                }))}
                placeholder={
                  !pathId
                    ? "اختر المسار أولًا"
                    : isLoadingStages
                      ? "جارٍ التحميل…"
                      : stageOptions.length === 0
                        ? "لا توجد مراحل في هذا المسار"
                        : "اختر المرحلة"
                }
                error={errors.stageId?.message}
              />
            )}
          />
        </div>
      )}

      <TextField
        id="title"
        label="عنوان الدرس"
        required
        placeholder="مثال: شرح حديث الأعمال بالنيات"
        error={errors.title?.message}
        {...register("title")}
      />

      <TextareaField
        id="description"
        label="الوصف"
        rows={3}
        placeholder="نبذة مختصرة عن الدرس وأهدافه"
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <SelectField
              id="type"
              label="نوع الدرس"
              value={field.value ?? "VIDEO"}
              onValueChange={field.onChange}
              options={TYPE_OPTIONS}
              error={errors.type?.message}
            />
          )}
        />

        <TextField
          id="duration"
          label="مدة الدرس"
          placeholder="مثال: 12:30 أو 45 دقيقة"
          hint="تُعرض كما تُكتب — مجموع مدد الدروس هو مدة المرحلة."
          error={errors.duration?.message}
          {...register("duration")}
        />
      </div>

      {type === "TEXT" ? (
        <TextareaField
          id="content"
          label="محتوى الدرس"
          rows={10}
          placeholder="نص الدرس أو التفريغ الكامل…"
          hint="التفريغات والملخصات والتشجيرات يمكن إضافتها أيضًا كمرفقات."
          error={errors.content?.message}
          {...register("content")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <Controller
            control={control}
            name="contentType"
            render={({ field }) => (
              <SelectField
                id="contentType"
                label="مصدر الفيديو"
                value={field.value ?? "YOUTUBE"}
                onValueChange={field.onChange}
                options={CONTENT_TYPE_OPTIONS}
                error={errors.contentType?.message}
              />
            )}
          />

          <TextField
            id="videoUrl"
            label="رابط الفيديو"
            placeholder="https://…"
            error={errors.videoUrl?.message}
            {...register("videoUrl")}
          />
        </div>
      )}

      <TextField
        id="order"
        label="الترتيب داخل المرحلة"
        type="number"
        min={1}
        max={999}
        placeholder="تلقائي"
        hint="اتركه فارغًا لإضافة الدرس في نهاية المرحلة."
        error={errors.order?.message}
        {...register("order")}
      />

      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
        {submitLabel}
      </Button>
    </form>
  );
}
