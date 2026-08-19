import {
  Award,
  Baby,
  BookMarked,
  ClipboardCheck,
  Dumbbell,
  FileText,
  GitBranch,
  Globe,
  GraduationCap,
  Library,
  Microscope,
  Network,
  Rocket,
  Scale,
  Timer,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/**
 * Everything the public site says about the academy, in one file.
 *
 * The landing page is **not** database-driven: there is no published path in the
 * catalog yet, and the page has to describe the academy before it can list its
 * inventory. So the copy lives here rather than being invented inside JSX — the
 * same reason `constants/path.ts` exists. One place to correct a claim, and the
 * header, the footer and the page cannot drift apart about what the sections
 * are called.
 *
 * **Every claim below is traceable to `docs/business-analysis.md`**, and the
 * section it comes from is cited. That is the rule this file is maintained
 * under: if a sentence has no citation, it is a marketing claim nobody has
 * approved. See `docs/landing-page.md` §2.
 */

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export type MarketingNavItem = {
  /** In-page anchor, or a real route. */
  href: string;
  label: string;
};

/**
 * The public navigation, in the order the page tells its story.
 *
 * Two of the four are now **routes**: `/paths` is the catalog and `/about` is
 * the academy's own page. The other two are still sections of the landing page,
 * written root-relative (`/#audiences`, not `#audiences`) because this header
 * renders on every marketing route — a bare anchor is a link that scrolls
 * nowhere for anyone reading a path page.
 *
 * The order is unchanged: what you would study, whether you are invited, how
 * the study works, who is behind it.
 */
export const MARKETING_NAV_ITEMS: MarketingNavItem[] = [
  { href: "/paths", label: "المسارات" },
  { href: "/#audiences", label: "لمن الأكاديمية" },
  { href: "/#methodology", label: "منهجية الدراسة" },
  { href: "/about", label: "عن الأكاديمية" },
];

/**
 * Where the footer's "الأكاديمية" column points.
 *
 * Every entry resolves to something that exists — a route, or a section on the
 * landing page. There is no `#supervision` anchor because scholarly supervision
 * is part of "عن الأكاديمية" rather than a section of its own, and a footer
 * link to an id nothing renders is a dead link that happens to scroll to the
 * top instead of 404ing, which is worse.
 *
 * Root-relative for the same reason as `MARKETING_NAV_ITEMS`: the footer
 * renders on every page in the marketing shell, not only on the one that has
 * these sections.
 */
export const MARKETING_FOOTER_LINKS: MarketingNavItem[] = [
  { href: "/about", label: "عن الأكاديمية" },
  { href: "/paths", label: "المسارات" },
  { href: "/#values", label: "قيمنا" },
  { href: "/#audiences", label: "لمن الأكاديمية" },
  { href: "/#methodology", label: "منهجية الدراسة" },
];

/* -------------------------------------------------------------------------- */
/*  Hero — the vision and the mission                                          */
/* -------------------------------------------------------------------------- */

/**
 * `business-analysis.md` §2.1 — the vision, verbatim.
 *
 * Stored in two halves because the hero tints the second one with
 * `--primary` and everywhere else prints the whole line. Splitting it here
 * rather than hard-coding the halves in JSX is what stops the headline and the
 * footer drifting into two different visions.
 */
export const ACADEMY_VISION_PARTS = ["جيلٌ ربانيٌّ", "يُحيي السنة"] as const;

export const ACADEMY_VISION = ACADEMY_VISION_PARTS.join(" ");

/** §2.2 — the mission, condensed to one sentence without adding to it. */
export const ACADEMY_MISSION =
  "تعليمٌ راسخ، ومنهجٌ موثوق، وتزكيةٌ فعّالة، وفكرٌ متّقد — على نهج السلف الصالح، لتصل رسالة السنة إلى كل مسلم وغير مسلم حول العالم.";

/**
 * §2.1 — what the vision means in practice.
 *
 * Four outcomes rather than four adjectives: "جيل رباني" is a claim, and these
 * are the things that would make it true.
 */
export const ACADEMY_OUTCOMES: string[] = [
  "فهمٌ عميق للسنة الصحيحة",
  "عملٌ بها وتربيةٌ عليها",
  "تنميةُ الملكة وتزكيةُ النفس",
  "استنباطُ الأحكام للمستجدات",
];

/* -------------------------------------------------------------------------- */
/*  §2.3 — the four core values                                                */
/* -------------------------------------------------------------------------- */

export type MarketingValue = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * The values table from §2.3, one card each.
 *
 * This is the section that carries the positioning. §2.3's own analytical note
 * says these values place the academy as a **bridge** between the science of
 * hadith and modern disciplines — which is what separates it from a
 * memorisation platform. The page leads with them for that reason.
 */
export const MARKETING_VALUES: MarketingValue[] = [
  {
    icon: BookMarked,
    title: "الاستفادة القصوى من السنة",
    description:
      "استخلاص الفوائد من السنة النبوية في جميع العلوم الشرعية والحياتية، لا في باب واحد منها.",
  },
  {
    icon: Network,
    title: "ربط السنة بالعلوم المختلفة",
    description:
      "تأكيد أن السنة لا تتعارض مع العلوم الأخرى بل تتكامل معها: تفسيرًا وفقهًا ولغةً وتربيةً وتقنية.",
  },
  {
    icon: Scale,
    title: "الوسطية في تناول السنة",
    description:
      "توازنٌ بين دراسة السنة والمذاهب الفقهية، دون إفراطٍ ولا تفريط.",
  },
  {
    icon: Library,
    title: "الاستفادة من التراث العلمي",
    description:
      "الاستعانة بكبار العلماء في الإشراف واللقاءات ووضع الاختبارات والإجابة عن أسئلة الطلاب.",
  },
];

/* -------------------------------------------------------------------------- */
/*  §3.1 — who the academy is for                                              */
/* -------------------------------------------------------------------------- */

export type MarketingAudience = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * The seven segments of §3.1, each with the example the document itself gives.
 *
 * Naming them is the point. §3 describes an audience running from a curious
 * Muslim to an advanced researcher, and a landing page that addresses only
 * "students of knowledge" silently turns away five of the seven.
 */
export const MARKETING_AUDIENCES: MarketingAudience[] = [
  {
    icon: Users,
    title: "كل مسلم",
    description: "مسارات «ما لا يسع المسلم جهله» — الأربعون النووية وعمدة الأحكام.",
  },
  {
    icon: GraduationCap,
    title: "طلاب العلم",
    description: "بلوغ المرام واللؤلؤ والمرجان، مع علوم المصطلح ومنظومته.",
  },
  {
    icon: Baby,
    title: "الأطفال",
    description: "مسارات مبسّطة تغرس محبة السنة في الصغر.",
  },
  {
    icon: UsersRound,
    title: "النساء",
    description: "مسارات تناسب اهتماماتهن وأدوارهن وأحكامهن الخاصة.",
  },
  {
    icon: Rocket,
    title: "الشباب",
    description: "برامج تفاعلية تعالج قضاياهم من منظور نبوي.",
  },
  {
    icon: Globe,
    title: "غير المسلمين",
    description: "شروحات ومواد مترجمة بلغات عالمية.",
  },
  {
    icon: Microscope,
    title: "صناعة الباحثين",
    description: "برامج بحثية متقدمة تستعين بالأدوات والبرامج الحديثة.",
  },
];

/* -------------------------------------------------------------------------- */
/*  §3.4 + §4.2 + §4.3 — the paths                                             */
/* -------------------------------------------------------------------------- */

export type MarketingPath = {
  title: string;
  description: string;
  /** A `PathCategory` key, so the badge reuses `PATH_CATEGORY_CLASSES`. */
  category: "FIQH" | "AQEEDA" | "LIFE_AFFAIRS" | "SEERAH" | "TAFSIR";
  audience: string;
};

/**
 * The paths the academy opens with — §3.4's priority list.
 *
 * §3.4 recommends these because the market is not saturated with them, an
 * approach its own analysis calls a "Blue Ocean" strategy: compete on subjects
 * nobody has exhausted rather than on a thousandth commentary of the same
 * hadith collection. So the page leads with السنة والاقتصاد and السنة والطب,
 * not with a generic "our courses" grid.
 *
 * **These are planned paths, not published ones.** Nothing in the database
 * backs them yet, and the section that renders them says so — see
 * `docs/landing-page.md` §5.
 */
export const MARKETING_PATHS: MarketingPath[] = [
  {
    title: "السنة والأسرة",
    description:
      "هدي النبي ﷺ في الزواج والتربية ومعالجة المشكلات الأسرية، لبناء بيتٍ مسلم مستقر.",
    category: "LIFE_AFFAIRS",
    audience: "لكل مسلم",
  },
  {
    title: "السنة والاقتصاد",
    description:
      "فقه البيوع والمعاملات المالية المعاصرة في ضوء السنة، وكيف تُطبَّق اليوم.",
    category: "FIQH",
    audience: "للمهتمين وطلاب العلم",
  },
  {
    title: "السنة والطب",
    description: "ما صحّ من الهدي النبوي في الطب والصحة، وموقعه من العلم الحديث.",
    category: "LIFE_AFFAIRS",
    audience: "لكل مسلم",
  },
  {
    title: "السنة وأصول الفقه",
    description:
      "الربط بين أحاديث الأحكام والقواعد الأصولية، لتقوية ملكة الاستنباط.",
    category: "FIQH",
    audience: "لطلاب العلم",
  },
  {
    title: "السنة والمرأة",
    description: "أحكامٌ ومسائل تخص المرأة المسلمة في عبادتها وأسرتها ومجتمعها.",
    category: "FIQH",
    audience: "للنساء",
  },
  {
    title: "صناعة الباحث الفائق",
    description:
      "برنامج بحثي متقدم في التعامل مع كتب السنة، بالاستعانة بالبرامج البحثية والذكاء الاصطناعي.",
    category: "SEERAH",
    audience: "للباحثين",
  },
];

/* -------------------------------------------------------------------------- */
/*  §4.4 — how a stage is built                                                */
/* -------------------------------------------------------------------------- */

export type MarketingMethodStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * The curriculum structure rules of §4.4, as the learner experiences them.
 *
 * The most credible thing this page can say is not "we are excellent" but "here
 * is exactly how a stage is built" — and §4.4 is unusually specific about it.
 * It also happens to be the part the product genuinely implements:
 * `Path → Stage → Lesson → Quiz → Certificate` is the same shape, which §7 of
 * the analysis notes explicitly.
 */
export const MARKETING_METHOD_STEPS: MarketingMethodStep[] = [
  {
    icon: Timer,
    title: "مرحلةٌ من ٥ إلى ١٠ ساعات",
    description:
      "تُقسَّم ساعات كل مرحلة على عددٍ من الدروس المتدرجة، فلا تطول المرحلة حتى تُملّ ولا تقصر حتى لا تُبنى عليها ملكة.",
  },
  {
    icon: FileText,
    title: "تفريغاتٌ وملخصات",
    description:
      "نصٌّ مكتوب مع كل درس، لمن يقرأ أسرع مما يستمع ولمن يعود للمراجعة.",
  },
  {
    icon: GitBranch,
    title: "تشجيراتٌ وخرائط ذهنية",
    description: "بنية الدرس مرسومة، لأن ترتيب المسائل نصف فهمها.",
  },
  {
    icon: Dumbbell,
    title: "تدريباتٌ عملية",
    description: "تطبيقٌ على ما دُرس، لا حفظٌ مجرد.",
  },
  {
    icon: ClipboardCheck,
    title: "اختبارٌ نهائي لكل مرحلة",
    description: "لا تُطوى المرحلة إلا بعد التحقق من إتقانها.",
  },
  {
    icon: Award,
    title: "شهادةُ إتمام",
    description: "تُمنح عند اجتياز المسار، موثّقةً برقمٍ يمكن الرجوع إليه.",
  },
];

/* -------------------------------------------------------------------------- */
/*  §5.2 — scholarly supervision                                               */
/* -------------------------------------------------------------------------- */

/**
 * What the supervising scholars actually do, from §5.2.
 *
 * Deliberately a list of *activities* and not a list of names. §5.2 records a
 * gap the project has not closed — there is no contractual arrangement with the
 * named scholars yet — so printing their names on a public page would be
 * claiming an endorsement that has not been formalised. The activities are the
 * declared model and are safe to state; the names are not this page's to give.
 */
export const MARKETING_SUPERVISION_POINTS: string[] = [
  "الإشراف على المحتوى العلمي ومراجعته",
  "اللقاءات التفاعلية مع الطلاب",
  "وضع الاختبارات وتصحيحها",
  "الإجابة عن أسئلة الدارسين",
];

/* -------------------------------------------------------------------------- */
/*  §4.1–4.3 — the tracks model, for `/about`                                  */
/* -------------------------------------------------------------------------- */

export type MarketingTrackFamily = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Track names exactly as §4.2 and §4.3 list them. */
  tracks: string[];
};

