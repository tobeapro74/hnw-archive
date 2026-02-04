"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Schedule,
  ScheduleCategory,
  MeetingType,
  OutingType,
  CreateScheduleRequest,
  meetingTypes,
  outingTypes,
} from "@/lib/schedule-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: Schedule | null;
  onSave: (schedule: Schedule) => void;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  onSave,
}: ScheduleFormDialogProps) {
  const isEditing = !!schedule;

  const [formData, setFormData] = useState({
    category: "회의" as ScheduleCategory,
    date: "",
    time: "",
    location: "",
    // 회의
    meetingType: undefined as MeetingType | undefined,
    meetingTopic: "",
    // 외근
    outingType: undefined as OutingType | undefined,
    center: "",
    rmName: "",
    contact: "",
    customerName: "",
    customerInfo: "",
    outingTopic: "",
    preparationItems: "",
  });

  const [saving, setSaving] = useState(false);

  // 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (schedule) {
      const scheduleDate = new Date(schedule.date);
      setFormData({
        category: schedule.category,
        date: scheduleDate.toISOString().split("T")[0],
        time: schedule.time,
        location: schedule.location,
        meetingType: schedule.meetingType,
        meetingTopic: schedule.meetingTopic || "",
        outingType: schedule.outingType,
        center: schedule.center || "",
        rmName: schedule.rmName || "",
        contact: schedule.contact || "",
        customerName: schedule.customerName || "",
        customerInfo: schedule.customerInfo || "",
        outingTopic: schedule.outingTopic || "",
        preparationItems: schedule.preparationItems || "",
      });
    } else {
      // 새 일정 - 폼 초기화
      setFormData({
        category: "회의",
        date: "",
        time: "",
        location: "",
        meetingType: undefined,
        meetingTopic: "",
        outingType: undefined,
        center: "",
        rmName: "",
        contact: "",
        customerName: "",
        customerInfo: "",
        outingTopic: "",
        preparationItems: "",
      });
    }
  }, [schedule, open]);

  const handleSubmit = async () => {
    if (!formData.category || !formData.date || !formData.time || !formData.location) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      const payload: CreateScheduleRequest = {
        category: formData.category,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        meetingType: formData.category === "회의" ? formData.meetingType : undefined,
        meetingTopic: formData.category === "회의" ? formData.meetingTopic : undefined,
        outingType: formData.category === "외근" ? formData.outingType : undefined,
        center: formData.category === "외근" ? formData.center : undefined,
        rmName: formData.category === "외근" ? formData.rmName : undefined,
        contact: formData.category === "외근" ? formData.contact : undefined,
        customerName:
          formData.category === "외근" && formData.outingType === "고객미팅"
            ? formData.customerName
            : undefined,
        customerInfo:
          formData.category === "외근" && formData.outingType === "고객미팅"
            ? formData.customerInfo
            : undefined,
        outingTopic: formData.category === "외근" ? formData.outingTopic : undefined,
        preparationItems: formData.category === "외근" ? formData.preparationItems : undefined,
      };

      const url = isEditing ? `/api/schedules/${schedule._id}` : "/api/schedules";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedSchedule = await res.json();
        onSave(savedSchedule);
        onOpenChange(false);
      } else {
        const error = await res.json();
        if (res.status === 401 || error.error === "로그인이 필요합니다.") {
          if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
            window.location.href = "/admin";
          }
        } else {
          alert(error.error || "저장에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditing ? "일정 수정" : "새 일정"}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <div className="p-4 space-y-4">
          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: ScheduleCategory) => {
                setFormData({ ...formData, category: value });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="회의">💼 회의</SelectItem>
                <SelectItem value="외근">🚗 외근</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 & 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">날짜 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">시간 *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-2">
            <Label htmlFor="location">장소 *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="예: 본사 회의실 A"
            />
          </div>

          {/* 회의 관련 필드 */}
          {formData.category === "회의" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="meetingType">회의 유형</Label>
                <Select
                  value={formData.meetingType}
                  onValueChange={(value: MeetingType) =>
                    setFormData({ ...formData, meetingType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="회의 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingTopic">회의 주제</Label>
                <Input
                  id="meetingTopic"
                  value={formData.meetingTopic}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingTopic: e.target.value })
                  }
                  placeholder="예: 2026년 1분기 마케팅 계획"
                />
              </div>
            </>
          )}

          {/* 외근 관련 필드 */}
          {formData.category === "외근" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="outingType">외근 유형</Label>
                <Select
                  value={formData.outingType}
                  onValueChange={(value: OutingType) =>
                    setFormData({ ...formData, outingType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="외근 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {outingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="center">센터</Label>
                <Input
                  id="center"
                  value={formData.center}
                  onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                  placeholder="예: 강남센터"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rmName">담당 RM</Label>
                  <Input
                    id="rmName"
                    value={formData.rmName}
                    onChange={(e) => setFormData({ ...formData, rmName: e.target.value })}
                    placeholder="예: 홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">연락처</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {formData.outingType === "고객미팅" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">고객명</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      placeholder="예: (주)ABC 김철수 이사"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerInfo">고객 기타정보</Label>
                    <Textarea
                      id="customerInfo"
                      value={formData.customerInfo}
                      onChange={(e) =>
                        setFormData({ ...formData, customerInfo: e.target.value })
                      }
                      placeholder="고객 관련 추가 정보"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="outingTopic">미팅 주제</Label>
                <Input
                  id="outingTopic"
                  value={formData.outingTopic}
                  onChange={(e) =>
                    setFormData({ ...formData, outingTopic: e.target.value })
                  }
                  placeholder="미팅 주제를 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparationItems">준비물</Label>
                <Textarea
                  id="preparationItems"
                  value={formData.preparationItems}
                  onChange={(e) =>
                    setFormData({ ...formData, preparationItems: e.target.value })
                  }
                  placeholder="준비할 자료나 물품을 입력하세요"
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
