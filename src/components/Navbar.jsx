import { useState } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Rooms', href: '#rooms' },
    { name: 'Dormitory', href: '#dormitory' },
    { name: 'Booking', href: '#booking' },
    { name: 'Contact', href: '#contact' },
  ];

  const logoUrl = `${(import.meta.env.BASE_URL || './').replace(/\/+$/, '')}/logo.png`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div>
          <a href="#" className="flex items-center gap-3.5 group">
            <img
              src={logoUrl}
              alt="Mountain Stay Retreat Logo"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-contain bg-white shadow-xs border border-slate-200/80 group-hover:scale-105 transition-transform duration-300"
            />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 leading-tight">
                Mountain Stay Retreat
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                WDPCS Accommodation • Suites & Dormitory
              </p>
            </div>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden gap-6 items-center text-sm font-semibold md:flex text-slate-700">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-blue-600 transition"
            >
              {link.name}
            </a>
          ))}
          <a
            href="#booking"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Reserve Now
          </a>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden shadow-lg">
          <nav className="flex flex-col gap-3 text-sm font-semibold text-slate-800">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-blue-600 transition"
              >
                {link.name}
              </a>
            ))}
            <a
              href="#booking"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 text-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Reserve Now
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
