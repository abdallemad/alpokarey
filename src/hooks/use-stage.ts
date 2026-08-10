"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiRequest, type ApiRequestError } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import type { StageListItem } from "@/types/stage";
import type {
  StageCreateInput,
  StageUpdateInput,
} from "@/validation/stage.schema";

/**
 * Mutations for a single stage.
 *
 * Every one of them invalidates the **paths** cache as well as the stages
 * cache: a path row carries `stagesCount` and a path detail page lists its
 * stages, so both go stale the moment a stage is added, renamed or removed.
 *
 * None of them navigate. All three are driven from dialogs on the list screen,
 * and the point of a dialog is that the admin keeps their filters, their page
 * and their scroll position.
 */

function useStageMutationSuccess() {
  const queryClient = useQueryClient();

  return (message: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stages.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.paths.all });
    toast.success(message);
  };
}

export function useCreateStage() {
  const onSuccess = useStageMutationSuccess();

  return useMutation({
    mutationFn: (input: StageCreateInput) =>
      apiRequest<StageListItem>({ url: "/stages", method: "POST", data: input }),
    onSuccess: () => onSuccess("تم إنشاء المرحلة بنجاح"),
    // 409s (a taken order) and 422s carry an Arabic message from the server,
    // so the dialog can surface `error.message` verbatim.
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

export function useUpdateStage(stageId: string) {
  const onSuccess = useStageMutationSuccess();

  return useMutation({
    mutationFn: (input: StageUpdateInput) =>
      apiRequest<StageListItem>({
        url: `/stages/${stageId}`,
        method: "PATCH",
        data: input,
      }),
    onSuccess: () => onSuccess("تم حفظ التعديلات"),
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

export function useDeleteStage() {
  const onSuccess = useStageMutationSuccess();

  return useMutation({
    mutationFn: (stageId: string) =>
      apiRequest<{ id: string }>({
        url: `/stages/${stageId}`,
        method: "DELETE",
      }),
    onSuccess: () => onSuccess("تم حذف المرحلة"),
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
