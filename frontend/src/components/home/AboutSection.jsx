import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import infoImage from "../../assets/Reception.webp"
import labImage from "../../assets/lab.webp"
gsap.registerPlugin(ScrollTrigger);

/**
 * AboutSection
 * ----------------------------------------------------------------------
 * Continues the Hero's premium white / glassmorphism / gradient design
 * language. All colors are pulled from CSS custom properties defined in
 * index.css so this section stays perfectly in sync with the Hero.
 *
 * Tokens pulled straight from index.css (shadcn/Tailwind v4 --theme
 * inline block), so this section inherits the Hero's palette exactly:
 *
 *   --color-background     base page background (near-white)
 *   --color-card           card / glass surface color
 *   --color-foreground     primary text color
 *   --color-muted-foreground  secondary / paragraph text color
 *   --color-border          hairline border color
 *   --color-primary         navy — gradient start, primary accent
 *   --color-primary-2       tonal blue — gradient end (stays in the
 *                           navy family so text/blob gradients never
 *                           blend across the blue→gold hue jump)
 *   --color-primary-soft    low-opacity navy wash for glows / blobs
 *
 * --color-accent (the brand gold) is intentionally NOT used in any
 * gradient here — it's reserved for flat, isolated highlights only,
 * since blending navy and gold directly produces a muddy green-gray
 * middle tone. If you want a gold accent somewhere (e.g. the badge
 * icon or a stat highlight), apply it as a solid fill/text color, not
 * as one end of a gradient.
 *
 * VIEWPORT-FIT LAYOUT
 * ----------------------------------------------------------------------
 * At the lg breakpoint (desktop, e.g. 1920x1080) this section is sized
 * to fit inside one viewport without scrolling:
 *   - section padding, headings, paragraph, cards, and stats all get an
 *     lg-specific compact scale, separate from their (larger, roomier)
 *     mobile/tablet sizing
 *   - feature cards go from a 2x2 grid to a single row of 4 at lg
 *   - the image column height is capped with a vh unit + max-height so
 *     it scales with the viewport instead of forcing a fixed 600px
 *   - `lg:min-h-screen lg:flex lg:items-center` on the section vertically
 *     centers the (now-shorter) content within exactly one screen
 * The exact `lg:h-[..vh]` and `lg:py-*` numbers depend on your fixed
 * navbar height and browser chrome, which I can't see from here — if
 * it's still a touch too tall or too short in your browser, this is
 * the first place to nudge (see the two spots flagged below).
 *
 * Animation architecture
 * ----------------------------------------------------------------------
 * 1. Entrance timeline (left column) — badge, heading, paragraph lines,
 *    feature cards, stats. Plays once when the section enters the
 *    viewport (toggleActions "play none none reverse").
 * 2. Scrubbed reveal timeline (right column) — the building image and
 *    student image reveal via clip-path, driven directly by scroll
 *    progress (scrub: true), exactly like Apple product pages.
 * 3. Independent parallax — background blobs, floating cards, and the
 *    quote card each move at their own speed via individual
 *    ScrollTrigger.create calls with scrub.
 * 4. Ambient motion — slow orbital rotation on the decorative rings and
 *    a gentle idle float on the trust/quote cards. Not scroll-linked;
 *    purely atmospheric, and disabled under reduced motion.
 * 5. Count-up — statistics animate their numbers once, on entry.
 *
 * Everything is registered inside a single gsap.context() scoped to the
 * section root and torn down on unmount via ctx.revert(), which also
 * kills every ScrollTrigger instance created inside it.
 */

const FEATURE_CARDS = [
  {
    id: "affiliation",
    title: "Affiliated with",
    highlight: "SBTE SDC & PFA",
    icon: IconInstitution,
  },
  {
    id: "experience",
    title: "20+ Years",
    highlight: "Trusted Excellence",
    icon: IconMentor,
  },
  {
    id: "affordability",
    title: "Affordable",
    highlight: "Quality Education",
    icon: IconGraduationCap,
  },
  {
    id: "focus",
    title: "Focused on",
    highlight: "Your Future",
    icon: IconTarget,
  },
];

