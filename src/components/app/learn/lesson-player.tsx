"use client";

import { ExternalLink, FileText, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { LearnLesson } from "@/types/learn";
import { toYouTubeEmbedUrl } from "@/utils/video";

/**
 * The lesson itself — the video, or the text that stands in its place.
 *
 * A `TEXT` lesson has no player, and giving it an empty black frame would be
 * worse than giving it nothing: the body *is* the lesson, so it takes the
 * position the video would have held.
 *
 * The video branch is deliberately forgiving about `contentType`. It is a field
 * an author picks in a select, next to a URL they paste, and the two disagree
 * often enough that trusting the label over the link would leave lessons with
 * a blank player and no explanation. So a YouTube link plays as YouTube
 * whatever the label says, anything else with a URL is handed to the browser's
 * own player, and only a lesson with no URL at all reports that it is not ready.
 */
export function LessonPlayer({ lesson }: { lesson: LearnLesson }) {
  if (lesson.type === "TEXT") {
    return <LessonText content={lesson.content} />;
  }

  const embedUrl = toYouTubeEmbedUrl(lesson.videoUrl);

  if (embedUrl) {
    return (
      <AspectRatio
        ratio={16 / 9}
        className="overflow-hidden rounded-xl bg-black ring-1 ring-foreground/10"
      >
        <iframe
          src={embedUrl}
          title={lesson.title}
          // The set YouTube's own embed code ships with, minus `autoplay`:
          // starting a lecture on its own is a decision for the learner.
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </AspectRatio>
    );
  }

  if (lesson.videoUrl) {
    return (
      <div className="space-y-2">
        <AspectRatio
          ratio={16 / 9}
          className="overflow-hidden rounded-xl bg-black ring-1 ring-foreground/10"
        >
          {/* No `<track>`: the model has no caption file, and a transcript
              travels as an `Attachment` instead — see the المرفقات tab. */}
          <video
            src={lesson.videoUrl}
            controls
            preload="metadata"
            className="absolute inset-0 size-full"
          />
        </AspectRatio>

        {/* A codec the browser will not play is silent failure otherwise. */}
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <ExternalLink />
          فتح الفيديو في نافذة جديدة
        </Button>
      </div>
    );
  }

  return (
    <PlaceholderFrame
      icon={VideoOff}
      title="لم يُضف الفيديو بعد"
      description="هذا الدرس قيد الإعداد. سيظهر الفيديو هنا فور رفعه."
    />
  );
}

/**
 * A text lesson's body.
 *
 * `whitespace-pre-wrap` rather than a markdown renderer: the admin editor is a
 * plain textarea, so what an author typed — including their line breaks — is
 * exactly what should appear. Rendering it as text also means a lesson body can
 * never inject markup into the page.
 */
function LessonText({ content }: { content: string | null }) {
  if (!content) {
    return (
      <PlaceholderFrame
        icon={FileText}
        title="لم يُضف محتوى الدرس بعد"
        description="هذا الدرس قيد الإعداد. سيظهر نصّه هنا فور نشره."
      />
    );
  }

  return (
    <article className="rounded-xl bg-card p-4 text-sm leading-8 whitespace-pre-wrap ring-1 ring-foreground/10 md:p-6">
      {content}
    </article>
  );
}

function PlaceholderFrame({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof VideoOff;
  title: string;
  description: string;
}) {
  return (
    <AspectRatio
      ratio={16 / 9}
      className="overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
        <Icon className="size-8 text-muted-foreground" />
        <p className="font-heading text-base font-bold">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </AspectRatio>
  );
}
