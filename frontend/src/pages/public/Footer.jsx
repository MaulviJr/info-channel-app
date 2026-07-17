import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import info2 from "../../assets/Info_logo.svg";
gsap.registerPlugin(ScrollTrigger);

/**
 * FooterSection
 * ----------------------------------------------------------------------
 * Closes out the page. Uses the site's existing --sidebar-* tokens from
 * index.css (deep navy) rather than --primary — that's deliberate: the
 * CTA section right above this is already the brand's bright blue, so
 * the footer uses the deeper navy to read as a distinct, grounding
 * "end of page" zone rather than a continuation of the CTA. No new CSS
 * variables were added; --color-sidebar / --color-sidebar-foreground /
 * --color-sidebar-border / --color-sidebar-accent all already exist in
 * your index.css `@theme inline` block.
 *
 * CONTENT NOTES
 * ----------------------------------------------------------------------
 * - Address links to a fresh Bing Maps search URL built from the
 *   address text, rather than the pasted Bing link — that one carried
 *   a Facebook click-tracking id (`fbclid`) meant for a shared link,
 *   not for embedding permanently on the site.
 * - Phone uses `tel:+923159251618` (converted from the local 0315-...
 *   format) so it's click-to-call on mobile, while still *displaying*
 *   the local format people recognize.
 * - No legal links / newsletter signup, per your last message — easy
 *   to add either later; see the two marked spots if you want them.
 *
 * ANIMATION
 * ----------------------------------------------------------------------
 * Simple, deliberately understated compared to the sections above it —
 * a single staggered fade-up on scroll-into-view (toggleActions, not
 * pinned/scrubbed; a footer doesn't need a cinematic scroll story).
 * Respects prefers-reduced-motion.
 */

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Courses", href: "#courses" },
  { label: "Testimonials", href: "#testimonials" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/infochannelpk", icon: IconFacebook },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/info-channel-institute/posts/?feedView=all", icon: IconLinkedIn },
];

const AFFILIATIONS = ["SDC", "SBTE", "PCIA"];

const ADDRESS_TEXT = "A-983, Sector 11-B, North Karachi, Karachi, Pakistan, 75850";
const ADDRESS_HREF = `https://www.bing.com/maps?q=${encodeURIComponent(ADDRESS_TEXT)}`;
const PHONE_DISPLAY = "0315-9251618";
const PHONE_HREF = "tel:+923159251618";

const LOGO_SRC = info2;

