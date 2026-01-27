"use client";

import { useState } from "react";
import { Check, Trash2, GripVertical, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChecklistItem as ChecklistItemType, getChecklistDueDate } from "@/lib/seminar-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChecklistItemProps {
  item: ChecklistItemType;
  seminarDate: Date | string;
  onToggle: (itemId: string, isCompleted: boolean) => void;
  onDelete?: (itemId: string) => void;
  onUpdateDueDate?: (itemId: string, dueOffset: number | undefined) => void;
  showDueDate?: boolean;
  isDraggable?: boolean;
}

export function ChecklistItemComponent({
  item,
  seminarDate,
  onToggle,
  onDelete,
  onUpdateDueDate,
  showDueDate = true,
  isDraggable = false,
}: ChecklistItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);

  // 세미나 날짜 파싱
  const seminarDateObj = new Date(seminarDate);
  seminarDateObj.setHours(0, 0, 0, 0);

  // D-day 계산
  const dueDate = item.dueOffset !== undefined
    ? getChecklistDueDate(seminarDate, item.dueOffset)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = dueDate && !item.isCompleted && dueDate < today;
  const isDueSoon = dueDate && !item.isCompleted && !isOverdue &&
    (dueDate.getTime() - today.getTime()) <= 2 * 24 * 60 * 60 * 1000; // 2일 이내

  const handleToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onToggle(item._id!, !item.isCompleted);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLoading || !onDelete) return;
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;

    setIsLoading(true);
    try {
      await onDelete(item._id!);
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 선택한 날짜로 dueOffset 계산
  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUpdateDueDate) return;

    const selectedDate = e.target.value;
    if (!selectedDate) {
      // 날짜 삭제
      setIsLoading(true);
      try {
        await onUpdateDueDate(item._id!, undefined);
      } finally {
        setIsLoading(false);
        setIsEditingDueDate(false);
      }
      return;
    }

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    // dueOffset 계산: 선택한 날짜 - 세미나 날짜 (일 단위)
    const diffTime = selected.getTime() - seminarDateObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    setIsLoading(true);
    try {
      await onUpdateDueDate(item._id!, diffDays);
    } finally {
      setIsLoading(false);
      setIsEditingDueDate(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        item.isCompleted
          ? "bg-muted/30 border-muted"
          : isOverdue
          ? "bg-red-50 border-red-200"
          : isDueSoon
          ? "bg-yellow-50 border-yellow-200"
          : "bg-card border-border hover:bg-muted/30"
      )}
    >
      {/* 드래그 핸들 */}
      {isDraggable && (
        <div className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* 체크박스 */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          item.isCompleted
            ? "bg-green-500 border-green-500"
            : "border-gray-300 hover:border-primary"
        )}
      >
        {item.isCompleted && <Check className="w-3 h-3 text-white" />}
      </button>

      {/* 항목 내용 */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm transition-all",
            item.isCompleted && "line-through text-muted-foreground"
          )}
        >
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.description}
          </div>
        )}
      </div>

      {/* D-day 표시 / 날짜 편집 */}
      {showDueDate && (
        <>
          {isEditingDueDate ? (
            <Input
              type="date"
              className="w-32 h-7 text-xs"
              defaultValue={formatDateForInput(dueDate)}
              onChange={handleDueDateChange}
              onBlur={() => setIsEditingDueDate(false)}
              autoFocus
              disabled={isLoading}
            />
          ) : (
            <button
              onClick={() => onUpdateDueDate && setIsEditingDueDate(true)}
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 flex items-center gap-1",
                onUpdateDueDate && "cursor-pointer hover:opacity-80",
                item.isCompleted
                  ? "bg-muted text-muted-foreground"
                  : isOverdue
                  ? "bg-red-100 text-red-600"
                  : isDueSoon
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-muted text-muted-foreground"
              )}
              disabled={!onUpdateDueDate}
            >
              {dueDate ? (
                `목표일: ${dueDate.getMonth() + 1}/${dueDate.getDate()}`
              ) : (
                <>
                  <Calendar className="w-3 h-3" />
                  목표일 설정
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* 삭제 버튼 */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-destructive flex-shrink-0"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
