"use client";

import { Award, Route } from "lucide-react";

import { UserRoleBadge } from "@/components/admin/users/user-role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserListItem } from "@/types/user";
import { formatDate, formatNumber } from "@/utils/format";
import { toDisplayName } from "@/utils/user";

/**
 * The accounts table.
 *
 * A whole row opens the detail panel — there is no row menu, because the panel
 * holds the only action this feature has and putting "تغيير الصلاحية" in a
 * dropdown would mean two ways to reach one control.
 *
 * Secondary columns shed as the viewport narrows (`admin-dashboard.md` §6), so
 * the identity, the role and nothing else survive on a phone. The identity cell
 * carries the avatar, the display name and the email together: an admin
 * searching for someone has one of the two, and the row has to be recognisable
 * by either.
 */
export function UsersTable({
  users,
  onSelect,
  selectedUserId,
}: {
  users: UserListItem[];
  onSelect: (userId: string) => void;
  selectedUserId: string | null;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الحساب</TableHead>
          <TableHead>الصلاحية</TableHead>
          <TableHead className="hidden lg:table-cell">المسارات</TableHead>
          <TableHead className="hidden lg:table-cell">الشهادات</TableHead>
          <TableHead className="hidden xl:table-cell">تاريخ الانضمام</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((user) => {
          const displayName = toDisplayName(user);

          return (
            <TableRow
              key={user.id}
              onClick={() => onSelect(user.id)}
              // `aria-selected` rather than a colour alone: the open row stays
              // identifiable when the panel covers half the screen.
              aria-selected={user.id === selectedUserId}
              className="cursor-pointer aria-selected:bg-muted/60"
            >
              <TableCell className="max-w-[22rem] whitespace-normal">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={user.imageUrl ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <UserRoleBadge role={user.role} />
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Route className="size-3.5" />
                  {formatNumber(user.enrollmentsCount)}
                </span>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Award className="size-3.5" />
                  {formatNumber(user.certificatesCount)}
                </span>
              </TableCell>

              <TableCell className="hidden text-muted-foreground xl:table-cell">
                {formatDate(user.createdAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
