"use client";

import { useState } from "react";
import { Article } from "@/lib/types";
import { ArticleCard } from "./article-card";
import { ChevronDown, ChevronUp } from "lucide-react";

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
    <div className="space-y-2">
      {/* 대표 기사 */}
      <ArticleCard
        article={mainArticle}
        relatedCount={articles.length}
        onShowRelated={onShowRelated}
      />

      {/* 펼치기/접기 버튼 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
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

      {/* 나머지 기사들 */}
      {expanded && (
        <div className="space-y-2 pl-4 border-l-2 border-blue-200">
          {otherArticles.map((article) => (
            <ArticleCard
              key={article._id}
              article={article}
              relatedCount={articles.length}
              onShowRelated={onShowRelated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
