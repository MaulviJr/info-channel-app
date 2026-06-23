import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';


// Maps a value from one range to another (e.g. scroll progress 0-0.5 to opacity 0-1)
const mapRange = (value, inMin, inMax, outMin, outMax) => {
  if (value <= inMin) return outMin;
  if (value >= inMax) return outMax;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
};

// Maps a value across multiple segments (useful for overshoot/bounce animations)
// Segments format: [[inMin, inMax, outMin, outMax], ...]
const mapPiecewise = (value, segments) => {
  for (let [inMin, inMax, outMin, outMax] of segments) {
    if (value >= inMin && value <= inMax) {
      return mapRange(value, inMin, inMax, outMin, outMax);
    }
  }
  if (value < segments[0][0]) return segments[0][2];
  if (value > segments[segments.length - 1][1]) return segments[segments.length - 1][3];
  return 0;
};

// Hook: Tracks media queries (for mobile & reduced motion)
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
};


// Hook: Calculates scroll progress (0 to 1) through a specific container element
const useScrollScrub = (ref, disable = false) => {
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    if (disable) {
      setProgress(1); // Force complete state if disabled (mobile/a11y)
      return;
    }

    let ticking = false;
    const updateScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        // Total scrollable area is the container's height minus the viewport height
        const maxScroll = rect.height - window.innerHeight;
        
        if (maxScroll > 0) {
          const scrolled = -rect.top;
          const normalized = Math.max(0, Math.min(1, scrolled / maxScroll));
          setProgress(normalized);
        } else {
          setProgress(1);
        }
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScroll(); // Initial measurement

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, disable]);

  return progress;
};

// Hook: Standard intersection observer for sections that don't need pin-and-scrub
const useInView = (options = { threshold: 0.1, triggerOnce: true }) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (options.triggerOnce && ref.current) observer.unobserve(ref.current);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [options.threshold, options.triggerOnce]);

  return [ref, isInView];
};


// Brand Colors
const COLORS = {
  navy: '#293890',
  gold: '#FFCC12',
  red: '#CB2027',
  bg: '#F4F4F0',
};

// Signature Gold Seal Graphic
const OfficialSeal = ({ className, style }) => (
  <svg 
    className={className} 
    style={{ color: COLORS.gold, ...style }}
    viewBox="0 0 120 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
    <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="1" />
    <path d="M60 25L66 42H84L69 52L75 70L60 58L45 70L51 52L36 42H54L60 25Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1"/>
    <text x="60" y="36" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="'Fraunces', serif" fontWeight="600" letterSpacing="0.1em" transform="rotate(-15 60 60)">OFFICIAL</text>
    <text x="60" y="92" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="'Fraunces', serif" fontWeight="600" letterSpacing="0.1em" transform="rotate(15 60 60)">RECORD</text>
  </svg>
);

