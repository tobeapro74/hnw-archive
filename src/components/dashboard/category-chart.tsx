"use client";

import { ArticleCategory } from "@/lib/types";
import { categoryHexColors, categoryIcons, categoryBgColors } from "@/lib/constants";

interface CategoryChartProps {
  stats: Record<ArticleCategory, number>;
  total: number;
  onCategoryClick?: (category: ArticleCategory) => void;
}

const categoryOrder: ArticleCategory[] = ["인터뷰", "세미나 안내", "소개 및 홍보"];

export function CategoryChart({ stats, total, onCategoryClick }: CategoryChartProps) {
  // 퍼센트 계산
  const percentages = categoryOrder.map((cat) => ({
    category: cat,
    count: stats[cat] || 0,
    pct: total > 0 ? ((stats[cat] || 0) / total) * 100 : 0,
  }));

  // conic-gradient 생성
  let cumulative = 0;
  const gradientStops = percentages.map(({ category, pct }) => {
    const start = cumulative;
    cumulative += pct;
    return `${categoryHexColors[category]} ${start}% ${cumulative}%`;
  });

  const gradient = `conic-gradient(${gradientStops.join(", ")})`;

  return (
    <div className="flex items-center gap-6">
      {/* 도넛 차트 */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <div
          className="w-full h-full rounded-full transition-all duration-500"
          style={{ background: total > 0 ? gradient : "#e5e5e5" }}
        />
        <div className="absolute inset-3 bg-card rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-xl font-bold">{total}</span>
          <span className="text-[10px] text-muted-foreground">전체</span>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex-1 space-y-2">
        {percentages.map(({ category, count, pct }) => {
          const Icon = categoryIcons[category];
          return (
            <button
              key={category}
              onClick={() => onCategoryClick?.(category)}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className={`${categoryBgColors[category]} p-1 rounded`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground truncate">{category}</div>
              </div>
              <div className="text-sm font-medium">{count}</div>
              <div className="text-xs text-muted-foreground w-10 text-right">
                {pct.toFixed(0)}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