const STATS = [
  { id: "students", value: 5000, suffix: "+", label: "Students Trained" },
  { id: "instructors", value: 100, suffix: "+", label: "Expert Instructors" },
  { id: "courses", value: 200, suffix: "+", label: "Courses Offered" },
  { id: "years", value: 20, suffix: "+", label: "Years of Impact" },
];

// Paragraph split into discrete lines so each can animate in on its own,
// matching the "appears line by line" requirement. Condensed to 3 lines
// (was 4) to help the section fit in one viewport at lg.
const PARAGRAPH_LINES = [
  <>
    Affiliated with{" "}
    <span className="font-semibold text-[color:var(--color-foreground)]">
      SBTE SDC
    </span>{" "}
    and{" "}
    <span className="font-semibold text-[color:var(--color-foreground)]">
      PFA
    </span>
    , Info Channel has been empowering students across Karachi{" "}
    <span className="font-semibold text-[color:var(--color-foreground)]">
      since 2000
    </span>
    .
  </>,
  <>
    For more than two decades, we've made{" "}
    <span className="font-semibold text-[color:var(--color-foreground)]">
      quality education
    </span>{" "}
    accessible and{" "}
    <span className="font-semibold text-[color:var(--color-foreground)]">
      affordable
    </span>
    , helping thousands of students turn ambition into real careers.
  </>,
  <>
    Our mission remains unchanged: to{" "}
    <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)] bg-clip-text font-semibold text-transparent">
      transform lives
    </span>{" "}
    through technology, knowledge, and the right guidance.
  </>,
];

