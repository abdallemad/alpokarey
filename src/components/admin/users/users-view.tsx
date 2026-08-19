"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchX, Users } from "lucide-react";

import {
  ApiErrorState,
  DataPagination,
  DataTableSkeleton,
  EmptyState,
  PageHeader,
  SearchInput,
} from "@/components/admin/shared";
import { UserDetailSheet } from "@/components/admin/users/user-detail-sheet";
import { UsersTable } from "@/components/admin/users/users-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  USERS_PAGE_SIZE,
  USER_ROLE_LABELS,
  USER_SORT_LABELS,
} from "@/constants/user";
import { useUsers } from "@/hooks/use-users";
import type { UsersQueryState } from "@/types/user";
import { USER_ROLES, USER_SORT_OPTIONS } from "@/validation/user.schema";

const ROLE_ITEMS = { all: "كل الصلاحيات", ...USER_ROLE_LABELS };

/**
 * The `/admin/users` screen.
 *
 * Read-and-one-write, deliberately: accounts arrive from Clerk on sign-in
 * (`docs/admin-access-control.md` §2), so there is no "new user" button and no
 * delete. The only thing the console owns is the role, and it lives in the
 * detail panel.
 *
 * Filter state lives in the URL, exactly as on `/admin/paths`: refreshing keeps
 * the view, the back button steps through filters, and React Query caches each
 * combination independently.
 *
 * **The open account is a URL parameter too** (`?user=<id>`). A panel held in
 * component state disappears on refresh and cannot be linked; keeping it in the
 * query string means an admin can send a colleague the exact account they are
 * looking at. It is stripped from the URL when the sheet closes.
 *
 * Because it reads `useSearchParams`, the page wraps it in `<Suspense>`.
 */
export function UsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query: UsersQueryState = {
    search: searchParams.get("search") ?? "",
    role: searchParams.get("role") ?? "all",
    sort: searchParams.get("sort") ?? "newest",
    page: Number(searchParams.get("page")) || 1,
    pageSize: USERS_PAGE_SIZE,
  };

  const selectedUserId = searchParams.get("user");

  const { data, isPending, isFetching, isError, error, refetch } =
    useUsers(query);

  const setParams = React.useCallback(
    (updates: Record<string, string | number | null>) => {
      const next = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        // Defaults are omitted so the URL stays short and readable.
        if (value === null || value === "" || value === "all") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      router.replace(next.size > 0 ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  /** Any filter change invalidates the current page number. */
  const setFilter = (key: string, value: string) =>
    setParams({ [key]: value, page: null });

  const hasActiveFilters = query.search !== "" || query.role !== "all";

  return (
    <>
      <PageHeader
        title="المستخدمون"
        description="حسابات الطلاب والمشرفين المتزامنة مع Clerk. افتح أي حساب لعرض نشاطه وتغيير صلاحيته."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query.search}
              onValueChange={(value) => setFilter("search", value)}
              placeholder="ابحث بالاسم أو البريد…"
              className="lg:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
              <Select
                items={ROLE_ITEMS}
                value={query.role}
                onValueChange={(value) => setFilter("role", value as string)}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الصلاحيات</SelectItem>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={USER_SORT_LABELS}
                value={query.sort}
                onValueChange={(value) => setFilter("sort", value as string)}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {USER_SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {isPending ? (
            <DataTableSkeleton columns={4} rows={USERS_PAGE_SIZE} />
          ) : isError ? (
            <ApiErrorState
              error={error}
              title="تعذّر تحميل الحسابات"
              onRetry={() => refetch()}
            />
          ) : data.items.length === 0 ? (
            hasActiveFilters ? (
              // Two different nothings: no match is a filter the admin can
              // undo, an empty table would mean nobody has ever signed in.
              <EmptyState
                icon={SearchX}
                title="لا توجد حسابات مطابقة"
                description="جرّب تعديل كلمات البحث أو إزالة عامل تصفية الصلاحية."
                action={
                  <Button
                    variant="outline"
                    onClick={() =>
                      setParams({ search: null, role: null, page: null })
                    }
                  >
                    إزالة عوامل التصفية
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Users}
                title="لا توجد حسابات بعد"
                description="تُنشأ الحسابات في Clerk وتُزامَن هنا عند أول تسجيل دخول."
              />
            )
          ) : (
            <>
              <UsersTable
                users={data.items}
                selectedUserId={selectedUserId}
                onSelect={(userId) => setParams({ user: userId })}
              />
              <DataPagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                isLoading={isFetching}
                itemLabel="حساب"
                onPageChange={(page) => setParams({ page })}
              />
            </>
          )}
        </CardContent>
      </Card>

      <UserDetailSheet
        userId={selectedUserId}
        onClose={() => setParams({ user: null })}
      />
    </>
  );
}
