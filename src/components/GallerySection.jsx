export default function GallerySection({ galleryImages, fallbackImage }) {
  return (
    <section className="bg-slate-50 px-6 py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Visual Tour
          </span>
          <h3 className="mt-2 mb-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Property Photo Gallery
          </h3>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Take a look at the rooms, surroundings, and facilities at Mountain Stay Retreat.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {galleryImages.map((img, index) => (
            <div
              key={`${img}-${index}`}
              className="overflow-hidden rounded-3xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={img}
                alt={`Mountain Stay Retreat view ${index + 1}`}
                className="h-64 sm:h-72 w-full object-cover transition duration-500 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
