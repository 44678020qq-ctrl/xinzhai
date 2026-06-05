"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InkMark } from "@/components/InkMark";

function getWuxingColor(wx: string): string {
  const map: Record<string, string> = {
    "木": "#9CB89A", "火": "#D88A7A", "土": "#C9A86A", "金": "#B9AE92", "水": "#7AA0C4",
  };
  return map[wx] || "#94a3b8";
}

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 读取八字信息
    const raw = sessionStorage.getItem("xinzhai_birth");
    if (!raw) { router.push("/register"); return; }

    import("@/lib/bazi").then(async (mod) => {
      const form = JSON.parse(raw);
      const bazi = mod.calculateBazi(
        parseInt(form.birth_year), parseInt(form.birth_month), parseInt(form.birth_day),
        form.birth_hour ? parseInt(form.birth_hour) : undefined,
        form.birth_minute ? parseInt(form.birth_minute) : undefined,
        form.is_lunar || false
      );
      const wx = mod.getDayMasterWuxing(bazi);
      const strength = mod.judgeStrength(bazi);

      // 从 sessionStorage 读八字结果
      let summary = "";
      const baziRaw = sessionStorage.getItem("xinzhai_bazi");
      if (baziRaw) {
        const info = JSON.parse(baziRaw);
        summary = info.summary || "";
      }

      setProfile({
        bazi: bazi,
        wx,
        dayGan: bazi.dayGan,
        strength: strength?.level || "中和",
        summary,
      });
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/register");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg page-in">
        <div className="animate-pulse text-sub text-sm">加载中…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-10 bg-bg">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* 标题 */}
        <div className="text-center flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-xl font-semibold text-ink">我</h2>
          <div className="w-8 h-[1px] bg-line" />
        </div>

        {/* 头像 + 日主 */}
        <div className="flex flex-col items-center gap-3 bg-card rounded-2xl p-6 shadow-sm border border-line/50">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-sm"
            style={{ backgroundColor: getWuxingColor(profile?.wx || "木") }}
          >
            {profile?.dayGan || "?"}
          </div>
          <div className="text-center">
            <div className="text-base font-semibold text-ink">{profile?.dayGan}{profile?.wx}</div>
            <div className="text-xs text-sub mt-1">{profile?.strength}</div>
          </div>
          {profile?.summary && (
            <p className="text-xs text-sub leading-relaxed text-center">{profile.summary}</p>
          )}
        </div>

        {/* 功能列表 */}
        <div className="flex flex-col gap-2">
          {[
            { label: "重新入斋", action: () => { sessionStorage.clear(); router.push("/register"); } },
            { label: "清除缓存", action: () => { sessionStorage.clear(); } },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="bg-card rounded-xl px-4 py-3 text-sm text-ink text-left border border-line/50 hover:border-accent/30 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-sub">
          <Link href="/privacy" className="hover:text-accent">隐私政策</Link>
          <Link href="/terms" className="hover:text-accent">用户协议</Link>
          <Link href="/data-deletion" className="hover:text-accent">数据删除</Link>
        </div>

        <button
          onClick={handleLogout}
          className="mt-2 text-xs text-sub hover:text-rose-500 transition-colors text-center"
        >
          退出登录
        </button>
      </div>
    </main>
  );
}