export default function AboutSection() {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);

  const badgeRef = useRef(null);
  const headingLine1Ref = useRef(null);
  const headingLine2Ref = useRef(null);
  const paraLineRefs = useRef([]);
  const featuresWrapRef = useRef(null);
  const statsWrapRef = useRef(null);
  const statValueRefs = useRef([]);

  const buildingImgRef = useRef(null);
  const buildingGlowRef = useRef(null);
  const studentImgRef = useRef(null);
  const trustCardRef = useRef(null);
  const quoteCardRef = useRef(null);
  const skillsCardRef = useRef(null);
  const orbitRef = useRef(null);
  const orbit2Ref = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      // ---------------------------------------------------------------
      // Reduced motion: snap everything to its final, fully-visible
      // state and skip every ScrollTrigger. No animation is created.
      // ---------------------------------------------------------------
      if (prefersReducedMotion) {
        gsap.set(
          [
            badgeRef.current,
            headingLine1Ref.current,
            headingLine2Ref.current,
            ...paraLineRefs.current,
            featuresWrapRef.current?.children,
            statsWrapRef.current?.children,
          ],
          { opacity: 1, y: 0, clearProps: "transform" }
        );
        gsap.set([buildingImgRef.current, studentImgRef.current], {
          clipPath: "inset(0% 0% 0% 0%)",
        });
        gsap.set(
          [trustCardRef.current, quoteCardRef.current, skillsCardRef.current],
          { opacity: 1, y: 0, x: 0, rotate: 0 }
        );
        statValueRefs.current.forEach((el, i) => {
          if (el) el.textContent = `${STATS[i].value.toLocaleString()}${STATS[i].suffix}`;
        });
        return;
      }

      const isDesktop = window.innerWidth >= 1024;

      // ---------------------------------------------------------------
      // 1. ENTRANCE TIMELINE — left column content, sequenced.
      // ---------------------------------------------------------------
      const entrance = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });

      entrance
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        )
        .fromTo(
          headingLine1Ref.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "-=0.3"
        )
        .fromTo(
          headingLine2Ref.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "-=0.45"
        )
        .fromTo(
          paraLineRefs.current,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.14,
          },
          "-=0.3"
        )
        .fromTo(
          featuresWrapRef.current?.children,
          { opacity: 0, y: 28, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: 0.12,
          },
          "-=0.2"
        )
        .fromTo(
          statsWrapRef.current?.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.1,
            onStart: animateStatValues,
          },
          "-=0.25"
        );

      function animateStatValues() {
        statValueRefs.current.forEach((el, i) => {
          if (!el) return;
          const stat = STATS[i];
          const counter = { val: 0 };
          gsap.to(counter, {
            val: stat.value,
            duration: 1.4,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = `${Math.floor(counter.val).toLocaleString()}${
                stat.suffix
              }`;
            },
          });
        });
      }

      // ---------------------------------------------------------------
      // 2. SCRUBBED IMAGE REVEALS — clip-path driven directly by
      //    scroll position, exactly tracking scroll percentage.
      // ---------------------------------------------------------------
      gsap.fromTo(
        buildingImgRef.current,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: buildingImgRef.current,
            start: "top 90%",
            end: "top 30%",
            scrub: 0.6,
          },
        }
      );

      gsap.fromTo(
        studentImgRef.current,
        { clipPath: "inset(0% 0% 100% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: studentImgRef.current,
            start: "top 95%",
            end: "top 55%",
            scrub: 0.6,
          },
        }
      );

      // Glow behind the building image expands as the image reveals.
      gsap.fromTo(
        buildingGlowRef.current,
        { scale: 0.6, opacity: 0.15 },
        {
          scale: 1.15,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: buildingImgRef.current,
            start: "top 90%",
            end: "top 20%",
            scrub: 0.8,
          },
        }
      );

      // ---------------------------------------------------------------
      // 3. INDEPENDENT PARALLAX — each element travels at its own
      //    speed so nothing moves in lockstep with anything else.
      // ---------------------------------------------------------------
      const parallaxTargets = [
        { el: trustCardRef.current, yPercent: isDesktop ? -18 : -6, rotate: -2 },
        { el: quoteCardRef.current, yPercent: isDesktop ? 22 : 8, rotate: 1.5 },
        { el: skillsCardRef.current, yPercent: isDesktop ? -12 : -4, rotate: -1 },
      ];

      parallaxTargets.forEach(({ el, yPercent, rotate }) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { yPercent: 0, rotate: 0 },
          {
            yPercent,
            rotate,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      });

      // Background blobs drift slowest — deep background parallax layer.
      if (bgRef.current) {
        gsap.to(bgRef.current.querySelectorAll("[data-blob]"), {
          yPercent: (i) => (i % 2 === 0 ? 12 : -12),
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      // Decorative orbit rings rotate slowly, continuously, tied loosely
      // to scroll so they never feel perfectly mechanical.
      [orbitRef.current, orbit2Ref.current].forEach((el, i) => {
        if (!el) return;
        gsap.to(el, {
          rotate: i === 0 ? 360 : -360,
          duration: 40 + i * 15,
          repeat: -1,
          ease: "none",
        });
      });

      // Card fade-ins for the right column (independent of the entrance
      // timeline so their arrival can feel slightly delayed / floaty).
      gsap.fromTo(
        [trustCardRef.current, quoteCardRef.current, skillsCardRef.current],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Gentle ambient idle float on the two smaller floating cards —
      // purely atmospheric, layered on top of the scroll parallax.
      gsap.to(trustCardRef.current, {
        y: "+=10",
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(quoteCardRef.current, {
        y: "-=12",
        duration: 3.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.4,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[color:var(--color-background,#ffffff)] py-16 md:py-20 lg:py-10 lg:min-h-screen lg:flex lg:items-center"
    >
      {/* ------------------------------------------------------------ */}
      {/* Background layer — gradients, blurred blobs, dot pattern      */}
      {/* ------------------------------------------------------------ */}
      <div ref={bgRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          data-blob
          className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary-soft, rgba(99,102,241,0.12)) 0%, transparent 70%)",
          }}
        />
        <div
          data-blob
          className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary-soft, rgba(99,102,241,0.12)) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--color-foreground, #111) 14%, transparent) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(ellipse 60% 60% at 50% 40%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 60% at 50% 40%, black 30%, transparent 75%)",
          }}
        />
        <div className="absolute right-[8%] top-[12%] h-64 w-64 rounded-full border border-[color:var(--color-border,#e5e7eb)]" />
        <div className="absolute left-[4%] bottom-[18%] h-40 w-40 rounded-full border border-[color:var(--color-border,#e5e7eb)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* ---------------------------------------------------------- */}
          {/* LEFT COLUMN                                                 */}
          {/* ---------------------------------------------------------- */}
          <div className="relative order-2 lg:order-1">
            {/* Badge */}
            <span
              ref={badgeRef}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground,#6b7280)] backdrop-blur-md"
            >
              <IconUsers className="h-3.5 w-3.5" />
              About Info Channel
            </span>

            {/* Heading — lg size trimmed from 6xl to 5xl to save vertical space */}
            <h2 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-[color:var(--color-foreground,#0a0a0a)] sm:text-5xl lg:mt-4 lg:text-5xl">
              <span ref={headingLine1Ref} className="block">
                Empowering Karachi
              </span>
              <span
                ref={headingLine2Ref}
                className="mt-1 block bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)] bg-clip-text text-transparent"
              >
                Since 2000
              </span>
            </h2>

            {/* Description — 3 lines instead of 4, and sized back down at lg */}
            <div className="mt-4 max-w-xl space-y-2 text-base leading-relaxed text-[color:var(--color-muted-foreground,#6b7280)] sm:text-lg lg:mt-4 lg:space-y-2 lg:text-base">
              {PARAGRAPH_LINES.map((line, i) => (
                <p
                  key={i}
                  ref={(el) => (paraLineRefs.current[i] = el)}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Feature icon cards — 2x2 on mobile/tablet, single compact row of 4 at lg */}
            <div
              ref={featuresWrapRef}
              className="mt-6 grid grid-cols-2 gap-3 lg:mt-5 lg:grid-cols-4 lg:gap-3"
            >
              {FEATURE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className="group relative overflow-hidden rounded-2xl border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/60 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.15)] lg:p-3"
                  >
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
                      style={{
                        background:
                          "radial-gradient(circle, var(--color-primary-soft, rgba(99,102,241,0.25)) 0%, transparent 70%)",
                      }}
                    />
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-2)] text-white shadow-sm lg:h-8 lg:w-8">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="relative mt-3 text-xs font-medium text-[color:var(--color-muted-foreground,#6b7280)] lg:mt-2">
                      {card.title}
                    </p>
                    <p className="relative text-sm font-semibold text-[color:var(--color-foreground,#0a0a0a)]">
                      {card.highlight}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Statistics */}
            <div
              ref={statsWrapRef}
              className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-5"
            >
              {STATS.map((stat, i) => (
                <div
                  key={stat.id}
                  className="rounded-2xl border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/60 px-3 py-4 text-center shadow-sm backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 lg:py-3"
                >
                  <p
                    ref={(el) => (statValueRefs.current[i] = el)}
                    className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-2)] bg-clip-text text-xl font-bold text-transparent sm:text-2xl lg:text-xl"
                  >
                    0
                  </p>
                  <p className="mt-1 text-xs font-medium text-[color:var(--color-muted-foreground,#6b7280)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT COLUMN — images + floating cards                     */}
          {/* height is vh-capped at lg so it scales with the viewport   */}
          {/* instead of a fixed 600px — this is the second spot to      */}
          {/* nudge (try 65–75vh) if it's still slightly too tall/short  */}
          {/* against your real navbar.                                 */}
          {/* ---------------------------------------------------------- */}
          <div className="relative order-1 mx-auto h-[380px] w-full max-w-md sm:h-[460px] lg:order-2 lg:mx-0 lg:h-[70vh] lg:max-h-[600px] lg:min-h-[380px] lg:max-w-none">
            {/* Orbital decorative rings */}
            <div
              ref={orbitRef}
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 rounded-full border border-dashed border-[color:var(--color-border,#e5e7eb)] lg:block"
            />
            <div
              ref={orbit2Ref}
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 -left-6 hidden h-28 w-28 rounded-full border border-dashed border-[color:var(--color-border,#e5e7eb)] lg:block"
            />

            {/* Glow behind building image */}
            <div
              ref={buildingGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, var(--color-primary-soft, rgba(99,102,241,0.3)) 0%, transparent 70%)",
              }}
            />

            {/* Image 1 — institute building */}
            <div
              ref={buildingImgRef}
              className="absolute right-0 top-0 h-[75%] w-[78%] overflow-hidden rounded-[2rem] border border-[color:var(--color-border,#e5e7eb)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]"
              style={{ clipPath: "inset(100% 0% 0% 0%)" }}
            >
              <img
                src={infoImage}
                alt="Institute Building"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Image 2 — students in computer lab */}
            <div
              ref={studentImgRef}
              className="absolute bottom-0 left-0 h-[46%] w-[52%] overflow-hidden rounded-[1.5rem] border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)] shadow-[0_25px_50px_-15px_rgba(0,0,0,0.25)]"
              style={{ clipPath: "inset(0% 0% 100% 0%)" }}
            >
              <img
                src={labImage}
                alt="Students in Computer Lab"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Floating trust card */}
            <div
              ref={trustCardRef}
              className="absolute left-[6%] top-[8%] flex items-center gap-3 rounded-2xl border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/80 px-4 py-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] backdrop-blur-lg"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-2)] text-white">
                <IconHeart className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[color:var(--color-foreground,#0a0a0a)]">
                  Trusted by
                </p>
                <p className="text-sm font-semibold text-[color:var(--color-foreground,#0a0a0a)]">
                  Thousands
                </p>
              </div>
            </div>

            {/* Floating skills card */}
            <div
              ref={skillsCardRef}
              className="absolute right-[4%] top-[42%] flex items-center gap-3 rounded-2xl border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/80 px-4 py-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] backdrop-blur-lg"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-2)] text-white">
                <IconGraduationCap className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[color:var(--color-foreground,#0a0a0a)]">
                  Building Skills
                </p>
                <p className="text-sm font-semibold text-[color:var(--color-foreground,#0a0a0a)]">
                  Shaping Futures
                </p>
              </div>
            </div>

            {/* Floating quote card */}
            <div
              ref={quoteCardRef}
              className="absolute -bottom-6 right-[6%] max-w-[15rem] rounded-2xl border border-[color:var(--color-border,#e5e7eb)] bg-[color:var(--color-card,#ffffff)]/85 px-5 py-4 shadow-[0_25px_50px_-15px_rgba(0,0,0,0.25)] backdrop-blur-lg"
            >
              <IconChat className="h-4 w-4 text-[color:var(--color-primary)]" />
              <p className="mt-2 text-sm font-medium italic leading-snug text-[color:var(--color-foreground,#0a0a0a)]">
                "We don't just teach. We transform lives."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- */
/* Inline outline icons — kept local so this file has zero extra deps    */
/* beyond gsap. Swap for lucide-react equivalents if your project        */
/* already depends on it (Building2, GraduationCap, Target, Heart,       */
/* MessageCircle, Users2, UserCheck map 1:1 to these).                   */
/* -------------------------------------------------------------------- */

function IconInstitution(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-5 7 5v11" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 13h.01M15 13h.01M9 9h.01M15 9h.01" />
    </svg>
  );
}

function IconMentor(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 21c0-4 3.1-6.5 7-6.5S19 17 19 21" />
      <path d="M3.5 10.5c.6-1.6 2-2.5 2-2.5M20.5 10.5c-.6-1.6-2-2.5-2-2.5" />
    </svg>
  );
}

function IconGraduationCap(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z" />
      <path d="M6 12v5c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7v-5" />
      <path d="M21 9.5v5.5" />
    </svg>
  );
}

function IconTarget(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconHeart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20.5s-7.5-4.6-9.8-9.3C.8 8 2.4 4.5 6 4c2.1-.3 3.9.8 6 3 2.1-2.2 3.9-3.3 6-3 3.6.5 5.2 4 3.8 7.2-2.3 4.7-9.8 9.3-9.8 9.3Z" />
    </svg>
  );
}

function IconChat(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a8 8 0 1 1-3.4-6.5" />
      <path d="M21 4 12 13l-3 1 1-3 9-9Z" />
    </svg>
  );
}

function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
      <circle cx="17.5" cy="9" r="2.4" />
      <path d="M21.5 20c0-2.5-1.7-4.6-4-5.4" />
    </svg>
  );
}