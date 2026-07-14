import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo3DHero from "../3D/Logo3DHero";

const NAV_HEIGHT = 56;

function usePrefersReducedMotion() {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

		handleChange();

		if (typeof mediaQuery.addEventListener === "function") {
			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}

		mediaQuery.addListener(handleChange);
		return () => mediaQuery.removeListener(handleChange);
	}, []);

	return prefersReducedMotion;
}

export default function HeroSection() {
	const [mounted, setMounted] = useState(false);
	const [mouse, setMouse] = useState({ x: 0, y: 0 });
	const reducedMotion = usePrefersReducedMotion();

	const stats = [
		["50K+", "Students"],
		["100+", "Expert Instructors"],
		["200+", "Courses"],
	];

	const decorativeParticles = [
		{ top: "12%", left: "18%", size: 10, delay: "0s" },
		{ top: "24%", left: "78%", size: 8, delay: "1.2s" },
		{ top: "68%", left: "14%", size: 12, delay: "0.6s" },
		{ top: "78%", left: "76%", size: 9, delay: "1.7s" },
	];

	const orbitRings = [
		{ size: "100%", delay: "0s" },
		{ size: "78%", delay: "-6s" },
		{ size: "58%", delay: "-12s" },
	];

	useEffect(() => {
		setMounted(true);
	}, []);

	const contentVisible = mounted || reducedMotion;

	const handleMouseMove = (event) => {
		if (reducedMotion) return;

		const rect = event.currentTarget.getBoundingClientRect();
		if (!rect.width || !rect.height) return;

		const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
		const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

		setMouse({ x, y });
	};

	const shadowX = `${mouse.x * 8}px`;
	const shadowY = `${mouse.y * 8}px`;

	return (
		<main className="relative min-h-screen w-full overflow-hidden" onMouseMove={handleMouseMove}>
			<div className="premium-hero absolute inset-0 bg-(--background) text-(--foreground)" aria-hidden="true">
				<div className="premium-bg absolute inset-0 pointer-events-none">
					<div className="premium-bg__grid" />
					<div className="premium-bg__orb premium-bg__orb--one" />
					<div className="premium-bg__orb premium-bg__orb--two" />
					<div className="premium-bg__vignette" />
				</div>
			</div>

			<section
				className={`hero-stage relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center px-4 pb-16 pt-[calc(${NAV_HEIGHT}px+2rem)] sm:px-6 lg:px-10 lg:pt-[calc(${NAV_HEIGHT}px+3rem)] ${
					contentVisible ? "hero-stage--visible" : ""
				} ${reducedMotion ? "hero-stage--reduced" : ""}`}
			>
				<div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)] lg:gap-10">
					<div className="order-1 flex flex-col items-start text-left lg:max-w-2xl">
						<h1 className="hero-title max-w-[12ch] text-balance text-[clamp(3.2rem,7vw,5.5rem)] font-semibold leading-[0.9] tracking-tighter text-(--foreground)">
							20+ Years of <span className="hero-gradient-text">Transforming Lives</span>
						</h1>

						<p className={`hero-copy hero-copy--bottom mt-6 max-w-[58ch] text-[clamp(1rem,1.4vw,1.125rem)] leading-[1.7] text-(--muted-foreground) ${contentVisible ? "hero-copy--body-visible" : ""}`}>
							Build practical skills, guided by expert instructors and a curriculum designed to feel premium, focused, and career-ready from the first click.
						</p>

						<div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
							<Link
								to="/courses"
								className="inline-flex items-center justify-center rounded-full bg-(--foreground) px-6 py-3.5 text-[15px] font-medium text-white shadow-[0_14px_32px_rgba(41,56,144,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(41,56,144,0.24)] sm:min-w-44"
							>
								Explore Courses →
							</Link>
							<a
								href="#about"
								className="inline-flex items-center justify-center rounded-full border border-(--border) bg-white/70 px-6 py-3.5 text-[15px] font-medium text-(--foreground) shadow-[0_10px_30px_rgba(41,56,144,0.08)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-(--foreground)/20 hover:bg-white/90 sm:min-w-37.5"
							>
								Learn More
							</a>
						</div>

						<div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
							{stats.map(([value, label]) => (
								<div
									key={label}
									className="hero-stat-card rounded-3xl border border-white/70 bg-white/72 p-5 shadow-[0_20px_55px_rgba(41,56,144,0.08)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_26px_70px_rgba(41,56,144,0.12)]"
								>
									<p className="text-[1.65rem] font-semibold leading-none tracking-tighter text-(--foreground)">{value}</p>
									<p className="mt-2 text-sm leading-6 text-(--muted-foreground)">{label}</p>
								</div>
							))}
						</div>
					</div>

					<div className="order-2 flex justify-center lg:justify-end">
						<div className={`hero-logo-stage ${contentVisible ? "hero-logo-stage--visible" : ""}`}>
							<div className="hero-logo-stage__light" aria-hidden="true" />
							<div className="hero-logo-stage__glow" aria-hidden="true" />
							<div className="hero-logo-stage__pedestal" aria-hidden="true" />
							<div className="hero-logo-stage__orbits" aria-hidden="true">
								{orbitRings.map((ring) => (
									<span
										key={`${ring.size}-${ring.delay}`}
										className="hero-logo-stage__orbit"
										style={{ width: ring.size, height: ring.size, animationDelay: ring.delay }}
									/>
								))}
							</div>
							<div className="hero-logo-stage__particles" aria-hidden="true">
								{decorativeParticles.map((particle) => (
									<span
										key={`${particle.top}-${particle.left}`}
										className="hero-logo-stage__particle"
										style={{
											top: particle.top,
											left: particle.left,
											width: `${particle.size}px`,
											height: `${particle.size}px`,
											animationDelay: particle.delay,
										}}
									/>
								))}
							</div>
							<div
								className={`hero-logo-wrap ${contentVisible ? "hero-logo-wrap--visible" : ""}`}
								style={{
									width: "clamp(300px, 36vw, 470px)",
									height: "clamp(300px, 36vw, 470px)",
									filter: reducedMotion
										? "drop-shadow(0px 0px 22px rgba(41,56,144,0.18))"
										: `drop-shadow(${shadowX} ${shadowY} 22px rgba(41,56,144,0.22))`,
								}}
							>
								<Logo3DHero autoRotate={!reducedMotion} style={{ width: "100%", height: "100%", minHeight: 0, cursor: "grab" }} />
							</div>
						</div>
					</div>
				</div>
			</section>

			<style>{`\
				.premium-hero {
					position: relative;
				}

				.premium-bg {
					position: absolute;
					inset: 0;
					overflow: hidden;
				}

				.premium-bg__grid {
					position: absolute;
					inset: 0;
					opacity: 0.4;
					background-image:
						linear-gradient(rgba(41, 56, 144, 0.06) 1px, transparent 1px),
						linear-gradient(90deg, rgba(41, 56, 144, 0.05) 1px, transparent 1px);
					background-size: 72px 72px;
					mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.95), transparent 82%);
				}

				.premium-bg__orb {
					position: absolute;
					border-radius: 999px;
					filter: blur(18px);
					animation: premiumBlobFloat 14s ease-in-out infinite;
				}

				.premium-bg__orb--one {
					top: -8rem;
					right: -4rem;
					width: 32rem;
					height: 32rem;
					background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(41, 56, 144, 0.08) 48%, rgba(41, 56, 144, 0) 72%);
				}

				.premium-bg__orb--two {
					left: -10rem;
					top: 12rem;
					width: 26rem;
					height: 26rem;
					background: radial-gradient(circle, rgba(255, 204, 18, 0.2), rgba(255, 255, 255, 0) 72%);
					animation-delay: -5s;
				}

				.premium-bg__vignette {
					position: absolute;
					inset: 0;
					background: radial-gradient(circle at center, rgba(255, 255, 255, 0) 20%, rgba(244, 244, 240, 0.15) 70%, rgba(244, 244, 240, 0.45) 100%);
				}

				@keyframes heroRiseIn {
					from { transform: translateY(16px); }
					to { transform: translateY(0); }
				}

				@keyframes heroScaleIn {
					from { opacity: 0; transform: scale(0.85); }
					to { opacity: 1; transform: scale(1); }
				}

				@keyframes heroUnderlineIn {
					from { transform: scaleX(0); }
					to { transform: scaleX(1); }
				}

				@keyframes premiumBlobFloat {
					0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
					50% { transform: translate3d(0, 18px, 0) scale(1.03); }
				}

				@keyframes heroOrbitRotate {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}

				@keyframes heroPedestalPulse {
					0%, 100% { transform: translateX(-50%) scale(0.98); opacity: 0.65; }
					50% { transform: translateX(-50%) scale(1.03); opacity: 1; }
				}

				@keyframes heroParticleFloat {
					0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
					50% { transform: translate3d(0, -14px, 0) scale(1.1); opacity: 1; }
				}

				@keyframes heroBadgeFloat {
					0%, 100% { transform: translate3d(0, 0, 0); }
					50% { transform: translate3d(0, -6px, 0); }
				}

				.hero-stage--reduced .hero-copy,
				.hero-stage--reduced .hero-logo-wrap,
				.hero-stage--reduced .hero-guidance::after,
				.hero-stage--reduced .hero-logo-stage__orbit,
				.hero-stage--reduced .hero-logo-stage__particle,
				.hero-stage--reduced .hero-logo-stage__pedestal,
				.hero-stage--reduced .hero-badge--floating,
				.hero-stage--reduced .premium-bg__orb {
					animation: none !important;
					opacity: 1 !important;
					transform: none !important;
				}

				.hero-stage--visible .hero-kicker {
					animation: heroRiseIn 600ms ease-out 220ms forwards;
				}

				.hero-stage--visible .hero-title {
					animation: heroRiseIn 750ms cubic-bezier(0.16, 1, 0.3, 1) 320ms forwards;
				}

				.hero-stage--visible .hero-copy--top {
					animation: heroRiseIn 700ms ease-out 300ms forwards;
				}

				.hero-stage--visible .hero-logo-wrap {
					animation: heroScaleIn 900ms cubic-bezier(0.16, 1, 0.3, 1) 500ms forwards;
				}

				.hero-stage--visible .hero-copy--bottom {
					animation: heroRiseIn 700ms ease-out 700ms forwards;
				}

				.hero-stage--visible .hero-logo-stage__pedestal {
					animation: heroPedestalPulse 5.5s ease-in-out infinite;
				}

				.hero-stage--visible .hero-logo-stage__orbit {
					animation: heroOrbitRotate 22s linear infinite;
				}

				.hero-stage--visible .hero-logo-stage__particle {
					animation: heroParticleFloat 5s ease-in-out infinite;
				}

				.hero-stage--visible .hero-badge--floating {
					animation: heroBadgeFloat 4.8s ease-in-out infinite;
				}

				.hero-kicker {
					margin: 0;
					text-transform: uppercase;
					letter-spacing: 0.24em;
					font-size: 0.78rem;
					font-weight: 600;
					color: color-mix(in srgb, var(--muted-foreground) 78%, var(--foreground));
				}

				.hero-gradient-text {
					display: inline-block;
					background: linear-gradient(90deg, var(--primary), var(--chart-1));
					-webkit-background-clip: text;
					background-clip: text;
					-webkit-text-fill-color: transparent;
				}

                

				.hero-badge {
					display: inline-flex;
					align-items: center;
					gap: 0.625rem;
					padding: 0.7rem 1rem;
					border-radius: 999px;
					border: 1px solid rgba(255, 255, 255, 0.85);
					background: rgba(255, 255, 255, 0.75);
					backdrop-filter: blur(14px);
					-webkit-backdrop-filter: blur(14px);
					box-shadow: 0 12px 34px rgba(41, 56, 144, 0.08);
					color: var(--foreground);
					font-size: 0.875rem;
					font-weight: 600;
				}

				.hero-badge__dot {
					width: 0.55rem;
					height: 0.55rem;
					border-radius: 999px;
					background: var(--primary);
					box-shadow: 0 0 0 6px rgba(41, 56, 144, 0.08);
				}

				.hero-logo-stage {
					position: relative;
					display: grid;
					place-items: center;
					width: min(100%, 560px);
					aspect-ratio: 1;
					isolation: isolate;
				}

				.hero-logo-stage__light {
					position: absolute;
					inset: 10%;
					border-radius: 999px;
					background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(41, 56, 144, 0.12) 44%, rgba(41, 56, 144, 0) 72%);
					filter: blur(28px);
					opacity: 0.9;
					z-index: 0;
				}

				.hero-logo-stage__glow {
					position: absolute;
					inset: 18%;
					border-radius: 999px;
					background: radial-gradient(circle, rgba(255, 255, 255, 0.75), rgba(41, 56, 144, 0.1) 52%, rgba(41, 56, 144, 0) 78%);
					filter: blur(24px);
					opacity: 0.9;
					z-index: 1;
				}

				.hero-logo-stage__pedestal {
					position: absolute;
					left: 50%;
					bottom: 6%;
					width: 62%;
					height: 20%;
					transform: translateX(-50%);
					border-radius: 999px;
					background: radial-gradient(circle at center, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.8) 35%, rgba(41, 56, 144, 0.08) 70%, rgba(41, 56, 144, 0) 100%);
					box-shadow: 0 20px 48px rgba(41, 56, 144, 0.1);
					opacity: 0.95;
					z-index: 2;
				}

				.hero-logo-stage__orbits,
				.hero-logo-stage__particles {
					position: absolute;
					inset: 0;
					z-index: 3;
					pointer-events: none;
				}

				.hero-logo-stage__orbit {
					position: absolute;
					top: 50%;
					left: 50%;
					border-radius: 999px;
					border: 1px solid rgba(41, 56, 144, 0.16);
					transform: translate(-50%, -50%);
					box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.35);
				}

				.hero-logo-stage__particle {
					position: absolute;
					border-radius: 999px;
					background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.2) 60%, rgba(255, 255, 255, 0) 100%);
					box-shadow: 0 0 16px rgba(41, 56, 144, 0.12);
					filter: blur(0.1px);
				}

				.hero-logo-wrap {
					position: relative;
					z-index: 4;
					will-change: transform, filter;
				}

				.hero-guidance {
					position: relative;
					display: inline-block;
					color: inherit;
				}

				.hero-guidance::after {
					content: "";
					position: absolute;
					left: 0;
					right: 0;
					bottom: -10px;
					height: 3px;
					background: #293890;
					transform-origin: left;
					transform: scaleX(0);
				}

				.hero-stage--visible .hero-guidance::after {
					animation: heroUnderlineIn 500ms ease-out 900ms forwards;
				}

				@media (max-width: 1024px) {
					.hero-stage {
						padding-bottom: 4rem;
					}

					.hero-logo-stage {
						width: min(100%, 500px);
					}
				}

				@media (max-width: 640px) {
					.hero-stage {
						gap: 2rem;
						padding-top: calc(${NAV_HEIGHT}px + 1.5rem);
						padding-bottom: 2.5rem;
					}

					.hero-title {
						max-width: 100%;
					}

					.hero-logo-stage {
						width: min(100%, 390px);
					}

					.hero-badge {
						align-self: flex-start;
					}

					.hero-stage .sm\:flex-row {
						flex-direction: column;
					}

					.hero-stage a,
					.hero-stage .inline-flex {
						width: 100%;
					}

					.hero-stage .sm\:grid-cols-3 {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</main>
	);
}