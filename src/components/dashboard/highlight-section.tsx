"use client";

import { Article } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink } from "lucide-react";
import { tagBgColors, tagIcons } from "@/lib/constants";

interface HighlightSectionProps {
  articles: Article[]; // 단독기사/특집기사 중 최신 기사들
}

export function HighlightSection({ articles }: HighlightSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
        <span className="text-yellow-500">&#9733;</span>
        주요 기사
      </h4>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {articles.map((article) => {
            const TagIcon = tagIcons[article.tag];
            return (
              <a
                key={article._id}
                href={article.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-48 group"
              >
                <div className="relative h-28 rounded-lg overflow-hidden bg-muted">
                  {article.thumbnailUrl ? (
                    <img
                      src={article.thumbnailUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* 그라데이션 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* 태그 배지 */}
                  <div className="absolute top-2 left-2">
                    <Badge className={`${tagBgColors[article.tag]} text-white text-[10px] px-1.5 py-0.5`}>
                      <TagIcon className="w-3 h-3 mr-0.5" />
                      {article.tag}
                    </Badge>
                  </div>
                  {/* 외부 링크 아이콘 */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 p-1 rounded">
                      <ExternalLink className="w-3 h-3 text-gray-700" />
                    </div>
                  </div>
                  {/* 제목 */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                      {article.title}
                    </p>
                  </div>
                </div>
                {/* 언론사 + 날짜 */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">{article.mediaName || "언론사"}</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
                </div>
              </a>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
