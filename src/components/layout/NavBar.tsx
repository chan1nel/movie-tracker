"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/timeline",  label: "Timeline",  icon: "📖" },
  { href: "/dna",       label: "Film DNA",  icon: "🧬" },
  { href: "/couple",    label: "Couple",     icon: "💕" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="w-full max-w-6xl mx-auto mb-8">
      <div className="flex items-center gap-1 p-1 rounded-2xl"
           style={{background: 'rgba(255,255,255,0.4)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(12px)'}}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-white/70 text-[var(--purple-deep)] shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/30'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