/**
 * §4.1 — what the "integrated tracks" system is, in one sentence.
 *
 * The system is the academy's actual product decision: not a library of
 * lectures but a graded route, each track carrying the instrument sciences
 * (علوم الآلة) and the terminology (المصطلح) that its own level requires.
 */
export const ACADEMY_TRACKS_INTRO =
  "منهجٌ مرنٌ من المسارات يخدم المسلم العام وطالب العلم المتخصص والباحث المتقدم، ويزوّد الدارس في كل مسارٍ بما يناسبه من علوم الآلة وعلوم المصطلح، ليكون البناء العلمي متينًا ومتدرّجًا.";

/**
 * The two families of tracks named in §4.2 and §4.3.
 *
 * Listed as **names only**, with no promise of a date. §1 records the project
 * in early founding and §6 puts curriculum preparation at phase two, so these
 * are the declared plan rather than an inventory — the published inventory is
 * `/paths`, which reads the database.
 */
export const ACADEMY_TRACK_FAMILIES: MarketingTrackFamily[] = [
  {
    icon: Network,
    title: "مسارات التكامل المعرفي",
    description:
      "تصل السنة بعلوم الآلة التي تُفهم بها: الأصول واللغة والقراءات والسيرة.",
    tracks: [
      "السنة وأصول الفقه",
      "السنة وعلوم اللغة",
      "السنة وعلم القراءات",
      "السنة والسيرة والتاريخ",
    ],
  },
  {
    icon: Rocket,
    title: "مسارات الحياة المعاصرة",
    description:
      "تنزّل السنة على ما يعيشه الناس اليوم: خطابةً واقتصادًا وسياسةً وبحثًا.",
    tracks: [
      "السنة وفن الخطابة",
      "السنة والاقتصاد وفقه البيوع",
      "السنة والعلوم السياسية",
      "صناعة الباحث الفائق",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  §6 — the roadmap                                                           */
/* -------------------------------------------------------------------------- */

export type MarketingRoadmapPhase = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * The four phases of §6, in order.
 *
 * Published deliberately. An academy that has not launched cannot claim a
 * catalog, but it can say exactly what it is doing and in what order — and a
 * visitor who can see the plan is being told the truth about where the project
 * stands, which §9 identifies as this project's whole currency.
 *
 * **No dates.** §6 gives an order, not a schedule, and inventing one here would
 * be a promise nobody has made.
 */
export const ACADEMY_ROADMAP: MarketingRoadmapPhase[] = [
  {
    icon: Rocket,
    title: "توفير المنصة التقنية",
    description: "بناء بيئة تعليمية إلكترونية متطورة تحمل المسارات ومتابعة الدارسين.",
  },
  {
    icon: Library,
    title: "إعداد المواد والمناهج",
    description: "تطوير محتوى علمي أصيل ومعاصر لكل مسار، مراجَعٍ قبل نشره.",
  },
  {
    icon: GitBranch,
    title: "وضع منهجية المسارات",
    description: "تصميم الرحلة التعليمية لكل تخصص: مراحلها وترتيبها واختباراتها.",
  },
  {
    icon: Globe,
    title: "بناء آلية التسويق",
    description: "الوصول إلى الطلاب والشركاء حول العالم، بعربيةٍ وبغيرها.",
  },
];
