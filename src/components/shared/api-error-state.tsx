"use client";

import Link from "next/link";
import { LogIn, ShieldOff } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/axios";

type ApiErrorStateProps = {
  error: unknown;
  /** Generic-failure heading, e.g. "تعذّر تحميل المسارات". */
  title: string;
  onRetry?: () => void;
};

/**
 * Renders the right thing for a failed API call.
 *
 * A 401 or a 403 is not a malfunction — retrying will fail identically — so
 * those get an explanation and a route forward instead of an error box with a
 * retry button that cannot work.
 */
export function ApiErrorState({ error, title, onRetry }: ApiErrorStateProps) {
  const status = error instanceof ApiRequestError ? error.status : 0;
  const message =
    error instanceof Error ? error.message : "حدث خطأ غير متوقع";

  if (status === 401) {
    return (
      <EmptyState
        icon={LogIn}
        title="يجب تسجيل الدخول"
        // Neutral wording on purpose: this component is shared, and a learner
        // hitting a 401 on their own dashboard should not be told to find an
        // admin account. The 403 branch below stays admin-specific because
        // only admin endpoints ever return it.
        description="انتهت جلستك أو لم تسجّل الدخول بعد. سجّل الدخول للمتابعة."
        action={
          <Button nativeButton={false} render={<Link href="/sign-in" />}>
            <LogIn />
            تسجيل الدخول
          </Button>
        }
      />
    );
  }

  if (status === 403) {
    return (
      <EmptyState
        icon={ShieldOff}
        title="لا تملك صلاحية الوصول"
        description="هذا القسم مخصص للمشرفين. حسابك الحالي مسجّل كطالب، لذا لا يمكن عرض بيانات لوحة التحكم أو تعديلها."
      />
    );
  }

  return <ErrorState title={title} description={message} onRetry={onRetry} />;
}
