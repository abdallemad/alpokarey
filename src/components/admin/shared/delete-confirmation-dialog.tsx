"use client";

import { Loader2, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the record, quoted back so the admin sees what they are deleting. */
  entityName: string;
  description?: string;
  onConfirm: () => void;
  isPending?: boolean;
};

/**
 * The gate in front of every destructive admin action.
 *
 * Controlled rather than trigger-based, so the caller can open it from a
 * dropdown item that closes itself on click.
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  entityName,
  description,
  onConfirm,
  isPending = false,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>حذف «{entityName}»؟</AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              "سيتم حذف هذا العنصر وكل ما يتفرع عنه نهائيًا. لا يمكن التراجع عن هذا الإجراء."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            تأكيد الحذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
