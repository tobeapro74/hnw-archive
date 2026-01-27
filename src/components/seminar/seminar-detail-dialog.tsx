"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, X, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SeminarWithChecklist,
  ChecklistPhase,
  calculateDday,
  formatDday,
  seminarCategoryBgColors,
  seminarTypeBgColors,
  seminarStatusColors,
} from "@/lib/seminar-types";
import { ProgressBar, PhaseProgress } from "./progress-bar";
import { ChecklistSection, ChecklistTabs } from "./checklist-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SeminarDetailDialogProps {
  seminarId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (seminar: SeminarWithChecklist) => void;
  onDelete?: (seminarId: string) => void;
}

export function SeminarDetailDialog({
  seminarId,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: SeminarDetailDialogProps) {
  const [seminar, setSeminar] = useState<SeminarWithChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePhase, setActivePhase] = useState<ChecklistPhase>("사전");

  // 세미나 상세 정보 로드
  useEffect(() => {
    if (!seminarId || !open) {
      setSeminar(null);
      return;
    }

    const fetchSeminar = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/seminars/${seminarId}`);
        if (res.ok) {
          const data = await res.json();
          setSeminar(data);
        }
      } catch (error) {
        console.error("Failed to fetch seminar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeminar();
  }, [seminarId, open]);

  // 체크리스트 토글
  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });

      if (res.ok && seminar) {
        // 로컬 상태 업데이트
        const updatedChecklist = seminar.checklist.map((item) =>
          item._id === itemId ? { ...item, isCompleted } : item
        );

        // 진행률 재계산
        const completed = updatedChecklist.filter((item) => item.isCompleted).length;
        const total = updatedChecklist.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // 단계별 진행률 재계산
        const phaseProgress = {
          사전: { total: 0, completed: 0 },
          당일: { total: 0, completed: 0 },
          사후: { total: 0, completed: 0 },
        };

        updatedChecklist.forEach((item) => {
          phaseProgress[item.phase as ChecklistPhase].total += 1;
          if (item.isCompleted) {
            phaseProgress[item.phase as ChecklistPhase].completed += 1;
          }
        });

        setSeminar({
          ...seminar,
          checklist: updatedChecklist,
          progress: { total, completed, percentage },
          phaseProgress,
        });
      }
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  // 체크리스트 항목 삭제
  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/checklist/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok && seminar) {
        const updatedChecklist = seminar.checklist.filter((item) => item._id !== itemId);

        const completed = updatedChecklist.filter((item) => item.isCompleted).length;
        const total = updatedChecklist.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const phaseProgress = {
          사전: { total: 0, completed: 0 },
          당일: { total: 0, completed: 0 },
          사후: { total: 0, completed: 0 },
        };

        updatedChecklist.forEach((item) => {
          phaseProgress[item.phase as ChecklistPhase].total += 1;
          if (item.isCompleted) {
            phaseProgress[item.phase as ChecklistPhase].completed += 1;
          }
        });

        setSeminar({
          ...seminar,
          checklist: updatedChecklist,
          progress: { total, completed, percentage },
          phaseProgress,
        });
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  // 체크리스트 항목 추가
  const handleAddItem = async (phase: ChecklistPhase, title: string) => {
    if (!seminar) return;

    try {
      const res = await fetch(`/api/seminars/${seminar._id}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, title }),
      });

      if (res.ok) {
        const newItem = await res.json();
        const updatedChecklist = [...seminar.checklist, newItem];

        const completed = updatedChecklist.filter((item) => item.isCompleted).length;
        const total = updatedChecklist.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const phaseProgress = {
          사전: { total: 0, completed: 0 },
          당일: { total: 0, completed: 0 },
          사후: { total: 0, completed: 0 },
        };

        updatedChecklist.forEach((item) => {
          phaseProgress[item.phase as ChecklistPhase].total += 1;
          if (item.isCompleted) {
            phaseProgress[item.phase as ChecklistPhase].completed += 1;
          }
        });

        setSeminar({
          ...seminar,
          checklist: updatedChecklist,
          progress: { total, completed, percentage },
          phaseProgress,
        });
      }
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  // 세미나 삭제
  const handleDelete = async () => {
    if (!seminar || !confirm("이 세미나를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/seminars/${seminar._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.(seminar._id!);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to delete seminar:", error);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">로딩 중...</div>
        ) : seminar ? (
          <>
            {/* 헤더 */}
            <div className={cn("p-4", seminarCategoryBgColors[seminar.category])}>
              <DialogHeader className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs",
                        seminarTypeBgColors[seminar.seminarType],
                        "text-white"
                      )}
                    >
                      {seminar.seminarType}
                    </Badge>
                    <Badge
                      className={cn("text-xs", seminarStatusColors[seminar.status], "text-white")}
                    >
                      {seminar.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => onEdit(seminar)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <DialogTitle className="text-white text-lg">{seminar.title}</DialogTitle>
              </DialogHeader>

              {/* 기본 정보 */}
              <div className="mt-3 space-y-1 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(seminar.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </span>
                  <Badge className="bg-white/20 text-white ml-auto">
                    {formatDday(calculateDday(seminar.date))}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{seminar.location}</span>
                </div>
                {seminar.expectedAttendees && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>예상 {seminar.expectedAttendees}명</span>
                  </div>
                )}
              </div>
            </div>

            {/* 진행률 */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">전체 진행률</span>
                <span className="text-sm font-bold">{seminar.progress.percentage}%</span>
              </div>
              <ProgressBar percentage={seminar.progress.percentage} size="lg" />
              <div className="mt-3">
                <PhaseProgress phaseProgress={seminar.phaseProgress} />
              </div>
            </div>

            {/* 체크리스트 탭 */}
            <ChecklistTabs
              activePhase={activePhase}
              onPhaseChange={setActivePhase}
              phaseCounts={seminar.phaseProgress}
            />

            {/* 체크리스트 내용 */}
            <div className="p-4">
              <ChecklistSection
                phase={activePhase}
                items={seminar.checklist.filter((item) => item.phase === activePhase)}
                seminarDate={seminar.date}
                onToggleItem={handleToggleItem}
                onDeleteItem={handleDeleteItem}
                onAddItem={handleAddItem}
              />
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            세미나 정보를 불러올 수 없습니다.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
