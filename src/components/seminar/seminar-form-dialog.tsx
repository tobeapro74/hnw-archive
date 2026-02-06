"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Seminar,
  SeminarCategory,
  SeminarType,
  CorporateType,
  TargetType,
  SeminarStatus,
  CreateSeminarRequest,
} from "@/lib/seminar-types";
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

interface SeminarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seminar?: Seminar | null;
  onSave: (seminar: Seminar) => void;
}

export function SeminarFormDialog({
  open,
  onOpenChange,
  seminar,
  onSave,
}: SeminarFormDialogProps) {
  const isEditing = !!seminar;

  const [formData, setFormData] = useState({
    title: "",
    seminarType: "정기" as SeminarType,
    date: "",
    location: "",
    category: "패밀리오피스" as SeminarCategory,
    corporateType: undefined as CorporateType | undefined,
    targetType: undefined as TargetType | undefined,
    expectedAttendees: "",
    actualAttendees: "",
    description: "",
    status: "준비중" as SeminarStatus,
  });

  const [saving, setSaving] = useState(false);

  // 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (seminar) {
      const seminarDate = new Date(seminar.date);
      setFormData({
        title: seminar.title,
        seminarType: seminar.seminarType,
        date: seminarDate.toISOString().split("T")[0],
        location: seminar.location,
        category: seminar.category,
        corporateType: seminar.corporateType,
        targetType: seminar.targetType,
        expectedAttendees: seminar.expectedAttendees?.toString() || "",
        actualAttendees: seminar.actualAttendees?.toString() || "",
        description: seminar.description || "",
        status: seminar.status,
      });
    } else {
      // 새 세미나 - 폼 초기화
      setFormData({
        title: "",
        seminarType: "정기",
        date: "",
        location: "",
        category: "패밀리오피스",
        corporateType: undefined,
        targetType: undefined,
        expectedAttendees: "",
        actualAttendees: "",
        description: "",
        status: "준비중",
      });
    }
  }, [seminar, open]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.location) {
      toast.warning("필수 항목을 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      const payload: CreateSeminarRequest & { status?: SeminarStatus; actualAttendees?: number } = {
        title: formData.title,
        seminarType: formData.seminarType,
        date: formData.date,
        location: formData.location,
        category: formData.category,
        corporateType: formData.corporateType,
        targetType: formData.targetType,
        expectedAttendees: formData.expectedAttendees
          ? parseInt(formData.expectedAttendees)
          : undefined,
        description: formData.description || undefined,
      };

      if (isEditing) {
        payload.status = formData.status;
        payload.actualAttendees = formData.actualAttendees
          ? parseInt(formData.actualAttendees)
          : undefined;
      }

      const url = isEditing ? `/api/seminars/${seminar._id}` : "/api/seminars";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedSeminar = await res.json();
        toast.success("세미나를 저장했습니다.");
        onSave(savedSeminar);
        onOpenChange(false);
      } else {
        const error = await res.json();
        toast.error(error.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save seminar:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const categories: SeminarCategory[] = ["패밀리오피스", "법인"];
  const seminarTypes: SeminarType[] = ["정기", "비정기"];
  const corporateTypes: CorporateType[] = ["상장법인", "외감법인", "일반법인", "지역금융"];
  const targetTypes: TargetType[] = ["대기업", "중소기업", "벤처", "IPO준비기업"];
  const statuses: SeminarStatus[] = ["준비중", "완료", "취소"];

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
        <div className="shrink-0 bg-emerald-500 px-4 py-2">
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
            {isEditing ? "정기 세미나 수정" : "정기 세미나 등록"}
          </h2>
        </div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">세미나명 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 2026 1Q 패밀리오피스 세미나"
            />
          </div>

          {/* 유형 & 카테고리 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>세미나 유형 *</Label>
              <Select
                value={formData.seminarType}
                onValueChange={(value) =>
                  setFormData({ ...formData, seminarType: value as SeminarType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seminarTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as SeminarCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 날짜 & 장소 */}
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
              <Label htmlFor="location">장소 *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="예: 서울 강남"
              />
            </div>
          </div>

          {/* 법인 유형 (법인 카테고리인 경우) */}
          {formData.category === "법인" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>법인 유형</Label>
                <Select
                  value={formData.corporateType || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      corporateType: value ? (value as CorporateType) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {corporateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>대상 유형</Label>
                <Select
                  value={formData.targetType || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      targetType: value ? (value as TargetType) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 참석자 수 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedAttendees">예상 참석자 수</Label>
              <Input
                id="expectedAttendees"
                type="number"
                value={formData.expectedAttendees}
                onChange={(e) =>
                  setFormData({ ...formData, expectedAttendees: e.target.value })
                }
                placeholder="예: 50"
              />
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="actualAttendees">실제 참석자 수</Label>
                <Input
                  id="actualAttendees"
                  type="number"
                  value={formData.actualAttendees}
                  onChange={(e) =>
                    setFormData({ ...formData, actualAttendees: e.target.value })
                  }
                  placeholder="예: 45"
                />
              </div>
            )}
          </div>

          {/* 상태 (편집 모드) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as SeminarStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="세미나 관련 추가 설명..."
              rows={3}
            />
          </div>
        </div>

        {/* 고정 푸터 */}
        <div className="shrink-0 bg-background border-t px-6 py-4">
          <div className="flex items-center gap-3 justify-end">
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
