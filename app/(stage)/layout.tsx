import Stage from '@/components/Stage';

// "/" and "/write/..." share one living stage, so moving between them (including the
// browser's back button) never remounts Cin Ali or replays the opening.
export default function StageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Stage />
      {children}
    </>
  );
}
