'use client';

import Link from 'next/link';
import { Crown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#8B0000]/10 shadow-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Crown className="w-7 h-7 lg:w-9 lg:h-9 text-[#8B0000] group-hover:text-[#DC143C] transition-colors" />
            <span className="text-2xl lg:text-3xl font-bold font-montserrat text-royal-gradient">
              DevinOut
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-[#8B0000] font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-[#8B0000] font-medium transition-colors"
            >
              About
            </Link>
            
            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/business"
                  className="text-gray-700 hover:text-[#8B0000] font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/sign-in"
                  className="px-5 py-2 text-[#8B0000] hover:text-[#DC143C] font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="px-6 py-2.5 bg-royal-gradient text-white rounded-lg shadow-royal hover:shadow-royal-lg transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-[#8B0000] transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-[#8B0000]/10">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-[#8B0000] hover:bg-cream-light rounded-lg font-medium transition-all"
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-[#8B0000] hover:bg-cream-light rounded-lg font-medium transition-all"
              >
                About
              </Link>
              
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard/business"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:text-[#8B0000] hover:bg-cream-light rounded-lg font-medium transition-all"
                  >
                    Dashboard
                  </Link>
                  <div className="px-4 py-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-[#8B0000] hover:bg-cream-light rounded-lg font-semibold transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsOpen(false)}
                    className="mx-4 px-6 py-2.5 bg-royal-gradient text-white rounded-lg shadow-royal font-semibold text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
