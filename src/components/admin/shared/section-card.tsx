import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  /** Rendered in the header's end corner — a link, a filter, a menu. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Drop the inner padding — for tables that should bleed to the card edge. */
  flush?: boolean;
};

/**
 * A titled panel. The default container for any block of admin content that
 * needs a heading of its own, so every section on a page reads the same.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  flush = false,
}: SectionCardProps) {
  return (
    <Card data-slot="section-card" className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn(flush && "px-0")}>{children}</CardContent>
    </Card>
  );
}
