"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResourceCategory,
  MeetingSubCategory,
  ReportSubCategory,
  FileType,
  resourceCategories,
  meetingSubCategories,
  reportSubCategories,
  getFileType,
} from "@/lib/resource-types";

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: ResourceCategory;
  defaultSubCategory?: MeetingSubCategory | ReportSubCategory;
  onSuccess: () => void;
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  defaultCategory = "회의록",
  defaultSubCategory,
  onSuccess,
}: ResourceFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ResourceCategory>(defaultCategory);
  const [subCategory, setSubCategory] = useState<MeetingSubCategory | ReportSubCategory | "">(defaultSubCategory || "");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<FileType | "">("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [description, setDescription] = useState("");

  // 기본값 설정
  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setSubCategory(defaultSubCategory || "");
    }
  }, [open, defaultCategory, defaultSubCategory]);

  // 파일 URL에서 파일명과 타입 추출
  useEffect(() => {
    if (fileUrl) {
      try {
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split("/");
        const extractedFileName = pathParts[pathParts.length - 1] || "";
        setFileName(decodeURIComponent(extractedFileName));

        const extractedType = getFileType(extractedFileName);
        if (extractedType) {
          setFileType(extractedType);
        }
      } catch {
        // URL 파싱 실패 시 무시
      }
    }
  }, [fileUrl]);

  const handleSubmit = async () => {
    if (!title || !category || !fileUrl || !fileName || !fileType) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (category === "회의록" && !subCategory) {
      alert("회의록 유형(내부/외부)을 선택해주세요.");
      return;
    }

    if (category === "보고서" && !subCategory) {
      alert("보고서 유형(초안/완료/요약)을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          subCategory: (category === "회의록" || category === "보고서") ? subCategory : undefined,
          fileName,
          fileUrl,
          fileType,
          fileSize,
          description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        resetForm();
        onSuccess();
      } else {
        alert(data.error || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create resource:", error);
      alert("등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setFileUrl("");
    setFileName("");
    setFileType("");
    setFileSize(0);
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>자료 등록</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="자료 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label>카테고리 *</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as ResourceCategory);
                if (v !== "회의록" && v !== "보고서") setSubCategory("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resourceCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 회의록 서브카테고리 */}
          {category === "회의록" && (
            <div className="space-y-2">
              <Label>회의록 유형 *</Label>
              <Select
                value={subCategory}
                onValueChange={(v) => setSubCategory(v as MeetingSubCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {meetingSubCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 보고서 서브카테고리 */}
          {category === "보고서" && (
            <div className="space-y-2">
              <Label>보고서 유형 *</Label>
              <Select
                value={subCategory}
                onValueChange={(v) => setSubCategory(v as ReportSubCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {reportSubCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 파일 URL */}
          <div className="space-y-2">
            <Label htmlFor="fileUrl">파일 URL *</Label>
            <Input
              id="fileUrl"
              placeholder="https://..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Google Drive, Dropbox 등의 공유 링크 또는 직접 파일 URL
            </p>
          </div>

          {/* 파일명 */}
          <div className="space-y-2">
            <Label htmlFor="fileName">파일명 *</Label>
            <Input
              id="fileName"
              placeholder="파일명.pdf"
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                const type = getFileType(e.target.value);
                if (type) setFileType(type);
              }}
            />
          </div>

          {/* 파일 타입 */}
          <div className="space-y-2">
            <Label>파일 형식 *</Label>
            <Select
              value={fileType}
              onValueChange={(v) => setFileType(v as FileType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="ppt">PPT</SelectItem>
                <SelectItem value="pptx">PPTX</SelectItem>
                <SelectItem value="doc">DOC</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
                <SelectItem value="xls">XLS</SelectItem>
                <SelectItem value="xlsx">XLSX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 파일 크기 */}
          <div className="space-y-2">
            <Label htmlFor="fileSize">파일 크기 (KB)</Label>
            <Input
              id="fileSize"
              type="number"
              placeholder="0"
              value={fileSize ? Math.round(fileSize / 1024) : ""}
              onChange={(e) => setFileSize(parseInt(e.target.value || "0") * 1024)}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="자료에 대한 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "등록 중..." : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
