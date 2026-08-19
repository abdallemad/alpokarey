"use client";

import * as React from "react";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Info,
  Loader2,
  Route,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

import { UserRoleBadge } from "@/components/admin/users/user-role-badge";
import { ApiErrorState } from "@/components/admin/shared";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_PATHS_LIMIT, USER_ROLE_LABELS } from "@/constants/user";
import { useUpdateUserRole, useUser } from "@/hooks/use-users";
import type { UserDetail } from "@/types/user";
import { formatDate, formatNumber } from "@/utils/format";
import { toDisplayName } from "@/utils/user";

/**
 * One account, opened from the table.
 *
 * ### Why a sheet rather than a page
 *
 * Reviewing accounts is a scanning job: an admin opens three in a row looking
 * for the one they mean. A detail *page* would cost a navigation each way and
 * lose the table's scroll position and filters every time. The sheet keeps the
 * list underneath, and the row it came from stays marked.
 *
 * It slides from `side="left"` — physical left is the **end** edge in RTL, so
 * it opens away from the navigation rather than over it. The same reasoning
 * `marketing-mobile-nav.tsx` records for the public drawer.
 *
 * ### Controlled by the id, not by a boolean
 *
 * The caller owns `userId`; `null` closes the sheet. That is what lets one
 * mounted sheet serve every row — and it means `useUser` fetches only once a
 * row is actually picked, rather than for every row of a table.
 */
