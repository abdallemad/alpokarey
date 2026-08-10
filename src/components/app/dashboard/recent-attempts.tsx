import { Award, CheckCircle2, XCircle } from "lucide-react";

import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentAttempt, StudentCertificate } from "@/types/student";
import { formatDate, formatNumber } from "@/utils/format";

/**
 * The learner's last few exam attempts.
 *
 * Each row carries the score **and** the passing score, because "70%" means
 * nothing without knowing whether 70 was enough. A failed attempt is stated
 * plainly rather than hidden — it is information the learner needs, and the
 * exam can be retaken.
 */
export function RecentAttempts({ attempts }: { attempts: StudentAttempt[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">آخر الاختبارات</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {attempts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="لا توجد محاولات بعد"
            description="ستظهر هنا نتائج اختباراتك فور دخولك أول اختبار."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border">
            {attempts.map((attempt) => (
              <li
                key={attempt.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span
                  className={
                    attempt.isPassed
                      ? "flex size-8 shrink-0 items-center justify-center rounded-md bg-success/10 text-success"
                      : "flex size-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive"
                  }
                >
                  {attempt.isPassed ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {attempt.quizTitle}
                    </p>
                    {attempt.isFinal ? (
                      <Badge className="border-transparent bg-gold/15 text-gold-foreground dark:text-gold">
                        نهائي
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {attempt.pathTitle} ▸ {attempt.stageTitle} ·{" "}
                    {formatDate(attempt.createdAt)}
                  </p>
                </div>

                <div className="text-end">
                  <p
                    className={
                      attempt.isPassed
                        ? "font-heading text-lg font-bold tabular-nums text-success"
                        : "font-heading text-lg font-bold tabular-nums text-destructive"
                    }
                  >
                    {formatNumber(attempt.score)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    النجاح {formatNumber(attempt.passingScore)}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Certificates earned, newest first. */
export function EarnedCertificates({
  certificates,
}: {
  certificates: StudentCertificate[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">شهاداتي</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="لا توجد شهادات بعد"
            description="أتمم مسارًا مفعّلة شهادته لتحصل على شهادة إتمام."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border">
            {certificates.map((certificate) => (
              <li
                key={certificate.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold-foreground dark:text-gold">
                  <Award className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {certificate.pathTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    مُنحت في {formatDate(certificate.issuedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
