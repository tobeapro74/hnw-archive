"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Edit2, Trash2, ClipboardList, FileText, Building2, Target } from "lucide-react";
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
import { X } from "lucide-react";

type DetailTab = "checklist" | "info";

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
  const [activeTab, setActiveTab] = useState<DetailTab>("checklist");

  // 세미나 상세 정보 로드
  useEffect(() => {
    if (!seminarId || !open) {
      setSeminar(null);
      setActiveTab("checklist");
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

  // 체크리스트 항목 목표일 수정
  const handleUpdateDueDate = async (itemId: string, dueOffset: number | undefined) => {
    try {
      const res = await fetch(`/api/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueOffset }),
      });

      if (res.ok && seminar) {
        const updatedChecklist = seminar.checklist.map((item) =>
          item._id === itemId ? { ...item, dueOffset } : item
        );

        setSeminar({
          ...seminar,
          checklist: updatedChecklist,
        });
      }
    } catch (error) {
      console.error("Failed to update due date:", error);
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg bg-background rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">로딩 중...</div>
        ) : seminar ? (
          <>
            {/* 컴팩트 헤더 */}
            <div className={cn("shrink-0 px-4 py-2", seminarCategoryBgColors[seminar.category])}>
              {/* 핸들 + 액션버튼 */}
              <div className="flex items-center justify-between">
                <div className="w-8" />
                <div className="w-8 h-1 bg-white/30 rounded-full" />
                <div className="flex items-center">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 w-7 h-7"
                      onClick={() => onEdit(seminar)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 w-7 h-7"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-7 h-7"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 제목 + 배지 */}
              <div className="flex items-start justify-between gap-2 mt-1">
                <h2 className="text-white text-base font-semibold leading-tight flex-1">{seminar.title}</h2>
                <Badge className="bg-white/20 text-white text-xs shrink-0">
                  {formatDday(calculateDday(seminar.date))}
                </Badge>
              </div>

              {/* 메타 정보 한 줄 */}
              <div className="flex items-center gap-3 mt-1.5 text-white/80 text-xs">
                <div className="flex items-center gap-1">
                  <Badge
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      seminarTypeBgColors[seminar.seminarType],
                      "text-white"
                    )}
                  >
                    {seminar.seminarType}
                  </Badge>
                  <Badge
                    className={cn("text-[10px] px-1.5 py-0", seminarStatusColors[seminar.status], "text-white")}
                  >
                    {seminar.status}
                  </Badge>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(seminar.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {seminar.location}
                </span>
              </div>
            </div>

            {/* 메인 탭 (체크리스트 / 상세정보) */}
            <div className="shrink-0 flex border-b bg-muted/30">
              <button
                onClick={() => setActiveTab("checklist")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  activeTab === "checklist"
                    ? "text-primary border-b-2 border-primary bg-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                체크리스트
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  activeTab === "info"
                    ? "text-primary border-b-2 border-primary bg-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="w-4 h-4" />
                상세정보
              </button>
            </div>

            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {activeTab === "checklist" ? (
                <>
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
                  <div className="p-4 pb-8">
                    <ChecklistSection
                      phase={activePhase}
                      items={seminar.checklist.filter((item) => item.phase === activePhase)}
                      seminarDate={seminar.date}
                      onToggleItem={handleToggleItem}
                      onDeleteItem={handleDeleteItem}
                      onAddItem={handleAddItem}
                      onUpdateDueDate={handleUpdateDueDate}
                    />
                  </div>
                </>
              ) : (
                /* 상세정보 탭 */
                <div className="p-4 pb-8 space-y-4">
                  {/* 기본 정보 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">일시</p>
                          <p className="text-sm font-medium">
                            {new Date(seminar.date).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              weekday: "long",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">장소</p>
                          <p className="text-sm font-medium">{seminar.location}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">참석자</p>
                          <p className="text-sm font-medium">
                            {seminar.actualAttendees !== undefined
                              ? `실제 ${seminar.actualAttendees}명`
                              : seminar.expectedAttendees
                                ? `예상 ${seminar.expectedAttendees}명`
                                : "미정"}
                            {seminar.actualAttendees !== undefined && seminar.expectedAttendees && (
                              <span className="text-muted-foreground ml-1">
                                (예상 {seminar.expectedAttendees}명)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 분류 정보 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">분류</h3>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">카테고리</span>
                        <Badge className={cn(seminarCategoryBgColors[seminar.category], "text-white")}>
                          {seminar.category}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">유형</span>
                        <Badge className={cn(seminarTypeBgColors[seminar.seminarType], "text-white")}>
                          {seminar.seminarType}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">상태</span>
                        <Badge className={cn(seminarStatusColors[seminar.status], "text-white")}>
                          {seminar.status}
                        </Badge>
                      </div>

                      {seminar.corporateType && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">법인유형</span>
                          </div>
                          <span className="text-sm font-medium">{seminar.corporateType}</span>
                        </div>
                      )}

                      {seminar.targetType && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">대상유형</span>
                          </div>
                          <span className="text-sm font-medium">{seminar.targetType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 설명 */}
                  {seminar.description && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">설명</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap">{seminar.description}</p>
                      </div>
                    </div>
                  )}

                  {/* 등록 정보 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">등록 정보</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>등록일</span>
                        <span>{new Date(seminar.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>최종 수정일</span>
                        <span>{new Date(seminar.updatedAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                      {seminar.createdBy && (
                        <div className="flex justify-between">
                          <span>등록자</span>
                          <span>{seminar.createdBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            세미나 정보를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
