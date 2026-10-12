'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();
  const current = (href: string) => (path === href ? 'page' : undefined);
  return (
    <header className="nav">
      <Link className="logo" href="/" aria-label="Dot the Door, home">
        <span className="logo-dot" aria-hidden="true" />the Door
      </Link>
      <nav aria-label="Main">
        <Link className="navlink" href="/wall" aria-current={current('/wall')}>The Dot Wall</Link>
        <Link className="navlink" href="/about" aria-current={current('/about')}>About</Link>
      </nav>
    </header>
  );
}
