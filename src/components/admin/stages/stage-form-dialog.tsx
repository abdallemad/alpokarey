"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StageForm } from "@/forms/stage-form";
import type { PathOption } from "@/hooks/use-paths";
import { useCreateStage, useUpdateStage } from "@/hooks/use-stage";
import type { StageListItem } from "@/types/stage";

type StageFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing when a stage is supplied; creating otherwise. */
  stage?: StageListItem;
  /** Pre-selected parent when creating from a path's group heading. */
  defaultPathId?: string;
  pathOptions: PathOption[];
};

/**
 * Create and edit a stage without leaving the list.
 *
 * A stage is three fields — parent, title, position — so a dedicated page
 * would cost a navigation, a re-fetch and the admin's place in a filtered,
 * grouped list to edit one line of text. The dialog keeps all of that intact.
 *
 * Create and edit are separate inner components because each owns a different
 * mutation hook, and hooks cannot be called conditionally.
 */
export function StageFormDialog({
  open,
  onOpenChange,
  stage,
  defaultPathId,
  pathOptions,
}: StageFormDialogProps) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{stage ? "تعديل المرحلة" : "مرحلة جديدة"}</DialogTitle>
          <DialogDescription>
            {stage
              ? "عدّل عنوان المرحلة أو موضعها داخل المسار."
              : "المرحلة وحدة تعليمية داخل مسار، وتضم دروسًا واختبارات."}
          </DialogDescription>
        </DialogHeader>

        {stage ? (
          // Remounting on id change resets the fields when the admin opens the
          // dialog for a different stage.
          <EditStageForm key={stage.id} stage={stage} onDone={close} />
        ) : (
          <CreateStageForm
            key={defaultPathId ?? "new"}
            defaultPathId={defaultPathId}
            pathOptions={pathOptions}
            onDone={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CancelButton({ disabled }: { disabled: boolean }) {
  return (
    <DialogClose
      disabled={disabled}
      render={<Button type="button" variant="outline" />}
    >
      إلغاء
    </DialogClose>
  );
}

function CreateStageForm({
  defaultPathId,
  pathOptions,
  onDone,
}: {
  defaultPathId?: string;
  pathOptions: PathOption[];
  onDone: () => void;
}) {
  const createStage = useCreateStage();

  return (
    <StageForm
      pathOptions={pathOptions}
      defaultValues={{ pathId: defaultPathId ?? "" }}
      isPending={createStage.isPending}
      errorMessage={createStage.error?.message}
      submitLabel="إنشاء المرحلة"
      secondaryAction={<CancelButton disabled={createStage.isPending} />}
      onSubmit={(values) => createStage.mutate(values, { onSuccess: onDone })}
    />
  );
}

function EditStageForm({
  stage,
  onDone,
}: {
  stage: StageListItem;
  onDone: () => void;
}) {
  const updateStage = useUpdateStage(stage.id);

  return (
    <StageForm
      pathOptions={[]}
      lockedPathLabel={stage.path.title}
      defaultValues={{
        pathId: stage.path.id,
        title: stage.title,
        // A string keeps react-hook-form's dirty check comparing like with
        // like against what the number input reports back.
        order: String(stage.order),
      }}
      isPending={updateStage.isPending}
      errorMessage={updateStage.error?.message}
      submitLabel="حفظ التعديلات"
      secondaryAction={<CancelButton disabled={updateStage.isPending} />}
      onSubmit={({ title, order }) =>
        // `pathId` is intentionally dropped: the PATCH contract does not accept
        // it, because moving a stage is a migration rather than an edit.
        updateStage.mutate({ title, order }, { onSuccess: onDone })
      }
    />
  );
}