// Standard Reveal Component for non-pinned sections
const Reveal = ({ children, delay = 0, className = "", type = "standard" }) => {
  const [ref, isInView] = useInView();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  const baseStyles = "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";
  let hiddenStyles = "opacity-0";
  if (type === "standard") hiddenStyles += " translate-y-8";
  if (type === "snap") hiddenStyles += " scale-95";

  const visibleStyles = type === "snap" ? "opacity-100 scale-100" : "opacity-100 translate-y-0";

  return (
    <div ref={ref} className={`${baseStyles} ${isInView ? visibleStyles : hiddenStyles} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};


const HomePage = () => {
  // Accessibility & Environment
  const isMobile = useMediaQuery('(max-width: 768px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const disablePinning = isMobile || prefersReducedMotion;

  // Refs for scroll-scrubbed sections
  const heroRef = useRef(null);
  const heroProgress = useScrollScrub(heroRef, disablePinning);

  const statsRef = useRef(null);
  const statsProgress = useScrollScrub(statsRef, disablePinning);

  const badgeRef = useRef(null);
  const badgeProgress = useScrollScrub(badgeRef, disablePinning);

  // Inject Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="min-h-screen selection:bg-[#293890] selection:text-white" style={{ backgroundColor: COLORS.bg, color: COLORS.navy, fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. Navbar */}
      <nav className="border-b py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-[#F4F4F0]/90" style={{ borderColor: `${COLORS.navy}33` }}>
        <Link to="/" className="text-xl md:text-2xl font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy, outlineColor: COLORS.navy }}>
          Info Channel Institute
        </Link>
        <div className="flex items-center gap-6 md:gap-8">
          <Link to="/courses" className="text-sm font-medium transition-colors hover:opacity-70 focus:outline-none focus:ring-2 rounded-sm px-1" style={{ outlineColor: COLORS.navy }}>Courses</Link>
          <Link to="/about" className="hidden md:block text-sm font-medium transition-colors hover:opacity-70 focus:outline-none focus:ring-2 rounded-sm px-1" style={{ outlineColor: COLORS.navy }}>About</Link>
          <Link to="/login" className="text-sm font-medium border px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm hover:text-white" style={{ borderColor: COLORS.navy, color: COLORS.navy, outlineColor: COLORS.navy }} onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.navy} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            Login
          </Link>
        </div>
      </nav>

      <main>
        {/* 2. Apple-Style Pinned Hero Section */}
        <section 
          ref={heroRef} 
          className="relative w-full" 
          style={{ height: disablePinning ? 'auto' : '200vh' }}
        >
          <div 
            className={`w-full px-6 md:px-12 flex flex-col justify-center max-w-7xl mx-auto ${disablePinning ? 'py-24' : 'sticky top-0 h-screen overflow-hidden'}`}
          >
            <div className="max-w-4xl relative">
              <h1 className="text-6xl md:text-8xl font-bold leading-[1.05] tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy }}>
                <span 
                  className="block will-change-transform"
                  style={{ 
                    opacity: mapRange(heroProgress, 0.0, 0.2, 0, 1), 
                    transform: `translateY(${mapRange(heroProgress, 0.0, 0.2, 40, 0)}px)` 
                  }}
                >
                  Learn a skill.
                </span>
                <span 
                  className="block will-change-transform"
                  style={{ 
                    opacity: mapRange(heroProgress, 0.15, 0.35, 0, 1), 
                    transform: `translateY(${mapRange(heroProgress, 0.15, 0.35, 40, 0)}px)` 
                  }}
                >
                  Get certified.
                </span>
              </h1>
              
              <p 
                className="mt-8 text-lg md:text-xl max-w-2xl leading-relaxed will-change-transform"
                style={{ 
                  color: COLORS.navy, opacity: 0.8,
                  opacity: mapRange(heroProgress, 0.3, 0.5, 0, 0.8),
                  transform: `translateY(${mapRange(heroProgress, 0.3, 0.5, 20, 0)}px)`
                }}
              >
                We are a practical skill-building institute. No fluff, just hands-on instructors 
                teaching web development, digital marketing, and design. Pass the course, and we 
                physically hand-deliver your official certificate.
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
                <div 
                  className="flex gap-4 will-change-transform"
                  style={{ 
                    opacity: mapRange(heroProgress, 0.6, 0.8, 0, 1),
                    transform: `translateY(${mapRange(heroProgress, 0.6, 0.8, 15, 0)}px)`
                  }}
                >
                  <Link to="/courses" className="text-white px-8 py-4 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90" style={{ backgroundColor: COLORS.navy, outlineColor: COLORS.navy }}>
                    Browse Courses
                  </Link>
                  <Link to="/about" className="border px-8 py-4 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.navy, color: COLORS.navy, outlineColor: COLORS.navy }} onMouseEnter={(e) => { e.target.style.backgroundColor = COLORS.navy; e.target.style.color = 'white'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = COLORS.navy; }}>
                    How it works
                  </Link>
                </div>
                
                {/* Scroll-scrubbed Hero Seal */}
                <div className="hidden sm:block sm:ml-8 absolute right-[-80px] top-[-20px] will-change-transform">
                  <OfficialSeal 
                    className="w-24 h-24" 
                    style={{
                      opacity: mapRange(heroProgress, 0.5, 0.75, 0, 1),
                      transform: `scale(${mapRange(heroProgress, 0.5, 0.75, 0.2, 1)}) rotate(${mapRange(heroProgress, 0.5, 0.75, 60, -10)}deg)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {}
        
        {/* 3. Photo Strip (Bulletin Board) - Standard Reveal */}
        <section className="px-6 md:px-12 py-10 relative z-10 bg-white border-y" style={{ borderColor: `${COLORS.navy}33` }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-center">
              <Reveal delay={0} type="snap">
                <div className="border p-2 bg-white rotate-[-1deg]" style={{ borderColor: COLORS.navy }}>
                  <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80" alt="Students collaborating" className="w-full aspect-[4/3] object-cover grayscale-[20%]" />
                </div>
              </Reveal>
              <Reveal delay={100} type="snap">
                <div className="border p-2 bg-white rotate-[2deg]" style={{ borderColor: COLORS.navy }}>
                  <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" alt="Classroom lecture" className="w-full aspect-square object-cover grayscale-[20%]" />
                </div>
              </Reveal>
              <Reveal delay={200} type="snap">
                <div className="border p-2 bg-white rotate-[-2deg]" style={{ borderColor: COLORS.navy }}>
                  <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80" alt="Coding on laptop" className="w-full aspect-[3/4] object-cover grayscale-[20%]" />
                </div>
              </Reveal>
              <Reveal delay={300} type="snap">
                <div className="border p-2 bg-white rotate-[1deg]" style={{ borderColor: COLORS.navy }}>
                  <img src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=600&q=80" alt="Physical certificates" className="w-full aspect-square object-cover grayscale-[20%]" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {}

        {/* 4. Stats Row (Ledger Style) - Apple-Style Pinned Scrub */}
        <section 
          ref={statsRef} 
          className="relative w-full"
          style={{ height: disablePinning ? 'auto' : '300vh', backgroundColor: COLORS.bg }}
        >
          <div className={`w-full max-w-7xl mx-auto px-6 md:px-12 ${disablePinning ? 'py-24' : 'sticky top-0 h-screen flex flex-col justify-center'}`}>
            
            {/* Top Border Hairline */}
            <div className="w-full h-[1px] mb-12 origin-left" style={{ backgroundColor: `${COLORS.navy}40`, transform: `scaleX(${mapRange(statsProgress, 0, 0.1, 0, 1)})` }} />
            
            <div className="flex flex-col md:flex-row gap-12 md:gap-0">
              {/* Stat 1 */}
              <div className="flex-1 md:pr-12 relative group" style={{ opacity: mapRange(statsProgress, 0.05, 0.15, 0, 1) }}>
                <div className="font-mono text-5xl tracking-tight" style={{ color: COLORS.navy }}>
                  {Math.floor(mapRange(statsProgress, 0.1, 0.35, 0, 242))}
                </div>
                <div className="mt-4 uppercase tracking-widest text-xs font-semibold opacity-70" style={{ color: COLORS.navy }}>
                  Students Enrolled
                </div>
                <div className="absolute bottom-[-16px] left-0 h-[1px] origin-left" style={{ backgroundColor: COLORS.navy, width: `${mapRange(statsProgress, 0.1, 0.35, 0, 100)}%` }} />
              </div>
              
              {/* Stat 2 */}
              <div className="flex-1 md:px-12 relative" style={{ opacity: mapRange(statsProgress, 0.35, 0.45, 0, 1) }}>
                <div className="font-mono text-5xl tracking-tight" style={{ color: COLORS.navy }}>
                  {Math.floor(mapRange(statsProgress, 0.4, 0.65, 0, 18))}
                </div>
                <div className="mt-4 uppercase tracking-widest text-xs font-semibold opacity-70" style={{ color: COLORS.navy }}>
                  Courses Running
                </div>
                <div className="absolute bottom-[-16px] left-0 h-[1px] origin-left" style={{ backgroundColor: COLORS.navy, width: `${mapRange(statsProgress, 0.4, 0.65, 0, 100)}%` }} />
              </div>

              {/* Stat 3 */}
              <div className="flex-1 md:pl-12 relative flex justify-between items-start" style={{ opacity: mapRange(statsProgress, 0.65, 0.75, 0, 1) }}>
                <div>
                  <div className="font-mono text-5xl tracking-tight" style={{ color: COLORS.navy }}>
                    {Math.floor(mapRange(statsProgress, 0.7, 0.95, 0, 100))}%
                  </div>
                  <div className="mt-4 uppercase tracking-widest text-xs font-semibold opacity-70" style={{ color: COLORS.navy }}>
                    Certificates Delivered
                  </div>
                </div>
                <div className="absolute bottom-[-16px] left-0 h-[1px] origin-left" style={{ backgroundColor: COLORS.navy, width: `${mapRange(statsProgress, 0.7, 0.95, 0, 100)}%` }} />
              </div>
            </div>

            {/* Bottom Border Hairline */}
            <div className="w-full h-[1px] mt-12 origin-left" style={{ backgroundColor: `${COLORS.navy}40`, transform: `scaleX(${mapRange(statsProgress, 0.8, 0.95, 0, 1)})` }} />
          </div>
        </section>

        {}

        {/* 5. Featured Courses - Standard Reveal */}
        <section className="bg-white py-24 px-6 md:px-12 border-t border-b" style={{ borderColor: `${COLORS.navy}33` }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-bold mb-16" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy }}>
                Current Curriculum
              </h2>
            </Reveal>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Course Card 1 */}
              <Reveal delay={100}>
                <div className="border p-5 flex flex-col h-full bg-[#FDFDFD]" style={{ borderColor: `${COLORS.navy}80` }}>
                  <div className="aspect-[16/9] border mb-5 overflow-hidden" style={{ borderColor: `${COLORS.navy}33` }}>
                    <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80" alt="Code on screen" className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-tight" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy }}>Full-Stack Web Development</h3>
                  <p className="font-mono text-sm mb-4 opacity-70" style={{ color: COLORS.navy }}>Inst: Ali Raza</p>
                  <div className="mt-auto pt-6 flex justify-between items-end border-t" style={{ borderColor: `${COLORS.navy}33` }}>
                    <div className="font-mono text-sm font-semibold" style={{ color: COLORS.navy }}>Rs. 15,000</div>
                    <Link to="/courses/web-dev" className="text-sm font-medium hover:opacity-70 underline underline-offset-4 focus:outline-none focus:ring-2 rounded-sm" style={{ color: COLORS.red, outlineColor: COLORS.navy }}>View course</Link>
                  </div>
                </div>
              </Reveal>

              {/* Course Card 2 */}
              <Reveal delay={200}>
                <div className="border p-5 flex flex-col h-full bg-[#FDFDFD]" style={{ borderColor: `${COLORS.navy}80` }}>
                  <div className="aspect-[16/9] border mb-5 overflow-hidden" style={{ borderColor: `${COLORS.navy}33` }}>
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" alt="Marketing analytics" className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-tight" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy }}>Digital Marketing Pro</h3>
                  <p className="font-mono text-sm mb-4 opacity-70" style={{ color: COLORS.navy }}>Inst: Sana Khan</p>
                  <div className="mt-auto pt-6 flex justify-between items-end border-t" style={{ borderColor: `${COLORS.navy}33` }}>
                    <div className="font-mono text-sm font-semibold" style={{ color: COLORS.navy }}>Rs. 12,000</div>
                    <Link to="/courses/digital-marketing" className="text-sm font-medium hover:opacity-70 underline underline-offset-4 focus:outline-none focus:ring-2 rounded-sm" style={{ color: COLORS.red, outlineColor: COLORS.navy }}>View course</Link>
                  </div>
                </div>
              </Reveal>

              {/* Course Card 3 */}
              <Reveal delay={300}>
                <div className="border p-5 flex flex-col h-full bg-[#FDFDFD]" style={{ borderColor: `${COLORS.navy}80` }}>
                  <div className="aspect-[16/9] border mb-5 overflow-hidden" style={{ borderColor: `${COLORS.navy}33` }}>
                    <img src="https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80" alt="Design tools" className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-tight" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy }}>Graphic Design Fundamentals</h3>
                  <p className="font-mono text-sm mb-4 opacity-70" style={{ color: COLORS.navy }}>Inst: Usman Ahmed</p>
                  <div className="mt-auto pt-6 flex justify-between items-end border-t" style={{ borderColor: `${COLORS.navy}33` }}>
                    <div className="font-mono text-sm font-semibold" style={{ color: COLORS.navy }}>Rs. 10,000</div>
                    <Link to="/courses/graphic-design" className="text-sm font-medium hover:opacity-70 underline underline-offset-4 focus:outline-none focus:ring-2 rounded-sm" style={{ color: COLORS.red, outlineColor: COLORS.navy }}>View course</Link>
                  </div>
                </div>
              </Reveal>
            </div>
            
            <div className="mt-16 text-center">
              <Reveal delay={400}>
                <Link to="/courses" className="inline-block border px-8 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.navy, color: COLORS.navy, outlineColor: COLORS.navy }} onMouseEnter={(e) => { e.target.style.backgroundColor = COLORS.navy; e.target.style.color = 'white'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = COLORS.navy; }}>
                  View Full Catalog
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 6. Testimonials (Student Records) - Standard Reveal */}
        <section className="py-24 px-6 md:px-12" style={{ backgroundColor: COLORS.bg }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-bold mb-16" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy }}>
                Student Records
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16">
              {/* Record 1 */}
              <Reveal delay={100} direction="none" className="relative pt-6">
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ backgroundColor: `${COLORS.navy}40` }} />
                <div className="font-mono text-xs font-medium px-2 py-1 inline-block mb-5" style={{ backgroundColor: `${COLORS.navy}1A`, color: COLORS.navy }}>
                  GR-2024-0312 — Web Development
                </div>
                <p className="leading-relaxed mb-6" style={{ color: COLORS.navy }}>
                  "Got my first freelance client on Upwork after this course. The practical approach was exactly what I needed. They don't just teach theory; they make you build real projects."
                </p>
                <p className="text-sm font-medium italic opacity-70" style={{ color: COLORS.navy }}>
                  — Bilal M., completed March 2024
                </p>
              </Reveal>

              {/* Record 2 */}
              <Reveal delay={250} direction="none" className="relative pt-6">
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ backgroundColor: `${COLORS.navy}40` }} />
                <div className="font-mono text-xs font-medium px-2 py-1 inline-block mb-5" style={{ backgroundColor: `${COLORS.navy}1A`, color: COLORS.navy }}>
                  GR-2023-1105 — Digital Marketing
                </div>
                <p className="leading-relaxed mb-6" style={{ color: COLORS.navy }}>
                  "The instructors actually work in the industry. I learned how to run proper ad campaigns, not just textbook definitions. The physical certificate helped me secure an internship."
                </p>
                <p className="text-sm font-medium italic opacity-70" style={{ color: COLORS.navy }}>
                  — Ayesha T., completed November 2023
                </p>
              </Reveal>

              {/* Record 3 */}
              <Reveal delay={100} direction="none" className="relative pt-6">
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ backgroundColor: `${COLORS.navy}40` }} />
                <div className="font-mono text-xs font-medium px-2 py-1 inline-block mb-5" style={{ backgroundColor: `${COLORS.navy}1A`, color: COLORS.navy }}>
                  GR-2024-0122 — Graphic Design
                </div>
                <p className="leading-relaxed mb-6" style={{ color: COLORS.navy }}>
                  "Affordable and straight to the point. The labs are well-equipped, and getting the hand-delivered certificate at the end felt like a real achievement. Highly recommended."
                </p>
                <p className="text-sm font-medium italic opacity-70" style={{ color: COLORS.navy }}>
                  — Saad R., completed January 2024
                </p>
              </Reveal>

              {/* Record 4 */}
              <Reveal delay={250} direction="none" className="relative pt-6">
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ backgroundColor: `${COLORS.navy}40` }} />
                <div className="font-mono text-xs font-medium px-2 py-1 inline-block mb-5" style={{ backgroundColor: `${COLORS.navy}1A`, color: COLORS.navy }}>
                  GR-2023-0840 — Web Development
                </div>
                <p className="leading-relaxed mb-6" style={{ color: COLORS.navy }}>
                  "I was struggling to learn from YouTube tutorials. The structured environment and accountability here changed everything. I am now working as a junior frontend developer."
                </p>
                <p className="text-sm font-medium italic opacity-70" style={{ color: COLORS.navy }}>
                  — Hira K., completed August 2023
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {}

        {/* 7. Trust Badge & Seal Press Moment - Apple-Style Pinned Scrub */}
        <section 
          ref={badgeRef} 
          className="relative w-full border-t"
          style={{ height: disablePinning ? 'auto' : '150vh', borderColor: `${COLORS.navy}33`, backgroundColor: 'white' }}
        >
          <div className={`w-full max-w-4xl mx-auto px-6 text-center ${disablePinning ? 'py-32' : 'sticky top-0 h-screen flex flex-col justify-center items-center overflow-hidden'}`}>
            
            <div 
              className="will-change-transform"
              style={{ 
                opacity: mapRange(badgeProgress, 0, 0.2, 0, 1),
                transform: `translateY(${mapRange(badgeProgress, 0, 0.2, 30, 0)}px)`
              }}
            >
              <h3 className="text-2xl md:text-4xl font-bold uppercase tracking-widest mb-4" style={{ fontFamily: "'Fraunces', serif", color: COLORS.navy }}>
                Official Verification
              </h3>
              <p className="text-lg opacity-80 max-w-xl mx-auto mb-12" style={{ color: COLORS.navy }}>
                Every graduate is recorded in our permanent ledger. Certificates are issued physically and hand-delivered to ensure authenticity and pride of achievement.
              </p>
            </div>

            <div className="relative flex justify-center w-full max-w-[200px] aspect-square mx-auto will-change-transform">
              <OfficialSeal 
                className="w-full h-full"
                style={{
                  // The overshoot map: Scale 0 to 1.3 to 0.95 to 1.0
                  transform: `scale(${mapPiecewise(badgeProgress, [
                    [0.2, 0.6, 0.3, 1.3],
                    [0.6, 0.8, 1.3, 0.95],
                    [0.8, 1.0, 0.95, 1.0]
                  ])}) rotate(${mapRange(badgeProgress, 0.2, 0.8, 45, 0)}deg)`,
                  opacity: mapRange(badgeProgress, 0.2, 0.4, 0, 1)
                }}
              />
            </div>
            
          </div>
        </section>
      </main>

      {}

      {/* 8. Footer */}
      <footer className="text-white py-12 px-6 md:px-12 border-t-4" style={{ backgroundColor: COLORS.navy, borderColor: COLORS.gold }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-xs">
            <h4 className="text-xl font-bold mb-4" style={{ fontFamily: "'Fraunces', serif" }}>Info Channel Institute</h4>
            <p className="text-sm mb-2 opacity-80">123 Main Commercial Area, <br/>Karachi, Pakistan</p>
            <p className="text-sm opacity-80">info@infochannel.edu.pk <br/>+92 300 1234567</p>
          </div>
          
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="transition-colors hover:opacity-70 focus:outline-none focus:ring-2 rounded-sm" style={{ outlineColor: COLORS.gold }}>
              <span className="sr-only">Facebook</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="transition-colors hover:opacity-70 focus:outline-none focus:ring-2 rounded-sm" style={{ outlineColor: COLORS.gold }}>
              <span className="sr-only">LinkedIn</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          <p className="text-xs font-mono tracking-wider opacity-60">
            © {new Date().getFullYear()} INFO CHANNEL INSTITUTE. ALL RIGHTS RESERVED.
          </p>
          <p className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.gold }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Certificates issued and hand-delivered upon course completion.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;