export default function ContactSection() {
  return (
    <section id="contact" className="bg-slate-100 px-6 py-20 border-t border-slate-200/60">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Reach Us
          </span>
          <h3 className="mt-2 mb-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Contact & Location
          </h3>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Connect with our front desk reception for reservations, group bookings, and travel queries.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {/* Phone Card */}
          <div className="rounded-3xl bg-white p-8 shadow-sm text-center border border-slate-200/60">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-600">
              📞
            </div>
            <h4 className="mb-2 text-lg font-bold text-slate-900">Phone & Reception</h4>
            <div className="space-y-2 text-left font-semibold text-slate-600 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-normal">Reception (24x7):</span>
                <a href="tel:+917025017611" className="hover:text-blue-600 font-bold transition text-sm">
                  +91 70250 17611
                </a>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                <span className="text-slate-500 font-normal">Manager:</span>
                <a href="tel:+918301995940" className="hover:text-blue-600 font-bold transition text-sm">
                  +91 83019 95940
                </a>
              </div>
              <div className="text-[11px] text-slate-400 font-normal text-center pt-1">
                Available daily for guest inquiries & booking support
              </div>
            </div>
          </div>

          {/* Email Card */}
          <div className="rounded-3xl bg-white p-8 shadow-sm text-center border border-slate-200/60">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-600">
              ✉️
            </div>
            <h4 className="mb-2 text-lg font-bold text-slate-900">Official Email</h4>
            <p className="text-slate-600 font-semibold text-sm">
              wdpcs.208@gmail.com
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Wayanad District Police Co-operative Society
            </p>
          </div>

          {/* Location Card */}
          <div className="rounded-3xl bg-white p-8 shadow-sm text-center border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-600">
                📍
              </div>
              <h4 className="mb-2 text-lg font-bold text-slate-900">Retreat Location</h4>
              <p className="text-slate-700 font-medium text-xs sm:text-sm leading-relaxed mb-3">
                Kalpetta North Post, Opposite to Skyface Apartment, SP office Road, Wayanad, Kerala - 673122
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Opposite+to+Skyface+Apartment,+SP+office+Road,+Kalpetta+North,+Wayanad,+Kerala+673122"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              Open in Google Maps ↗
            </a>
          </div>
        </div>

        {/* Embedded Interactive Google Map */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 px-6 sm:px-8 py-5 bg-white">
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>📍</span> Find Us on Google Maps
              </h4>
              <p className="text-xs sm:text-sm text-slate-500">
                Easily navigate to Mountain Stay Retreat
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Opposite+to+Skyface+Apartment,+SP+office+Road,+Kalpetta+North,+Wayanad,+Kerala+673122"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 sm:mt-0 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>Open in Google Maps App</span>
              <span>↗</span>
            </a>
          </div>

          <div className="relative h-80 sm:h-96 w-full bg-slate-100">
            <iframe
              title="Mountain Stay Retreat Location Map"
              src="https://maps.google.com/maps?q=Opposite+to+Skyface+Apartment,+SP+office+Road,+Kalpetta+North,+Wayanad,+Kerala+673122&t=&z=14&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
