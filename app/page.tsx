import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Logo Section */}
      <div className="pt-16 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight">
          <span className="inline-block w-4 h-4 md:w-5 md:h-5 bg-red-accent rounded-full mr-1 align-middle relative -top-1"></span>
          <span>the Door</span>
        </h1>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-gray-200"></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center space-y-8">
          <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-800">
            is your invitation to a fresh start—a place where every{' '}
            <span className="dot-red font-medium">'dot'</span> represents a pause, a pivot, and a pathway to undiscovered opportunities.
          </p>
          
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-gray-900">
            Step beyond the ordinary, embrace new journeys, and redefine your path.
          </p>

          <div className="pt-4">
            <Link href="/explore-more" className="link-red text-base font-medium">
              Explore More
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <a href="mailto:info@dotthedoor.com" className="text-gray-600 hover:text-gray-900 text-sm">
          info@dotthedoor.com
        </a>
      </footer>
    </main>
  )
}
