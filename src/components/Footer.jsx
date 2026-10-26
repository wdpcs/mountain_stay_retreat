export default function Footer() {
  return (
    <>
      {/* Floating WhatsApp Quick Action */}
      <a
        href="https://wa.me/917025017611"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact reception on WhatsApp"
        className="fixed bottom-6 right-6 z-50 rounded-full bg-green-500 px-5 py-3.5 font-bold text-white shadow-2xl transition duration-300 hover:bg-green-600 hover:scale-105 flex items-center gap-2 text-sm"
      >
        <span className="text-lg">💬</span>
        <span className="hidden sm:inline">WhatsApp Us</span>
      </a>

      {/* Footer */}
      <footer className="bg-slate-950 py-10 px-6 text-center text-xs sm:text-sm text-slate-400 border-t border-slate-900">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5 text-left">
            <img
              src={`${(import.meta.env.BASE_URL || './').replace(/\/+$/, '')}/logo.png`}
              alt="Mountain Stay Retreat Logo"
              className="h-12 w-12 rounded-full object-contain bg-white p-0.5 shadow-md border border-slate-700"
            />
            <div>
              <p className="font-bold text-slate-200 text-sm">Mountain Stay Retreat</p>
              <p className="text-xs text-slate-400">
                Wayanad District Police Co-operative Society Ltd. No. W 208
              </p>
            </div>
          </div>
          <div>
            <p>© 2026 Mountain Stay Retreat. All Rights Reserved.</p>
          </div>
          <div className="flex gap-4 text-xs">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#rooms" className="hover:text-white transition">Rooms</a>
            <a href="#booking" className="hover:text-white transition">Book</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
