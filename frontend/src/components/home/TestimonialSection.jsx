import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * TestimonialsSection
 * ----------------------------------------------------------------------
 * The fourth chapter: Hero -> About -> Courses -> Testimonials. Same
 * tokens as the rest of the page (index.css --color-* custom
 * properties), same pinned-scrub storytelling pattern introduced in
 * CoursesSection, applied to an asymmetrical two-column layout:
 *
 *   LEFT (static once revealed)     RIGHT (scroll-driven)
 *   - badge                         - floating avatar cluster (ambient)
 *   - heading                       - 3-card layered stack (scrubbed)
 *   - paragraph                     - nav arrows + pagination
 *
 * DATA-DRIVEN, NOT HARDCODED
 * ----------------------------------------------------------------------
 * Nothing testimonial-specific is hardcoded in JSX — everything comes
 * from the `testimonials` prop (defaults to DEFAULT_TESTIMONIALS).
 * Shape:
 *   {
 *     id:          string (unique, used as React key)
 *     name:        string
 *     designation: string
 *     company:     string?
 *     review:      string
 *     rating:      number (1-5)
 *     image:       string?  (if omitted, an initials avatar is used —
 *                  no stock images)
 *   }
 *
 * SCALES AUTOMATICALLY
 * ----------------------------------------------------------------------
 * Identical mechanism to CoursesSection: one gsap.timeline({paused:true})
 * is built by looping over `testimonials`, adding one labeled 1-second
 * block per transition. The pinned ScrollTrigger's scroll distance is
 * *derived from* `tl.duration()`, which is *derived from*
 * `testimonials.length` — so 5, 20, or 100 testimonials all work with
 * zero changes to this file. Pagination dots and nav arrows are also
 * generated from the same array.
 *
 * CARD STACK MECHANICS
 * ----------------------------------------------------------------------
 * Same five-state system as the course cards: CENTER / PREV / NEXT /
 * HIDDEN_LEFT / HIDDEN_RIGHT. Only the active card and its two nearest
 * neighbors are ever visible, however many testimonials exist.
 *
 * MOUSE PARALLAX (desktop only)
 * ----------------------------------------------------------------------
 * A single mousemove listener on the section drives independent,
 * shallow (<=10px) offsets on the main card, side cards, background
 * glow, and orbit rings via gsap.quickTo — deliberately kept on a
 * *separate* transform property (raw `x`/`y` px) from the scrub
 * animation (which drives `xPercent`/`scale`/`rotate`/`filter`), so the
 * two motion systems layer instead of fighting each other. Removed via
 * the cleanup function returned from the matchMedia branch.
 *
 * RESPONSIVE (gsap.matchMedia, re-runs automatically on resize)
 * ----------------------------------------------------------------------
 *   >=1024px, motion OK   -> pinned scroll-scrubbed stack + parallax
 *   <1024px, motion OK    -> no pin; native horizontal swipe/snap row
 *   prefers-reduced-motion -> no pin, no scrub, no parallax; static
 *
 * VIEWPORT FIT
 * ----------------------------------------------------------------------
 * Sized to fit one desktop viewport while pinned, same approach as
 * About/Courses — compact type scale and a capped card-stage height at
 * `lg`, centered via `lg:min-h-screen lg:flex lg:items-center`. The
 * tunable spot is flagged below if your navbar height needs a nudge.
 */

const AVATAR_GRADIENTS = [
  "from-[var(--color-primary)] to-[var(--color-primary-2)]",
  "from-[var(--color-primary-2)] to-[var(--color-primary)]",
  "from-[var(--color-primary)] to-[var(--color-accent,var(--color-primary-2))]",
];

const DEFAULT_TESTIMONIALS = [
  {
    id: "ayesha-khan",
    name: "Ayesha Khan",
    designation: "AI Engineer",
    company: "Formerly a student, Generative AI track",
    review:
      "The best decision I made was joining Info Channel. It gave me the confidence to build a real career in AI, not just a certificate on paper.",
    rating: 5,
  },
  {
    id: "bilal-ahmed",
    name: "Bilal Ahmed",
    designation: "Full Stack Developer",
    company: "Formerly a student, Web Development track",
    review:
      "I came in knowing almost nothing about code. Within months I was shipping real projects — the instructors actually cared whether I understood things.",
    rating: 5,
  },
  {
    id: "sana-malik",
    name: "Sana Malik",
    designation: "Brand & Visual Designer",
    company: "Formerly a student, Graphic Design track",
    review:
      "Affordable, practical, and genuinely well taught. I went from doodling for fun to designing for paying clients in under a year.",
    rating: 5,
  },
];

