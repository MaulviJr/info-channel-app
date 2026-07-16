import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoUrl from "../../assets/info2.svg";
import HeroSection from "../../components/home/HeroSection";
import AboutSection from "../../components/home/AboutSection";
import CourseSection from "../../components/home/CourseSection";
import TestimonialsSection from "../../components/home/TestimonialSection"
import CTASection from "../../components/home/CTASection";
function Navbar({ scrolled }) {
	return (
		<header
			className="fixed inset-x-0 top-0 z-50 h-14 transition-[background-color,box-shadow,backdrop-filter] duration-300"
			style={
				scrolled
					? {
							backgroundColor: "rgba(255,255,255,0.82)",
							backdropFilter: "blur(18px)",
							WebkitBackdropFilter: "blur(18px)",
							boxShadow: "0 1px 0 rgba(41, 56, 144, 0.08), 0 14px 40px rgba(41, 56, 144, 0.05)",
						}
					: { backgroundColor: "transparent" }
			}
		>
			<div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
				<Link to="/" className="flex items-center gap-3">
					<img src={logoUrl} alt="Info Channel Institute" className="h-8 w-8 object-contain" />
					<span
						className="text-[18px] leading-none tracking-[-0.03em] text-(--foreground)"
						style={{ fontFamily: "var(--font-sans)", fontWeight: 600 }}
					>
						Info Channel
					</span>
				</Link>

				<nav className="hidden items-center gap-6 md:flex">
					{[
						["Home", "/"],
						["About", "#about"],
						["Courses", "/courses"],
						["Testimonials", "#testimonials"],
					].map(([label, href]) => (
						<a
							key={label}
							href={href}
							className="text-[14px] text-(--muted-foreground) transition-colors duration-200 hover:text-(--foreground)"
						>
							{label}
						</a>
					))}

					<a href="/login" className="text-[14px] font-medium text-(--foreground) transition-colors duration-200 hover:opacity-75">
						Login
					</a>

					<a
						href="/signup"
						className="rounded-full bg-(--foreground) px-4.5 py-2 text-[14px] font-medium text-white shadow-[0_10px_24px_rgba(41,56,144,0.18)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(41,56,144,0.22)]"
					>
						Register
					</a>
				</nav>
			</div>
		</header>
	);
}

export default function HomePage() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 60);

		handleScroll();

		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<div className="min-h-screen bg-(--background) text-(--foreground)">
			<Navbar scrolled={scrolled} />
			<HeroSection />
			<AboutSection />
			<CourseSection />
			<TestimonialsSection />
			<CTASection />
		</div>
	);
}