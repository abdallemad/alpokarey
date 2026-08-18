import type { Metadata } from "next";

import { CertificateDetailView } from "@/components/app/dashboard/certificate-detail-view";
import { PageContainer } from "@/components/shared";

export const metadata: Metadata = { title: "الشهادة" };

/**
 * `/dashboard/certificates/[certificateId]` — one issued certificate.
 *
 * The destination the player redirects to the moment a certificate is granted,
 * and the target of every row in the certificates list.
 *
 * A thin Server Component like the rest of the section: the document is fetched
 * client-side, because `useIssueCertificate` has usually already put the exact
 * payload in the React Query cache and the page can render with no request at
 * all. See `docs/certificates-feature.md`.
 *
 * The title stays generic — "الشهادة" rather than the path's name — because
 * naming it would mean a database read in `generateMetadata` for a tab label,
 * on a page whose body is client-fetched anyway.
 */
export default async function CertificateDetailPage({
  params,
}: PageProps<"/dashboard/certificates/[certificateId]">) {
  const { certificateId } = await params;

  return (
    <PageContainer>
      <CertificateDetailView certificateId={certificateId} />
    </PageContainer>
  );
}
