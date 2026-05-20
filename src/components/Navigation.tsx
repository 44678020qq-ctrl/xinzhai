"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/register", label: "入斋", icon: "🏯" },
  { href: "/card", label: "命签", icon: "🀄" },
  { href: "/match", label: "遇合", icon: "🤝" },
  { href: "/chat", label: "对谈", icon: "💬" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-ink-200">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-ink-400 hover:text-ink-600"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
