"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Menu() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = ["Home", "Features", "Pricing", "Resources"];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-white/70 shadow-md"
          : "bg-white/50 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-6">
          <img src="/favicon.ico" alt="Logo" className="w-32" />
          <h2 className="text-2xl font-semibold text-gray-800"></h2>

          <div className="hidden md:flex gap-8 ml-10 font-medium text-lg">
            {navLinks.map((link) => (
              <Link
                key={link}
                href="/"
                className="relative group text-gray-800 hover:text-gray-600 transition-colors"
              >
                {link}
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gray-800 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-800 hover:text-gray-600">
            Login
          </Link>
          <Link
            href="/"
            className="bg-gray-900 text-white px-6 py-2 rounded-2xl hover:bg-gray-700 transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
