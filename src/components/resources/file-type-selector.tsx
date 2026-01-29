"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resource, fileTypeConfig, formatFileSize, FileType } from "@/lib/resource-types";
import { ResourceGroup } from "./resource-list";
import { cn } from "@/lib/utils";

interface FileTypeSelectorProps {
  group: ResourceGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (resource: Resource) => void;
}

// 파일 타입별 배경색
const fileTypeBgColors: Record<string, string> = {
  pdf: "bg-red-500 hover:bg-red-600",
  doc: "bg-blue-500 hover:bg-blue-600",
  docx: "bg-blue-500 hover:bg-blue-600",
  ppt: "bg-orange-500 hover:bg-orange-600",
  pptx: "bg-orange-500 hover:bg-orange-600",
  xls: "bg-green-500 hover:bg-green-600",
  xlsx: "bg-green-500 hover:bg-green-600",
};

export function FileTypeSelector({ group, open, onOpenChange, onSelect }: FileTypeSelectorProps) {
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

  if (!open || !group) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg bg-background rounded-t-2xl max-h-[50vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-4 py-3 border-b bg-muted/30">
          {/* 핸들 + 닫기 버튼 */}
          <div className="flex items-center justify-between mb-2">
            <div className="w-8" />
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-base font-semibold text-center line-clamp-2">
            {group.title}
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            어떤 형식으로 열까요?
          </p>
        </div>

        {/* 파일 타입 선택 버튼들 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {group.resources.map((resource) => {
              const typeConfig = fileTypeConfig[resource.fileType] || {
                icon: "📄",
                label: resource.fileType.toUpperCase(),
              };
              const bgColor = fileTypeBgColors[resource.fileType] || "bg-gray-500 hover:bg-gray-600";

              return (
                <button
                  key={resource._id}
                  onClick={() => onSelect(resource)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl text-white transition-all active:scale-95",
                    bgColor
                  )}
                >
                  <span className="text-3xl mb-2">{typeConfig.icon}</span>
                  <span className="font-semibold text-lg">{typeConfig.label}</span>
                  <span className="text-xs text-white/70 mt-1">
                    {formatFileSize(resource.fileSize)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 취소 버튼 */}
        <div className="shrink-0 p-4 border-t bg-muted/30">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
