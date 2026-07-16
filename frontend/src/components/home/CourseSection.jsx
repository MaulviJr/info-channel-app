import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * CoursesSection
 * ----------------------------------------------------------------------
 * Continues the Hero/About design language (see index.css --color-*
 * tokens) with a pinned, scroll-scrubbed "cinematic card stack" —
 * think Apple product-story sections, not a course grid.
 *
 * DATA-DRIVEN, NOT HARDCODED
 * ----------------------------------------------------------------------
 * Nothing about a specific course is hardcoded in JSX. Everything reads
 * from the `courses` prop (defaults to DEFAULT_COURSES below). Add a
 * 4th, 10th, or 20th course to the array and:
 *   - a card is generated automatically (courses.map)
 *   - the GSAP timeline duration grows automatically (see "SCALES
 *     AUTOMATICALLY" below) — no animation code needs to change.
 *
 * Course shape:
 *   {
 *     id:            string (unique, used as the React key)
 *     icon:          "ai" | "webdev" | "design" | "code"  (see ICONS map;
 *                    add more keys to ICONS if you add new subjects)
 *     title:         string
 *     description:   string
 *     technologies:  string[]
 *     duration:      string   e.g. "6 Months"
 *     level:         string   e.g. "Beginner to Advanced"
 *     badge:         string?  optional pill, e.g. "Most Popular"
 *     ctaLabel:      string?  defaults to "Explore Course"
 *   }
 *
 * SCALES AUTOMATICALLY — HOW THE TIMELINE IS BUILT
 * ----------------------------------------------------------------------
 * One gsap.timeline({ paused: true }) is built by looping over
 * `courses`. Each "transition" (card i -> card i+1) adds exactly one
 * labeled 1-second block to the timeline — so the timeline's total
 * duration is naturally `courses.length + constant` seconds, whatever
 * `courses.length` is. That timeline is then attached to a single
 * ScrollTrigger as `animation: tl`, with:
 *
 *     end: () => "+=" + tl.duration() * PIXELS_PER_SECOND
 *
 * ...so the pinned scroll distance is *derived from* the timeline
 * duration, which is *derived from* courses.length. Add more courses,
 * get a longer (but proportionally identical) scroll story, with zero
 * changes to this file.
 *
 * CARD STACK MECHANICS
 * ----------------------------------------------------------------------
 * Every course card is rendered, absolutely positioned, in the same
 * box. At any moment each card is in one of five states:
 *   CENTER        the featured card — full size, sharp, front
 *   PREV          just-viewed card — shifted left, smaller, blurred
 *   NEXT          up-next card — shifted right, smaller, blurred
 *   HIDDEN_LEFT   fully retired — off-screen left, invisible
 *   HIDDEN_RIGHT  not yet due — off-screen right, invisible
 * Each scroll-driven transition moves at most 4 cards one state to the
 * left (center->prev->hidden-left, next->center, hidden-right->next),
 * which is why it scales to any number of courses without the visual
 * clutter of rendering all of them at once.
 *
 * RESPONSIVE BEHAVIOR (gsap.matchMedia, auto re-runs on resize)
 * ----------------------------------------------------------------------
 *   >=768px, motion OK   -> pinned scroll-scrubbed stack (this file's
 *                           main feature)
 *   <768px, motion OK    -> no pin; native horizontal swipe/snap row,
 *                           plus a simple fade-up entrance
 *   prefers-reduced-motion -> no pin, no scrub; everything set to its
 *                           final visible state immediately
 *
 * VIEWPORT FIT (desktop)
 * ----------------------------------------------------------------------
 * At `lg` the whole stage (badge + heading + description + card stack
 * + feature strip + CTA) is sized to comfortably fit one 1920x1080
 * viewport, matching the reference composition — compact heading/copy,
 * a ~480px card stage, and a slim feature strip, centered via
 * `lg:min-h-screen lg:flex lg:items-center`. Exact fit depends on your
 * navbar height; the two tunable spots are flagged in comments below.
 */

// ---------------------------------------------------------------------
// Inline icon set — zero extra deps. Add a key here if you add a course
// with a new `icon` value.
// ---------------------------------------------------------------------
const ICONS = {
  ai: IconSparkles,
  webdev: IconCode,
  design: IconPalette,
};

const DEFAULT_COURSES = [
  {
    id: "generative-ai",
    icon: "ai",
    title: "Generative AI",
    description:
      "Learn prompt engineering, AI tools, and LLM workflows, and build real-world AI applications from the ground up.",
    technologies: ["ChatGPT", "Claude", "LangChain", "OpenAI", "Python"],
    duration: "5 Months",
    level: "Beginner to Advanced",
  },
  {
    id: "full-stack-web-development",
    icon: "webdev",
    title: "Full Stack Web Development",
    description:
      "Master front-end and back-end development end to end, and ship real-world projects you can put in a portfolio.",
    technologies: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
    duration: "6 Months",
    level: "Beginner to Advanced",
    badge: "Most Popular",
  },
  {
    id: "graphic-designing",
    icon: "design",
    title: "Graphic Designing",
    description:
      "Learn professional branding, social media design, and visual communication with the industry-standard Adobe suite.",
    technologies: ["Photoshop", "Illustrator", "Figma", "Canva"],
    duration: "4 Months",
    level: "Beginner",
  },
   {
    id: "graphic-designing",
    icon: "design",
    title: "Graphic Designing",
    description:
      "Learn professional branding, social media design, and visual communication with the industry-standard Adobe suite.",
    technologies: ["Photoshop", "Illustrator", "Figma", "Canva"],
    duration: "4 Months",
    level: "Beginner",
  },
   {
    id: "graphic-designing",
    icon: "design",
    title: "Graphic Designing",
    description:
      "Learn professional branding, social media design, and visual communication with the industry-standard Adobe suite.",
    technologies: ["Photoshop", "Illustrator", "Figma", "Canva"],
    duration: "4 Months",
    level: "Beginner",
  },
];

const DEFAULT_FEATURES = [
  {
    id: "industry-focused",
    title: "Industry Focused",
    description: "Curriculum designed with working professionals.",
    icon: IconBriefcase,
  },
  {
    id: "practical-learning",
    title: "Practical Learning",
    description: "Hands-on projects, not just theory.",
    icon: IconTool,
  },
  {
    id: "certification",
    title: "Certification",
    description: "Recognized credentials that boost your resume.",
    icon: IconTrophy,
  },
  {
    id: "career-support",
    title: "Career Support",
    description: "Mentorship and guidance after you graduate.",
    icon: IconHandshake,
  },
];

// Card "slot" presets the stack animates between. Kept outside the
// component so they're stable references, not recreated every render.
const CENTER = { xPercent: 0, scale: 1, rotate: 0, filter: "blur(0px)", opacity: 1, zIndex: 30 };
const PREV = { xPercent: -34, scale: 0.86, rotate: -5, filter: "blur(3px)", opacity: 0.55, zIndex: 20 };
const NEXT = { xPercent: 34, scale: 0.86, rotate: 5, filter: "blur(3px)", opacity: 0.55, zIndex: 20 };
const HIDDEN_LEFT = { xPercent: -60, scale: 0.72, rotate: -10, filter: "blur(8px)", opacity: 0, zIndex: 5 };
const HIDDEN_RIGHT = { xPercent: 60, scale: 0.72, rotate: 10, filter: "blur(8px)", opacity: 0, zIndex: 5 };

// How many pixels of scroll correspond to one "second" of timeline
// duration. This is the single number that controls how much scrolling
// it takes to move through the whole story — raise it for a slower,
// more deliberate scroll; lower it for a snappier one.
const PIXELS_PER_SECOND = 420;

export default function CoursesSection({
  courses = DEFAULT_COURSES,
  features = DEFAULT_FEATURES,
}) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const bgRef = useRef(null);
  const orbitRef = useRef(null);
  const orbit2Ref = useRef(null);
  const glowRef = useRef(null);

  const badgeRef = useRef(null);
  const headingLine1Ref = useRef(null);
  const headingLine2Ref = useRef(null);
  const descRef = useRef(null);

  const cardStageWrapRef = useRef(null);
  const cardRefs = useRef([]);
  const pillGroupRefs = useRef([]);

  const featureStripRef = useRef(null);
  const featureCardRefs = useRef([]);
  const ctaRef = useRef(null);

  // Mobile (no-pin) horizontal list
  const mobileListRef = useRef(null);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, courses.length);
    pillGroupRefs.current = pillGroupRefs.current.slice(0, courses.length);
    featureCardRefs.current = featureCardRefs.current.slice(0, features.length);

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        isMobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, isMobile, reduceMotion } = context.conditions;

        // -----------------------------------------------------------
        // Reduced motion: snap everything to final visible state, no
        // pin, no ScrollTrigger, no scrub.
        // -----------------------------------------------------------
        if (reduceMotion) {
          gsap.set([badgeRef.current, headingLine1Ref.current, headingLine2Ref.current, descRef.current], {
            opacity: 1,
            y: 0,
            clearProps: "transform",
          });
          cardRefs.current.forEach((el, i) => {
            if (!el) return;
            gsap.set(el, i === 0 ? CENTER : { ...HIDDEN_RIGHT, opacity: 0 });
          });
          gsap.set(featureCardRefs.current, { opacity: 1, y: 0 });
          gsap.set(ctaRef.current, { opacity: 1, y: 0 });
          return;
        }

        // -----------------------------------------------------------
        // DESKTOP / TABLET — pinned, scroll-scrubbed card story
        // -----------------------------------------------------------
        if (isDesktop) {
          // Initial layout state for every card.
          cardRefs.current.forEach((el, i) => {
            if (!el) return;
            if (i === 0) gsap.set(el, { ...CENTER, opacity: 0, y: 16 });
            else if (i === 1) gsap.set(el, { ...NEXT, opacity: 0 });
            else gsap.set(el, HIDDEN_RIGHT);
          });
          gsap.set([badgeRef.current, headingLine1Ref.current, headingLine2Ref.current, descRef.current], {
            opacity: 0,
            y: 26,
          });
          gsap.set(featureCardRefs.current, { opacity: 0, y: 24 });
          gsap.set(ctaRef.current, { opacity: 0, y: 16 });
          pillGroupRefs.current.forEach((group, i) => {
            if (group && i !== 0) gsap.set(group.children, { opacity: 0, y: 8 });
          });

          const tl = gsap.timeline({ paused: true });

          // --- Intro: badge -> heading -> description --------------
          tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0)
            .to(headingLine1Ref.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.1)
            .to(headingLine2Ref.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.18)
            .to(descRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.3);

          // --- First card reveal (card 0 in, card 1 peeking) --------
          tl.to(cardRefs.current[0], { ...CENTER, opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.45);
          if (cardRefs.current[1]) {
            tl.to(cardRefs.current[1], { ...NEXT, opacity: 0.55, duration: 0.6, ease: "power3.out" }, 0.45);
          }
          if (pillGroupRefs.current[0]) {
            tl.to(
              pillGroupRefs.current[0].children,
              { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" },
              0.7
            );
          }

          // --- One labeled 1s block per transition. This loop is the
          //     entire reason the timeline scales with courses.length
          //     automatically — N courses => N-1 of these blocks. -----
          courses.forEach((_, i) => {
            if (i === 0) return;
            const label = `card-${i}`;
            tl.addLabel(label);

            const prevIdx = i - 1;
            const twoBackIdx = i - 2;
            const twoAheadIdx = i + 1;

            if (twoBackIdx >= 0 && cardRefs.current[twoBackIdx]) {
              tl.to(cardRefs.current[twoBackIdx], { ...HIDDEN_LEFT, duration: 1, ease: "power2.inOut" }, label);
            }
            if (cardRefs.current[prevIdx]) {
              tl.to(cardRefs.current[prevIdx], { ...PREV, opacity: 0.55, duration: 1, ease: "power2.inOut" }, label);
            }
            if (cardRefs.current[i]) {
              tl.to(cardRefs.current[i], { ...CENTER, opacity: 1, duration: 1, ease: "power2.inOut" }, label);
            }
            if (pillGroupRefs.current[i]) {
              tl.to(
                pillGroupRefs.current[i].children,
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" },
                `${label}+=0.35`
              );
            }
            if (twoAheadIdx < courses.length && cardRefs.current[twoAheadIdx]) {
              tl.to(
                cardRefs.current[twoAheadIdx],
                { ...NEXT, opacity: 0.55, duration: 1, ease: "power2.inOut" },
                label
              );
            }
          });

          // --- Outro: feature strip + CTA ---------------------------
          tl.addLabel("outro");
          tl.to(
            featureCardRefs.current,
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" },
            "outro"
          );
          tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "outro+=0.2");

          // --- Wire the timeline to a single pinned ScrollTrigger.
          //     Scroll distance is derived from tl.duration(), which
          //     is derived from courses.length — see file header.
          ScrollTrigger.create({
            trigger: stageRef.current,
            start: "top top",
            end: () => "+=" + tl.duration() * PIXELS_PER_SECOND,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            animation: tl,
            invalidateOnRefresh: true,
          });

          // --- Ambient (non-scroll) motion: slow breathing glow and
          //     continuously rotating orbit rings. ---------------------
          if (glowRef.current) {
            gsap.to(glowRef.current, {
              scale: 1.15,
              opacity: 0.5,
              duration: 4,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          }
          [orbitRef.current, orbit2Ref.current].forEach((el, i) => {
            if (!el) return;
            gsap.to(el, {
              rotate: i === 0 ? 360 : -360,
              duration: 50 + i * 20,
              repeat: -1,
              ease: "none",
            });
          });
        }

        // -----------------------------------------------------------
        // MOBILE — no pin. Simple fade-up entrance; the card row is a
        // native horizontally-snapping scroller (see JSX), which is
        // the most performant option and needs no JS.
        // -----------------------------------------------------------
        if (isMobile) {
          gsap.set(
            [badgeRef.current, headingLine1Ref.current, headingLine2Ref.current, descRef.current],
            { opacity: 0, y: 22 }
          );
          gsap.set(featureCardRefs.current, { opacity: 0, y: 20 });
          gsap.set(ctaRef.current, { opacity: 0, y: 14 });

          const introTl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          });
          introTl
            .to(badgeRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
            .to(headingLine1Ref.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.3")
            .to(headingLine2Ref.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.45")
            .to(descRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.3");

          if (mobileListRef.current) {
            gsap.fromTo(
              mobileListRef.current.children,
              { opacity: 0, y: 24 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.12,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: mobileListRef.current,
                  start: "top 85%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          gsap.fromTo(
            featureCardRefs.current,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: featureStripRef.current,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
          gsap.fromTo(
            ctaRef.current,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ctaRef.current,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      }
    );

    return () => mm.revert();
  }, [courses, features]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[color:var(--color-background,#ffffff)] py-20 md:py-24 lg:py-8"
    >
      {/* Decorative background — glow, blobs, dots, orbit rings */}
      <div ref={bgRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          ref={glowRef}
          className="absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary-soft, rgba(99,102,241,0.16)) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--color-foreground, #111) 12%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 70% 55% at 50% 40%, black 25%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 40%, black 25%, transparent 78%)",
          }}
        />
        <div
          ref={orbitRef}
          className="absolute left-[8%] top-[18%] hidden h-56 w-56 rounded-full border border-dashed border-[color:var(--color-border,#e5e7eb)] lg:block"
        />
        <div
          ref={orbit2Ref}
          className="absolute right-[6%] bottom-[12%] hidden h-40 w-40 rounded-full border border-dashed border-[color:var(--color-border,#e5e7eb)] lg:block"
        />
      </div>

      {/* Pinned stage: header + card stack + feature strip + CTA.
          At lg this is sized to fit one viewport (min-h-screen + flex
          centering) so the pin never clips content — the two spots to
          tune if it's a touch too tall/short on your real navbar are
          marked "TUNE" below. */}
      <div
        ref={stageRef}
        className="relative mx-auto flex w-full max-w-7xl flex-col px-6 lg:min-h-screen lg:justify-center lg:px-8" /* TUNE: swap lg:min-h-screen for a fixed lg:h-[..vh] if needed */
      >
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span
            ref={badgeRef}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground,#6b7280)] backdrop-blur-md"
          >
            <IconGrid className="h-3.5 w-3.5" />
            Our Courses
          </span>

          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[color:var(--color-foreground,#0a0a0a)] sm:text-5xl lg:text-5xl">
            <span ref={headingLine1Ref} className="block">
              Learn Skills.
            </span>
            <span
              ref={headingLine2Ref}
              className="mt-1 block bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)] bg-clip-text text-transparent"
            >
              Build Your Future.
            </span>
          </h2>

          <p
            ref={descRef}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[color:var(--color-muted-foreground,#6b7280)] lg:text-base"
          >
            Industry-relevant courses designed to give you practical skills, real-world experience, and a career you'll be proud of.
          </p>
        </div>

        {/* Card stack — desktop/tablet only (pinned + scrubbed) */}
        <div
          ref={cardStageWrapRef}
          className="relative mx-auto mt-10 hidden h-[420px] w-full max-w-4xl md:block lg:mt-8 lg:h-[62vh] lg:max-h-[460px]" /* TUNE: adjust h-[..vh]/max-h if the stack feels cramped or oversized */
        >
          {courses.map((course, i) => (
            <CourseCard
              key={course.id ?? course.title}
              course={course}
              cardRef={(el) => (cardRefs.current[i] = el)}
              pillGroupRef={(el) => (pillGroupRefs.current[i] = el)}
            />
          ))}
        </div>

        {/* Card list — mobile only, native horizontal snap scroll, no pin */}
        <div
          ref={mobileListRef}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 md:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {courses.map((course) => (
            <div key={course.id ?? course.title} className="w-[85%] flex-none snap-center">
              <CourseCard course={course} static />
            </div>
          ))}
        </div>

        {/* Feature strip */}
        <div
          ref={featureStripRef}
          className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 rounded-3xl border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/60 p-5 backdrop-blur-md sm:grid-cols-2 lg:mt-6 lg:grid-cols-4 lg:gap-3 lg:p-4"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id ?? feature.title}
                ref={(el) => (featureCardRefs.current[i] = el)}
                className="flex items-start gap-3"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-2)] text-white">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-[color:var(--color-foreground,#0a0a0a)]">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[color:var(--color-muted-foreground,#6b7280)]">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {/* <p ref={ctaRef} className="mx-auto mt-6 text-center text-sm text-[color:var(--color-muted-foreground,#6b7280)]">
          Don't see the course you're looking for?{" "}
          <a
            href="#request-course"
            className="font-semibold text-[color:var(--color-primary)] underline-offset-4 transition-colors hover:underline"
          >
            Request a Course →
          </a>
        </p> */}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* CourseCard                                                            */
/* -------------------------------------------------------------------- */
/**
 * A single course card. When `static` is true (mobile list) it renders
 * as normal flow with no ref/animation hooks. On desktop/tablet it's
 * absolutely positioned inside the stack and driven entirely by the
 * refs passed down from CoursesSection's GSAP timeline.
 */
function CourseCard({ course, cardRef, pillGroupRef, static: isStatic = false }) {
  const Icon = ICONS[course.icon] ?? IconCode;

  return (
    <div
      ref={cardRef}
      className={
        isStatic
          ? "relative overflow-hidden rounded-[2rem] border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)] shadow-[0_25px_60px_-25px_rgba(0,0,0,0.25)]"
          : "absolute inset-0 overflow-hidden rounded-[2rem] border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.3)] will-change-transform"
      }
      style={
        !isStatic
          ? { backgroundImage: "linear-gradient(var(--color-card,#fff), var(--color-card,#fff))" }
          : undefined
      }
    >
      {/* subtle gradient border wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-40"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-soft, rgba(99,102,241,0.15)) 0%, transparent 40%, transparent 100%)",
        }}
      />

      {course.badge && (
        <span className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/90 px-3 py-1 text-xs font-medium text-[color:var(--color-primary)] shadow-sm backdrop-blur-md">
          <IconStar className="h-3 w-3" />
          {course.badge}
        </span>
      )}

      <div className="relative flex h-full flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-8 lg:p-10">
        {/* LEFT — content */}
        <div className="flex flex-1 flex-col">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-2)] text-white shadow-sm">
            <Icon className="h-5 w-5" />
          </div>

          <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[color:var(--color-foreground,#0a0a0a)] lg:text-3xl">
            {course.title}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-[color:var(--color-muted-foreground,#6b7280)] lg:text-base">
            {course.description}
          </p>

          <div ref={pillGroupRef} className="mt-4 flex flex-wrap gap-2">
            {course.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-background,#fafafa)] px-3 py-1 text-xs font-medium text-[color:var(--color-foreground,#0a0a0a)]"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[color:var(--color-border,#e5e7eb)] pt-4 text-xs text-[color:var(--color-muted-foreground,#6b7280)]">
            <span className="flex items-center gap-1.5">
              <IconClock className="h-3.5 w-3.5" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <IconBarChart className="h-3.5 w-3.5" />
              {course.level}
            </span>
          </div>

          <a
            href={course.href ?? "#"}
            className="group mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
          >
            {course.ctaLabel ?? "Explore Course"}
            <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {/* RIGHT — illustration placeholder, not a stock image */}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-[1.5rem] border border-[color:var(--color-border,#e5e7eb)] bg-gradient-to-br from-[color:var(--color-background,#f7f7f8)] via-[color:var(--color-card,#ffffff)] to-[color:var(--color-background,#f7f7f8)]">
            <Icon className="h-14 w-14 text-[color:var(--color-muted-foreground,#c4c8d0)]" strokeWidth={1.2} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Inline icons                                                          */
/* -------------------------------------------------------------------- */

function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M8.2 6h7.6M8.2 18h7.6M6 8.2v7.6M18 8.2v7.6" />
    </svg>
  );
}

function IconSparkles(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M6.5 6.5 9 9M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );
}

function IconCode(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
      <path d="m13 6-2 12" />
    </svg>
  );
}

function IconPalette(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.3A4.2 4.2 0 0 0 21 12c0-5-4-9-9-9Z" />
      <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconStar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 2.5 14.9 9l7.1.6-5.4 4.7 1.6 6.9-6.2-3.7-6.2 3.7 1.6-6.9L2 9.6 9.1 9 12 2.5Z" />
    </svg>
  );
}

function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconBarChart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 20V11M12 20V6M19 20v-6" />
    </svg>
  );
}

function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconBriefcase(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12.5h18" />
    </svg>
  );
}

function IconTool(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.3-5.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2-2 2.6-2.6Z" />
    </svg>
  );
}

function IconTrophy(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a2 2 0 0 0 2 4M16 5h3a2 2 0 0 1-2 4M10 15v2M14 15v2M8 21h8M9 21v-2a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function IconHandshake(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 12 4.5-4.5a2 2 0 0 1 2.8 0L11 9.2M22 12l-4.5-4.5a2 2 0 0 0-2.8 0L13 9.2" />
      <path d="m8 11 2.3 2.3a1.6 1.6 0 0 0 2.3 0v0a1.6 1.6 0 0 0 0-2.3L11 9.2 8 12l3 3" />
      <path d="M16 11l-2.3 2.3M6 12l-2 2 3 3 1.5-1.5M18 12l2 2-3 3-1.5-1.5" />
    </svg>
  );
}