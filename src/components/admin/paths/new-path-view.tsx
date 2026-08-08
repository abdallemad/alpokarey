"use client";

import { PageHeader, SectionCard } from "@/components/admin/shared";
import { PathForm } from "@/forms/path-form";
import { useCreatePath } from "@/hooks/use-path";

/**
 * `/admin/paths/new`.
 *
 * A new path always starts as a draft — the Service refuses to publish one
 * that has no stages yet — so the form's status field is left at its default
 * and the admin publishes from the detail page once stages exist.
 */
export function NewPathView() {
  const createPath = useCreatePath();

  return (
    <>
      <PageHeader
        title="مسار جديد"
        description="أنشئ المسار كمسودة، ثم أضف إليه المراحل والدروس قبل نشره."
      />

      <SectionCard
        title="بيانات المسار"
        description="الحقول المعلّمة بعلامة * مطلوبة."
      >
        <PathForm
          onSubmit={(values) => createPath.mutate(values)}
          isPending={createPath.isPending}
          submitLabel="إنشاء المسار"
        />
      </SectionCard>
    </>
  );
}
