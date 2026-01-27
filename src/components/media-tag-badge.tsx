"use client";

import { Newspaper } from "lucide-react";

interface MediaTagBadgeProps {
  mediaName: string;
  size?: "sm" | "md";
}

export function MediaTagBadge({ mediaName, size = "sm" }: MediaTagBadgeProps) {
  // 언론사명 축약
  const shortName = getShortMediaName(mediaName);

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded ${sizeClasses[size]} hover:bg-slate-200 transition-colors`}
      title={mediaName}
    >
      <Newspaper className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {shortName}
    </span>
  );
}

// 여러 언론사명을 배지로 표시
interface MediaTagListProps {
  mediaNames: string[];
  maxDisplay?: number;
  size?: "sm" | "md";
}

export function MediaTagList({ mediaNames, maxDisplay = 3, size = "sm" }: MediaTagListProps) {
  const uniqueNames = [...new Set(mediaNames.filter(Boolean))];
  const displayNames = uniqueNames.slice(0, maxDisplay);
  const remainingCount = uniqueNames.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayNames.map((name) => (
        <MediaTagBadge key={name} mediaName={name} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className={`text-muted-foreground ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

// 언론사명 축약 함수
function getShortMediaName(name: string): string {
  const shortNames: Record<string, string> = {
    "한국경제": "한경",
    "매일경제": "매경",
    "이데일리": "이데일리",
    "머니투데이": "머니투데이",
    "서울경제": "서경",
    "파이낸셜뉴스": "파이낸셜",
    "전자신문": "전자신문",
    "뉴시스": "뉴시스",
    "연합뉴스": "연합",
    "헤럴드경제": "헤럴드",
    "아시아경제": "아시아경제",
    "더벨": "더벨",
    "조선비즈": "조선비즈",
    "동아일보": "동아",
    "중앙일보": "중앙",
    "한겨레": "한겨레",
    "경향신문": "경향",
    "브릿지경제": "브릿지",
    "한국경제TV": "한경TV",
    "이투데이": "이투데이",
    "뉴스핌": "뉴스핌",
  };

  return shortNames[name] || (name.length > 6 ? name.slice(0, 5) + ".." : name);
}
