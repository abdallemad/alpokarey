"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { LearnQuestion } from "@/types/learn";
import { formatNumber } from "@/utils/format";

/**
 * One question, with its options.
 *
 * Each option is a full-width label wrapping its radio, so the whole row is the
 * hit target rather than the 16px circle — the difference between an exam that
 * is comfortable on a phone and one that is not.
 */
export function QuizQuestionCard({
  question,
  index,
  total,
  selectedOptionId,
  onSelect,
}: {
  question: LearnQuestion;
  index: number;
  total: number;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs text-muted-foreground">
          السؤال {formatNumber(index + 1)} من {formatNumber(total)}
        </p>
        <CardTitle className="text-base leading-8">{question.text}</CardTitle>
      </CardHeader>

      <CardContent>
        {question.options.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            لا توجد خيارات لهذا السؤال بعد.
          </p>
        ) : (
          <RadioGroup
            value={selectedOptionId ?? ""}
            onValueChange={(value) => onSelect(String(value))}
            aria-label={question.text}
          >
            {question.options.map((option) => {
              const isSelected = option.id === selectedOptionId;

              return (
                <Label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <RadioGroupItem value={option.id} />
                  <span className="min-w-0 flex-1">{option.text}</span>
                </Label>
              );
            })}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