// Card "slot" presets — identical pattern to CoursesSection so the
// stack behaves consistently across the site.
const CENTER = { xPercent: 0, scale: 1, rotate: 0, filter: "blur(0px)", opacity: 1, zIndex: 30 };
const PREV = { xPercent: -30, scale: 0.84, rotate: -6, filter: "blur(3px)", opacity: 0.5, zIndex: 20 };
const NEXT = { xPercent: 30, scale: 0.84, rotate: 6, filter: "blur(3px)", opacity: 0.5, zIndex: 20 };
const HIDDEN_LEFT = { xPercent: -56, scale: 0.7, rotate: -12, filter: "blur(8px)", opacity: 0, zIndex: 5 };
const HIDDEN_RIGHT = { xPercent: 56, scale: 0.7, rotate: 12, filter: "blur(8px)", opacity: 0, zIndex: 5 };

// Pixels of scroll per "second" of timeline duration — the single knob
// that controls how much physical scrolling the story takes.
const PIXELS_PER_SECOND = 400;

export default function TestimonialsSection({ testimonials = DEFAULT_TESTIMONIALS }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const bgRef = useRef(null);
  const glowRef = useRef(null);
  const orbitRef = useRef(null);
  const orbit2Ref = useRef(null);

  const badgeRef = useRef(null);
  const headingLine1Ref = useRef(null);
  const headingLine2Ref = useRef(null);
  const paraRef = useRef(null);

  const avatarClusterRef = useRef(null);
  const avatarRefs = useRef([]);
  const statPillRef = useRef(null);

  const cardStageWrapRef = useRef(null);
  const cardRefs = useRef([]);
  const quoteIconRefs = useRef([]);
  const starGroupRefs = useRef([]);

  const navPrevRef = useRef(null);
  const navNextRef = useRef(null);

  const mobileListRef = useRef(null);

  // Scroll-jump bookkeeping (used by nav arrows + pagination dots)
  const scrollTriggerRef = useRef(null);
  const labelTimesRef = useRef([]);
  const tlDurationRef = useRef(0);
  const lastIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, testimonials.length);
    quoteIconRefs.current = quoteIconRefs.current.slice(0, testimonials.length);
    starGroupRefs.current = starGroupRefs.current.slice(0, testimonials.length);
    avatarRefs.current = avatarRefs.current.slice(0, Math.min(testimonials.length, 5));

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        isCompact: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, isCompact, reduceMotion } = context.conditions;

        // -----------------------------------------------------------
        // Reduced motion: final visible state, nothing pinned/scrubbed.
        // -----------------------------------------------------------
        if (reduceMotion) {
          gsap.set([badgeRef.current, headingLine1Ref.current, headingLine2Ref.current, paraRef.current], {
            opacity: 1,
            y: 0,
          });
          gsap.set(avatarClusterRef.current, { opacity: 1, y: 0 });
          gsap.set(statPillRef.current, { opacity: 1, y: 0 });
          cardRefs.current.forEach((el, i) => {
            if (!el) return;
            gsap.set(el, i === 0 ? CENTER : { ...HIDDEN_RIGHT, opacity: 0 });
          });
          return;
        }

        // Ambient avatar idle bob — independent of scroll, disabled
        // under reduced motion, runs at every breakpoint that isn't
        // reduced motion (both branches below share it).
        avatarRefs.current.forEach((el, i) => {
          if (!el) return;
          gsap.to(el, {
            y: i % 2 === 0 ? "-=6" : "+=6",
            duration: 2.4 + i * 0.3,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.15,
          });
        });

        // Quote-mark breathing effect, on every card (only the visible
        // one reads, but it's cheap to run on all of them).
        quoteIconRefs.current.forEach((el, i) => {
          if (!el) return;
          gsap.to(el, {
            opacity: 0.14,
            scale: 1.06,
            duration: 3 + i * 0.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });

        [orbitRef.current, orbit2Ref.current].forEach((el, i) => {
          if (!el) return;
          gsap.to(el, { rotate: i === 0 ? 360 : -360, duration: 55 + i * 20, repeat: -1, ease: "none" });
        });
        if (glowRef.current) {
          gsap.to(glowRef.current, {
            scale: 1.12,
            opacity: 0.5,
            duration: 4.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }

        // -----------------------------------------------------------
        // DESKTOP (>=1024px) — pinned, scroll-scrubbed testimonial
        // story with mouse parallax layered on top.
        // -----------------------------------------------------------
        if (isDesktop) {
          gsap.set([badgeRef.current, headingLine1Ref.current, headingLine2Ref.current, paraRef.current], {
            opacity: 0,
            y: 26,
          });
          gsap.set([avatarClusterRef.current, statPillRef.current], { opacity: 0, y: 18 });
          cardRefs.current.forEach((el, i) => {
            if (!el) return;
            if (i === 0) gsap.set(el, { ...CENTER, opacity: 0, y: 14 });
            else if (i === 1) gsap.set(el, { ...NEXT, opacity: 0 });
            else gsap.set(el, HIDDEN_RIGHT);
          });
          starGroupRefs.current.forEach((group, i) => {
            if (group && i !== 0) gsap.set(group.children, { opacity: 0, scale: 0.4 });
          });

          const tl = gsap.timeline({ paused: true });
          const labelTimes = [0];

          // --- Intro: left column + avatar cluster ------------------
          tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0)
            .to(headingLine1Ref.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.1)
            .to(headingLine2Ref.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.18)
            .to(paraRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.3)
            .to(avatarClusterRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.32)
            .to(statPillRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.4);

          // --- First card reveal --------------------------------------
          tl.to(cardRefs.current[0], { ...CENTER, opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.5);
          if (cardRefs.current[1]) {
            tl.to(cardRefs.current[1], { ...NEXT, opacity: 0.5, duration: 0.6, ease: "power3.out" }, 0.5);
          }
          if (starGroupRefs.current[0]) {
            tl.to(
              starGroupRefs.current[0].children,
              { opacity: 1, scale: 1, duration: 0.3, stagger: 0.06, ease: "back.out(2)" },
              0.75
            );
          }

          // --- One labeled 1s block per transition — this is what
          //     lets the timeline (and therefore the pinned scroll
          //     distance) scale automatically with testimonials.length.
          testimonials.forEach((_, i) => {
            if (i === 0) return;
            const label = `t-${i}`;
            tl.addLabel(label);
            labelTimes[i] = tl.time ? undefined : undefined; // placeholder, resolved after build (see below)

            const prevIdx = i - 1;
            const twoBackIdx = i - 2;
            const twoAheadIdx = i + 1;

            if (twoBackIdx >= 0 && cardRefs.current[twoBackIdx]) {
              tl.to(cardRefs.current[twoBackIdx], { ...HIDDEN_LEFT, duration: 1, ease: "power2.inOut" }, label);
            }
            if (cardRefs.current[prevIdx]) {
              tl.to(cardRefs.current[prevIdx], { ...PREV, opacity: 0.5, duration: 1, ease: "power2.inOut" }, label);
            }
            if (cardRefs.current[i]) {
              tl.to(cardRefs.current[i], { ...CENTER, opacity: 1, duration: 1, ease: "power2.inOut" }, label);
            }
            if (starGroupRefs.current[i]) {
              tl.to(
                starGroupRefs.current[i].children,
                { opacity: 1, scale: 1, duration: 0.35, stagger: 0.06, ease: "back.out(2)" },
                `${label}+=0.3`
              );
            }
            if (twoAheadIdx < testimonials.length && cardRefs.current[twoAheadIdx]) {
              tl.to(
                cardRefs.current[twoAheadIdx],
                { ...NEXT, opacity: 0.5, duration: 1, ease: "power2.inOut" },
                label
              );
            }
          });

          // Resolve actual label times now that the timeline is fully
          // built (tl.labels is populated only after addLabel calls
          // have been processed against the final timeline).
          testimonials.forEach((_, i) => {
            if (i === 0) return;
            labelTimes[i] = tl.labels[`t-${i}`] ?? labelTimes[i - 1];
          });
          labelTimesRef.current = labelTimes;
          tlDurationRef.current = tl.duration();

          const st = ScrollTrigger.create({
            trigger: stageRef.current,
            start: "top top",
            end: () => "+=" + tl.duration() * PIXELS_PER_SECOND,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            animation: tl,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const t = self.progress * tl.duration();
              let idx = 0;
              for (let i = 1; i < labelTimes.length; i++) {
                if (t >= labelTimes[i]) idx = i;
              }
              if (idx !== lastIndexRef.current) {
                lastIndexRef.current = idx;
                setActiveIndex(idx);
              }
            },
          });
          scrollTriggerRef.current = st;

          // --- Mouse parallax: shallow, independent offsets on the
          //     main card, side cards, glow, and orbit rings. Uses raw
          //     x/y (not xPercent) so it layers on top of the scrub
          //     animation instead of overwriting it. -------------------
          const parallaxTargets = [
            { get: () => cardRefs.current[activeIndexSafe(lastIndexRef.current, testimonials.length)], depth: 8 },
            { get: () => glowRef.current, depth: 14 },
            { get: () => orbitRef.current, depth: 10 },
            { get: () => orbit2Ref.current, depth: -10 },
          ];
          const quickSetters = parallaxTargets.map(({ get, depth }) => {
            const el = get();
            if (!el) return null;
            return {
              x: gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" }),
              y: gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" }),
              depth,
              get,
            };
          });

          const sectionEl = sectionRef.current;
          const onMouseMove = (e) => {
            const rect = sectionEl.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
            const my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            quickSetters.forEach((setter) => {
              if (!setter) return;
              const el = setter.get();
              if (!el) return;
              const maxPx = 10;
              setter.x(mx * (setter.depth / 14) * maxPx);
              setter.y(my * (setter.depth / 14) * maxPx);
            });
          };
          sectionEl.addEventListener("mousemove", onMouseMove);

          // gsap.matchMedia supports returning a cleanup function from
          // this callback — it runs automatically when this breakpoint
          // stops matching (resize below 1024px, or reduced motion
          // turned on mid-session).
          return () => {
            sectionEl.removeEventListener("mousemove", onMouseMove);
            scrollTriggerRef.current = null;
          };
        }

        // -----------------------------------------------------------
        // COMPACT (<1024px) — no pin. Fade-up entrance + native
        // horizontal snap-scroll row, matching the "tablet: smaller
        // cards, reduced overlap" / "mobile: swipeable" spec.
        // -----------------------------------------------------------
        if (isCompact) {
          gsap.set([badgeRef.current, headingLine1Ref.current, headingLine2Ref.current, paraRef.current], {
            opacity: 0,
            y: 22,
          });
          gsap.set([avatarClusterRef.current, statPillRef.current], { opacity: 0, y: 16 });
          starGroupRefs.current.forEach((group) => {
            if (group) gsap.set(group.children, { opacity: 1, scale: 1 });
          });

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
            .to(paraRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.3")
            .to(avatarClusterRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.25")
            .to(statPillRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.35");

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
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }
        }
      }
    );

    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testimonials]);

  // Jump to a given testimonial index — used by both nav arrows and
  // pagination dots. Converts the timeline label's time into an
  // absolute page scroll position using the live ScrollTrigger.
  const jumpToIndex = (targetIndex) => {
    const st = scrollTriggerRef.current;
    const labelTimes = labelTimesRef.current;
    const duration = tlDurationRef.current;
    if (!st || !labelTimes.length || !duration) return;

    const clamped = Math.max(0, Math.min(testimonials.length - 1, targetIndex));
    const t = labelTimes[clamped] ?? 0;
    const progress = t / duration;
    const target = st.start + progress * (st.end - st.start);
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[color:var(--color-background,#ffffff)] py-20 md:py-24 lg:py-8"
    >
      {/* Decorative background */}
      <div ref={bgRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          ref={glowRef}
          className="absolute right-[10%] top-1/3 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary-soft, rgba(99,102,241,0.16)) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--color-foreground, #111) 12%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 65% 55% at 60% 45%, black 20%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 60% 45%, black 20%, transparent 78%)",
          }}
        />
        <div
          ref={orbitRef}
          className="absolute right-[14%] top-[14%] hidden h-52 w-52 rounded-full border border-dashed border-[color:var(--color-border,#e5e7eb)] lg:block"
        />
        <div
          ref={orbit2Ref}
          className="absolute right-[4%] bottom-[10%] hidden h-36 w-36 rounded-full border border-dashed border-[color:var(--color-border,#e5e7eb)] lg:block"
        />
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto flex w-full max-w-7xl flex-col px-6 lg:min-h-screen lg:justify-center lg:px-8" /* TUNE: swap lg:min-h-screen for a fixed lg:h-[..vh] if it clips against your navbar */
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-10">
          {/* -------------------------------------------------------- */}
          {/* LEFT — badge, heading, paragraph (static once revealed)  */}
          {/* -------------------------------------------------------- */}
          <div className="relative">
            <span
              ref={badgeRef}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground,#6b7280)] backdrop-blur-md"
            >
              <IconChatBubble className="h-3.5 w-3.5" />
              Testimonials
            </span>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-[color:var(--color-foreground,#0a0a0a)] sm:text-5xl lg:text-5xl">
              <span ref={headingLine1Ref} className="block">
                Real Stories.
              </span>
              <span
                ref={headingLine2Ref}
                className="mt-1 block bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)] bg-clip-text text-transparent"
              >
                Real Transformations.
              </span>
            </h2>

            <p ref={paraRef} className="mt-4 max-w-md text-base leading-relaxed text-[color:var(--color-muted-foreground,#6b7280)] lg:text-base">
              Every student begins with a dream. Different backgrounds, different ambitions, one common outcome:{" "}
              <span className="font-semibold text-[color:var(--color-foreground)]">
                Info Channel helped transform their future.
              </span>
            </p>
          </div>

          {/* -------------------------------------------------------- */}
          {/* RIGHT — avatar cluster, card stack, nav, pagination      */}
          {/* -------------------------------------------------------- */}
          <div className="relative">
            {/* Avatar cluster */}
            <div ref={avatarClusterRef} className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {testimonials.slice(0, 5).map((t, i) => (
                  <div
                    key={t.id ?? t.name}
                    ref={(el) => (avatarRefs.current[i] = el)}
                    className="h-10 w-10 rounded-full border-2 border-[color:var(--color-card,#ffffff)] shadow-sm"
                  >
                    <Avatar name={t.name} image={t.image} gradient={AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} />
                  </div>
                ))}
              </div>
              <div
                ref={statPillRef}
                className="flex items-center gap-2 rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/70 px-4 py-2 backdrop-blur-md"
              >
                <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)] bg-clip-text text-sm font-bold text-transparent">
                  50K+
                </span>
                <span className="text-xs font-medium text-[color:var(--color-muted-foreground,#6b7280)]">
                  Happy Students
                </span>
              </div>
            </div>

            {/* Card stack — desktop/tablet, pinned + scrubbed */}
            <div
              ref={cardStageWrapRef}
              className="relative mx-auto mt-8 hidden h-[380px] w-full max-w-lg lg:mt-6 lg:block lg:h-[52vh] lg:max-h-[400px]" /* TUNE: adjust h-[..vh]/max-h if the stack feels cramped or oversized */
            >
              {testimonials.map((t, i) => (
                <TestimonialCard
                  key={t.id ?? t.name}
                  testimonial={t}
                  gradient={AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}
                  cardRef={(el) => (cardRefs.current[i] = el)}
                  quoteIconRef={(el) => (quoteIconRefs.current[i] = el)}
                  starGroupRef={(el) => (starGroupRefs.current[i] = el)}
                />
              ))}
            </div>

            {/* Card list — mobile/tablet, native horizontal snap scroll */}
            <div
              ref={mobileListRef}
              className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 lg:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {testimonials.map((t, i) => (
                <div key={t.id ?? t.name} className="w-[82%] flex-none snap-center sm:w-[60%]">
                  <TestimonialCard testimonial={t} gradient={AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} static />
                </div>
              ))}
            </div>

            {/* Navigation + pagination — desktop/tablet only, since
                mobile relies on native swipe. */}
            <div className="mt-6 hidden items-center justify-between lg:flex">
              <button
                ref={navPrevRef}
                type="button"
                aria-label="Previous testimonial"
                onClick={() => jumpToIndex(activeIndex - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/70 text-[color:var(--color-foreground)] shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-12px_rgba(0,0,0,0.25)] hover:[box-shadow:0_0_0_4px_var(--color-primary-soft,rgba(99,102,241,0.15))]"
              >
                <IconArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((t, i) => (
                  <button
                    key={t.id ?? t.name}
                    type="button"
                    aria-label={`Go to testimonial from ${t.name}`}
                    aria-current={i === activeIndex}
                    onClick={() => jumpToIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "w-7 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)]"
                        : "w-2 bg-[color:var(--color-border,#e5e7eb)] hover:bg-[color:var(--color-muted-foreground,#9ca3af)]"
                    }`}
                  />
                ))}
              </div>

              <button
                ref={navNextRef}
                type="button"
                aria-label="Next testimonial"
                onClick={() => jumpToIndex(activeIndex + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/70 text-[color:var(--color-foreground)] shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-12px_rgba(0,0,0,0.25)] hover:[box-shadow:0_0_0_4px_var(--color-primary-soft,rgba(99,102,241,0.15))]"
              >
                <IconArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Keeps the "which card should mouse-parallax react to" lookup safe
// even before the first onUpdate fires.
function activeIndexSafe(i, length) {
  if (length === 0) return 0;
  return Math.max(0, Math.min(length - 1, i));
}

/* -------------------------------------------------------------------- */
/* TestimonialCard                                                       */
/* -------------------------------------------------------------------- */
function TestimonialCard({ testimonial, gradient, cardRef, quoteIconRef, starGroupRef, static: isStatic = false }) {
  const rating = Math.max(0, Math.min(5, testimonial.rating ?? 5));

  return (
    <div
      ref={cardRef}
      className={
        isStatic
          ? "relative overflow-hidden rounded-[2rem] border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)] p-7 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.25)]"
          : "absolute inset-0 overflow-hidden rounded-[2rem] border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)] p-7 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.3)] will-change-transform sm:p-9"
      }
    >
      {/* gradient border wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-40"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-soft, rgba(99,102,241,0.15)) 0%, transparent 45%, transparent 100%)",
        }}
      />

      {/* large faded quote mark, behind the content */}
      <IconQuote
        ref={quoteIconRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 -top-4 h-28 w-28 text-[color:var(--color-primary)] opacity-[0.08]"
      />

      <div className="relative flex h-full flex-col">
        <div ref={starGroupRef} className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <IconStar
              key={i}
              className={`h-4 w-4 ${i < rating ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-border,#e5e7eb)]"}`}
            />
          ))}
        </div>

        <p className="mt-4 flex-1 text-base leading-relaxed text-[color:var(--color-foreground,#0a0a0a)] sm:text-lg">
          "{testimonial.review}"
        </p>

        <div className="mt-6 flex items-center gap-3 border-t border-[color:var(--color-border,#e5e7eb)] pt-4">
          <div className="h-11 w-11 flex-none rounded-full">
            <Avatar name={testimonial.name} image={testimonial.image} gradient={gradient} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[color:var(--color-foreground,#0a0a0a)]">{testimonial.name}</p>
            <p className="text-xs text-[color:var(--color-muted-foreground,#6b7280)]">
              {testimonial.designation}
              {testimonial.company ? ` · ${testimonial.company}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Avatar — initials placeholder, used both in the cluster and cards.    */
/* No stock images; drop a real `image` URL on a testimonial to use a    */
/* real photo instead (this component swaps to an <img> automatically). */
/* -------------------------------------------------------------------- */
function Avatar({ name, image, gradient }) {
  if (image) {
    return <img src={image} alt={name} className="h-full w-full rounded-full object-cover" />;
  }
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-semibold text-white`}>
      {initials}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Inline icons                                                          */
/* -------------------------------------------------------------------- */

function IconChatBubble(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a8 8 0 1 1-3.4-6.5" />
      <path d="M21 4 12 13l-3 1 1-3 9-9Z" />
    </svg>
  );
}

function IconArrowLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
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

function IconStar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 2.5 14.9 9l7.1.6-5.4 4.7 1.6 6.9-6.2-3.7-6.2 3.7 1.6-6.9L2 9.6 9.1 9 12 2.5Z" />
    </svg>
  );
}

// forwardRef isn't imported at the top since only this icon needs it —
// keep it self-contained with React.forwardRef via a tiny local import.
import { forwardRef } from "react";
const IconQuote = forwardRef(function IconQuote(props, ref) {
  return (
    <svg ref={ref} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M9.5 6C6.5 6 4 8.7 4 12.4c0 3 1.9 5.1 4.5 5.1 2 0 3.4-1.4 3.4-3.3 0-1.7-1.1-2.9-2.7-3-0.2 0-.4 0-.5.1.2-1.9 1.7-3.4 3.6-3.6L11.9 6H9.5Zm9.5 0c-3 0-5.5 2.7-5.5 6.4 0 3 1.9 5.1 4.5 5.1 2 0 3.4-1.4 3.4-3.3 0-1.7-1.1-2.9-2.7-3-.2 0-.4 0-.5.1.2-1.9 1.7-3.4 3.6-3.6L21.4 6H19Z" />
    </svg>
  );
});