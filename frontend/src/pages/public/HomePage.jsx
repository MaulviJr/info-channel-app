// pages/HomePage.jsx
import React from "react";
import HeroSection from "../../components/home/HeroSection";
import AboutSection from "../../components/home/AboutSection";
import CourseSection from "../../components/home/CourseSection";
import TestimonialsSection from "../../components/home/TestimonialSection";
import CTASection from "../../components/home/CTASection";

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <AboutSection />
            <CourseSection />
            <TestimonialsSection />
            <CTASection />
        </>
    );
}