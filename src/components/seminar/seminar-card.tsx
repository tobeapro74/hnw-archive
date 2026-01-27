"use client";

import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Seminar,
  calculateDday,
  formatDday,
  seminarCategoryBgColors,
  seminarCategoryLightBgColors,
  seminarCategoryTextColors,
  seminarTypeBgColors,
  seminarStatusColors,
} from "@/lib/seminar-types";
import { ProgressBar } from "./progress-bar";
import { Badge } from "@/components/ui/badge";

interface SeminarCardProps {
  seminar: Seminar & {
    progress?: { total: number; completed: number; percentage: number };
  };
  onClick?: () => void;
  compact?: boolean;
}

export function SeminarCard({ seminar, onClick, compact = false }: SeminarCardProps) {
  const dday = calculateDday(seminar.date);
  const ddayText = formatDday(dday);
  const isUpcoming = dday > 0;
  const isToday = dday === 0;
  const isPast = dday < 0;

  const seminarDate = new Date(seminar.date);
  const dateStr = seminarDate.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-3 rounded-lg border transition-all hover:shadow-md",
          seminarCategoryLightBgColors[seminar.category]
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium truncate">{seminar.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{dateStr}</span>
              <MapPin className="w-3 h-3 ml-1" />
              <span className="truncate">{seminar.location}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              className={cn(
                "text-[10px]",
                isToday
                  ? "bg-red-500 text-white"
                  : isUpcoming
                  ? "bg-blue-500 text-white"
                  : "bg-slate-400 text-white"
              )}
            >
              {ddayText}
            </Badge>
            {seminar.progress && (
              <span className="text-[10px] text-muted-foreground">
                {seminar.progress.percentage}%
              </span>
            )}
          </div>
        </div>
        {seminar.progress && (
          <div className="mt-2">
            <ProgressBar percentage={seminar.progress.percentage} size="sm" />
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg"
    >
      {/* 상단 컬러 바 */}
      <div className={cn("h-2", seminarCategoryBgColors[seminar.category])} />

      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* 배지들 */}
            <div className="flex items-center gap-1.5 mb-2">
              <Badge
                className={cn("text-[10px]", seminarTypeBgColors[seminar.seminarType], "text-white")}
              >
                {seminar.seminarType}
              </Badge>
              <Badge
                className={cn(
                  "text-[10px]",
                  seminarCategoryBgColors[seminar.category],
                  "text-white"
                )}
              >
                {seminar.category}
              </Badge>
              {seminar.corporateType && (
                <Badge variant="outline" className="text-[10px]">
                  {seminar.corporateType}
                </Badge>
              )}
              <Badge className={cn("text-[10px]", seminarStatusColors[seminar.status], "text-white")}>
                {seminar.status}
              </Badge>
            </div>
            {/* 제목 */}
            <h3 className="font-semibold text-base leading-tight">{seminar.title}</h3>
          </div>

          {/* D-day */}
          <div
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-lg text-center",
              isToday
                ? "bg-red-500 text-white"
                : isUpcoming
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            <div className="text-lg font-bold leading-none">{ddayText}</div>
          </div>
        </div>

        {/* 정보 */}
        <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {seminarDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{seminar.location}</span>
          </div>
          {seminar.expectedAttendees && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                예상 {seminar.expectedAttendees}명
                {seminar.actualAttendees && ` (실제 ${seminar.actualAttendees}명)`}
              </span>
            </div>
          )}
        </div>

        {/* 진행률 */}
        {seminar.progress && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">체크리스트 진행률</span>
              <span className="text-xs font-medium">
                {seminar.progress.completed}/{seminar.progress.total} (
                {seminar.progress.percentage}%)
              </span>
            </div>
            <ProgressBar percentage={seminar.progress.percentage} size="md" />
          </div>
        )}
      </div>
    </button>
  );
}

// 세미나 리스트 아이템 (간략 버전)
interface SeminarListItemProps {
  seminar: Seminar & {
    progress?: { total: number; completed: number; percentage: number };
  };
  onClick?: () => void;
}

export function SeminarListItem({ seminar, onClick }: SeminarListItemProps) {
  const dday = calculateDday(seminar.date);
  const ddayText = formatDday(dday);
  const isUpcoming = dday > 0;
  const isToday = dday === 0;

  const seminarDate = new Date(seminar.date);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
    >
      {/* 날짜 */}
      <div className="flex-shrink-0 w-12 text-center">
        <div className="text-lg font-bold">{seminarDate.getDate()}</div>
        <div className="text-xs text-muted-foreground">
          {seminarDate.toLocaleDateString("ko-KR", { weekday: "short" })}
        </div>
      </div>

      {/* 구분선 */}
      <div className={cn("w-1 h-10 rounded-full", seminarCategoryBgColors[seminar.category])} />

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Badge
            className={cn("text-[10px]", seminarTypeBgColors[seminar.seminarType], "text-white")}
          >
            {seminar.seminarType}
          </Badge>
          <span className="font-medium text-sm truncate">{seminar.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{seminar.location}</span>
          {seminar.expectedAttendees && (
            <>
              <Users className="w-3 h-3 ml-1" />
              <span>{seminar.expectedAttendees}명</span>
            </>
          )}
        </div>
      </div>

      {/* D-day & 진행률 */}
      <div className="flex-shrink-0 text-right">
        <Badge
          className={cn(
            "text-xs mb-1",
            isToday
              ? "bg-red-500 text-white"
              : isUpcoming
              ? "bg-blue-500 text-white"
              : "bg-slate-400 text-white"
          )}
        >
          {ddayText}
        </Badge>
        {seminar.progress && (
          <div className="w-16">
            <ProgressBar percentage={seminar.progress.percentage} size="sm" />
          </div>
        )}
      </div>
    </button>
  );
}
