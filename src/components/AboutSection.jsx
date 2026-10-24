export default function AboutSection({ aboutImage, fallbackImage, amenities }) {
  return (
    <section id="about" className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-lg transition duration-500 group-hover:opacity-30"></div>
          <img
            src={aboutImage}
            alt="Mountain Stay Retreat Facility"
            className="relative h-[420px] w-full rounded-3xl object-cover shadow-2xl"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            About Our Property
          </span>

          <h3 className="mt-2 mb-6 text-3xl font-extrabold sm:text-4xl text-slate-900">
            Welcome to Mountain Stay Retreat
          </h3>

          <p className="mb-6 text-base sm:text-lg leading-relaxed text-slate-600">
            Managed with pride by the <strong>Wayanad District Police Co-operative Society Ltd. No. W 208</strong>,
            Mountain Stay Retreat provides immaculate, secure, and serene accommodations in the heart of Wayanad.
          </p>

          <p className="mb-6 text-sm sm:text-base leading-relaxed text-slate-600">
            Whether visiting on official duty, a family vacation, or exploring the western ghats, guests enjoy modern rooms,
            24x7 reception, and smooth reservation processing.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3.5">
            {amenities.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700"
              >
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
