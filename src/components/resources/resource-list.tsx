"use client";

import { useState, useMemo } from "react";
import { Resource } from "@/lib/resource-types";
import { ResourceCard } from "./resource-card";
import { ResourceViewer } from "./resource-viewer";
import { FileTypeSelector } from "./file-type-selector";

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

// 파일명에서 확장자 제거 + 유니코드 정규화 (NFC)
// macOS에서 생성된 파일은 NFD(분해형), Windows/Linux는 NFC(조합형) 사용
// 한글 비교를 위해 NFC로 통일
function getBaseName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  const baseName = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  // NFC 정규화로 한글 조합형 통일
  return baseName.normalize("NFC");
}

// 그룹화된 리소스 타입
export interface ResourceGroup {
  baseName: string;
  title: string;
  resources: Resource[];
  primaryResource: Resource;
}

export function ResourceList({ resources, loading, onDelete, onRefresh }: ResourceListProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectorGroup, setSelectorGroup] = useState<ResourceGroup | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // 파일명 기준으로 그룹화
  const groupedResources = useMemo(() => {
    const groups = new Map<string, Resource[]>();

    resources.forEach((resource) => {
      const baseName = getBaseName(resource.fileName);
      const existing = groups.get(baseName) || [];
      existing.push(resource);
      groups.set(baseName, existing);
    });

    // 그룹 배열로 변환
    const result: ResourceGroup[] = [];
    groups.forEach((groupResources, baseName) => {
      // 가장 최근 업로드된 것을 primary로
      const sorted = [...groupResources].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      result.push({
        baseName,
        title: sorted[0].title,
        resources: sorted,
        primaryResource: sorted[0],
      });
    });

    // 최신 파일이 위로 오도록 정렬 (uploadedAt 내림차순)
    return result.sort((a, b) => {
      const dateA = new Date(a.primaryResource.uploadedAt).getTime();
      const dateB = new Date(b.primaryResource.uploadedAt).getTime();

      // 날짜가 같으면 파일명으로 정렬 (내림차순 - 0128이 0127보다 위에)
      if (dateB === dateA) {
        return b.baseName.localeCompare(a.baseName);
      }
      return dateB - dateA;
    });
  }, [resources]);

  const handleGroupClick = (group: ResourceGroup) => {
    if (group.resources.length === 1) {
      // 단일 파일이면 바로 뷰어 열기
      setSelectedResource(group.resources[0]);
      setViewerOpen(true);
    } else {
      // 여러 파일이면 선택 모달 열기
      setSelectorGroup(group);
      setSelectorOpen(true);
    }
  };

  const handleSelectFileType = (resource: Resource) => {
    setSelectorOpen(false);
    setSelectedResource(resource);
    setViewerOpen(true);
  };

  const handleDeleteGroup = (group: ResourceGroup) => {
    // 그룹의 모든 파일 삭제
    if (confirm(`"${group.title}" 관련 파일 ${group.resources.length}개를 모두 삭제하시겠습니까?`)) {
      group.resources.forEach((r) => {
        if (r._id) onDelete(r._id);
      });
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        등록된 자료가 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {groupedResources.map((group) => (
          <ResourceCard
            key={group.baseName}
            resource={group.primaryResource}
            fileTypes={group.resources.map((r) => r.fileType)}
            onView={() => handleGroupClick(group)}
            onDelete={() => handleDeleteGroup(group)}
          />
        ))}
      </div>

      {/* 파일 타입 선택 모달 */}
      <FileTypeSelector
        group={selectorGroup}
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleSelectFileType}
      />

      {/* 파일 뷰어 */}
      <ResourceViewer
        resource={selectedResource}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </>
  );
}
