import { trustData } from "../Data/trustData";
function TrustSection() {
  return (
    <section className="bg-gray-50 py-16 md:py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Why Shop With Us?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Safe. Fast. Reliable. Discover what makes our marketplace special.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {trustData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group bg-slate-100 rounded-xl border border-gray-200 p-6 md:p-8 text-center transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-100/60"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-50 text-orange-600 mb-5 group-hover:bg-orange-100 transition-colors">
                  <Icon size={28} strokeWidth={2} />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
export default TrustSection