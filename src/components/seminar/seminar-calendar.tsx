"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Seminar,
  seminarCategoryBgColors,
} from "@/lib/seminar-types";
import { Button } from "@/components/ui/button";

interface SeminarCalendarProps {
  seminars: (Seminar & { progress?: { percentage: number } })[];
  onDateClick?: (date: Date, seminars: Seminar[]) => void;
  onSeminarClick?: (seminar: Seminar) => void;
}

export function SeminarCalendar({
  seminars,
  onDateClick,
  onSeminarClick,
}: SeminarCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 월의 첫날과 마지막날
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // 달력에 표시할 날짜들 계산
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // 첫째 주 시작 전 빈 칸
    const startDay = firstDayOfMonth.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // 해당 월의 모든 날짜
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [year, month, firstDayOfMonth, lastDayOfMonth]);

  // 날짜별 세미나 매핑
  const seminarsByDate = useMemo(() => {
    const map: Record<string, (Seminar & { progress?: { percentage: number } })[]> = {};

    seminars.forEach((seminar) => {
      const dateKey = new Date(seminar.date).toDateString();
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(seminar);
    });

    return map;
  }, [seminars]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (date: Date) => {
    const dateKey = date.toDateString();
    const dateSeminars = seminarsByDate[dateKey] || [];
    onDateClick?.(date, dateSeminars);
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {year}년 {month + 1}월
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-sm font-medium",
              index === 0 && "text-red-500",
              index === 6 && "text-blue-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-[80px] bg-muted/30" />;
          }

          const dateKey = date.toDateString();
          const dateSeminars = seminarsByDate[dateKey] || [];
          const dayOfWeek = date.getDay();
          const isTodayDate = isToday(date);

          return (
            <button
              key={dateKey}
              onClick={() => handleDateClick(date)}
              className={cn(
                "min-h-[80px] p-1 border-r border-b text-left transition-colors hover:bg-muted/50",
                dayOfWeek === 0 && "bg-red-50/50",
                dayOfWeek === 6 && "bg-blue-50/50"
              )}
            >
              {/* 날짜 숫자 */}
              <div
                className={cn(
                  "w-6 h-6 flex items-center justify-center text-sm rounded-full mb-1",
                  isTodayDate && "bg-primary text-primary-foreground font-bold",
                  dayOfWeek === 0 && !isTodayDate && "text-red-500",
                  dayOfWeek === 6 && !isTodayDate && "text-blue-500"
                )}
              >
                {date.getDate()}
              </div>

              {/* 세미나 표시 */}
              <div className="space-y-0.5">
                {dateSeminars.slice(0, 2).map((seminar) => (
                  <button
                    key={seminar._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeminarClick?.(seminar);
                    }}
                    className={cn(
                      "w-full text-left px-1 py-0.5 rounded text-[10px] truncate text-white",
                      seminarCategoryBgColors[seminar.category]
                    )}
                  >
                    {seminar.title}
                  </button>
                ))}
                {dateSeminars.length > 2 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dateSeminars.length - 2}개 더
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 미니 캘린더 (대시보드용)
interface MiniCalendarProps {
  seminars: Seminar[];
  onDateClick?: (date: Date) => void;
}

export function MiniCalendar({ seminars, onDateClick }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const startDay = firstDayOfMonth.getDay();

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [year, month, firstDayOfMonth, lastDayOfMonth]);

  const seminarDates = useMemo(() => {
    const dates = new Set<string>();
    seminars.forEach((seminar) => {
      dates.add(new Date(seminar.date).toDateString());
    });
    return dates;
  }, [seminars]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-card rounded-xl p-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-[10px] text-muted-foreground",
              i === 0 && "text-red-400",
              i === 6 && "text-blue-400"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="w-7 h-7" />;
          }

          const dateKey = date.toDateString();
          const hasSeminar = seminarDates.has(dateKey);
          const isTodayDate = isToday(date);
          const dayOfWeek = date.getDay();

          return (
            <button
              key={dateKey}
              onClick={() => onDateClick?.(date)}
              className={cn(
                "w-7 h-7 flex items-center justify-center text-xs rounded-full relative transition-colors",
                isTodayDate && "bg-primary text-primary-foreground font-bold",
                !isTodayDate && dayOfWeek === 0 && "text-red-500",
                !isTodayDate && dayOfWeek === 6 && "text-blue-500",
                !isTodayDate && hasSeminar && "font-semibold",
                "hover:bg-muted"
              )}
            >
              {date.getDate()}
              {hasSeminar && !isTodayDate && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
