"use client";

import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Seminar, calculateDday } from "@/lib/seminar-types";

interface SeminarStatsProps {
  seminars: Seminar[];
  onStatClick?: (type: "upcoming" | "inProgress" | "completed") => void;
}

export function SeminarStats({ seminars, onStatClick }: SeminarStatsProps) {
  // 통계 계산
  const stats = {
    upcoming: seminars.filter((s) => {
      const dday = calculateDday(s.date);
      return dday > 0 && s.status === "준비중";
    }).length,
    inProgress: seminars.filter((s) => {
      const dday = calculateDday(s.date);
      return dday <= 0 && dday >= -7 && s.status === "준비중";
    }).length,
    completed: seminars.filter((s) => s.status === "완료").length,
  };

  // 이번 주 세미나 수
  const thisWeekSeminars = seminars.filter((s) => {
    const dday = calculateDday(s.date);
    return dday >= 0 && dday <= 7;
  }).length;

  const statCards = [
    {
      key: "upcoming" as const,
      label: "예정",
      count: stats.upcoming,
      icon: Calendar,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      key: "inProgress" as const,
      label: "진행중",
      count: stats.inProgress,
      icon: Clock,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      key: "completed" as const,
      label: "완료",
      count: stats.completed,
      icon: CheckCircle,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ];

  // 정기/비정기 통계
  const regularCount = seminars.filter((s) => s.seminarType === "정기").length;
  const irregularCount = seminars.filter((s) => s.seminarType === "비정기").length;

  return (
    <div className="space-y-2">
      {/* 주간 알림 */}
      {thisWeekSeminars > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-700">
            이번 주 세미나 <strong>{thisWeekSeminars}개</strong>
          </span>
        </div>
      )}

      {/* 정기/비정기 구분 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50">
          <div className="w-2 h-8 rounded-full bg-emerald-500" />
          <div>
            <div className="text-xl font-bold text-emerald-600">{regularCount}</div>
            <div className="text-[11px] text-muted-foreground">정기 세미나</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50">
          <div className="w-2 h-8 rounded-full bg-amber-500" />
          <div>
            <div className="text-xl font-bold text-amber-600">{irregularCount}</div>
            <div className="text-[11px] text-muted-foreground">비정기 세미나</div>
          </div>
        </div>
      </div>

      {/* 상태별 통계 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map(({ key, label, count, icon: Icon, color, lightColor, textColor }) => (
          <button
            key={key}
            onClick={() => onStatClick?.(key)}
            className={cn(
              "p-2.5 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
              lightColor
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("p-1 rounded", color)}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className={cn("text-xl font-bold", textColor)}>
                {count}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// 세미나 유형별 통계
interface SeminarTypeStatsProps {
  seminars: Seminar[];
}

export function SeminarTypeStats({ seminars }: SeminarTypeStatsProps) {
  const regularCount = seminars.filter((s) => s.seminarType === "정기").length;
  const irregularCount = seminars.filter((s) => s.seminarType === "비정기").length;

  const foCount = seminars.filter((s) => s.category === "패밀리오피스").length;
  const corpCount = seminars.filter((s) => s.category === "법인").length;

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">세미나 현황</h3>

      <div className="space-y-3">
        {/* 유형별 */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>유형별</span>
            <span>총 {seminars.length}건</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-emerald-600">{regularCount}</div>
              <div className="text-[10px] text-muted-foreground">정기</div>
            </div>
            <div className="flex-1 bg-amber-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-amber-600">{irregularCount}</div>
              <div className="text-[10px] text-muted-foreground">비정기</div>
            </div>
          </div>
        </div>

        {/* 카테고리별 */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">카테고리별</div>
          <div className="flex gap-2">
            <div className="flex-1 bg-purple-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-purple-600">{foCount}</div>
              <div className="text-[10px] text-muted-foreground">패밀리오피스</div>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{corpCount}</div>
              <div className="text-[10px] text-muted-foreground">법인</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
