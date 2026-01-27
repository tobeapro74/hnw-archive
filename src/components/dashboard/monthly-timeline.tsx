"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MonthlyTimelineProps {
  monthlyData: number[]; // 0~11 인덱스, 각 월별 기사 수
  year: number;
  onMonthClick?: (month: number) => void; // 0~11 인덱스
}

const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export function MonthlyTimeline({ monthlyData, year, onMonthClick }: MonthlyTimelineProps) {
  const maxCount = Math.max(...monthlyData, 1);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">{year}년 월별 현황</h4>
        <div className="text-xs text-muted-foreground">
          총 {monthlyData.reduce((a, b) => a + b, 0)}건
        </div>
      </div>
      <ScrollArea className="w-full">
        <div className="flex items-end gap-1 h-28 pt-2 pb-1">
          {monthlyData.map((count, month) => {
            const isCurrentMonth = year === currentYear && month === currentMonth;
            const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <button
                key={month}
                onClick={() => onMonthClick?.(month)}
                className="flex flex-col items-center gap-1 min-w-[40px] group"
              >
                {/* 건수 */}
                <span className={`text-[10px] font-medium transition-colors ${
                  count > 0 ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {count > 0 ? count : "-"}
                </span>
                {/* 막대 */}
                <div className="w-6 h-16 bg-muted/30 rounded-t relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t transition-all duration-300 ${
                      isCurrentMonth
                        ? "bg-primary"
                        : count > 0
                        ? "bg-primary/70 group-hover:bg-primary"
                        : "bg-muted"
                    }`}
                    style={{ height: `${Math.max(heightPct, count > 0 ? 10 : 0)}%` }}
                  />
                </div>
                {/* 월 */}
                <span className={`text-[10px] transition-colors ${
                  isCurrentMonth
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}>
                  {monthNames[month]}
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
