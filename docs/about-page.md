# About Page — `/about`, the academy in its own words

> **Scope:** the public about page, the constants it added to
> `constants/marketing.ts`, and the editorial rule that decided what from
> `business-analysis.md` goes on it and what does not.
>
> Related: [`business-analysis.md`](./business-analysis.md) — the source of
> every claim on the page · [`tracks-catalog-feature.md`](./tracks-catalog-feature.md)
> — the sibling public route · [`design-system.md`](./design-system.md) ·
> [`folder-structure.md`](./folder-structure.md)

---

## 1. Why the page exists

The header and the footer have both linked to "عن الأكاديمية" since the
marketing shell was built, and both pointed at `/#about` — a section on the
landing page that answers the question in two paragraphs. That is the right
length inside a landing page's argument and the wrong length for the question
itself.

`/about` is where the claim gets its paragraphs. The nav and footer now point
here; the landing section stays where it is, doing its shorter job.

---

## 2. Files

```text
src/
├── app/(marketing)/about/page.tsx     # NEW — the composition
│
├── components/marketing/about/        # NEW folder, one section per file
│   ├── about-intro.tsx                #   vision, mission, what this is
│   ├── about-values.tsx               #   §2.3, with the positioning
│   ├── about-tracks.tsx               #   §4.1–4.3 — the model
│   ├── about-supervision.tsx          #   §5.2
│   ├── about-roadmap.tsx              #   §6
│   └── index.ts
│
└── constants/marketing.ts             # + ACADEMY_TRACKS_INTRO,
                                       #   ACADEMY_TRACK_FAMILIES, ACADEMY_ROADMAP
```

A subfolder rather than five more files beside the landing's seven: `about-`
prefixes on every one of them would still collide conceptually with the existing
`about-section.tsx`, which is the *landing page's* about block and stays where
it is.

The page is **static** — nothing reads the request, the database or the session.
It reuses the landing page's `CtaSection` verbatim as its closing band.

---

## 3. What is on it, and in what order

| # | Section | Source | New to this page? |
|---|---|---|---|
| 1 | من نحن — vision, mission, what the project is | §1, §2.1, §2.2 | deepened |
| 2 | قيمنا — the four values and the positioning they carry | §2.3 | restated |
| 3 | نظام المسارات — the model, and the two families of tracks | §4.1, §4.2, §4.3 | **yes** |
| 4 | الإشراف العلمي — who vouches for what is taught | §5.2 | restated |
| 5 | خارطة الطريق — where the project stands and what comes next | §6 | **yes** |
| 6 | CTA | — | shared with `/` |

The page **deepens** the landing page rather than repeating it. The audience
segments (§3.1), the curriculum-structure steps (§4.4) and the priority path
list (§3.4) are all argued on `/`, so this page names them and links out instead
of re-rendering their grids — the audiences appear as a row of chips, and the
supervision section ends with a link to `/#methodology` rather than copying its
six steps. Copying them would give the product two places to correct the same
fact.

Values and supervision *are* restated, deliberately. An about page that omits an
organisation's values because another page mentions them is an about page that
never says what the organisation is for. Both read the same constants, so they
cannot drift; only the presentation differs — a numbered list here, a card grid
there.

---

## 4. What was deliberately left off

`business-analysis.md` is an internal analysis, not a brochure. Four things in
it are **not** on this page, and each exclusion is a decision rather than an
oversight:

| Left off | Why |
|---|---|
| **§9 SWOT** — weaknesses, threats | The working assessment behind the academy, not a public statement about it. "Revenue model undecided" is a real risk to manage, not a thing to publish. |
| **§7 technical gaps** — no payments, no live-session model, limited roles | Same. It is a to-do list for the build. |
| **§8 revenue model** — free / subscription still open, legal entity recommended | Publishing "we have not decided whether this costs money" invites exactly one question and answers it badly. When it is decided, it belongs on the page. |
| **The supervising scholars' names** | §5.2 records that no contractual or scheduled arrangement exists yet. Printing names would claim an endorsement nobody has formalised, and that is an expensive claim to withdraw. The page states what the supervision *consists of* — the declared model — and leaves the names to whoever is authorised to give them. |

The org chart of §5.1 is also absent: it is a proposed structure with roles
nobody holds yet, and an about page listing six unfilled directorships describes
an ambition as though it were a staff.

### The roadmap has no dates

§6 gives an order, not a schedule. The page prints the four phases in order and
says so out loud — "بلا وعودٍ بمواعيد". Inventing a quarter would be a promise
nobody made, and a missed public date costs more than a vague one saves.

Publishing the roadmap at all is the deliberate part: §1 records the project in
early founding and §9 names scholarly credibility as its whole currency. An
academy in that position cannot claim a catalog it does not have, but it can say
exactly what it is doing and in what order — and a visitor who can see the plan
is being told the truth about where things stand.

---

## 5. The citation rule

`constants/marketing.ts` is maintained under one rule, stated at the top of the
file: **a sentence with no `business-analysis.md` citation is a marketing claim
nobody approved.** The three constants this page added keep it:

- `ACADEMY_TRACKS_INTRO` — §4.1, condensed without adding to it.
- `ACADEMY_TRACK_FAMILIES` — §4.2 and §4.3, the eight track names verbatim.
- `ACADEMY_ROADMAP` — §6's four phases, each with a one-line gloss that
  restates the phase rather than extending it.

Prose that sits in the JSX rather than in constants — the two "ما هذه
الأكاديمية؟" paragraphs, the supervision headline — is §1 and §5.2 rephrased,
and is marked as such in each component's own doc comment.

---

## 6. Verification performed

- `npx tsc --noEmit` — clean.
- `npx eslint` on every new and changed file — clean.
- **The page in the browser**, signed out: all six sections render in order —
  the vision headline with its tinted second half, the mission, the two
  "ما هذه الأكاديمية؟" paragraphs, the four outcomes, the four values with the
  positioning line, the tracks intro, both track families with their four names
  each, the seven audience chips, the supervision headline with its four
  activities, the four numbered roadmap phases, and the CTA band.
- **Title and description** resolve to
  `عن الأكاديمية | أكاديمية الإمام البخاري` and the academy's description —
  unlike `/paths/[pathId]`, this page needs no database read to name itself.
- **The links out** work: "استعرض المسارات المنشورة" → `/paths`,
  "كيف تُبنى المرحلة الدراسية؟" → `/#methodology`, and the CTA → `/sign-up`
  and `/sign-in`.
- **The links in** work: the header nav's "عن الأكاديمية" and the footer's
  first "الأكاديمية" entry both resolve to `/about`.
- No console errors.

**Not verified:** `npx next build` — a dev server is running on port 3000 and
both write to `.next`. Nothing on this page is dynamic, so a build would only
confirm it prerenders.

---

## 7. A note on `docs/landing-page.md`

Eight files across this codebase cite `docs/landing-page.md` — `page.tsx`,
`about-section.tsx`, `paths-section.tsx`, `constants/marketing.ts` and
`types/path.ts` among them, several with section numbers (§2, §5, §6).

**That document has never existed**, in the working tree or anywhere in git
history. The citations are to a document that was planned and not written, which
means the reasoning they point at lives only in the components' own comments
today.

This page's document does not try to reconstruct it: inventing a
`landing-page.md` with different section numbering would break every one of
those citations rather than satisfy it. Writing it — with numbering that matches
what the existing references assume — is a task of its own.
