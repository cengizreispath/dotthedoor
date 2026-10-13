import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { Dots } from '@/lib/text';

export const metadata: Metadata = {
  title: 'About',
  description: 'Every sentence ends with a dot. We like to think of it as a door.',
};

export default function About() {
  return (
    <>
      <section className="page about" aria-labelledby="aboutTitle">
        <h1 id="aboutTitle">About</h1>
        <p className="lede"><Dots>Every sentence ends with a dot. We like to think of it as a door.</Dots></p>
        <p>
          <Dots>
            Dot the Door is a small place to write the sentence that comes next: something you’re starting, deciding,
            letting go of, or don’t have a name for yet. Keep it, copy it, or leave it on the Dot Wall for others to read.
          </Dots>
        </p>
        <p><Dots>There are no accounts, likes or followers here. Just sentences, and the red dots people leave behind.</Dots></p>

        <h2>How the Dot Wall works</h2>
        <p>
          <Dots>
            Every sentence is read by a filter before it goes up, and sometimes by a person. Links, contact details and
            anything that could hurt someone are held back.
          </Dots>
        </p>
        <p>
          <Dots>
            See something that shouldn’t be here? Tap the sentence and choose Report. Changed your mind about your own? You
            can take your dot down from the device you posted it from, or write to
          </Dots>{' '}
          <a href="mailto:info@dotthedoor.com">info@dotthedoor<span className="p">.</span>com</a><span className="p">.</span>
        </p>
        <p>
          <Dots>
            We don’t keep your IP address. A scrambled version of it is kept for 30 days to stop spam, and then it’s
            deleted too.
          </Dots>
        </p>
        <p className="about-cta">
          <Link className="primary" href="/write"><span className="mini-dot" aria-hidden="true" />Write your next sentence</Link>
        </p>
      </section>
      <Footer />
    </>
  );
}
