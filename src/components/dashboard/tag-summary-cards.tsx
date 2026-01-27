"use client";

import { ArticleTag } from "@/lib/types";
import { tagIcons, tagBgColors, tagLightBgColors, tagTextColors } from "@/lib/constants";

interface TagSummaryCardsProps {
  tagStats: Record<ArticleTag, number>;
  onTagClick: (tag: ArticleTag) => void;
}

const tagOrder: ArticleTag[] = ["보도기사", "특집기사", "단독기사"];

export function TagSummaryCards({ tagStats, onTagClick }: TagSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {tagOrder.map((tag) => {
        const Icon = tagIcons[tag];
        const count = tagStats[tag] || 0;

        return (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className={`${tagLightBgColors[tag]} rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`${tagBgColors[tag]} p-1.5 rounded-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className={`text-2xl font-bold ${tagTextColors[tag]}`}>
              {count}
              <span className="text-sm font-normal ml-0.5">건</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{tag}</div>
          </button>
        );
      })}
    </div>
  );
}
