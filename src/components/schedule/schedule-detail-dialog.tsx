"use client";

import { useState, useEffect } from "react";
import { X, Edit, Trash2, Calendar, Clock, MapPin, Users, Briefcase, FolderOpen, Download, Eye, FileText, FileSpreadsheet, FileImage, File, RefreshCw } from "lucide-react";
import { Schedule, ScheduleFile } from "@/lib/schedule-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return <FileSpreadsheet className="w-4 h-4 text-orange-500" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  if (mimeType.includes("document") || mimeType.includes("word"))
    return <FileText className="w-4 h-4 text-blue-500" />;
  if (mimeType.includes("image")) return <FileImage className="w-4 h-4 text-purple-500" />;
  return <File className="w-4 h-4 text-gray-500" />;
}

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
  const [files, setFiles] = useState<ScheduleFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 자료 로드
  const loadFiles = async () => {
    if (!schedule?._id) return;
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/schedules/${schedule._id}/files`);
      if (res.ok) setFiles(await res.json());
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setFilesLoading(false);
    }
  };

  // 동기화 후 새로고침
  const handleSyncFiles = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/cron/sync-drive?key=${encodeURIComponent("hnw-admin-2025")}`);
      await loadFiles();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!open || !schedule?._id || !schedule?.driveFolderId) {
      setFiles([]);
      return;
    }
    const fetchFiles = async () => {
      setFilesLoading(true);
      try {
        const res = await fetch(`/api/schedules/${schedule._id}/files`);
        if (res.ok) setFiles(await res.json());
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setFilesLoading(false);
      }
    };
    fetchFiles();
  }, [open, schedule?._id, schedule?.driveFolderId]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const scheduleDate = new Date(schedule.date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={() => onOpenChange(false)}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        className="relative bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
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

            {/* 외부미팅 기타 정보 */}
            {schedule.category === "회의" && schedule.meetingEtc && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">기타</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {schedule.meetingEtc}
                </div>
              </div>
            )}

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

          {/* 자료 */}
          {schedule.driveFolderId && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">자료</span>
                </div>
                <button
                  onClick={handleSyncFiles}
                  disabled={syncing}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                  {syncing ? "동기화 중..." : "새로고침"}
                </button>
              </div>
              {filesLoading ? (
                <p className="text-xs text-muted-foreground">로딩 중...</p>
              ) : files.length === 0 ? (
                <p className="text-xs text-muted-foreground">등록된 자료가 없습니다.</p>
              ) : (
                <div className="space-y-1.5">
                  {files.map((file) => (
                    <div
                      key={file._id}
                      className="flex items-center gap-2 p-2 border rounded-lg text-sm"
                    >
                      <a
                        href={`https://drive.google.com/file/d/${file.driveFileId}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
                        <span className="flex-1 truncate text-xs">{file.name}</span>
                      </a>
                      <a
                        href={`https://drive.google.com/open?id=${file.driveFileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                        title="드라이브에서 열기"
                      >
                        <Download className="w-5 h-5 text-muted-foreground" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
