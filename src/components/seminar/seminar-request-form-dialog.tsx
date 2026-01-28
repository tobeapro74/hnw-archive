"use client";

import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import {
  SeminarRequest,
  SeminarRequestTopic,
  SeminarRequestStatus,
  seminarRequestTopics,
  seminarRequestStatusColors,
  CreateSeminarRequestInput,
} from "@/lib/seminar-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SeminarRequestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: SeminarRequest | null;
  onSave: (request: SeminarRequest) => void;
  onDelete?: (requestId: string) => void;
}

export function SeminarRequestFormDialog({
  open,
  onOpenChange,
  request,
  onSave,
  onDelete,
}: SeminarRequestFormDialogProps) {
  const isEditing = !!request;
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    requestingCenter: "",
    requestLocation: "",
    targetCorporation: "",
    minAttendees: "",
    maxAttendees: "",
    requestedDate: "",
    topics: [] as SeminarRequestTopic[],
    topicDetail: "",
    receiver: "",
    centerContact: "",
    notes: "",
    status: "요청접수" as SeminarRequestStatus,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request) {
      const reqDate = new Date(request.requestedDate);
      setFormData({
        requestingCenter: request.requestingCenter,
        requestLocation: request.requestLocation,
        targetCorporation: request.targetCorporation,
        minAttendees: request.minAttendees.toString(),
        maxAttendees: request.maxAttendees.toString(),
        requestedDate: reqDate.toISOString().split("T")[0],
        topics: request.topics || [],
        topicDetail: request.topicDetail || "",
        receiver: request.receiver,
        centerContact: request.centerContact || "",
        notes: request.notes || "",
        status: request.status,
      });
    } else {
      setFormData({
        requestingCenter: "",
        requestLocation: "",
        targetCorporation: "",
        minAttendees: "",
        maxAttendees: "",
        requestedDate: "",
        topics: [],
        topicDetail: "",
        receiver: "",
        centerContact: "",
        notes: "",
        status: "요청접수",
      });
    }
  }, [request, open]);

  const toggleTopic = (topic: SeminarRequestTopic) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.requestingCenter ||
      !formData.requestLocation ||
      !formData.targetCorporation ||
      !formData.requestedDate ||
      !formData.receiver ||
      formData.topics.length === 0
    ) {
      alert("필수 항목을 입력해주세요. (주제를 1개 이상 선택해주세요)");
      return;
    }

    setSaving(true);

    try {
      const payload: CreateSeminarRequestInput & { status?: SeminarRequestStatus } = {
        requestingCenter: formData.requestingCenter,
        requestLocation: formData.requestLocation,
        targetCorporation: formData.targetCorporation,
        minAttendees: parseInt(formData.minAttendees) || 0,
        maxAttendees: parseInt(formData.maxAttendees) || 0,
        requestedDate: formData.requestedDate,
        topics: formData.topics,
        topicDetail: formData.topics.includes("기타") ? formData.topicDetail : undefined,
        receiver: formData.receiver,
        centerContact: formData.centerContact || undefined,
        notes: formData.notes || undefined,
      };

      if (isEditing) {
        payload.status = formData.status;
      }

      const url = isEditing ? `/api/seminar-requests/${request._id}` : "/api/seminar-requests";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedRequest = await res.json();
        onSave(savedRequest);
        onOpenChange(false);
      } else {
        const error = await res.json();
        alert(error.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save request:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!request?._id) return;

    if (!confirm("이 요청을 삭제하시겠습니까?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/seminar-requests/${request._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.(request._id);
        onOpenChange(false);
      } else {
        const error = await res.json();
        alert(error.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete request:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const statuses: SeminarRequestStatus[] = ["요청접수", "검토중", "승인", "반려", "완료"];

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
        {/* 컴팩트 헤더 */}
        <div className="shrink-0 bg-amber-500 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="w-7" />
            <div className="w-8 h-1 bg-white/30 rounded-full" />
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-base font-semibold text-white text-center -mt-1">
            {isEditing ? "비정기 세미나 요청 수정" : "비정기 세미나 요청 등록"}
          </h2>
        </div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-h-0">
          {/* 요청센터 & 장소 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestingCenter">요청센터 *</Label>
              <Input
                id="requestingCenter"
                value={formData.requestingCenter}
                onChange={(e) =>
                  setFormData({ ...formData, requestingCenter: e.target.value })
                }
                placeholder="예: 강남WM센터"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestLocation">요청장소 (세미나실) *</Label>
              <Input
                id="requestLocation"
                value={formData.requestLocation}
                onChange={(e) =>
                  setFormData({ ...formData, requestLocation: e.target.value })
                }
                placeholder="예: 강남센터 2층 세미나실"
              />
            </div>
          </div>

          {/* 대상법인 */}
          <div className="space-y-2">
            <Label htmlFor="targetCorporation">대상법인 *</Label>
            <Input
              id="targetCorporation"
              value={formData.targetCorporation}
              onChange={(e) =>
                setFormData({ ...formData, targetCorporation: e.target.value })
              }
              placeholder="예: (주)ABC, 한화그룹 계열사"
            />
          </div>

          {/* 모집인원 */}
          <div className="space-y-2">
            <Label>모집인원</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.minAttendees}
                onChange={(e) => setFormData({ ...formData, minAttendees: e.target.value })}
                placeholder="최소"
                className="w-24"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                placeholder="최대"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">명</span>
            </div>
          </div>

          {/* 요청일자 */}
          <div className="space-y-2">
            <Label htmlFor="requestedDate">요청일자 *</Label>
            <Input
              id="requestedDate"
              type="date"
              value={formData.requestedDate}
              onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
            />
          </div>

          {/* 요청주제 (복수 선택) */}
          <div className="space-y-2">
            <Label>요청주제 * (복수 선택 가능)</Label>
            <div className="flex flex-wrap gap-2">
              {seminarRequestTopics.map((topic) => {
                const isSelected = formData.topics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-muted hover:border-primary/50"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {topic}
                  </button>
                );
              })}
            </div>
            {formData.topics.includes("기타") && (
              <Input
                value={formData.topicDetail}
                onChange={(e) => setFormData({ ...formData, topicDetail: e.target.value })}
                placeholder="주제 상세 입력..."
                className="mt-2"
              />
            )}
          </div>

          {/* 접수자 & 센터 담당자 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receiver">접수자 *</Label>
              <Input
                id="receiver"
                value={formData.receiver}
                onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                placeholder="접수자 이름"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="centerContact">센터 담당자</Label>
              <Input
                id="centerContact"
                value={formData.centerContact}
                onChange={(e) => setFormData({ ...formData, centerContact: e.target.value })}
                placeholder="센터 담당자 이름"
              />
            </div>
          </div>

          {/* 상태 (편집 모드) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as SeminarRequestStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            seminarRequestStatusColors[status]
                          )}
                        />
                        {status}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 비고 */}
          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="추가 메모..."
              rows={3}
            />
          </div>
        </div>

        {/* 고정 푸터 */}
        <div className="shrink-0 bg-background border-t px-6 py-4">
          <div className="flex items-center gap-3">
            {isEditing && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-destructive hover:underline disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "저장 중..." : isEditing ? "수정" : "등록"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 비정기 세미나 요청 카드
interface SeminarRequestCardProps {
  request: SeminarRequest;
  onClick?: () => void;
}

export function SeminarRequestCard({ request, onClick }: SeminarRequestCardProps) {
  const requestDate = new Date(request.requestedDate);
  const topicsDisplay = request.topics?.join(", ") || "";

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border bg-card hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              className={cn("text-xs text-white", seminarRequestStatusColors[request.status])}
            >
              {request.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{request.requestingCenter}</span>
          </div>
          <h3 className="font-medium truncate">{request.targetCorporation}</h3>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {requestDate.toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>📍 {request.requestLocation}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👥 {request.minAttendees}~{request.maxAttendees}명</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span>📋 {topicsDisplay || "-"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👤 접수: {request.receiver}</span>
        </div>
      </div>
    </button>
  );
}
