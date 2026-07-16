import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import info2 from "../../assets/info2.svg";
gsap.registerPlugin(ScrollTrigger);

/**
 * CTASection
 * ----------------------------------------------------------------------
 * The cinematic hinge between Testimonials and the end of the page: the
 * Info Channel logo appears small and centered, the "camera" flies
 * toward it as the user scrolls, its brand-blue fill grows to cover the
 * viewport, the background blends into that same blue, and a
 * glassmorphic Register/Login card fades up out of it. One element
 * plays two roles — hero logo, then background watermark — so it never
 * "disappears", it becomes the section (see LOGO MECHANICS below).
 *
 * ASSET PATH
 * ----------------------------------------------------------------------
 * `LOGO_SRC = "/assets/info2.svg"` assumes a public-folder asset (Vite
 * `public/`, CRA `public/`, or Next.js `public/`), fetched at runtime
 * and inlined — see LOGO MECHANICS. If your SVG actually lives under
 * `src/assets` instead, swap this for a normal
 * `import logoSrc from "../../assets/info2.svg"` and drop the fetch
 * logic in favor of using `logoSrc` directly as an `<img src>` (you'll
 * lose the "always-vector-crisp at 20x scale" guarantee the inline
 * approach gives you, but it'll still work).
 *
 * LOGO MECHANICS — WHY IT'S FETCHED, NOT <img>'d
 * ----------------------------------------------------------------------
 * Browsers rasterize an `<img src="*.svg">` at roughly its rendered
 * size and can reuse that bitmap when you scale it with a CSS
 * transform — which goes soft/blurry once you're scaling 15-25x, which
 * is exactly the "logo fills the viewport" moment where crispness
 * matters most. To guarantee "no bitmap scaling", the SVG's raw markup
 * is fetched once on mount and injected via `dangerouslySetInnerHTML`,
 * so what's actually being transformed is live, resolution-independent
 * vector geometry. Falls back to a normal `<img>` if the fetch fails
 * for any reason (e.g. CORS, offline).
 *
 * THE THREE PHASES (see the big comment block inside the effect for
 * the exact GSAP tweens)
 * ----------------------------------------------------------------------
 *   1. Reveal   — logo fades/scales in small and centered, subtle
 *                 continuous idle float starts (runs the whole time,
 *                 on `y`, deliberately separate from the scrub-driven
 *                 `scale`/`rotate`/`filter` so the two never fight).
 *   2. Approach — pinned scroll-scrub: scale rockets up, a hair of
 *                 rotation and a touch of blur/brightness sell the
 *                 sense of camera movement, and once the logo is
 *                 "almost full screen" the background blends from
 *                 white to brand blue (var(--color-primary)) using the
 *                 *same* blue as the logo's own fill, so there's no
 *                 seam between "logo" and "background" — then the
 *                 logo itself fades to 3% opacity and settles as the
 *                 watermark, rather than being removed.
 *   3. Arrival  — the glass CTA card fades/slides up, as if it
 *                 emerged from inside the logo.
 *
 * TARGET SCALE IS COMPUTED, NOT HARDCODED
 * ----------------------------------------------------------------------
 * The logo needs to grow just past the largest viewport dimension to
 * guarantee full-bleed coverage at any aspect ratio. That's computed
 * from the live `window.innerWidth`/`innerHeight` at setup time, which
 * is also what naturally gives tablets a smaller absolute scale factor
 * than desktops ("tablet: reduce logo scaling") without any special
 * casing — it just falls out of the math.
 *
 * RESPONSIVE (gsap.matchMedia, re-runs automatically on resize)
 * ----------------------------------------------------------------------
 *   >=768px, motion OK    -> full pinned cinematic version (Phases 1-3)
 *   <768px, motion OK     -> no pin; the same three phases run as a
 *                            normal (non-pinned) scroll-scrub over a
 *                            shorter distance and a smaller target
 *                            scale, so it stays smooth on a phone
 *   prefers-reduced-motion -> the cinematic transition is skipped
 *                            entirely; the section renders straight
 *                            into its resting state (blue background,
 *                            watermark, visible CTA card)
 */

