export default function Hero({ bgImage }) {
  return (
    <section
      className="relative flex min-h-[75vh] md:h-[85vh] items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url("${bgImage}")`,
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>

      <div className="relative z-10 max-w-4xl px-6 py-16 text-center text-white">
        <span className="inline-block rounded-full bg-blue-500/20 border border-blue-400/30 px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-blue-300 mb-6 backdrop-blur-sm">
          Wayanad District Police Co-operative Society (W 208)
        </span>

        <h2 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl md:text-7xl">
          Experience Comfort & Peace
        </h2>

        <p className="mb-8 text-base text-slate-200 sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Premium stay facility featuring 5 luxury suite rooms and a
          15-bed dormitory for travelers, families, police personnel, and corporate groups in Wayanad.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#booking"
            className="rounded-2xl bg-blue-600 px-8 py-4 text-base sm:text-lg font-bold shadow-xl transition hover:bg-blue-700 hover:shadow-2xl"
          >
            Book Now
          </a>

          <a
            href="#rooms"
            className="rounded-2xl border border-white/40 bg-white/15 px-8 py-4 text-base sm:text-lg font-semibold backdrop-blur-sm transition hover:bg-white/25"
          >
            Explore Rooms
          </a>
        </div>
      </div>
    </section>
  );
}
