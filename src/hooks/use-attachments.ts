"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiRequest, type ApiRequestError } from "@/lib/axios";
import { queryKeys } from "@/constants/query-keys";
import type { LessonAttachment, UploadedFile } from "@/types/lesson";

/**
 * What the attachment form hands over: either a file to upload or a note to
 * store inline. The two are separate shapes rather than one with optional
 * fields, so an impossible combination cannot be constructed.
 */
export type AttachmentDraft =
  | { type: "TEXT"; name: string; content: string }
  | { type: "FILE"; name: string; file: File };

/**
 * Uploads the bytes, then records the attachment.
 *
 * Two requests, one action. `POST /api/uploads` knows nothing about lessons
 * and `POST /api/lessons/:id/attachments` knows nothing about bytes; chaining
 * them here is what keeps that separation from leaking into the UI.
 */
async function uploadFile(file: File): Promise<UploadedFile> {
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

export function useAddAttachment(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: AttachmentDraft) => {
      const payload =
        draft.type === "FILE"
          ? await uploadFile(draft.file).then((uploaded) => ({
              name: draft.name || uploaded.name,
              type: "FILE" as const,
              url: uploaded.url,
              storageKey: uploaded.key,
            }))
          : {
              name: draft.name,
              type: "TEXT" as const,
              content: draft.content,
            };

      return apiRequest<LessonAttachment>({
        url: `/lessons/${lessonId}/attachments`,
        method: "POST",
        data: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lessons.detail(lessonId),
      });
      // `attachmentsCount` is a column in the lessons table.
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.lists() });
      toast.success("تمت إضافة المرفق");
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

export function useDeleteAttachment(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) =>
      apiRequest<{ id: string }>({
        url: `/attachments/${attachmentId}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.lessons.detail(lessonId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.lists() });
      toast.success("تم حذف المرفق");
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
