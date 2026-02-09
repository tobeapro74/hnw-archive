"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Filter, Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Schedule, ScheduleCategory } from "@/lib/schedule-types";
import { ScheduleCard } from "./schedule-card";
import { ScheduleFormDialog } from "./schedule-form-dialog";
import { ScheduleDetailDialog } from "./schedule-detail-dialog";

interface ScheduleViewProps {
  highlightScheduleId?: string | null;
  onHighlightHandled?: () => void;
  readOnly?: boolean;
}

export function ScheduleView({ highlightScheduleId, onHighlightHandled, readOnly }: ScheduleViewProps = {}) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<ScheduleCategory | "전체" | "지난일정">("전체");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 일정 목록 조회
  useEffect(() => {
    fetchSchedules();
  }, [selectedYear]);

  // highlightScheduleId가 전달되면 해당 일정 상세 모달 열기
  useEffect(() => {
    if (highlightScheduleId && schedules.length > 0) {
      const targetSchedule = schedules.find(s => s._id === highlightScheduleId);
      if (targetSchedule) {
        setSelectedSchedule(targetSchedule);
        setDetailOpen(true);
        onHighlightHandled?.();
      }
    }
  }, [highlightScheduleId, schedules, onHighlightHandled]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      console.log('[fetchSchedules] API 호출:', `year=${selectedYear}`);
      const res = await fetch(`/api/schedules?year=${selectedYear}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      console.log('[fetchSchedules] 받은 데이터:', data);
      setSchedules(Array.isArray(data) ? data : []);
      console.log('[fetchSchedules] setSchedules 완료');
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 일정
  const filteredSchedules = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPastFilter = selectedCategory === "지난일정";

    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
      scheduleDate.setHours(0, 0, 0, 0);

      if (isPastFilter) {
        // 지난일정: 오늘 이전 일정만
        return scheduleDate < today;
      } else {
        // 다가오는 일정: 오늘 이후 일정만 + 카테고리 필터
        if (scheduleDate < today) return false;
        if (selectedCategory !== "전체" && schedule.category !== selectedCategory) {
          return false;
        }
        return true;
      }
    }).sort((a, b) => {
      if (isPastFilter) {
        // 지난일정: 최근 것이 위로 (내림차순)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      // 다가오는 일정: 가까운 것이 위로 (오름차순)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [schedules, selectedCategory]);

  // 월별로 그룹화
  const schedulesByMonth = useMemo(() => {
    const groups: { month: string; schedules: Schedule[] }[] = [];
    const monthMap = new Map<string, Schedule[]>();

    filteredSchedules.forEach((schedule) => {
      const date = new Date(schedule.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, []);
      }
      monthMap.get(key)!.push(schedule);
    });

    // 월별로 정렬 (가까운 월이 위로)
    const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => a.localeCompare(b));
    sortedKeys.forEach((key) => {
      const [year, month] = key.split("-");
      groups.push({
        month: `${year}년 ${parseInt(month)}월`,
        schedules: monthMap.get(key)!,
      });
    });

    return groups;
  }, [filteredSchedules]);

  const handleSave = async (schedule: Schedule) => {
    console.log('[handleSave] 저장된 일정:', schedule);
    setFormOpen(false);
    setEditingSchedule(null);

    // 수정된 일정을 상세 모달에도 반영
    if (selectedSchedule && selectedSchedule._id === schedule._id) {
      setSelectedSchedule(schedule);
      setDetailOpen(true);
    }

    // 최신 데이터 동기화
    console.log('[handleSave] fetchSchedules 호출 전');
    await fetchSchedules();
    console.log('[handleSave] fetchSchedules 호출 완료');
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setDetailOpen(false);
    setFormOpen(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("일정을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log('[handleDelete] 삭제 성공:', scheduleId);
        toast.success("일정을 삭제했습니다.");
        setDetailOpen(false);
        setSelectedSchedule(null);

        // 최신 데이터 동기화
        console.log('[handleDelete] fetchSchedules 호출 전');
        await fetchSchedules();
        console.log('[handleDelete] fetchSchedules 호출 완료');
      } else {
        const error = await res.json();
        if (res.status === 401 || error.error === "로그인이 필요합니다.") {
          if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
            window.location.href = "/admin";
          }
        } else {
          toast.error(error.error || "삭제에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleCardClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setDetailOpen(true);
  };

  const handleNewSchedule = () => {
    setEditingSchedule(null);
    setFormOpen(true);
  };

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{readOnly ? "일정" : "일정 관리"}</h2>
        {!readOnly && (
          <Button onClick={handleNewSchedule} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            새 일정
          </Button>
        )}
      </div>

      {/* 필터 */}
      <div className="relative">
        <div className="flex gap-2 items-center overflow-x-auto pb-2 scrollbar-hide pr-6">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {([
            { key: "전체" as const, label: "전체" },
            { key: "회의" as const, label: "💼 회의" },
            { key: "외근" as const, label: "🚗 외근" },
            { key: "기타" as const, label: "📌 기타" },
          ] as const).map((item) => (
            <Button
              key={item.key}
              variant={selectedCategory === item.key ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setSelectedCategory(item.key)}
            >
              {item.label}
            </Button>
          ))}
          <div className="w-px h-5 bg-border flex-shrink-0" />
          <Button
            variant={selectedCategory === "지난일정" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("지난일정")}
            className="flex-shrink-0"
          >
            🕐 지난일정
          </Button>
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {/* 일정 목록 */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
      ) : schedulesByMonth.length > 0 ? (
        <div className="space-y-6">
          {schedulesByMonth.map((group) => (
            <div key={group.month} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">
                {group.month}
              </h3>
              <div className="space-y-3">
                {group.schedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule._id}
                    schedule={schedule}
                    onClick={() => handleCardClick(schedule)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title={selectedCategory === "지난일정" ? "지난 일정이 없습니다." : "다가오는 일정이 없습니다."}
          description={readOnly || selectedCategory === "지난일정" ? undefined : "새 일정을 등록해보세요."}
          action={readOnly || selectedCategory === "지난일정" ? undefined : { label: "첫 일정 만들기", onClick: handleNewSchedule }}
        />
      )}

      {/* 폼 다이얼로그 */}
      {!readOnly && (
        <ScheduleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          schedule={editingSchedule}
          onSave={handleSave}
        />
      )}

      {/* 상세 다이얼로그 */}
      {selectedSchedule && (
        <ScheduleDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          schedule={selectedSchedule}
          onEdit={handleEdit}
          onDelete={handleDelete}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
