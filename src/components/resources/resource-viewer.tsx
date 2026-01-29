"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resource, fileTypeConfig, formatFileSize } from "@/lib/resource-types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ResourceViewerProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Resource 타입 확장 (content, filePath 포함)
interface ExtendedResource extends Resource {
  content?: string;
  filePath?: string;
}

// 파일 타입별 헤더 배경색
const fileTypeBgColors: Record<string, string> = {
  pdf: "bg-red-500",
  doc: "bg-blue-500",
  docx: "bg-blue-500",
  ppt: "bg-orange-500",
  pptx: "bg-orange-500",
  xls: "bg-green-500",
  xlsx: "bg-green-500",
};

export function ResourceViewer({ resource, open, onOpenChange }: ResourceViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const extResource = resource as ExtendedResource;

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setPdfLoading(true);
      setPdfError(false);
    }
  }, [open]);

  if (!open || !resource) return null;

  const typeConfig = fileTypeConfig[resource.fileType] || {
    icon: "📄",
    color: "bg-gray-100 text-gray-700",
    label: resource.fileType.toUpperCase(),
  };

  const headerBgColor = fileTypeBgColors[resource.fileType] || "bg-gray-500";

  // 파일 타입별 뷰어 지원 확인
  const isPdf = resource.fileType === "pdf";
  const isOfficeFile = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(resource.fileType);

  // 다운로드 핸들러
  const handleDownload = async () => {
    if (!resource._id) return;

    try {
      setDownloading(true);

      const response = await fetch(`/api/resources/${resource._id}/download`);

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "다운로드에 실패했습니다.");
        return;
      }

      // Blob으로 변환 후 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resource.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  // content가 있는지 확인
  const hasContent = extResource.content && extResource.content.trim().length > 0;

  // 파일 뷰어 URL
  const fileDownloadUrl = resource._id ? `/api/resources/${resource._id}/download` : "";

  // Google Docs Viewer URL (Office 파일용)
  const getGoogleViewerUrl = () => {
    if (typeof window === "undefined") return "";
    const fullUrl = `${window.location.origin}/api/resources/${resource._id}/download`;
    return `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg bg-background rounded-t-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 컴팩트 헤더 */}
        <div className={cn("shrink-0 px-4 py-2", headerBgColor)}>
          {/* 핸들 + 닫기 버튼 */}
          <div className="flex items-center justify-between">
            <div className="w-8" />
            <div className="w-8 h-1 bg-white/30 rounded-full" />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-7 h-7"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* 제목 + 배지 */}
          <div className="flex items-start justify-between gap-2 mt-1">
            <h2 className="text-white text-base font-semibold leading-tight flex-1 line-clamp-2">
              {resource.title}
            </h2>
            <Badge className="bg-white/20 text-white text-xs shrink-0">
              {typeConfig.icon} {typeConfig.label}
            </Badge>
          </div>

          {/* 메타 정보 한 줄 */}
          <div className="flex items-center gap-3 mt-1.5 text-white/80 text-xs flex-wrap">
            {resource.subCategory && (
              <Badge className="bg-white/20 text-white text-[10px] px-1.5 py-0">
                {resource.subCategory}
              </Badge>
            )}
            <span>{formatDate(resource.uploadedAt)}</span>
            <span>·</span>
            <span>{formatFileSize(resource.fileSize)}</span>
          </div>

          {resource.description && (
            <p className="text-white/70 text-xs mt-2 line-clamp-2">{resource.description}</p>
          )}
        </div>

        {/* 액션 버튼 영역 */}
        <div className="shrink-0 flex border-b bg-muted/30 p-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "다운로드 중..." : "파일 다운로드"}
          </Button>
        </div>

        {/* 내용 영역 */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
          onTouchMove={(e) => e.stopPropagation()}
        >
          {isPdf || isOfficeFile ? (
            // PDF 또는 Office 파일 뷰어
            <div className="h-[50vh] relative">
              {pdfLoading && !pdfError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {isPdf ? "PDF" : resource.fileType.toUpperCase()} 로딩 중...
                    </span>
                  </div>
                </div>
              )}
              {pdfError ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="text-6xl mb-4">{typeConfig.icon}</div>
                  <p className="text-lg font-medium mb-2">{resource.fileName}</p>
                  <p className="text-muted-foreground mb-4 text-sm">
                    문서를 표시할 수 없습니다.<br />다운로드해서 확인해주세요.
                  </p>
                </div>
              ) : (
                <iframe
                  src={isPdf ? fileDownloadUrl : getGoogleViewerUrl()}
                  className="w-full h-full border-0"
                  onLoad={() => setPdfLoading(false)}
                  onError={() => {
                    setPdfLoading(false);
                    setPdfError(true);
                  }}
                  title={resource.title}
                />
              )}
            </div>
          ) : hasContent ? (
            // 텍스트 내용 표시
            <div className="p-4 pb-8">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">문서 내용</span>
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {extResource.content}
                </pre>
              </div>
            </div>
          ) : (
            // 미리보기 불가
            <div className="h-[40vh] flex flex-col items-center justify-center text-center p-4">
              <div className="text-6xl mb-4">{typeConfig.icon}</div>
              <p className="text-lg font-medium mb-2">{resource.fileName}</p>
              <p className="text-muted-foreground mb-4 text-sm">
                미리보기를 지원하지 않는 파일입니다.
              </p>
            </div>
          )}
        </div>

        {/* 파일명 푸터 */}
        <div className="shrink-0 p-3 border-t bg-muted/30 text-xs text-muted-foreground text-center">
          📁 {resource.fileName}
        </div>
      </div>
    </div>
  );
}