const LOGO_SRC = info2;
const PIXELS_PER_SECOND = 550; // scroll px per "second" of timeline duration

export default function CTASection({
  heading = "Start Your Learning Journey",
  subtitle = "Join thousands of students building successful careers with Info Channel.",
  primaryCtaLabel = "Register Now",
  secondaryCtaLabel = "Login",
  primaryHref = "#register",
  secondaryHref = "#login",
  footnote = "Already have an account?",
  footnoteLinkLabel = "Login",
}) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);

  const bgBaseRef = useRef(null);
  const bgBlueRef = useRef(null);
  const gridRef = useRef(null);

  const logoStageRef = useRef(null); // fixed-size box, holds the idle float
  const logoInnerRef = useRef(null); // scaled/rotated/blurred by the scrub

  const glowARef = useRef(null);
  const glowBRef = useRef(null);
  const particleRefs = useRef([]);
  const lineRef = useRef(null);

  const cardRef = useRef(null);
  const cardHeadingRef = useRef(null);
  const cardSubtitleRef = useRef(null);
  const cardButtonsRef = useRef(null);
  const cardFootnoteRef = useRef(null);

  const [svgMarkup, setSvgMarkup] = useState(null);

  // Fetch the raw SVG once so it can be inlined and scaled without ever
  // being rasterized (see LOGO MECHANICS above).
  useEffect(() => {
    let cancelled = false;
    fetch(LOGO_SRC)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("logo fetch failed"))))
      .then((text) => {
        if (!cancelled) setSvgMarkup(text);
      })
      .catch(() => {
        /* silently fall back to <img> below */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        isPinned: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        isMobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isPinned, isMobile, reduceMotion } = context.conditions;

        // -----------------------------------------------------------
        // Reduced motion: skip the cinematic transition entirely.
        // Render straight into the resting state.
        // -----------------------------------------------------------
        if (reduceMotion) {
          gsap.set(bgBlueRef.current, { opacity: 1 });
          gsap.set(logoInnerRef.current, { scale: 8, rotate: 0, opacity: 0.03, filter: "blur(0px) brightness(1)" });
          gsap.set(cardRef.current, { opacity: 1, y: 0, top: "50%", yPercent: -50 });
          gsap.set([cardHeadingRef.current, cardSubtitleRef.current, cardButtonsRef.current?.children, cardFootnoteRef.current], {
            opacity: 1,
            y: 0,
          });
          return;
        }

        // Ambient idle float on the logo stage — independent of the
        // scrub timeline (targets `y`, the scrub targets `scale`/
        // `rotate`/`filter` on a *different* element, so they layer
        // cleanly). Runs continuously, at both breakpoints.
        gsap.to(logoStageRef.current, {
          y: "+=10",
          duration: 3.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        // Ambient decorative motion — glows breathe, particles drift,
        // the thin line slowly rotates. Never fully stops.
        [glowARef.current, glowBRef.current].forEach((el, i) => {
          if (!el) return;
          gsap.to(el, {
            scale: 1.15,
            opacity: i === 0 ? 0.5 : 0.35,
            duration: 4.5 + i,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });
        particleRefs.current.forEach((el, i) => {
          if (!el) return;
          gsap.to(el, {
            y: i % 2 === 0 ? "-=18" : "+=18",
            x: i % 3 === 0 ? "+=10" : "-=10",
            opacity: 0.6,
            duration: 5 + i * 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.2,
          });
        });
        if (lineRef.current) {
          gsap.to(lineRef.current, { rotate: 360, duration: 90, repeat: -1, ease: "none" });
        }

        // Compute how large the logo needs to scale to guarantee
        // full-bleed coverage at the current viewport, whatever its
        // aspect ratio. This is what makes tablets get a naturally
        // smaller scale than desktops with zero special-casing.
        const baseSize = logoStageRef.current?.offsetWidth || 160;
        const targetScale = (Math.max(window.innerWidth, window.innerHeight) * 1.6) / baseSize;

        // Shared initial state for both branches below.
        gsap.set(logoInnerRef.current, { scale: 0.2, rotate: 0, opacity: 0, filter: "blur(0px) brightness(1)" });
        gsap.set(bgBlueRef.current, { opacity: 0 });
        gsap.set(gridRef.current, { opacity: 0 });
        gsap.set([cardHeadingRef.current, cardSubtitleRef.current], { opacity: 0, y: 24 });
        gsap.set(cardButtonsRef.current?.children, { opacity: 0, y: 16 });
        gsap.set(cardFootnoteRef.current, { opacity: 0, y: 10 });
        // `top: "50%"` + `yPercent: -50` reliably centers the card
        // regardless of flex quirks (an absolutely-positioned child is
        // removed from flex layout, so `items-center` on the parent
        // never actually centers it — this was the mobile bug). GSAP
        // composites `yPercent` (constant) and `y` (the entrance slide,
        // animated below) into one transform, so they don't conflict.
        gsap.set(cardRef.current, { opacity: 0, y: 40, top: "50%", yPercent: -50 });

        const tl = gsap.timeline({ paused: true });

        // --- Phase 1: reveal --------------------------------------
        tl.to(logoInnerRef.current, { opacity: 1, scale: 0.32, duration: 0.6, ease: "power2.out" }, 0);

        // --- Phase 2: approach — scale/rotate/blur/brightness all
        //     move together, camera-flying-toward-it feel. ----------
        tl.to(
          logoInnerRef.current,
          {
            scale: targetScale,
            rotate: 3,
            filter: "blur(0px) brightness(1.08)",
            duration: 4,
            ease: "power1.inOut",
          },
          0.4
        );

        // Background blend starts once the logo is "almost full
        // screen" — timed to the tail of the scale tween above, not
        // the start, per spec (don't blend early).
        tl.to(gridRef.current, { opacity: 1, duration: 0.6, ease: "power1.inOut" }, 3.0);
        tl.to(bgBlueRef.current, { opacity: 1, duration: 1.1, ease: "power2.inOut" }, 3.0);

        // --- Phase 3a: logo settles into watermark instead of
        //     vanishing — same element, opacity down, one last hair
        //     of extra scale so it reads as "continuing to grow into
        //     the background" rather than shrinking away. -----------
        tl.to(logoInnerRef.current, { opacity: 0.03, scale: targetScale * 1.08, duration: 1, ease: "power2.out" }, 4.2);

        // --- Phase 3b: CTA card emerges. ---------------------------
        tl.to(cardRef.current, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 4.7)
          .to(cardHeadingRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 4.85)
          .to(cardSubtitleRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 4.95)
          .to(cardButtonsRef.current?.children, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }, 5.05)
          .to(cardFootnoteRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 5.2);

        // -----------------------------------------------------------
        // DESKTOP / TABLET — pin the section and scrub the whole
        // timeline against the pin's scroll distance.
        // -----------------------------------------------------------
        if (isPinned) {
          const st = ScrollTrigger.create({
            trigger: stageRef.current,
            start: "top top",
            end: () => "+=" + tl.duration() * PIXELS_PER_SECOND,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            animation: tl,
            invalidateOnRefresh: true,
          });

          // Subtle mouse parallax on glows/particles/watermark once
          // the scene has settled — same pattern as TestimonialsSection:
          // raw x/y offsets on a property the scrub never touches.
          const sectionEl = sectionRef.current;
          const parallaxEls = [glowARef.current, glowBRef.current, logoStageRef.current, cardRef.current].filter(Boolean);
          const setters = parallaxEls.map((el, i) => ({
            el,
            depth: i === 2 ? 4 : 12, // logo/watermark barely moves; glows move more
            x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
          }));
          const onMouseMove = (e) => {
            const rect = sectionEl.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            setters.forEach(({ x, y, depth }) => {
              x(mx * depth);
              y(my * depth);
            });
          };
          sectionEl.addEventListener("mousemove", onMouseMove);

          return () => {
            sectionEl.removeEventListener("mousemove", onMouseMove);
            st.kill();
          };
        }

        // -----------------------------------------------------------
        // MOBILE — same three phases, no pin: a shorter, smaller,
        // normal (non-pinned) scroll-scrub tied to the section's own
        // height. `targetScale` above is already smaller here because
        // it's derived from the (smaller) viewport dimensions.
        // -----------------------------------------------------------
        if (isMobile) {
          // A fixed, computed pixel distance (not "bottom center",
          // which depends on section height and is sensitive to the
          // mobile viewport resizing as the address bar shows/hides)
          // — "shorter distance" per spec, ~55% of the desktop pace.
          const mobileTrigger = ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top 85%",
            end: () => "+=" + tl.duration() * PIXELS_PER_SECOND * 0.55,
            scrub: 0.8,
            animation: tl,
            invalidateOnRefresh: true,
          });
          return () => mobileTrigger.kill();
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[color:var(--color-background,#ffffff)]"
    >
      <div
        ref={stageRef}
        className="relative flex min-h-[640px] w-full items-center justify-center px-6 py-24 sm:px-8 md:h-screen md:min-h-0 md:px-0 md:py-0" /* mobile: natural height, not 100vh — avoids the mobile-toolbar/vh ScrollTrigger jump bug; md+: h-screen, where the pin actually needs it */
      >
        {/* Base white layer (bottom) */}
        <div ref={bgBaseRef} aria-hidden="true" className="absolute inset-0 bg-[color:var(--color-background,#ffffff)]" />

        {/* Brand-blue layer — fades in during Phase 2, same color as
            the logo's own fill so the handoff is seamless. */}
        <div
          ref={bgBlueRef}
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: "var(--color-primary, #1e2a78)", opacity: 0 }}
        />

        {/* Faint grid + radial light, only visible once blue has
            taken over. */}
        <div
          ref={gridRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, white 14%, transparent) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 78%)",
          }}
        />

        {/* Soft radial glows */}
        <div
          ref={glowARef}
          aria-hidden="true"
          className="pointer-events-none absolute left-[15%] top-[20%] h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)" }}
        />
        <div
          ref={glowBRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-[12%] bottom-[15%] h-[26rem] w-[26rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)" }}
        />

        {/* Tiny drifting particles */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              ref={(el) => (particleRefs.current[i] = el)}
              className="absolute h-1.5 w-1.5 rounded-full bg-white/40"
              style={{
                left: `${8 + ((i * 9.3) % 84)}%`,
                top: `${12 + ((i * 17.7) % 76)}%`,
              }}
            />
          ))}
        </div>

        {/* Thin rotating orbit line */}
        <div
          ref={lineRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 md:block"
        />

        {/* Logo — hero, then watermark. logoStageRef carries the idle
            float; logoInnerRef is scaled/rotated/blurred by the scrub. */}
        <div ref={logoStageRef} className="relative z-10 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
          <div ref={logoInnerRef} className="h-full w-full [&>svg]:h-full [&>svg]:w-full">
            {svgMarkup ? (
              <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            ) : (
              <img src={LOGO_SRC} alt="" className="h-full w-full object-contain" draggable={false} />
            )}
          </div>
        </div>

        {/* CTA card — glassmorphic, floats above everything */}
        <div
          ref={cardRef}
          className="absolute inset-x-6 z-20 mx-auto max-w-lg rounded-[2rem] border border-white/20 bg-white/10 p-8 text-center shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-10"
        >
          <h2 ref={cardHeadingRef} className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            {heading}
          </h2>
          <p ref={cardSubtitleRef} className="mx-auto mt-3 max-w-sm text-sm text-white/80 sm:text-base">
            {subtitle}
          </p>

          <div ref={cardButtonsRef} className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={primaryHref}
              className="w-full rounded-full bg-white px-8 py-3 text-sm font-semibold text-[color:var(--color-primary,#1e2a78)] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
            >
              {primaryCtaLabel}
            </a>
            <a
              href={secondaryHref}
              className="w-full rounded-full border border-white/60 px-8 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 sm:w-auto"
            >
              {secondaryCtaLabel}
            </a>
          </div>

          <p ref={cardFootnoteRef} className="mt-5 text-xs text-white/70">
            {footnote}{" "}
            <a href={secondaryHref} className="font-semibold text-white underline-offset-4 hover:underline">
              {footnoteLinkLabel}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}