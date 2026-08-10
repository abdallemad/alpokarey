import { Award, BookOpen, CheckCircle2, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { StudentStats } from "@/types/student";
import { formatNumber } from "@/utils/format";

/**
 * The four figures at the top of the learner's dashboard.
 *
 * Each one answers a question a learner actually asks: how much am I doing,
 * how far along am I, what have I finished, what have I earned. The overall
 * progress card carries a bar because a percentage alone reads as an abstract
 * number, while a bar reads as a distance.
 */
export function StudentStatCards({ stats }: { stats: StudentStats }) {
  const cards = [
    {
      label: "مساراتي",
      value: formatNumber(stats.enrolledCount),
      hint:
        stats.inProgressCount > 0
          ? `${formatNumber(stats.inProgressCount)} قيد الدراسة`
          : "لم تبدأ بعد",
      icon: BookOpen,
    },
    {
      label: "التقدّم الكلي",
      value: `${formatNumber(stats.overallProgress)}%`,
      hint: `${formatNumber(stats.completedLessonsCount)} من ${formatNumber(stats.totalLessonsCount)} درس`,
      icon: TrendingUp,
      progress: stats.overallProgress,
    },
    {
      label: "مسارات مكتملة",
      value: formatNumber(stats.completedCount),
      hint: "أتممت جميع دروسها",
      icon: CheckCircle2,
    },
    {
      label: "شهاداتي",
      value: formatNumber(stats.certificatesCount),
      hint: "شهادات ممنوحة",
      icon: Award,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <card.icon className="size-4" />
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-heading text-2xl font-bold tabular-nums">
              {card.value}
            </p>

            {/* `Progress` renders its own track and indicator — it takes only
                a value. */}
            {card.progress === undefined ? null : (
              <Progress value={card.progress} />
            )}

            <p className="text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
