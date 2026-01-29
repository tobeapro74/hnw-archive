"use client";

import { useState } from "react";
import { Resource } from "@/lib/resource-types";
import { ResourceCard } from "./resource-card";
import { ResourceViewer } from "./resource-viewer";

interface ResourceListProps {
  resources: Resource[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function ResourceList({ resources, loading, onDelete, onRefresh }: ResourceListProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleView = (resource: Resource) => {
    setSelectedResource(resource);
    setViewerOpen(true);
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
        {resources.map((resource) => (
          <ResourceCard
            key={resource._id}
            resource={resource}
            onView={() => handleView(resource)}
            onDelete={() => onDelete(resource._id!)}
          />
        ))}
      </div>

      {/* 파일 뷰어 */}
      <ResourceViewer
        resource={selectedResource}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </>
  );
}
