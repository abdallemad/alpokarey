import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Data access for Attachment — the files and notes hanging off a lesson.
 *
 * > **Schema note.** `Attachment.cloudinaryPublicId` is where the storage
 * > driver's object key is kept, because that is the column the schema
 * > provides. The name is historical: the key belongs to whichever driver
 * > `lib/storage.ts` currently is, which today is local disk. Renaming it needs
 * > a migration — see `docs/lessons-feature.md` §12.
 * >
 * > `CloudinaryResource` is deliberately untouched. It declares both
 * > `lessonId` and `attachmentId` as `@unique`, which allows exactly one
 * > resource per lesson, so it cannot represent a lesson with several
 * > attachments.
 */

const attachmentSelect = {
  id: true,
  name: true,
  type: true,
  content: true,
  url: true,
  cloudinaryPublicId: true,
  lessonId: true,
  createdAt: true,
} satisfies Prisma.AttachmentSelect;

export type AttachmentRow = Prisma.AttachmentGetPayload<{
  select: typeof attachmentSelect;
}>;

export const attachmentRepository = {
  findById(id: string) {
    return db.attachment.findUnique({ where: { id }, select: attachmentSelect });
  },

  create(data: Prisma.AttachmentUncheckedCreateInput) {
    return db.attachment.create({ data, select: attachmentSelect });
  },

  delete(id: string) {
    return db.attachment.delete({ where: { id }, select: { id: true } });
  },

  /** Storage keys of every file under a lesson — what a cascade would orphan. */
  findKeysByLesson(lessonId: string) {
    return db.attachment.findMany({
      where: { lessonId, cloudinaryPublicId: { not: null } },
      select: { cloudinaryPublicId: true },
    });
  },
};
