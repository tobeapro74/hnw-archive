"use client";

import { Article } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Calendar, ExternalLink, Newspaper, Link2 } from "lucide-react";

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
  relatedCount?: number;
  onShowRelated?: (eventName: string) => void;
}

export function ArticleCard({ article, onClick, relatedCount = 0, onShowRelated }: ArticleCardProps) {
  const getCategoryVariant = (category: string) => {
    switch (category) {
      case "인터뷰":
        return "interview";
      case "세미나 안내":
        return "seminar";
      case "소개 및 홍보":
        return "solution";
      default:
        return "default";
    }
  };

  const getTagVariant = (tag: string) => {
    switch (tag) {
      case "단독기사":
        return "exclusive";
      case "특집기사":
        return "special";
      case "보도기사":
        return "press";
      default:
        return "secondary";
    }
  };

  const handleClick = () => {
    if (article.articleUrl) {
      window.open(article.articleUrl, "_blank", "noopener,noreferrer");
    }
    onClick?.();
  };

  const handleRelatedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (article.eventName && onShowRelated) {
      onShowRelated(article.eventName);
    }
  };

  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex gap-4">
        {/* 썸네일 */}
        <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg overflow-hidden">
          {article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 배지들 */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge variant={getCategoryVariant(article.category) as "interview" | "seminar" | "solution"}>
              {article.category}
            </Badge>
            <Badge variant={getTagVariant(article.tag) as "exclusive" | "special" | "press"}>
              {article.tag}
            </Badge>
          </div>

          {/* 제목 */}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2">
            {article.title}
          </h3>

          {/* 메타 정보 */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(article.publishedAt)}
            </span>
            {article.mediaName && (
              <span className="flex items-center gap-1">
                <Newspaper className="w-3 h-3" />
                {article.mediaName}
              </span>
            )}
          </div>

          {/* 연관 이벤트 및 기사 수 */}
          {article.eventName && (
            <button
              onClick={handleRelatedClick}
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Link2 className="w-3 h-3" />
              <span className="font-medium">{article.eventName}</span>
              {relatedCount > 1 && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {relatedCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* 외부 링크 아이콘 */}
        {article.articleUrl && (
          <a
            href={article.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        )}
      </div>
    </Card>
  );
}