export function UserDetailSheet({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { data, isPending, isError, error, refetch } = useUser(userId);

  return (
    <Sheet
      open={userId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="left"
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="text-start">تفاصيل الحساب</SheetTitle>
          <SheetDescription className="text-start">
            بيانات الحساب ونشاطه، وصلاحيته في المنصة.
          </SheetDescription>
        </SheetHeader>

        {isPending && userId ? (
          <UserDetailSkeleton />
        ) : isError ? (
          <div className="p-4">
            <ApiErrorState
              error={error}
              title="تعذّر تحميل بيانات الحساب"
              onRetry={() => refetch()}
            />
          </div>
        ) : data ? (
          <UserDetailBody user={data} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function UserDetailBody({ user }: { user: UserDetail }) {
  const displayName = toDisplayName(user);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-12">
          <AvatarImage src={user.imageUrl ?? undefined} alt={displayName} />
          <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1.5">
          <p className="font-heading text-base font-bold">{displayName}</p>
          <p className="text-xs break-all text-muted-foreground">
            {user.email}
          </p>
          <UserRoleBadge role={user.role} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <Stat icon={Route} label="المسارات" value={user.enrollmentsCount} />
        <Stat
          icon={BookOpen}
          label="دروس مكتملة"
          value={user.completedLessonsCount}
        />
        <Stat
          icon={ClipboardCheck}
          label="محاولات الاختبارات"
          value={user.quizAttemptsCount}
        />
        <Stat icon={Award} label="الشهادات" value={user.certificatesCount} />
      </dl>

      <p className="text-xs text-muted-foreground">
        انضم في {formatDate(user.createdAt)} · آخر تحديث للبيانات{" "}
        {formatDate(user.updatedAt)}
      </p>

      <Separator />

      <section className="space-y-3">
        <h3 className="font-heading text-sm font-bold">المسارات المسجَّلة</h3>

        {user.paths.length > 0 ? (
          <>
            <ul className="space-y-3">
              {user.paths.map((path) => (
                <li key={path.id} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{path.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatNumber(path.progress)}%
                    </span>
                  </div>
                  <Progress value={path.progress} />
                  <p className="text-xs text-muted-foreground">
                    سُجِّل في {formatDate(path.enrolledAt)}
                    {path.isCompleted ? " · مكتمل" : null}
                  </p>
                </li>
              ))}
            </ul>

            {/* The list is capped; the count above it is not. Saying so stops
                an admin reading "8 paths" off a panel of a learner with more. */}
            {user.enrollmentsCount > USER_PATHS_LIMIT ? (
              <p className="text-xs text-muted-foreground">
                تُعرض أحدث {formatNumber(USER_PATHS_LIMIT)} مسارات من أصل{" "}
                {formatNumber(user.enrollmentsCount)}.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            لم يسجّل هذا الحساب في أي مسار بعد.
          </p>
        )}
      </section>

      <Separator />

      <RoleControl user={user} />
    </div>
  );
}

/**
 * The one write in the feature.
 *
 * A single button that flips the role, behind a confirmation — rather than a
 * select that applies on change. Promoting someone hands them the whole
 * console, and a permission change made by brushing past a dropdown is the kind
 * of accident that is discovered later. `design-system.md` §8.6 puts consequential
 * actions behind `AlertDialog`, and this is one.
 *
 * Two cases disable it, and each says why rather than showing a dead control:
 *
 * - **Your own account.** An admin who demotes themselves cannot undo it.
 * - **The last administrator.** The server refuses; the button says so first.
 *   The client counts nothing — `isSelf` comes from the server, and the
 *   last-admin refusal arrives as a 409 with its own Arabic message.
 */
function RoleControl({ user }: { user: UserDetail }) {
  const [isConfirming, setConfirming] = React.useState(false);
  const updateRole = useUpdateUserRole(user.id);

  const nextRole: UserRole = user.role === "ADMIN" ? "STUDENT" : "ADMIN";
  const isPromotion = nextRole === "ADMIN";

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-heading text-sm font-bold">الصلاحية</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          المشرف يملك الوصول الكامل إلى لوحة التحكم: المسارات والمراحل والدروس
          والاختبارات والحسابات.
        </p>
      </div>

      {user.isSelf ? (
        <Note>
          هذا حسابك. لا يمكنك تغيير صلاحيتك بنفسك — اطلب ذلك من مشرفٍ آخر.
        </Note>
      ) : null}

      {/* The allowlist outranks this button on the next sign-in, so an admin
          demoting such an account needs to know before they press it, not
          after it silently reverts. */}
      {user.isAllowlistedAdmin ? (
        <Note>
          بريد هذا الحساب مُدرج ضمن <code>ADMIN_EMAILS</code>، لذا سيعود مشرفًا
          تلقائيًا عند تسجيل الدخول التالي حتى لو حوّلته إلى طالب.
        </Note>
      ) : null}

      <Button
        variant={isPromotion ? "default" : "destructive"}
        className="w-full"
        disabled={user.isSelf || updateRole.isPending}
        onClick={() => setConfirming(true)}
      >
        {updateRole.isPending ? (
          <Loader2 className="animate-spin" />
        ) : isPromotion ? (
          <ShieldCheck />
        ) : (
          <ShieldOff />
        )}
        {isPromotion ? "ترقية إلى مشرف" : "تحويل إلى طالب"}
      </Button>

      <AlertDialog open={isConfirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia
              className={
                isPromotion
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }
            >
              {isPromotion ? <ShieldCheck /> : <ShieldOff />}
            </AlertDialogMedia>

            <AlertDialogTitle>
              {isPromotion
                ? `ترقية «${toDisplayName(user)}» إلى مشرف؟`
                : `تحويل «${toDisplayName(user)}» إلى طالب؟`}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {isPromotion
                ? "سيحصل هذا الحساب على صلاحية كاملة في لوحة التحكم، بما فيها إدارة الحسابات وصلاحياتها."
                : "سيفقد هذا الحساب الوصول إلى لوحة التحكم، ويبقى طالبًا عاديًا بكل تسجيلاته وتقدّمه."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateRole.isPending}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              variant={isPromotion ? "default" : "destructive"}
              disabled={updateRole.isPending}
              onClick={() =>
                updateRole.mutate(nextRole, {
                  onSuccess: () => setConfirming(false),
                })
              }
            >
              {updateRole.isPending ? (
                <Loader2 className="animate-spin" />
              ) : null}
              تأكيد — {USER_ROLE_LABELS[nextRole]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-1 font-heading text-lg font-bold tabular-nums">
        {formatNumber(value)}
      </dd>
    </div>
  );
}

/** Mirrors the body's shape so the panel does not reflow when it arrives. */
function UserDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-3 w-56" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}
