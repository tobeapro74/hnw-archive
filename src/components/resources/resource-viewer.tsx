"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Resource, fileTypeConfig, formatFileSize } from "@/lib/resource-types";
import { formatDate } from "@/lib/utils";

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

export function ResourceViewer({ resource, open, onOpenChange }: ResourceViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const extResource = resource as ExtendedResource;

  if (!resource) return null;

  const typeConfig = fileTypeConfig[resource.fileType] || {
    icon: "📄",
    color: "bg-gray-100 text-gray-700",
    label: resource.fileType.toUpperCase(),
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* 헤더 */}
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg line-clamp-2">{resource.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                  {typeConfig.icon} {typeConfig.label}
                </Badge>
                {resource.subCategory && (
                  <Badge variant="secondary" className="text-xs">
                    {resource.subCategory}
                  </Badge>
                )}
                <span>{formatDate(resource.uploadedAt)}</span>
                <span>·</span>
                <span>{formatFileSize(resource.fileSize)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download className="w-4 h-4 mr-1" />
                {downloading ? "다운로드 중..." : "다운로드"}
              </Button>
            </div>
          </div>
          {resource.description && (
            <p className="text-sm text-muted-foreground mt-2">{resource.description}</p>
          )}
        </DialogHeader>

        {/* 내용 영역 */}
        <div className="flex-1 overflow-hidden">
          {hasContent ? (
            <ScrollArea className="h-full">
              <div className="p-4">
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
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="text-6xl mb-4">{typeConfig.icon}</div>
              <p className="text-lg font-medium mb-2">{resource.fileName}</p>
              <p className="text-muted-foreground mb-4">
                미리보기를 지원하지 않는 파일입니다.
              </p>
              <Button onClick={handleDownload} disabled={downloading}>
                <Download className="w-4 h-4 mr-1" />
                {downloading ? "다운로드 중..." : "파일 다운로드"}
              </Button>
            </div>
          )}
        </div>

        {/* 파일명 푸터 */}
        <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
          📁 {resource.fileName}
        </div>
      </DialogContent>
    </Dialog>
  );
}
