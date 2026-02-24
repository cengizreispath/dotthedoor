import Link from 'next/link'

export default function ExplorMore() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
          <span className="dot"></span>Dot the Door
        </Link>
        <Link 
          href="/" 
          className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-all text-gray-700"
        >
          Home
        </Link>
      </nav>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 leading-tight">
          The Philosophy Behind <br/>
          <span className="gradient-text">Dot the Door</span>
        </h1>

        <div className="prose prose-lg text-gray-600 space-y-6">
          <p className="text-xl leading-relaxed">
            Dot the Door is built on a simple but powerful idea:
          </p>

          <p className="text-lg leading-relaxed">
            Every moment in life is made of sentences—choices, actions, feelings, and the stories 
            that follow them. Some are short, some are long. Some we write quickly, some we wrestle 
            with for years.
          </p>

          <p className="text-lg leading-relaxed font-medium text-gray-800">
            But every sentence, no matter how complex or emotional, eventually ends with a dot.
          </p>

          <p className="text-2xl font-bold text-gray-900 py-4">
            And that dot is not an ending. <br/>
            <span className="gradient-text">It's a door.</span>
          </p>

          <ul className="space-y-4 text-lg">
            <li className="flex items-start gap-3">
              <span className="dot mt-2 flex-shrink-0"></span>
              <span>A door you can choose to open.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="dot mt-2 flex-shrink-0"></span>
              <span>A door that leads to who you want to become next.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="dot mt-2 flex-shrink-0"></span>
              <span>A door that turns "maybe one day" into today.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="dot mt-2 flex-shrink-0"></span>
              <span>A door that invites you to step into unrealized potential, untried opportunities, unexplored versions of yourself.</span>
            </li>
          </ul>

          <div className="border-l-4 border-purple-500 pl-6 py-4 my-8 bg-purple-50 rounded-r-lg">
            <p className="text-lg text-gray-700">
              Dot the Door isn't about escaping the past.<br/>
              <strong>It's about honoring it—then choosing what comes next with intention.</strong>
            </p>
          </div>

          <p className="text-lg leading-relaxed">
            It's a philosophy for people who:
          </p>

          <ul className="space-y-3 text-lg text-gray-700">
            <li>• feel a shift coming,</li>
            <li>• dream of something more,</li>
            <li>• sense that their next chapter has been waiting patiently,</li>
            <li>• or simply want to give themselves permission to start.</li>
          </ul>

          <div className="py-8 text-center">
            <p className="text-xl text-gray-800 font-medium">
              Your life isn't a single story.
            </p>
            <p className="text-lg text-gray-600 mt-2">
              It's a collection of chapters, sentences, and dots—<br/>
              each one offering another doorway to step through.
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-2xl text-center">
            <p className="text-xl font-medium">
              This is your space to choose, reset, explore, and move forward—<br/>
              <span className="text-2xl font-bold">one dot, one door at a time.</span>
            </p>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-16 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all"
          >
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Back to Home
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>© 2026 Dot the Door. All rights reserved.</p>
      </footer>
    </main>
  )
}
