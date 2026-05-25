import { Suspense } from "react";
import ShareClient from "./ShareClient";

export const dynamic = 'force-dynamic';

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sub text-sm">加载中…</div>}>
      <ShareClient />
    </Suspense>
  );
}
