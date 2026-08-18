"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROUTES } from "@/constants/routes";
import { useIssueCertificate } from "@/hooks/use-certificate";
import type { LearnCurriculum } from "@/types/learn";
import { toCertificateBlockReason } from "@/utils/certificate";

/**
 * "احصل على الشهادة" — the reward for finishing a path, in the player's header.
 *
 * It sits in the chrome rather than at the foot of the final lesson because a
 * learner does not know which lesson is the last one until they are past it,
 * and a button that appears once, on one screen, is a button most people will
 * never see. Here it is visible from the first lesson onwards — dimmed, with
 * the reason attached — so finishing the path has a destination the whole way
 * through.
 *
 * Four states, in the order a learner meets them:
 *
 * 1. **Absent** — the admin never activated certification for this path, so
 *    there is no certificate to earn and a permanently dead button would be
 *    noise in every header of every path.
 * 2. **Disabled, with a reason** — lessons still outstanding. The tooltip is
 *    the same sentence the endpoint would return, from
 *    `toCertificateBlockReason`, so the two can never disagree.
 * 3. **Enabled** — every lesson complete. Pressing it issues the certificate
 *    and goes to it.
 * 4. **"عرض الشهادة"** — already earned; the button becomes a link to the
 *    certificate rather than an offer to issue a second one.
 *
 * The verdict is the server's, taken from the curriculum payload. This
 * component decides what the button *looks* like; it never decides whether a
 * certificate may be issued — `certificateService.issue` re-checks everything
 * from the database before writing a row.
 */
export function PathCertificateButton({
  curriculum,
}: {
  curriculum: LearnCurriculum;
}) {
  const router = useRouter();
  const { certificate, path } = curriculum;
  const issue = useIssueCertificate(path.id);

  const handleIssue = () => {
    issue.mutate(undefined, {
      onSuccess: (issued) => {
        toast.success("تهانينا! تم إصدار شهادتك.");
        router.push(ROUTES.app.certificate(issued.id));
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // Nothing to earn on this path, and nothing to explain.
  if (!certificate.isCertificationActivated) return null;

  if (certificate.certificateId) {
    return (
      <Button
        size="sm"
        variant="outline"
        nativeButton={false}
        className="border-gold/50 text-gold-foreground dark:text-gold"
        render={
          <Link href={ROUTES.app.certificate(certificate.certificateId)} />
        }
      >
        <Award />
        <span className="hidden sm:inline">عرض الشهادة</span>
      </Button>
    );
  }

  if (!certificate.canIssue) {
    return (
      <Tooltip>
        {/* The trigger is the wrapper, not the button: a disabled button gets
            `pointer-events-none`, so hovering it would never open a tooltip —
            and the reason it is disabled is the only thing worth saying. */}
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button size="sm" variant="outline" disabled>
            <Award />
            <span className="hidden sm:inline">احصل على الشهادة</span>
          </Button>
        </TooltipTrigger>

        <TooltipContent side="bottom">
          {toCertificateBlockReason(certificate) ??
            "لا يمكن إصدار الشهادة حاليًا."}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleIssue}
      disabled={issue.isPending}
      className="bg-gold text-gold-foreground hover:bg-gold/85"
    >
      {issue.isPending ? <Loader2 className="animate-spin" /> : <Award />}
      <span className="hidden sm:inline">احصل على الشهادة</span>
    </Button>
  );
}
