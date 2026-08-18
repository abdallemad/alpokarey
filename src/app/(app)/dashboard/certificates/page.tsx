import type { Metadata } from "next";

import { StudentCertificatesView } from "@/components/app/dashboard/student-certificates-view";
import { PageContainer } from "@/components/shared";

export const metadata: Metadata = { title: "شهاداتي" };

/**
 * `/dashboard/certificates` — the learner's certificates.
 *
 * Reads the same `/api/me/dashboard` payload the dashboard does rather than
 * adding an endpoint: the certificate list is already in it, React Query has
 * it cached from the dashboard visit, and one source means the two screens can
 * never disagree about how many the learner has.
 */
export default function StudentCertificatesPage() {
  return (
    <PageContainer>
      <StudentCertificatesView />
    </PageContainer>
  );
}
