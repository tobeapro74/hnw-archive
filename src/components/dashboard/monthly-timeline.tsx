"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MonthItem {
  year: number;
  month: number; // 0~11
  count: number;
}

interface MonthlyTimelineProps {
  monthlyData: number[]; // 0~11 인덱스, 각 월별 기사 수 (단일 연도용)
  year: number;
  onMonthClick?: (month: number) => void;
  // 롤링 12개월용 (선택적)
  rollingData?: MonthItem[];
  title?: string;
}

const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export function MonthlyTimeline({ monthlyData, year, onMonthClick, rollingData, title }: MonthlyTimelineProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 롤링 모드인지 확인
  const isRolling = !!rollingData && rollingData.length > 0;

  // 데이터 준비
  const displayData = isRolling
    ? rollingData
    : monthlyData.map((count, month) => ({ year, month, count }));

  const maxCount = Math.max(...displayData.map(d => d.count), 1);
  const totalCount = displayData.reduce((sum, d) => sum + d.count, 0);

  // 제목 결정
  const displayTitle = title || (isRolling
    ? `${displayData[0].year % 100}.${displayData[0].month + 1}월~${displayData[displayData.length - 1].year % 100}.${displayData[displayData.length - 1].month + 1}월 현황`
    : `${year}년 월별 현황`);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">{displayTitle}</h4>
        <div className="text-xs text-muted-foreground">
          총 {totalCount}건
        </div>
      </div>
      <ScrollArea className="w-full">
        <div className="flex items-end gap-1 h-28 pt-2 pb-1">
          {displayData.map((item, idx) => {
            const isCurrentMonth = item.year === currentYear && item.month === currentMonth;
            const heightPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

            // 롤링 모드에서 연도가 바뀌는 첫 월 표시
            const showYear = isRolling && (idx === 0 || displayData[idx - 1].year !== item.year);

            return (
              <button
                key={`${item.year}-${item.month}`}
                onClick={() => onMonthClick?.(item.month)}
                className="flex flex-col items-center gap-1 min-w-[40px] group"
              >
                {/* 건수 */}
                <span className={`text-[10px] font-medium transition-colors ${
                  item.count > 0 ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {item.count > 0 ? item.count : "-"}
                </span>
                {/* 막대 */}
                <div className="w-6 h-16 bg-muted/30 rounded-t relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t transition-all duration-300 ${
                      isCurrentMonth
                        ? "bg-primary"
                        : item.count > 0
                        ? "bg-primary/70 group-hover:bg-primary"
                        : "bg-muted"
                    }`}
                    style={{ height: `${Math.max(heightPct, item.count > 0 ? 10 : 0)}%` }}
                  />
                </div>
                {/* 월 (롤링 모드에서 연도 변경점 표시) */}
                <span className={`text-[10px] transition-colors ${
                  isCurrentMonth
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}>
                  {showYear ? `${item.year % 100}'` : ""}{monthNames[item.month]}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
