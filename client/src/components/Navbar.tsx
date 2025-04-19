import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <a className="flex items-center">
                <svg className="h-9 w-9 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334L12 2.25l-8.25 2.25 10.5 4.5 6.75-3.75z"/>
                  <path d="M12.75 15.75h-4.5a.75.75 0 01-.75-.75 3 3 0 013-3h3a.75.75 0 01.75.75m0 3h-7.5c-.414 0-.75.336-.75.75a3 3 0 003 3h6a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-1.5"/>
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">HealthChat AI</span>
              </a>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/#features">
                <a className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">Features</a>
              </Link>
              <Link href="/#how-it-works">
                <a className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">How it Works</a>
              </Link>
              <Link href="/#pricing">
                <a className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium">Pricing</a>
              </Link>
            </div>
            <div className="ml-6">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="default">Dashboard</Button>
                </Link>
              ) : (
                <div className="flex space-x-4">
                  <Link href="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/#features">
              <a className="text-gray-500 hover:text-gray-700 block px-3 py-2 text-base font-medium">Features</a>
            </Link>
            <Link href="/#how-it-works">
              <a className="text-gray-500 hover:text-gray-700 block px-3 py-2 text-base font-medium">How it Works</a>
            </Link>
            <Link href="/#pricing">
              <a className="text-gray-500 hover:text-gray-700 block px-3 py-2 text-base font-medium">Pricing</a>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <a className="bg-primary-50 border-l-4 border-primary-500 text-primary-700 block px-3 py-2 text-base font-medium">Dashboard</a>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <a className="text-gray-500 hover:text-gray-700 block px-3 py-2 text-base font-medium">Sign In</a>
                </Link>
                <Link href="/register">
                  <a className="bg-primary-50 border-l-4 border-primary-500 text-primary-700 block px-3 py-2 text-base font-medium">Get Started</a>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
