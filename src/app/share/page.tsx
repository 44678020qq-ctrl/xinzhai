import { Suspense } from "react";
import ShareClient from "./ShareClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { name?: string };
}

export default function SharePage({ searchParams }: PageProps) {
  const name = searchParams?.name;
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sub text-sm">加载中…</div>}>
      <ShareClient name={name} />
    </Suspense>
  );
}
