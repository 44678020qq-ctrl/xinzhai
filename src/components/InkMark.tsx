import type { SVGProps } from "react";

export function InkMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 抽象墨迹 mark，象征「心斋」的禅意 */}
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.15" />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.25" />
      {/* 不规则墨点 */}
      <circle cx="24" cy="18" r="2.5" fill="currentColor" opacity="0.08" />
      <circle cx="30" cy="28" r="1.8" fill="currentColor" opacity="0.06" />
      <circle cx="18" cy="30" r="2" fill="currentColor" opacity="0.07" />
      {/* 中心留白 */}
      <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.03" />
    </svg>
  );
}
