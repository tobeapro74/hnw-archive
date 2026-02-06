"use client";

import { X, Edit, Trash2, Calendar, Clock, MapPin, Users, Briefcase } from "lucide-react";
import { Schedule } from "@/lib/schedule-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ScheduleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (scheduleId: string) => void;
  readOnly?: boolean;
}

export function ScheduleDetailDialog({
  open,
  onOpenChange,
  schedule,
  onEdit,
  onDelete,
  readOnly,
}: ScheduleDetailDialogProps) {
  if (!open) return null;

  const scheduleDate = new Date(schedule.date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">일정 상세</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4 space-y-4">
          {/* 카테고리 및 타입 */}
          <div className="flex items-center gap-2">
            <Badge variant={schedule.category === "회의" ? "default" : schedule.category === "외근" ? "secondary" : "outline"}>
              {schedule.category === "회의" ? "💼" : schedule.category === "외근" ? "🚗" : "📌"} {schedule.category}
            </Badge>
            {schedule.category === "회의" && schedule.meetingType && (
              <span className="text-sm text-muted-foreground">{schedule.meetingType}</span>
            )}
            {schedule.category === "외근" && schedule.outingType && (
              <span className="text-sm text-muted-foreground">{schedule.outingType}</span>
            )}
          </div>

          {/* 주제 */}
          <div>
            <h3 className="font-semibold text-lg">
              {schedule.meetingTopic || schedule.outingTopic || schedule.etcTopic || schedule.etcDescription || "일정"}
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {/* 날짜 및 시간 */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatDate(scheduleDate)}</span>
              <Clock className="w-4 h-4 text-muted-foreground ml-2" />
              <span>{schedule.time}</span>
            </div>

            {/* 장소 */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{schedule.location}</span>
            </div>

            {/* 외근 상세 정보 */}
            {schedule.category === "외근" && (
              <>
                {schedule.center && (
                  <div className="flex items-start gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{schedule.center}</div>
                      {schedule.rmName && (
                        <div className="text-muted-foreground">
                          담당 RM: {schedule.rmName}
                          {schedule.contact && ` (${schedule.contact})`}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {schedule.customerName && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{schedule.customerName}</div>
                      {schedule.customerInfo && (
                        <div className="text-muted-foreground whitespace-pre-wrap">
                          {schedule.customerInfo}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {schedule.preparationItems && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">준비물</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {schedule.preparationItems}
                    </div>
                  </div>
                )}
              </>
            )}

          {/* 기타 정보 */}
          {schedule.category === "기타" && schedule.etcDescription && schedule.etcTopic && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">설명</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {schedule.etcDescription}
              </div>
            </div>
          )}
          </div>

          {/* 메타 정보 */}
          {schedule.createdBy && (
            <div className="pt-3 border-t text-xs text-muted-foreground">
              작성자: {schedule.createdBy}
            </div>
          )}
        </div>

        {/* 푸터 */}
        {!readOnly && (
          <div className="sticky bottom-0 bg-background border-t p-4 flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (schedule._id) onDelete(schedule._id);
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
            <Button size="sm" onClick={() => onEdit(schedule)}>
              <Edit className="w-4 h-4 mr-1" />
              수정
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
