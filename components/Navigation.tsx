'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Navigation({ className, style }: NavigationProps) {
  const pathname = usePathname();

  const getLinkStyle = (path: string) => ({
    fontSize: '0.875rem',
    fontFamily: 'var(--font-league-spartan)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'white',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    backgroundColor: pathname === path ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
  });

  return (
    <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center', ...style }} className={className}>
      <Link href="/bracket" style={getLinkStyle('/bracket')}>
        2025 Saintfest Bracket
      </Link>
      <Link href="/about" style={getLinkStyle('/about')}>
        About
      </Link>
      <Link href="/posts" style={getLinkStyle('/posts')}>
        Posts
      </Link>
      <Link href="/admin/login" style={getLinkStyle('/admin')}>
        Admin
      </Link>
    </nav>
  );
}