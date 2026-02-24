import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen hero-gradient text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          <span className="dot"></span>Dot the Door
        </Link>
        <Link 
          href="/explore-more" 
          className="px-6 py-2 border border-white/30 rounded-full hover:bg-white/10 transition-all"
        >
          Explore More
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="dot"></span>
            <span className="gradient-text">Dot the Door</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
            is your invitation to a fresh start—a place where every 'dot' represents 
            a pause, a pivot, and a pathway to undiscovered opportunities.
          </p>
          
          <p className="text-lg md:text-xl text-white/60 leading-relaxed">
            Step beyond the ordinary, embrace new journeys, and redefine your path.
          </p>

          <div className="pt-8">
            <Link 
              href="/explore-more"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-white/90 transition-all transform hover:scale-105"
            >
              Begin Your Journey
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Decorative dots */}
      <div className="fixed bottom-8 left-8 flex gap-2 opacity-30">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </main>
  )
}
