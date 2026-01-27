"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Seminar,
  SeminarRequest,
} from "@/lib/seminar-types";
import { Button } from "@/components/ui/button";

interface SeminarCalendarProps {
  seminars: (Seminar & { progress?: { percentage: number } })[];
  requests?: SeminarRequest[];
  onDateClick?: (date: Date, seminars: Seminar[], requests: SeminarRequest[]) => void;
  onSeminarClick?: (seminar: Seminar) => void;
  onRequestClick?: (request: SeminarRequest) => void;
}

export function SeminarCalendar({
  seminars,
  requests = [],
  onDateClick,
  onSeminarClick,
  onRequestClick,
}: SeminarCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 월의 첫날과 마지막날
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // 날짜별 세미나 매핑
  const seminarsByDate = useMemo(() => {
    const map = new Map<string, (Seminar & { progress?: { percentage: number } })[]>();
    seminars.forEach((seminar) => {
      const date = new Date(seminar.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const key = date.getDate().toString();
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(seminar);
      }
    });
    return map;
  }, [seminars, year, month]);

  // 날짜별 요청 매핑
  const requestsByDate = useMemo(() => {
    const map = new Map<string, SeminarRequest[]>();
    requests.forEach((request) => {
      const date = new Date(request.requestedDate);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const key = date.getDate().toString();
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(request);
      }
    });
    return map;
  }, [requests, year, month]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    const daySeminars = seminarsByDate.get(day.toString()) || [];
    const dayRequests = requestsByDate.get(day.toString()) || [];
    onDateClick?.(date, daySeminars, dayRequests);

    // 해당 날짜에 세미나 1개만 있으면 바로 열기
    if (daySeminars.length === 1 && dayRequests.length === 0) {
      onSeminarClick?.(daySeminars[0]);
    } else if (daySeminars.length === 0 && dayRequests.length === 1) {
      onRequestClick?.(dayRequests[0]);
    }
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  // 달력 그리드 생성
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {year}년 {month + 1}월
        </h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-medium py-2",
              index === 0 && "text-red-500",
              index === 6 && "text-blue-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const daySeminars = seminarsByDate.get(day.toString()) || [];
          const dayRequests = requestsByDate.get(day.toString()) || [];
          const hasItems = daySeminars.length > 0 || dayRequests.length > 0;
          const isSelected = selectedDate?.getDate() === day &&
                           selectedDate?.getMonth() === month &&
                           selectedDate?.getFullYear() === year;
          const dayOfWeek = (firstDayWeekday + day - 1) % 7;
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative",
                hasItems && "font-medium",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && hasItems && "bg-muted hover:bg-muted/80",
                !isSelected && !hasItems && "hover:bg-muted/50",
                dayOfWeek === 0 && !isSelected && "text-red-500",
                dayOfWeek === 6 && !isSelected && "text-blue-500",
                isToday && !isSelected && "ring-2 ring-primary ring-offset-1"
              )}
            >
              <span>{day}</span>
              {hasItems && (
                <div className="flex gap-0.5 mt-0.5">
                  {/* 세미나 점 (카테고리별 색상) */}
                  {daySeminars.slice(0, 2).map((seminar, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        seminar.category === "패밀리오피스" && "bg-violet-500",
                        seminar.category === "법인" && "bg-sky-500"
                      )}
                    />
                  ))}
                  {/* 요청 점 (주황색) */}
                  {dayRequests.slice(0, 2 - daySeminars.length).map((_, i) => (
                    <div
                      key={`req-${i}`}
                      className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    />
                  ))}
                  {/* 더 있으면 추가 표시 */}
                  {(daySeminars.length + dayRequests.length) > 2 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          <span className="text-xs text-muted-foreground">패밀리오피스</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span className="text-xs text-muted-foreground">법인</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-xs text-muted-foreground">요청</span>
        </div>
      </div>
    </div>
  );
}

// 미니 캘린더 (대시보드용)
interface MiniCalendarProps {
  seminars: Seminar[];
  requests?: SeminarRequest[];
  onDateClick?: (date: Date) => void;
}

export function MiniCalendar({ seminars, requests = [], onDateClick }: MiniCalendarProps) {
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

  const requestDates = useMemo(() => {
    const dates = new Set<string>();
    requests.forEach((request) => {
      dates.add(new Date(request.requestedDate).toDateString());
    });
    return dates;
  }, [requests]);

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
          const hasRequest = requestDates.has(dateKey);
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
                !isTodayDate && (hasSeminar || hasRequest) && "font-semibold",
                "hover:bg-muted"
              )}
            >
              {date.getDate()}
              {/* 세미나 및 요청 점 표시 */}
              {!isTodayDate && (hasSeminar || hasRequest) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasSeminar && (
                    <span className="w-1 h-1 bg-primary rounded-full" />
                  )}
                  {hasRequest && (
                    <span className="w-1 h-1 bg-amber-500 rounded-full" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
