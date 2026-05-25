"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SHENSHA_SHARE_DATA, isShareableShensha } from "@/lib/shensha-data";

export default function ShareClient() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const name = searchParams.get('name');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // DEBUG: 显示完整 searchParams
  const allParams = Array.from(searchParams.entries());
  
  if (!name || !isShareableShensha(name)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-sub text-sm mb-4">神煞不存在或暂不支持分享</p>
          <p className="text-ink text-xs bg-gray-100 p-3 rounded-lg mb-2 max-w-md mx-auto" style={{wordBreak:'break-all'}}>
            调试信息：<br/>
            name={JSON.stringify(name)}<br/>
            allParams={JSON.stringify(allParams)}<br/>
            href={typeof window !== 'undefined' ? window.location.href : 'N/A'}<br/>
            known={JSON.stringify(['天乙贵人','驿马','华盖','桃花','文昌贵人'])}
          </p>
          <a href="/card" className="text-accent text-xs hover:underline">返回命签 →</a>
        </div>
      </div>
    );
  }

  const data = SHENSHA_SHARE_DATA[name];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}>
      {/* 分享卡片 - 9:16 竖图 */}
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg"
        style={{
          aspectRatio: '9/16',
          maxHeight: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem 1.5rem',
          position: 'relative',
          background: '#FFFFFF',
        }}
      >
        {/* 顶部色晕 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '46%',
            background: `radial-gradient(120% 90% at 50% 0%, 
              ${data.tintColor}42 0%, 
              ${data.tintColor}14 42%, 
              #fff 80%)`,
            zIndex: 0,
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* 顶部：斋印 + 类别 */}
          <div className="flex items-center justify-between mb-auto">
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#33312E',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.92,
              }}
            >
              斋
            </div>
            <div style={{ fontSize: '12px', color: '#9A958C', letterSpacing: '2px' }}>
              {data.category}
            </div>
          </div>

          {/* 中部：徽章名 */}
          <div className="flex-grow flex flex-col items-center justify-center" style={{ marginBottom: 'auto', marginTop: 'auto' }}>
            <div style={{ fontSize: '12px', color: '#9A958C', letterSpacing: '3px', marginBottom: '12px' }}>
              {data.miniLabel}
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 600,
                letterSpacing: '4px',
                color: `${data.tintColor}9E`,
              }}
            >
              {data.name}
            </div>
            <div
              style={{
                width: '34px',
                height: '2px',
                borderRadius: '2px',
                background: `${data.tintColor}8C`,
                margin: '16px auto 0',
              }}
            />
          </div>

          {/* 下部：描述 + 水印 */}
          <div className="mt-auto">
            {/* 心斋口径描述 */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '14.5px',
                lineHeight: 1.85,
                color: '#33312E',
                padding: '0 4px',
                marginBottom: '18px',
              }}
            >
              {data.description}
            </div>

            {/* 底部水印 + 拉新钩子 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid #ECE7DF',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', lineHeight: 1.3 }}>
                <div style={{ color: '#33312E', fontWeight: 600, fontSize: '13px', letterSpacing: '1px' }}>
                  心斋
                </div>
                <div style={{ fontSize: '11px', color: '#9A958C', letterSpacing: '.5px' }}>
                  看见自己内心的能量
                </div>
              </div>
              <div style={{ fontSize: '11.5px', color: '#6FA292', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span>测测你的</span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    border: '1px solid #ECE7DF',
                    background: `
                      linear-gradient(90deg,#33312E 50%,transparent 0) 0 0/8px 8px,
                      linear-gradient(#33312E 50%,transparent 0) 0 0/8px 8px
                    `,
                    backgroundClip: 'padding-box',
                    opacity: 0.32,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮（非打印时显示） */}
      <style jsx>{`
        @media print {
          button { display: none; }
        }
      `}</style>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-2xl bg-accent text-white text-sm font-medium shadow-sm hover:bg-[#5A8D7A] transition-colors"
        >
          保存图片
        </button>
        <button
          onClick={() => {
            const url = typeof window !== 'undefined' ? window.location.href : '';
            if (navigator.share) {
              navigator.share({ title: `心斋 · ${data.name}`, url }).catch(() => {});
            } else {
              // Fallback: copy to clipboard
              navigator.clipboard?.writeText(url).then(() => {
                alert('链接已复制');
              }).catch(() => {
                prompt('复制链接:', url);
              });
            }
          }}
          className="px-5 py-2.5 rounded-2xl bg-white text-accent text-sm font-medium border-2 border-accent hover:bg-accent-soft transition-colors"
        >
          分享链接
        </button>
      </div>
    </div>
  );
}
