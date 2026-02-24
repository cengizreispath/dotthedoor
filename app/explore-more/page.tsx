import Link from 'next/link'

export default function ExploreMore() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Logo Section */}
      <div className="pt-16 pb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">
            <span className="inline-block w-4 h-4 md:w-5 md:h-5 bg-red-accent rounded-full mr-1 align-middle relative -top-1"></span>
            <span>the Door</span>
          </h1>
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-gray-200"></div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-16">
        <article className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-medium text-gray-900 text-center">
            The Philosophy Behind <span className="dot-red">Dot the Door</span>
          </h2>

          <div className="space-y-6 text-lg leading-relaxed text-gray-700">
            <p>
              Dot the Door is built on a simple but powerful idea:
            </p>

            <p>
              Every moment in life is made of sentences—choices, actions, feelings, and the stories that follow them. Some are short, some are long. Some we write quickly, some we wrestle with for years.
            </p>

            <p className="font-medium text-gray-900">
              But every sentence, no matter how complex or emotional, eventually ends with a dot.
            </p>

            <p className="text-2xl font-medium text-gray-900 py-4">
              And that dot is not an ending.<br/>
              <span className="dot-red">It's a door.</span>
            </p>

            <ul className="space-y-3 pl-0">
              <li className="flex items-start gap-3">
                <span className="inline-block w-2 h-2 bg-red-accent rounded-full mt-2.5 flex-shrink-0"></span>
                <span>A door you can choose to open.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-2 h-2 bg-red-accent rounded-full mt-2.5 flex-shrink-0"></span>
                <span>A door that leads to who you want to become next.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-2 h-2 bg-red-accent rounded-full mt-2.5 flex-shrink-0"></span>
                <span>A door that turns "maybe one day" into today.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-2 h-2 bg-red-accent rounded-full mt-2.5 flex-shrink-0"></span>
                <span>A door that invites you to step into unrealized potential, untried opportunities, unexplored versions of yourself.</span>
              </li>
            </ul>

            <blockquote className="border-l-4 border-red-accent pl-6 py-2 my-8 bg-gray-50">
              <p>
                Dot the Door isn't about escaping the past.<br/>
                <strong>It's about honoring it—then choosing what comes next with intention.</strong>
              </p>
            </blockquote>

            <p>It's a philosophy for people who:</p>

            <ul className="space-y-2 text-gray-700">
              <li>• feel a shift coming,</li>
              <li>• dream of something more,</li>
              <li>• sense that their next chapter has been waiting patiently,</li>
              <li>• or simply want to give themselves permission to start.</li>
            </ul>

            <div className="py-8 text-center">
              <p className="text-xl text-gray-800 font-medium">
                Your life isn't a single story.
              </p>
              <p className="text-gray-600 mt-2">
                It's a collection of chapters, sentences, and dots—<br/>
                each one offering another doorway to step through.
              </p>
            </div>

            <div className="bg-gray-900 text-white p-8 rounded-lg text-center">
              <p className="text-lg">
                This is your space to choose, reset, explore, and move forward—<br/>
                <span className="text-xl font-semibold">one dot, one door at a time.</span>
              </p>
            </div>
          </div>

          {/* Back link */}
          <div className="pt-8 text-center">
            <Link href="/" className="link-red text-base font-medium">
              ← Back to Home
            </Link>
          </div>
        </article>
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
