"use client";

import { useState } from "react";
import { Article } from "@/lib/types";
import { ArticleCard } from "./article-card";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronUp, Calendar, Link2 } from "lucide-react";
import { categoryBgColors } from "@/lib/constants";

interface ArticleGroupProps {
  articles: Article[];
  eventName: string;
  onShowRelated?: (eventName: string) => void;
}

export function ArticleGroup({ articles, eventName, onShowRelated }: ArticleGroupProps) {
  const [expanded, setExpanded] = useState(false);

  // 첫 번째 기사 (대표 기사)
  const mainArticle = articles[0];
  // 나머지 기사들
  const otherArticles = articles.slice(1);

  // 참여 언론사 목록 (중복 제거)
  const mediaNames = [...new Set(articles.map((a) => a.mediaName).filter(Boolean))] as string[];

  // 날짜 범위
  const dates = articles.map((a) => new Date(a.publishedAt).getTime());
  const earliestDate = new Date(Math.min(...dates));
  const latestDate = new Date(Math.max(...dates));
  const dateRange = earliestDate.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) +
    (dates.length > 1 && earliestDate.getTime() !== latestDate.getTime()
      ? " ~ " + latestDate.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
      : "");

  // 대표 카테고리 (가장 많은 카테고리)
  const categoryCounts = articles.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mainCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0];

  if (articles.length === 1) {
    // 기사가 1개면 그냥 표시
    return (
      <ArticleCard
        article={mainArticle}
        relatedCount={1}
        onShowRelated={onShowRelated}
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* 그룹 헤더 */}
      <div className={`${categoryBgColors[mainCategory as keyof typeof categoryBgColors] || "bg-slate-500"} px-4 py-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-white/80" />
              <h3 className="font-semibold text-white truncate">{eventName}</h3>
              <Badge className="bg-white/20 text-white border-0 text-xs">
                {articles.length}건
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <Calendar className="w-3 h-3" />
              <span>{dateRange}</span>
            </div>
          </div>
        </div>
        {/* 참여 언론사 */}
        {mediaNames.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-white/60 text-[10px]">언론사</span>
            <div className="flex flex-wrap gap-1">
              {mediaNames.slice(0, 5).map((name) => (
                <span key={name} className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {name}
                </span>
              ))}
              {mediaNames.length > 5 && (
                <span className="text-white/60 text-[10px]">+{mediaNames.length - 5}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 대표 기사 */}
      <div className="p-3">
        <ArticleCard
          article={mainArticle}
          relatedCount={articles.length}
          onShowRelated={onShowRelated}
          compact
        />
      </div>

      {/* 펼치기/접기 버튼 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            접기
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            연관 기사 {otherArticles.length}건 더보기
          </>
        )}
      </button>

      {/* 나머지 기사들 - 애니메이션 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-3 pt-0 space-y-2 border-t bg-muted/30">
          {otherArticles.map((article) => (
            <ArticleCard
              key={article._id}
              article={article}
              relatedCount={articles.length}
              onShowRelated={onShowRelated}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}
