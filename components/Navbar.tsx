'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',       label: 'Home'      },
  { href: '/plan',   label: '✈️ Plan Trip' },
  { href: '/trips',  label: '🗺️ My Trips'  },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="font-display font-bold text-xl text-orange-500 tracking-tight">
          Yatrica
        </Link>
        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                    : 'text-stone-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