export default function Footer() {
  const footerRef = useRef(null);
  const brandColRef = useRef(null);
  const linksColRef = useRef(null);
  const contactColRef = useRef(null);
  const bottomBarRef = useRef(null);
  const orbitRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      { reduceMotion: "(prefers-reduced-motion: reduce)" },
      (context) => {
        const { reduceMotion } = context.conditions;

        if (reduceMotion) {
          gsap.set([brandColRef.current, linksColRef.current, contactColRef.current, bottomBarRef.current], {
            opacity: 1,
            y: 0,
          });
          return;
        }

        gsap.set([brandColRef.current, linksColRef.current, contactColRef.current], { opacity: 0, y: 28 });
        gsap.set(bottomBarRef.current, { opacity: 0, y: 14 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
        tl.to(brandColRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
          .to(linksColRef.current, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, "-=0.4")
          .to(contactColRef.current, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, "-=0.4")
          .to(bottomBarRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.25");

        // Ambient — slow rotate + gentle breathing, never fully stops.
        if (orbitRef.current) {
          gsap.to(orbitRef.current, { rotate: 360, duration: 70, repeat: -1, ease: "none" });
        }
        if (glowRef.current) {
          gsap.to(glowRef.current, {
            opacity: 0.35,
            scale: 1.1,
            duration: 5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative w-full overflow-hidden bg-[color:var(--color-sidebar,#1a2260)] pb-8 pt-16 lg:pt-20"
    >
      {/* Decorative background — subtle on the dark surface */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          ref={glowRef}
          className="absolute left-1/4 top-0 h-96 w-96 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 15%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 15%, transparent 70%)",
          }}
        />
        <div
          ref={orbitRef}
          className="absolute right-[6%] top-[8%] hidden h-48 w-48 rounded-full border border-dashed border-white/10 lg:block"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand column */}
          <div ref={brandColRef} className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <img src={LOGO_SRC} alt="Info Channel" className="h-10 w-10 object-contain" />
              <span className="text-lg font-semibold text-[color:var(--color-sidebar-foreground,#ffffff)]">
                Info Channel
              </span>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[color:var(--color-sidebar-foreground,#ffffff)]/70">
              Empowering students across Karachi since 2000 — practical, affordable, industry-relevant training.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {AFFILIATIONS.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[color:var(--color-sidebar-foreground,#ffffff)]/80"
                >
                  {a}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[color:var(--color-sidebar-foreground,#ffffff)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links column */}
          <div ref={linksColRef} className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-sidebar-foreground,#ffffff)]/50">
              Quick Links
            </p>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[color:var(--color-sidebar-foreground,#ffffff)]/75 transition-colors duration-200 hover:text-[color:var(--color-sidebar-foreground,#ffffff)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div ref={contactColRef} className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-sidebar-foreground,#ffffff)]/50">
              Contact
            </p>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href={ADDRESS_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 text-sm text-[color:var(--color-sidebar-foreground,#ffffff)]/75 transition-colors duration-200 hover:text-[color:var(--color-sidebar-foreground,#ffffff)]"
                >
                  <IconMapPin className="mt-0.5 h-4 w-4 flex-none text-[color:var(--color-sidebar-foreground,#ffffff)]/50 transition-colors duration-200 group-hover:text-[color:var(--color-sidebar-foreground,#ffffff)]" />
                  <span>{ADDRESS_TEXT}</span>
                </a>
              </li>
              <li>
                <a
                  href={PHONE_HREF}
                  className="group flex items-center gap-3 text-sm text-[color:var(--color-sidebar-foreground,#ffffff)]/75 transition-colors duration-200 hover:text-[color:var(--color-sidebar-foreground,#ffffff)]"
                >
                  <IconPhone className="h-4 w-4 flex-none text-[color:var(--color-sidebar-foreground,#ffffff)]/50 transition-colors duration-200 group-hover:text-[color:var(--color-sidebar-foreground,#ffffff)]" />
                  <span>{PHONE_DISPLAY}</span>
                </a>
              </li>
            </ul>

            {/* OPTIONAL SPOT 1: newsletter signup could go here if you want
                one later — an input + button following the same
                border-white/15 bg-white/5 glass treatment used above. */}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          ref={bottomBarRef}
          className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between"
        >
          <p className="text-xs text-[color:var(--color-sidebar-foreground,#ffffff)]/50">
            © {new Date().getFullYear()} Info Channel. All rights reserved.
          </p>
          {/* OPTIONAL SPOT 2: legal links (Privacy Policy / Terms) would go
              here, right-aligned next to the copyright line, once those
              pages exist. */}
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------- */
/* Inline icons                                                          */
/* -------------------------------------------------------------------- */

function IconMapPin(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

function IconPhone(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4.5h4l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v4c0 1-1 1.5-2 1.5-8 0-14-6-14-14 0-1 .5-2 1.5-2Z" />
    </svg>
  );
}

function IconFacebook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0-3.62 1.31-3.62 3.72V10.5H8.25v3H10.7V21h2.8Z" />
    </svg>
  );
}

function IconLinkedIn(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M6.94 8.5H4.06V20h2.88V8.5ZM5.5 4a1.67 1.67 0 1 0 0 3.34A1.67 1.67 0 0 0 5.5 4ZM20 13.6c0-3.1-1.66-4.54-3.87-4.54-1.79 0-2.59.98-3.03 1.67V8.5H10.2c.04.85 0 12 0 12h2.9v-6.7c0-.36.03-.72.13-.98.29-.72.96-1.47 2.08-1.47 1.47 0 2.06 1.12 2.06 2.76V20H20v-6.4Z" />
    </svg>
  );
}