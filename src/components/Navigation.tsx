"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

// 入斋是一次性流程，不占 tab
const NO_NAV_PATHS = ["/", "/register", "/privacy", "/terms", "/data-deletion"];

const tabs = [
  { href: "/card", label: "命签", paths: ["/card"] },
  { href: "/match", label: "遇合", paths: ["/match"] },
  { href: "/chat", label: "消息", paths: ["/chat"] },
  { href: "/me", label: "我", paths: ["/me"] },
];

export default function Navigation() {
  const pathname = usePathname();

  if (NO_NAV_PATHS.includes(pathname)) return null;

  const isActive = (paths: string[]) => paths.includes(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-line/50">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 ${
              isActive(tab.paths) ? "text-accent" : "text-sub hover:text-accent/70"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              isActive(tab.paths) ? "bg-accent scale-125" : "bg-line scale-100"
            }`} />
            <span className={`text-[10px] font-medium tracking-wide ${
              isActive(tab.paths) ? "text-accent" : "text-sub"
            }`}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
      <div className="h-safe" />
    </nav>
  );
}
