import { GraduationCap, ShieldCheck } from "lucide-react";
import type { UserRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { USER_ROLE_CLASSES, USER_ROLE_LABELS } from "@/constants/user";
import { cn } from "@/lib/utils";

/**
 * What an account may do, as one badge.
 *
 * Its own component because it renders in three places — the table row, the
 * detail panel's header, and the confirmation dialog — and a permission shown
 * three different ways is three chances to read it wrong.
 */
export function UserRoleBadge({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  const Icon = role === "ADMIN" ? ShieldCheck : GraduationCap;

  return (
    <Badge
      className={cn("border-transparent", USER_ROLE_CLASSES[role], className)}
    >
      <Icon />
      {USER_ROLE_LABELS[role]}
    </Badge>
  );
}
