"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
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
import type { LessonOption } from "@/hooks/use-lessons";
import type { PathOption } from "@/hooks/use-paths";
import type { StageOption } from "@/hooks/use-stages";
import {
  quizCreateSchema,
  type QuizCreateInput,
  type QuizCreateValues,
} from "@/validation/quiz.schema";

export type QuizFormProps = {
  defaultValues?: Partial<QuizCreateInput>;
  /**
   * The parent picker is a two-step cascade — path, then stage — and the
   * caller owns it, because loading the options is a request and forms stay
   * out of the request business.
   */
  pathOptions?: PathOption[];
  stageOptions?: StageOption[];
  pathId?: string;
  onPathChange?: (pathId: string) => void;
  /**
   * Reported upward because the lesson list depends on it: the stage is a
   * form field, but the caller is the one holding the query for its lessons.
   */
  onStageChange?: (stageId: string) => void;
  isLoadingStages?: boolean;
  /** Lessons of the currently selected stage — the "attach to a lesson" list. */
  lessonOptions?: LessonOption[];
  isLoadingLessons?: boolean;
  /** Edit mode: the parent stage is fixed, so it is shown as static text. */
  lockedStageLabel?: string;
  /** Hidden on create — a brand-new exam has no questions to activate. */
  canActivate?: boolean;
  activationHint?: string;
  onSubmit: (values: QuizCreateValues) => void;
  isPending?: boolean;
  /** Form-level failure (a 409 from the Service, for example). */
  errorMessage?: string;
  submitLabel?: string;
};

/**
 * Create / edit form for an exam.
 *
 * Presentational by contract: it owns validation and field state, but the
 * caller owns the request. The same component therefore serves
 * `/admin/quizzes/new` and the editor at `/admin/quizzes/[quizId]`.
 *
 * The one piece of logic it does own is the **attachment pair**: marking an
 * exam as the stage's final hides the lesson select and clears it, because the
 * two are mutually exclusive and the Service rejects the combination. Better
 * to make it unrepresentable in the form than to explain a 409 afterwards.
 */
export function QuizForm({
  defaultValues,
  pathOptions = [],
  stageOptions = [],
  pathId = "",
  onPathChange,
  onStageChange,
  isLoadingStages = false,
  lessonOptions = [],
  isLoadingLessons = false,
  lockedStageLabel,
  canActivate = false,
  activationHint,
  onSubmit,
  isPending = false,
  errorMessage,
  submitLabel = "حفظ الاختبار",
}: QuizFormProps) {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<QuizCreateInput, unknown, QuizCreateValues>({
    resolver: standardSchemaResolver(quizCreateSchema),
    defaultValues: {
      stageId: "",
      title: "",
      description: "",
      passingScore: 70,
      duration: "",
      order: "",
      isFinal: false,
      active: false,
      lessonId: "",
      ...defaultValues,
    },
  });

  // `useWatch` rather than `watch()` — the latter returns a function, which
  // makes React Compiler skip memoising this whole component.
  const isFinal = useWatch({ control, name: "isFinal" });

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
                onValueChange={(value) => {
                  field.onChange(value);
                  // A lesson belongs to one stage, so a link chosen for the
                  // previous stage can only be wrong now.
                  setValue("lessonId", "", { shouldDirty: true });
                  onStageChange?.(value);
                }}
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
        label="عنوان الاختبار"
        required
        placeholder="مثال: اختبار المرحلة الأولى"
        error={errors.title?.message}
        {...register("title")}
      />

      <TextareaField
        id="description"
        label="الوصف"
        rows={3}
        placeholder="تعليمات الاختبار أو نبذة عمّا يقيسه"
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <TextField
          id="passingScore"
          label="درجة النجاح %"
          type="number"
          min={1}
          max={100}
          error={errors.passingScore?.message}
          {...register("passingScore")}
        />

        <TextField
          id="duration"
          label="مدة الاختبار"
          placeholder="مثال: 20 دقيقة"
          error={errors.duration?.message}
          {...register("duration")}
        />

        <TextField
          id="order"
          label="الترتيب"
          type="number"
          min={1}
          max={999}
          placeholder="تلقائي"
          hint="اتركه فارغًا للإضافة في النهاية."
          error={errors.order?.message}
          {...register("order")}
        />
      </div>

      <div className="space-y-3">
        <Controller
          control={control}
          name="isFinal"
          render={({ field }) => (
            <SwitchField
              id="isFinal"
              label="اختبار نهائي للمرحلة"
              hint="يُعقد في نهاية المرحلة ويخصّها كاملة. لا يمكن ربطه بدرس، وللمرحلة اختبار نهائي واحد فقط."
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                // The two attachments are mutually exclusive; drop the link
                // rather than let the Service reject the pair later.
                if (checked) setValue("lessonId", "", { shouldDirty: true });
              }}
            />
          )}
        />

        {isFinal ? null : (
          <Controller
            control={control}
            name="lessonId"
            render={({ field }) => (
              <SelectField
                id="lessonId"
                label="مرتبط بدرس"
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={[
                  { value: "", label: "بدون ربط" },
                  ...lessonOptions.map((lesson) => ({
                    value: lesson.id,
                    label: `${lesson.order}. ${lesson.title}`,
                  })),
                ]}
                // Base UI treats "" as "nothing selected" and falls back to the
                // placeholder, so the placeholder carries the real label.
                placeholder={
                  isLoadingLessons
                    ? "جارٍ التحميل…"
                    : lessonOptions.length === 0
                      ? "لا توجد دروس في هذه المرحلة"
                      : "بدون ربط"
                }
                hint="اختبار مرتبط بدرس يظهر مع ذلك الدرس. اتركه بدون ربط إن كان اختبارًا عامًا."
                error={errors.lessonId?.message}
              />
            )}
          />
        )}

        {canActivate ? (
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <SwitchField
                id="active"
                label="تفعيل الاختبار"
                hint={
                  activationHint ??
                  "الاختبار المفعّل يظهر للطلاب ويمكنهم دخوله."
                }
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
              />
            )}
          />
        ) : null}
      </div>

      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? <Loader2 className="animate-spin" /> : <Save />}
        {submitLabel}
      </Button>
    </form>
  );
}
