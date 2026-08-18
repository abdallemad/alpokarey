"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { apiRequest } from "@/lib/axios";
import type { CertificateDetail } from "@/types/certificate";

/**
 * One certificate the signed-in learner holds.
 *
 * Read straight from `/api/me/certificates/:id` rather than picked out of the
 * dashboard payload: the dashboard carries a list of certificates, but not the
 * curriculum figures the document prints, and this page can be opened directly
 * from a link with no dashboard visit behind it.
 */
export function useCertificate(certificateId: string) {
  return useQuery({
    queryKey: queryKeys.student.certificate(certificateId),
    queryFn: () =>
      apiRequest<CertificateDetail>({
        url: `/me/certificates/${certificateId}`,
        method: "GET",
      }),
    enabled: Boolean(certificateId),
  });
}

/**
 * Claim the certificate for a finished path.
 *
 * On success it seeds the detail cache with the certificate the endpoint just
 * returned, so the redirect to `/dashboard/certificates/:id` lands on a page
 * that is already populated — the learner presses a button and sees their
 * certificate, with no second spinner in between.
 *
 * Then it invalidates two things:
 *
 * - **`student.all`** — the dashboard's certificate count and the certificates
 *   list are both wrong the instant this succeeds.
 * - **`learn.path(pathId)`** — the curriculum carries the eligibility verdict
 *   that drove the button, so it has to be re-read or the button would still
 *   offer to issue a certificate that now exists.
 */
export function useIssueCertificate(pathId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<CertificateDetail>({
        url: "/me/certificates",
        method: "POST",
        data: { pathId },
      }),
    onSuccess: (certificate) => {
      queryClient.setQueryData(
        queryKeys.student.certificate(certificate.id),
        certificate,
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.student.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learn.path(pathId),
      });
    },
  });
}
