"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Schedule, ScheduleCategory } from "@/lib/schedule-types";
import { ScheduleCard } from "./schedule-card";
import { ScheduleFormDialog } from "./schedule-form-dialog";
import { ScheduleDetailDialog } from "./schedule-detail-dialog";

export function ScheduleView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<ScheduleCategory | "전체">("전체");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 일정 목록 조회
  useEffect(() => {
    fetchSchedules();
  }, [selectedYear]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedules?year=${selectedYear}`);
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 일정
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      if (selectedCategory !== "전체" && schedule.category !== selectedCategory) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    // 월별로 정렬
    const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));
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
    // 신규 등록인 경우 즉시 목록에 추가, 수정인 경우 기존 항목 업데이트
    setSchedules((prev) => {
      const existingIndex = prev.findIndex((s) => s._id === schedule._id);
      if (existingIndex >= 0) {
        // 수정
        const updated = [...prev];
        updated[existingIndex] = schedule;
        return updated;
      } else {
        // 신규 등록
        return [schedule, ...prev];
      }
    });

    setFormOpen(false);
    setEditingSchedule(null);

    // 수정된 일정을 상세 모달에도 반영
    if (selectedSchedule && selectedSchedule._id === schedule._id) {
      setSelectedSchedule(schedule);
      setDetailOpen(true);
    }

    // 백그라운드에서 최신 데이터 동기화
    fetchSchedules();
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
        await fetchSchedules();
        setDetailOpen(false);
        setSelectedSchedule(null);
      } else {
        const error = await res.json();
        if (res.status === 401 || error.error === "로그인이 필요합니다.") {
          if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
            window.location.href = "/admin";
          }
        } else {
          alert(error.error || "삭제에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      alert("삭제에 실패했습니다.");
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
        <h2 className="text-xl font-semibold">일정 관리</h2>
        <Button onClick={handleNewSchedule} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          새 일정
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 items-center overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Button
          variant={selectedCategory === "전체" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("전체")}
        >
          전체
        </Button>
        <Button
          variant={selectedCategory === "회의" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("회의")}
        >
          💼 회의
        </Button>
        <Button
          variant={selectedCategory === "외근" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("외근")}
        >
          🚗 외근
        </Button>
        <Button
          variant={selectedCategory === "기타" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("기타")}
        >
          📌 기타
        </Button>
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
        <div className="py-16 text-center text-muted-foreground">
          <p>등록된 일정이 없습니다.</p>
          <Button onClick={handleNewSchedule} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            첫 일정 만들기
          </Button>
        </div>
      )}

      {/* 폼 다이얼로그 */}
      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        schedule={editingSchedule}
        onSave={handleSave}
      />

      {/* 상세 다이얼로그 */}
      {selectedSchedule && (
        <ScheduleDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          schedule={selectedSchedule}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
