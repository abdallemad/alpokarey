"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

import { queryKeys } from "@/constants/query-keys";
import { USER_ROLE_LABELS } from "@/constants/user";
import { apiRequest, type ApiRequestError } from "@/lib/axios";
import type { Paginated } from "@/types/api";
import type { UserDetail, UserListItem, UsersQueryState } from "@/types/user";

/**
 * A filtered, paginated page of accounts.
 *
 * `keepPreviousData` keeps the rows on screen while the next page or a new
 * search loads, so the table never collapses to a skeleton mid-typing — the
 * same reason `usePaths` uses it.
 */
export function useUsers(query: UsersQueryState) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () =>
      apiRequest<Paginated<UserListItem>>({
        url: "/users",
        method: "GET",
        params: query,
      }),
    placeholderData: keepPreviousData,
  });
}

/**
 * One account, for the detail panel.
 *
 * Its own request rather than the row the table already holds, because the
 * panel shows things the list does not carry — the learner's enrolments, their
 * completed lessons, and the two flags that decide whether the role control is
 * offered (`isSelf`, `isAllowlistedAdmin`). Fetching them for every row of a
 * table nobody has opened would be paying for a panel that is usually closed.
 *
 * `enabled` is what makes that true: the query only runs once a row is picked.
 */
export function useUser(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId ?? ""),
    queryFn: () =>
      apiRequest<UserDetail>({ url: `/users/${userId}`, method: "GET" }),
    enabled: Boolean(userId),
  });
}

/**
 * Promote an account to مشرف, or return it to طالب.
 *
 * Not optimistic. The server refuses three cases the client cannot be sure
 * about — changing your own role, demoting the last administrator, and an
 * account that has since been deleted — and a badge that flips and then flips
 * back is a worse answer than one that waits half a second.
 *
 * On success it seeds the detail cache with the row the endpoint returned, so
 * the open panel updates without a second request, then invalidates
 * `users.all` so the table's role badge and the role filter behind it are
 * re-read.
 */
export function useUpdateUserRole(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: UserRole) =>
      apiRequest<UserDetail>({
        url: `/users/${userId}`,
        method: "PATCH",
        data: { role },
      }),

    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.users.detail(user.id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      toast.success(`تم تعيين الصلاحية: ${USER_ROLE_LABELS[user.role]}`);
    },

    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
