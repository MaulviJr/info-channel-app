// components/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer"; // Uncomment this when you create your Footer

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-(--background) text-(--foreground)">
            <Navbar />
            
            {/* flex-grow ensures the main content pushes the footer to the bottom */}
            <main className="flex-grow">
                <Outlet /> 
            </main>
            
            <Footer />
        </div>
    );
}