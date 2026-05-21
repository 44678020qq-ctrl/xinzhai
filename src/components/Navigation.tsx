"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/register", label: "入斋", paths: ["/register", "/"] },
  { href: "/card", label: "命签", paths: ["/card"] },
  { href: "/flow", label: "流年", paths: ["/flow"] },
  { href: "/match", label: "遇合", paths: ["/match"] },
  { href: "/chat", label: "对谈", paths: ["/chat"] },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-sm border-t border-ink-200">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = tab.paths.includes(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors duration-300 ${
                isActive ? "text-accent" : "text-ink-400 hover:text-ink-600"
              }`}
            >
              {/* 简洁墨点指示器 */}
              <div className={`w-1 h-1 rounded-full transition-all duration-300 ${isActive ? "bg-accent scale-150" : "bg-ink-300 scale-100"}`} />
              <span className={`text-[10px] tracking-[0.15em] font-light ${isActive ? "text-accent" : ""}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* 底部安全区 */}
      <div className="h-safe" />
    </nav>
  );
}
