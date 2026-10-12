import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import WallView from '@/components/WallView';
import { hasDatabase } from '@/lib/db';
import { listPublished, type PublicNote } from '@/lib/notes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Dot Wall',
  description: 'Sentences people wrote about what comes next. Every red dot here was left by someone.',
};

export default async function WallPage({ searchParams }: { searchParams: Promise<{ you?: string }> }) {
  const { you } = await searchParams;
  let notes: PublicNote[] = [];
  if (hasDatabase()) {
    try { notes = await listPublished(); } catch (err) { console.error('[wall] could not load notes', err); }
  }
  return (
    <>
      <WallView initial={notes} youNo={Number(you) || null} />
      <Footer />
    </>
  );
}
