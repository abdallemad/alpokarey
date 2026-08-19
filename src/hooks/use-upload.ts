"use client";

import { useMutation } from "@tanstack/react-query";

import { apiRequest, type ApiRequestError } from "@/lib/axios";
import type { UploadedFile } from "@/types/upload";

/**
 * Putting bytes into storage.
 *
 * `POST /api/uploads` is deliberately generic — it knows nothing about lessons
 * or paths — so this is the one place in the client that knows how to talk to
 * it. Two callers today: a lesson's attachments, and a path's cover image.
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<UploadedFile>({
    url: "/uploads",
    method: "POST",
    data: formData,
    // The shared client defaults to `application/json`, and axios turns a
    // FormData body into JSON when it sees that content type. Clearing the
    // header lets the browser set `multipart/form-data` with its boundary.
    headers: { "Content-Type": null },
  });
}

/**
 * The upload as a mutation, for a field that has to show progress.
 *
 * No cache invalidation and no toast: an upload on its own changes nothing a
 * query is holding — the record that will point at the object has not been
 * saved yet. Whoever owns the form decides what the returned URL means, and
 * `useAddAttachment` still chains the raw `uploadFile` because there the upload
 * is the first half of one action rather than an action of its own.
 */
export function useUploadFile(options?: {
  onSuccess?: (uploaded: UploadedFile) => void;
  onError?: (error: ApiRequestError) => void;
}) {
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
