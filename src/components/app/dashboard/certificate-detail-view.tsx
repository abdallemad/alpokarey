"use client";

import Link from "next/link";
import { Award, BookOpen, Layers, Printer, Route } from "lucide-react";

import { ApiErrorState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PATH_CATEGORY_CLASSES, PATH_CATEGORY_LABELS } from "@/constants/path";
import { ROUTES } from "@/constants/routes";
import { useCertificate } from "@/hooks/use-certificate";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/utils/format";

/**
 * `/dashboard/certificates/[certificateId]` — one certificate, as a document.
 *
 * This is where the player sends a learner the moment their certificate is
 * issued, so it is the first thing they see after finishing a path. It is laid
 * out as a certificate rather than as a detail record — a framed panel, the
 * academy above, the recipient's name large in the heading face, what they
 * completed beneath it — because the reward for months of study should not
 * look like a table row.
 *
 * `--gold` throughout: `docs/design-system.md` §2.2 reserves that token for
 * achievement, and nothing in the product has a better claim to it.
 *
 * Usually renders without a request. `useIssueCertificate` seeds this exact
 * cache entry with what the endpoint returned, so arriving from the button is
 * instant; arriving from a link or a bookmark fetches normally.
 */
export function CertificateDetailView({
  certificateId,
}: {
  certificateId: string;
}) {
  const { data, isPending, isError, error, refetch } =
    useCertificate(certificateId);

  if (isPending) {
    return <CertificateDetailSkeleton />;
  }

  if (isError) {
    return (
      <ApiErrorState
        error={error}
        title="تعذّر تحميل الشهادة"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden on paper: a printed certificate should carry the document and
          nothing else. */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ROUTES.app.certificates} />}
        >
          <Award />
          شهاداتي
        </Button>

        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ROUTES.app.learn(data.path.id)} />}
        >
          <Route />
          العودة إلى المسار
        </Button>

        <Button
          variant="outline"
          className="ms-auto"
          onClick={() => window.print()}
        >
          <Printer />
          طباعة
        </Button>
      </div>

      <Card className="overflow-hidden border-gold/40 bg-gradient-to-b from-gold/10 to-transparent">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="flex size-16 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Award className="size-8" />
          </div>

          <div className="space-y-1">
            <p className="font-heading text-sm font-bold text-muted-foreground">
              أكاديمية الإمام البخاري
            </p>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              شهادة إتمام
            </h1>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">تُمنح هذه الشهادة إلى</p>
            <p className="font-heading text-2xl font-bold text-gold-foreground sm:text-3xl dark:text-gold">
              {data.recipientName}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              لإتمامه بنجاح جميع دروس مسار
            </p>
            <p className="font-heading text-lg font-bold sm:text-xl">
              {data.path.title}
            </p>

            {data.path.category ? (
              <Badge
                className={cn(
                  "border-transparent",
                  PATH_CATEGORY_CLASSES[data.path.category],
                )}
              >
                {PATH_CATEGORY_LABELS[data.path.category]}
              </Badge>
            ) : null}
          </div>

          <dl className="grid w-full max-w-md grid-cols-1 gap-3 border-t border-gold/25 pt-6 sm:grid-cols-3">
            <CertificateFact
              icon={Layers}
              label="المراحل"
              value={`${formatNumber(data.stagesCount)}`}
            />
            <CertificateFact
              icon={BookOpen}
              label="الدروس"
              value={`${formatNumber(data.lessonsCount)}`}
            />
            <CertificateFact
              icon={Award}
              label="تاريخ المنح"
              value={formatDate(data.issuedAt)}
            />
          </dl>

          {/* The id is what makes the document checkable by someone who was not
              there when it was issued. Latin digits and a monospace face so it
              can be read aloud or typed without ambiguity. */}
          <p className="font-mono text-[0.7rem] text-muted-foreground">
            {data.id}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CertificateFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Award;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function CertificateDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-14">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-6 w-56 max-w-full" />
          <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
