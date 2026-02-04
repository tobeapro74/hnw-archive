"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/lib/types";
import { Schedule } from "@/lib/schedule-types";
import { Seminar } from "@/lib/seminar-types";
import { cn, getMonthName, getDaysInMonth, getFirstDayOfMonth } from "@/lib/utils";

interface CalendarViewProps {
  articles: Article[];
  schedules?: Schedule[];
  seminars?: Seminar[];
  onDateSelect?: (date: Date, articles: Article[], schedules: Schedule[], seminars: Seminar[]) => void;
}

export function CalendarView({ articles, schedules = [], seminars = [], onDateSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 해당 월의 기사들을 날짜별로 그룹화
  const articlesByDate = useMemo(() => {
    const map = new Map<string, Article[]>();
    articles.forEach((article) => {
      const date = new Date(article.publishedAt);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const key = date.getDate().toString();
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(article);
      }
    });
    return map;
  }, [articles, year, month]);

  // 해당 월의 일정들을 날짜별로 그룹화
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    schedules.forEach((schedule) => {
      const date = new Date(schedule.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const key = date.getDate().toString();
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(schedule);
      }
    });
    return map;
  }, [schedules, year, month]);

  // 해당 월의 세미나들을 날짜별로 그룹화
  const seminarsByDate = useMemo(() => {
    const map = new Map<string, Seminar[]>();
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

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // 월 변경 시 첫 번째 일정 자동 선택
  const selectFirstScheduleInMonth = (newYear: number, newMonth: number) => {
    // 해당 월의 일정들을 날짜순으로 정렬
    const monthSchedules = schedules
      .filter(schedule => {
        const date = new Date(schedule.date);
        return date.getFullYear() === newYear && date.getMonth() === newMonth;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (monthSchedules.length > 0) {
      const firstScheduleDate = new Date(monthSchedules[0].date);
      const day = firstScheduleDate.getDate();
      setSelectedDate(firstScheduleDate);

      // 해당 날짜의 모든 데이터 수집
      const dayArticles = articles.filter(article => {
        const date = new Date(article.publishedAt);
        return date.getFullYear() === newYear &&
               date.getMonth() === newMonth &&
               date.getDate() === day;
      });

      const daySchedules = schedules.filter(schedule => {
        const date = new Date(schedule.date);
        return date.getFullYear() === newYear &&
               date.getMonth() === newMonth &&
               date.getDate() === day;
      });

      const daySeminars = seminars.filter(seminar => {
        const date = new Date(seminar.date);
        return date.getFullYear() === newYear &&
               date.getMonth() === newMonth &&
               date.getDate() === day;
      });

      onDateSelect?.(firstScheduleDate, dayArticles, daySchedules, daySeminars);
    } else {
      setSelectedDate(null);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    selectFirstScheduleInMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    selectFirstScheduleInMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    const dayArticles = articlesByDate.get(day.toString()) || [];
    const daySchedules = schedulesByDate.get(day.toString()) || [];
    const daySeminars = seminarsByDate.get(day.toString()) || [];
    onDateSelect?.(date, dayArticles, daySchedules, daySeminars);
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  // 달력 그리드 생성
  const calendarDays = [];

  // 빈 칸 (이전 달)
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // 현재 달의 날짜
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {year}년 {getMonthName(month)}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
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

          const dayArticles = articlesByDate.get(day.toString()) || [];
          const daySchedules = schedulesByDate.get(day.toString()) || [];
          const daySeminars = seminarsByDate.get(day.toString()) || [];
          const hasArticles = dayArticles.length > 0;
          const hasSchedules = daySchedules.length > 0;
          const hasSeminars = daySeminars.length > 0;
          const hasContent = hasArticles || hasSchedules || hasSeminars;
          const isSelected = selectedDate?.getDate() === day &&
                           selectedDate?.getMonth() === month &&
                           selectedDate?.getFullYear() === year;
          const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          // 표시할 아이템들 (기사 + 일정 + 세미나)
          const displayItems = [
            ...dayArticles.map(article => ({ type: 'article' as const, data: article })),
            ...daySchedules.map(schedule => ({ type: 'schedule' as const, data: schedule })),
            ...daySeminars.map(seminar => ({ type: 'seminar' as const, data: seminar }))
          ];

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative",
                hasContent && "font-medium",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && hasContent && "bg-muted hover:bg-muted/80",
                !isSelected && !hasContent && "hover:bg-muted/50",
                dayOfWeek === 0 && !isSelected && "text-red-500",
                dayOfWeek === 6 && !isSelected && "text-blue-500",
                isToday && !isSelected && "ring-2 ring-primary ring-offset-1"
              )}
            >
              <span>{day}</span>
              {hasContent && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full px-0.5">
                  {displayItems.slice(0, 4).map((item, i) => {
                    if (item.type === 'article') {
                      const article = item.data as Article;
                      return (
                        <div
                          key={`article-${i}`}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            article.category === "인터뷰" && "bg-purple-500",
                            article.category === "세미나 안내" && "bg-orange-500",
                            article.category === "소개 및 홍보" && "bg-blue-500"
                          )}
                        />
                      );
                    } else if (item.type === 'schedule') {
                      const schedule = item.data as Schedule;
                      return (
                        <div
                          key={`schedule-${i}`}
                          className={cn(
                            "w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px]",
                            schedule.category === "회의" && "border-b-green-500",
                            schedule.category === "외근" && "border-b-yellow-500",
                            schedule.category === "기타" && "border-b-pink-500"
                          )}
                        />
                      );
                    } else {
                      // seminar
                      return (
                        <div
                          key={`seminar-${i}`}
                          className="w-1.5 h-1.5 rounded-full bg-orange-500"
                        />
                      );
                    }
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <span className="text-muted-foreground">기사</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">세미나</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-green-500" />
            <span className="text-muted-foreground">회의</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-yellow-500" />
            <span className="text-muted-foreground">외근</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-pink-500" />
            <span className="text-muted-foreground">기타</span>
          </div>
        </div>
      </div>
    </div>
  );
}
