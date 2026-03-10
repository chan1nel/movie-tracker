"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", emoji: "🏠" },
    { href: "/timeline", label: "Timeline", emoji: "⏳" },
    { href: "/dna", label: "Cinema DNA", emoji: "🧬" },
    { href: "/couple", label: "Couple Space", emoji: "💕" },
  ];

  return (
    <nav className="flex items-center gap-1 mb-10 overflow-x-auto pb-2 scrollbar-hide">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${isActive 
                ? 'bg-white text-[var(--purple-deep)] shadow-sm border border-[var(--purple-soft)] translate-y-[-1px]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/40'}`}
          >
            <span>{link.emoji}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
