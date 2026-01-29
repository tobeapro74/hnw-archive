"use client";

import { Trash2, Eye, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resource, fileTypeConfig, formatFileSize } from "@/lib/resource-types";
import { formatDate } from "@/lib/utils";

interface ResourceCardProps {
  resource: Resource;
  onView: () => void;
  onDelete: () => void;
}

export function ResourceCard({ resource, onView, onDelete }: ResourceCardProps) {
  const typeConfig = fileTypeConfig[resource.fileType] || {
    icon: "📄",
    color: "bg-gray-100 text-gray-700",
    label: resource.fileType.toUpperCase(),
  };

  const handleDownload = () => {
    window.open(resource.fileUrl, "_blank");
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
            <div className="min-w-0">
              <h3 className="font-medium text-sm line-clamp-1">{resource.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {resource.fileName}
              </p>
            </div>
            <Badge variant="outline" className={`text-xs flex-shrink-0 ${typeConfig.color}`}>
              {typeConfig.label}
            </Badge>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
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
