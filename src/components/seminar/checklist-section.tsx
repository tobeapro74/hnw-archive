"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChecklistItem,
  ChecklistPhase,
  checklistPhaseBgColors,
  checklistPhaseLightBgColors,
  checklistPhaseTextColors,
} from "@/lib/seminar-types";
import { ChecklistItemComponent } from "./checklist-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChecklistSectionProps {
  phase: ChecklistPhase;
  items: ChecklistItem[];
  seminarDate: Date | string;
  onToggleItem: (itemId: string, isCompleted: boolean) => void;
  onDeleteItem?: (itemId: string) => void;
  onAddItem?: (phase: ChecklistPhase, title: string) => void;
  onUpdateDueDate?: (itemId: string, dueOffset: number | undefined) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ChecklistSection({
  phase,
  items,
  seminarDate,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onUpdateDueDate,
  isExpanded = true,
}: ChecklistSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");

  const completedCount = items.filter((item) => item.isCompleted).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = () => {
    if (!newItemTitle.trim() || !onAddItem) return;
    onAddItem(phase, newItemTitle.trim());
    setNewItemTitle("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewItemTitle("");
    }
  };

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium text-white",
              checklistPhaseBgColors[phase]
            )}
          >
            {phase}
          </div>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
          {percentage === 100 && (
            <span className="text-xs text-green-600 font-medium">완료!</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 진행률 바 (미니) */}
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", checklistPhaseBgColors[phase])}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">{percentage}%</span>
        </div>
      </div>

      {/* 체크리스트 항목들 */}
      {isExpanded && (
        <div className={cn("rounded-lg p-2 space-y-2", checklistPhaseLightBgColors[phase])}>
          {items.length > 0 ? (
            items
              .sort((a, b) => {
                // 목표일(dueOffset) 기준 오름차순 정렬 (빠른 날짜가 위)
                // 목표일이 없는 항목은 맨 아래로
                if (a.dueOffset === undefined && b.dueOffset === undefined) return a.order - b.order;
                if (a.dueOffset === undefined) return 1;
                if (b.dueOffset === undefined) return -1;
                return a.dueOffset - b.dueOffset;
              })
              .map((item) => (
                <ChecklistItemComponent
                  key={item._id}
                  item={item}
                  seminarDate={seminarDate}
                  onToggle={onToggleItem}
                  onDelete={onDeleteItem}
                  onUpdateDueDate={onUpdateDueDate}
                />
              ))
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              체크리스트 항목이 없습니다.
            </div>
          )}

          {/* 항목 추가 */}
          {onAddItem && (
            <div className="pt-1">
              {isAdding ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="새 항목 입력..."
                    className="flex-1 h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddItem} disabled={!newItemTitle.trim()}>
                    추가
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAdding(false);
                      setNewItemTitle("");
                    }}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className={cn(
                    "w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed transition-colors text-sm",
                    checklistPhaseTextColors[phase],
                    "hover:bg-white/50"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  항목 추가
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 탭으로 단계 전환하는 컴포넌트
interface ChecklistTabsProps {
  activePhase: ChecklistPhase;
  onPhaseChange: (phase: ChecklistPhase) => void;
  phaseCounts: Record<ChecklistPhase, { total: number; completed: number }>;
}

export function ChecklistTabs({ activePhase, onPhaseChange, phaseCounts }: ChecklistTabsProps) {
  const phases: ChecklistPhase[] = ["사전", "당일", "사후"];

  return (
    <div className="flex border-b">
      {phases.map((phase) => {
        const { total, completed } = phaseCounts[phase];
        const isActive = activePhase === phase;

        return (
          <button
            key={phase}
            onClick={() => onPhaseChange(phase)}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? cn("border-current", checklistPhaseTextColors[phase])
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{phase}</span>
            <span className="ml-1 text-xs">
              ({completed}/{total})
            </span>
          </button>
        );
      })}
    </div>
  );
}
