"use client";

import { Trash2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resource, fileTypeConfig, formatFileSize, FileType } from "@/lib/resource-types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  resource: Resource;
  fileTypes?: FileType[]; // 그룹에 포함된 모든 파일 타입
  onView: () => void;
  onDelete: () => void;
}

// 파일 타입별 배지 색상
const fileTypeBadgeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-700 border-red-200",
  doc: "bg-blue-100 text-blue-700 border-blue-200",
  docx: "bg-blue-100 text-blue-700 border-blue-200",
  ppt: "bg-orange-100 text-orange-700 border-orange-200",
  pptx: "bg-orange-100 text-orange-700 border-orange-200",
  xls: "bg-green-100 text-green-700 border-green-200",
  xlsx: "bg-green-100 text-green-700 border-green-200",
};

export function ResourceCard({ resource, fileTypes, onView, onDelete }: ResourceCardProps) {
  const typeConfig = fileTypeConfig[resource.fileType] || {
    icon: "📄",
    color: "bg-gray-100 text-gray-700",
    label: resource.fileType.toUpperCase(),
  };

  // 표시할 파일 타입들 (중복 제거)
  const displayFileTypes = fileTypes || [resource.fileType];
  const uniqueFileTypes = [...new Set(displayFileTypes)];
  const hasMultipleTypes = uniqueFileTypes.length > 1;

  // title과 fileName이 같으면 파일명 숨김 (언더바, 하이픈, 공백 무시)
  const normalizeForCompare = (str: string) =>
    str.normalize("NFC").replace(/[-_\s]/g, "").toLowerCase();
  const fileNameWithoutExt = resource.fileName.replace(/\.[^.]+$/, "");
  const showFileName = normalizeForCompare(fileNameWithoutExt) !== normalizeForCompare(resource.title);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/resources/${resource._id}/download`, "_blank");
  };

  return (
    <div
      className="bg-card border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        {/* 파일 타입 아이콘 */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${typeConfig.color}`}>
          <FileText className="w-5 h-5" />
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm line-clamp-1">{resource.title}</h3>
              {(showFileName || hasMultipleTypes) && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {showFileName && fileNameWithoutExt}
                  {hasMultipleTypes && (
                    <span className="text-primary ml-1">({uniqueFileTypes.length}개 형식)</span>
                  )}
                </p>
              )}
            </div>

            {/* 파일 타입 배지들 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {uniqueFileTypes.map((type) => {
                const config = fileTypeConfig[type] || {
                  icon: "📄",
                  label: type.toUpperCase(),
                };
                const badgeColor = fileTypeBadgeColors[type] || "bg-gray-100 text-gray-700 border-gray-200";

                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0 border", badgeColor)}
                  >
                    {config.icon}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{formatDate(resource.uploadedAt)}</span>
            <span>·</span>
            <span>{formatFileSize(resource.fileSize)}</span>
            {resource.subCategory && (
              <>
                <span>·</span>
                <Badge variant="secondary" className="text-xs py-0">
                  {resource.subCategory}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex-shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!hasMultipleTypes && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
