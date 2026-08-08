"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiRequest, type ApiRequestError } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import { ROUTES } from "@/constants/routes";
import type { PathDetail } from "@/types/path";
import type {
  PathCreateInput,
  PathUpdateInput,
} from "@/validation/path.schema";

/** A single path with its stages. */
export function usePath(pathId: string) {
  return useQuery({
    queryKey: queryKeys.paths.detail(pathId),
    queryFn: () =>
      apiRequest<PathDetail>({ url: `/paths/${pathId}`, method: "GET" }),
    enabled: Boolean(pathId),
  });
}

export function useCreatePath() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: PathCreateInput) =>
      apiRequest<PathDetail>({ url: "/paths", method: "POST", data: input }),
    onSuccess: (path) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paths.all });
      toast.success("تم إنشاء المسار بنجاح");
      router.push(`${ROUTES.admin.paths}/${path.id}`);
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

export function useUpdatePath(pathId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PathUpdateInput) =>
      apiRequest<PathDetail>({
        url: `/paths/${pathId}`,
        method: "PATCH",
        data: input,
      }),
    onSuccess: (path) => {
      // Seed the detail cache with the server's response so the page shows the
      // saved values immediately, then refresh the lists in the background.
      queryClient.setQueryData(queryKeys.paths.detail(pathId), path);
      queryClient.invalidateQueries({ queryKey: queryKeys.paths.lists() });
      toast.success("تم حفظ التعديلات");
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

/**
 * Deleting from the table should leave the admin where they are, with their
 * filters intact; deleting from a detail page has to navigate away, because the
 * record it was showing no longer exists. The caller decides via
 * `redirectToList`.
 */
export function useDeletePath({ redirectToList = false } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (pathId: string) =>
      apiRequest<{ id: string }>({ url: `/paths/${pathId}`, method: "DELETE" }),
    onSuccess: ({ id }) => {
      queryClient.removeQueries({ queryKey: queryKeys.paths.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.paths.lists() });
      toast.success("تم حذف المسار");

      if (redirectToList) {
        router.push(ROUTES.admin.paths);
      }
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
