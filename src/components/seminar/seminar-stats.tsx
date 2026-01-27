"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Seminar, SeminarRequest, calculateDday } from "@/lib/seminar-types";

interface SeminarStatsProps {
  seminars: Seminar[];
  requests?: SeminarRequest[];
}

export function SeminarStats({ seminars, requests = [] }: SeminarStatsProps) {
  // 정기 세미나 통계 (seminars에서)
  const regularSeminars = seminars.filter((s) => s.seminarType === "정기");
  const regularStats = {
    total: regularSeminars.length,
    upcoming: regularSeminars.filter((s) => {
      const dday = calculateDday(s.date);
      return dday > 0 && s.status === "준비중";
    }).length,
    inProgress: regularSeminars.filter((s) => {
      const dday = calculateDday(s.date);
      return dday <= 0 && dday >= -7 && s.status === "준비중";
    }).length,
    completed: regularSeminars.filter((s) => s.status === "완료").length,
  };

  // 비정기 세미나 통계 (requests에서 - 요청 상태 기준)
  const irregularStats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "요청접수" || r.status === "검토중").length,
    approved: requests.filter((r) => r.status === "승인").length,
    completed: requests.filter((r) => r.status === "완료").length,
  };

  // 카테고리별 (정기 세미나만)
  const foCount = regularSeminars.filter((s) => s.category === "패밀리오피스").length;
  const corpCount = regularSeminars.filter((s) => s.category === "법인").length;

  // 이번 주 세미나 수
  const thisWeekSeminars = seminars.filter((s) => {
    const dday = calculateDday(s.date);
    return dday >= 0 && dday <= 7;
  }).length;

  const totalCount = regularStats.total + irregularStats.total;

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">세미나 현황</h3>
        <span className="text-xs text-muted-foreground">총 {totalCount}건</span>
      </div>

      {/* 주간 알림 */}
      {thisWeekSeminars > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-700">
            이번 주 세미나 <strong>{thisWeekSeminars}개</strong>
          </span>
        </div>
      )}

      {/* 정기/비정기 통합 카드 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 정기 */}
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">정기</span>
            <span className="text-lg font-bold text-emerald-600 ml-auto">{regularStats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={cn(regularStats.upcoming > 0 && "text-blue-600 font-medium")}>
              예정 {regularStats.upcoming}
            </span>
            <span>·</span>
            <span className={cn(regularStats.inProgress > 0 && "text-orange-600 font-medium")}>
              진행 {regularStats.inProgress}
            </span>
            <span>·</span>
            <span className={cn(regularStats.completed > 0 && "text-green-600 font-medium")}>
              완료 {regularStats.completed}
            </span>
          </div>
        </div>

        {/* 비정기 */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-700">비정기</span>
            <span className="text-lg font-bold text-amber-600 ml-auto">{irregularStats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={cn(irregularStats.pending > 0 && "text-blue-600 font-medium")}>
              대기 {irregularStats.pending}
            </span>
            <span>·</span>
            <span className={cn(irregularStats.approved > 0 && "text-orange-600 font-medium")}>
              승인 {irregularStats.approved}
            </span>
            <span>·</span>
            <span className={cn(irregularStats.completed > 0 && "text-green-600 font-medium")}>
              완료 {irregularStats.completed}
            </span>
          </div>
        </div>
      </div>

      {/* 카테고리별 (정기만) */}
      {regularStats.total > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-[11px] text-muted-foreground">카테고리</span>
          <div className="flex-1 flex items-center gap-3 justify-end">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-xs">패밀리오피스</span>
              <span className="text-xs font-semibold text-violet-600">{foCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="text-xs">법인</span>
              <span className="text-xs font-semibold text-sky-600">{corpCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
