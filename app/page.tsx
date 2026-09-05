import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">

      {/* ── Hero Section ── */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-500 via-rose-500 to-teal-600 px-6 py-32 text-center">

        {/* Dotted overlay pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

        {/* Floating decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-400 opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-400 opacity-20 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block mb-4 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            ✨ AI-Powered Travel Planning
          </span>

          <h1 className="font-display text-5xl sm:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            Your Perfect Trip,<br />
            <span className="text-amber-200">Crafted by AI.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl mx-auto mb-10">
            Tell Yatrica where you want to go, how long, and what you love —
            and get a stunning day-by-day itinerary in seconds.
          </p>

          <Link
            href="/plan"
            className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-orange-600 shadow-xl hover:shadow-orange-300/50 hover:scale-105 transition-all duration-300"
          >
            <span className="text-xl">✈️</span>
            Plan My Trip — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-amber-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold text-stone-800 mb-4">
            How It Works
          </h2>
          <p className="text-stone-500 mb-14 text-base max-w-md mx-auto">
            Three simple steps to your dream adventure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { emoji: '🗺️', step: '01', title: 'Tell Us Your Dream', desc: 'Enter your destination, trip length, budget and interests.' },
              { emoji: '🤖', step: '02', title: 'AI Crafts Your Plan', desc: 'Gemini AI builds a personalised day-by-day itinerary instantly.' },
              { emoji: '🌍', step: '03', title: 'Go Explore', desc: 'Save your itinerary and set off on your adventure.' },
            ].map(({ emoji, step, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-3xl shadow-lg shadow-orange-200">
                  {emoji}
                </div>
                <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">{step}</span>
                <h3 className="font-display text-lg font-bold text-stone-800">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-gradient-to-r from-teal-600 to-orange-500 animate-gradient py-16 px-6 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready for your next adventure?
        </h2>
        <p className="text-white/80 mb-8 text-base">
          Join thousands of travellers planning smarter with Yatrica.
        </p>
        <Link
          href="/plan"
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-teal-700 shadow-lg hover:scale-105 hover:shadow-white/30 transition-all duration-300"
        >
          Start Planning Now →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-stone-900 py-8 text-center text-sm text-stone-500">
        © 2026 Yatrica · Built with Next.js &amp; Gemini AI
      </footer>
    </main>
  );
}
