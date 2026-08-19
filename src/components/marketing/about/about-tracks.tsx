import Link from "next/link";
import { ArrowLeft, Dot } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/marketing/marketing-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ACADEMY_TRACKS_INTRO,
  ACADEMY_TRACK_FAMILIES,
  MARKETING_AUDIENCES,
} from "@/constants/marketing";
import { ROUTES } from "@/constants/routes";

/**
 * The tracks system — `business-analysis.md` §4.1, and the two families of
 * §4.2 and §4.3.
 *
 * This is the section that only exists on `/about`. The landing page shows
 * *which* paths are coming (§3.4's priority list) and `/paths` shows which are
 * published; neither explains the **model** — that a track is a graded route
 * carrying its own instrument sciences, rather than a playlist of lectures.
 * That model is the academy's actual product decision, and it belongs on the
 * page about the academy.
 *
 * The audience chips close the section rather than opening one of their own:
 * §3.1's seven segments are already a full section on `/`, and repeating that
 * grid here would make this page a copy of that one. Naming them in a line
 * answers "is this for me?" without re-arguing it.
 *
 * Track names carry **no dates and no links**. §6 puts curriculum preparation
 * at phase two, so these are the declared plan; the linkable inventory is
 * `/paths`, and the button at the end goes there.
 */
export function AboutTracks() {
  return (
    <MarketingSection id="tracks">
      <MarketingSectionHeading
        eyebrow="نظام المسارات"
        title="لا دروسٌ متفرقة، بل طريقٌ متدرّج"
        description={ACADEMY_TRACKS_INTRO}
      />

      <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ACADEMY_TRACK_FAMILIES.map((family) => (
          <Card key={family.title} className="h-full">
            <CardContent className="space-y-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <family.icon className="size-5" />
              </div>

              <div className="space-y-2">
                <h3 className="font-heading text-xl font-bold">
                  {family.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground text-pretty">
                  {family.description}
                </p>
              </div>

              <ul className="space-y-1.5 border-t border-border pt-4">
                {family.tracks.map((track) => (
                  <li
                    key={track}
                    className="flex items-center gap-1 text-sm text-foreground/90"
                  >
                    <Dot className="size-5 shrink-0 text-primary" />
                    {track}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-muted/60 p-6 sm:p-8">
        <h3 className="font-heading text-lg font-bold">
          ولكل شريحةٍ ما يناسبها
        </h3>

        <p className="mt-2 text-sm leading-6 text-muted-foreground text-pretty">
          المسارات مصمّمة لتخاطب سبع شرائح، من المسلم الذي يطلب ما لا يسعه جهله
          إلى الباحث المتخصص.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {MARKETING_AUDIENCES.map((audience) => (
            <li
              key={audience.title}
              className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-sm ring-1 ring-foreground/10"
            >
              <audience.icon className="size-3.5 text-primary" />
              {audience.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex justify-center">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href={ROUTES.paths} />}
        >
          استعرض المسارات المنشورة
          {/* Forward points left in RTL — design-system.md §10. */}
          <ArrowLeft />
        </Button>
      </div>
    </MarketingSection>
  );
}
