export default function RoomsSection({
  suites,
  availability,
  suitePrice,
  dormPrice,
  dormImage,
  fallbackImage,
}) {
  return (
    <>
      {/* Rooms (Suites) */}
      <section id="rooms" className="bg-slate-50 px-6 py-20 border-t border-slate-100">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              <span className="inline-block rounded-full bg-blue-100 border border-blue-200 px-4 py-1.5 text-xs font-bold text-blue-700">
                🛋️ {availability.availableSuites} / 5 Suites Currently Available
              </span>
              {availability.maintenanceSuites > 0 && (
                <span className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-800 border border-amber-300">
                  🛠️ {availability.maintenanceSuites} Suite{availability.maintenanceSuites !== 1 ? 's' : ''} Under Maintenance
                </span>
              )}
            </div>

            <h3 className="mb-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Executive Suite Rooms
            </h3>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Elegant and spacious rooms crafted for comfort, quiet relaxation, and family stays. Total 5 Suite Rooms available.
            </p>
          </div>

          <div className="grid items-stretch gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {suites.map((room) => (
              <div
                key={room.id}
                className="flex h-full flex-col overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-md transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="relative h-72 sm:h-80 w-full overflow-hidden">
                  <img
                    src={room.image}
                    alt={room.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImage;
                    }}
                  />
                  <span className="absolute top-4 right-4 rounded-full bg-slate-900/80 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-white">
                    5 Units Total
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {room.title}
                    </h4>

                    <span className="text-lg font-extrabold text-blue-600">
                      ₹{suitePrice.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-slate-500"> / night</span>
                    </span>
                  </div>

                  <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600">
                    {room.description}
                  </p>

                  <a
                    href="#booking"
                    className="block w-full text-center rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
                  >
                    Reserve Suite
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dormitory */}
      <section id="dormitory" className="bg-white px-6 py-20 border-t border-slate-100">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-block rounded-full bg-indigo-100 border border-indigo-200 px-4 py-1.5 text-xs font-bold text-indigo-700">
                🛏️ {availability.availableDormBeds} / 15 Beds Currently Available
              </span>
              {availability.maintenanceDormBeds > 0 && (
                <span className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-800 border border-amber-300">
                  🛠️ {availability.maintenanceDormBeds} Bed{availability.maintenanceDormBeds !== 1 ? 's' : ''} Under Maintenance
                </span>
              )}
            </div>

            <h3 className="mb-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
              15-Bed Dormitory
            </h3>

            <p className="mb-6 text-base sm:text-lg leading-relaxed text-slate-600">
              Affordable, secure, and clean dormitory accommodation perfect for
              individual backpackers, police batches, student groups, and travelers.
            </p>

            <ul className="space-y-3 text-sm text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span> Individual secure lockers for luggage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span> High-speed Wi-Fi internet access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span> Clean shared washroom facilities with hot water
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span> 24-hour security & desk assistance
              </li>
            </ul>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-600">
                ₹{dormPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                / bed per night
              </span>
            </div>

            <div className="mt-6">
              <a
                href="#booking"
                className="inline-block rounded-2xl bg-indigo-600 px-8 py-3.5 font-bold text-white shadow-md transition hover:bg-indigo-700"
              >
                Reserve Dorm Bed
              </a>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-blue-500 opacity-20 blur-lg transition duration-500 group-hover:opacity-30"></div>
            <img
              src={dormImage}
              alt="Mountain Stay Retreat Dormitory Facility"
              className="relative h-[420px] w-full rounded-3xl object-cover shadow-2xl"
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
