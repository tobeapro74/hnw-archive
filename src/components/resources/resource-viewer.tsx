"use client";

import { useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Resource, fileTypeConfig, formatFileSize } from "@/lib/resource-types";
import { formatDate } from "@/lib/utils";

interface ResourceViewerProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResourceViewer({ resource, open, onOpenChange }: ResourceViewerProps) {
  const [iframeError, setIframeError] = useState(false);

  if (!resource) return null;

  const typeConfig = fileTypeConfig[resource.fileType] || {
    icon: "📄",
    color: "bg-gray-100 text-gray-700",
    label: resource.fileType.toUpperCase(),
  };

  // 파일 뷰어 URL 생성
  const getViewerUrl = () => {
    const fileUrl = resource.fileUrl;

    // PDF는 직접 표시
    if (resource.fileType === "pdf") {
      return fileUrl;
    }

    // Office 파일은 Google Docs Viewer 사용
    // 참고: 공개 URL이어야 동작함
    const encodedUrl = encodeURIComponent(fileUrl);
    return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
  };

  const handleDownload = () => {
    window.open(resource.fileUrl, "_blank");
  };

  const handleOpenExternal = () => {
    window.open(resource.fileUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* 헤더 */}
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg line-clamp-1">{resource.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                  {typeConfig.label}
                </Badge>
                <span>{formatDate(resource.uploadedAt)}</span>
                <span>·</span>
                <span>{formatFileSize(resource.fileSize)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                다운로드
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="w-4 h-4 mr-1" />
                새 창
              </Button>
            </div>
          </div>
          {resource.description && (
            <p className="text-sm text-muted-foreground mt-2">{resource.description}</p>
          )}
        </DialogHeader>

        {/* 파일 뷰어 */}
        <div className="flex-1 bg-muted/30 relative">
          {iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <p className="text-muted-foreground mb-4">
                파일을 직접 표시할 수 없습니다.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  다운로드
                </Button>
                <Button variant="outline" onClick={handleOpenExternal}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  새 창에서 열기
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={getViewerUrl()}
              className="w-full h-full border-0"
              onError={() => setIframeError(true)}
              title={resource.title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
