"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, FileText, Users, Briefcase, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceList } from "./resource-list";
import { ResourceFormDialog } from "./resource-form-dialog";
import {
  Resource,
  ResourceCategory,
  MeetingSubCategory,
  ReportSubCategory,
} from "@/lib/resource-types";

// 캐시 키 생성
const getCacheKey = (category: string, subCategory?: string, search?: string) =>
  `${category}|${subCategory || ""}|${search || ""}`;

export function ResourceView() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>("회의록");
  const [meetingSubTab, setMeetingSubTab] = useState<MeetingSubCategory | "전체">("전체");
  const [reportSubTab, setReportSubTab] = useState<ReportSubCategory | "전체">("전체");
  const [formOpen, setFormOpen] = useState(false);

  // 프론트엔드 캐시 (메모리)
  const cacheRef = useRef<Map<string, { data: Resource[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 30000; // 30초

  // 현재 서브카테고리
  const getCurrentSubCategory = useCallback(() => {
    if (activeCategory === "회의록" && meetingSubTab !== "전체") {
      return meetingSubTab;
    }
    if (activeCategory === "보고서" && reportSubTab !== "전체") {
      return reportSubTab;
    }
    return undefined;
  }, [activeCategory, meetingSubTab, reportSubTab]);

  // 자료 목록 조회
  const fetchResources = useCallback(async (skipCache = false) => {
    const subCategory = getCurrentSubCategory();
    const cacheKey = getCacheKey(activeCategory, subCategory, searchQuery);
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();

    // 캐시 히트: 즉시 표시 (검색어가 있으면 캐시 무시)
    if (!skipCache && !searchQuery && cached && (now - cached.timestamp) < CACHE_TTL) {
      setResources(cached.data);
      setLoading(false);
      return;
    }

    // 캐시 미스 or 만료: API 호출
    try {
      // 캐시된 데이터가 있으면 먼저 표시 (stale-while-revalidate)
      if (cached && !searchQuery) {
        setResources(cached.data);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.set("category", activeCategory);

      if (subCategory) {
        params.set("subCategory", subCategory);
      }

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const res = await fetch(`/api/resources?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setResources(data.data);
        // 검색어가 없을 때만 캐시 저장
        if (!searchQuery) {
          cacheRef.current.set(cacheKey, { data: data.data, timestamp: now });
        }
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, getCurrentSubCategory, searchQuery]);

  useEffect(() => {
    fetchResources();
  }, [activeCategory, meetingSubTab, reportSubTab]);

  // 검색
  const handleSearch = () => {
    fetchResources(true); // 캐시 무시
  };

  // 자료 등록 완료
  const handleResourceCreated = () => {
    setFormOpen(false);
    // 캐시 무효화 후 새로고침
    cacheRef.current.clear();
    fetchResources(true);
  };

  // 자료 삭제 (confirm은 resource-list의 handleDeleteGroup에서 처리)
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        // 캐시 무효화 후 새로고침
        cacheRef.current.clear();
        fetchResources(true);
      } else {
        console.error("Failed to delete resource:", data.error);
        alert("삭제에 실패했습니다: " + (data.error || "알 수 없는 오류"));
      }
    } catch (error) {
      console.error("Failed to delete resource:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const categoryConfig: Record<ResourceCategory, { icon: typeof FileText; label: string }> = {
    "회의록": { icon: Users, label: "회의록" },
    "보고서": { icon: Briefcase, label: "보고서" },
    "기획안": { icon: ClipboardList, label: "기획안" },
  };

  return (
    <div className="p-4 space-y-4">
      {/* 헤더: 제목 + 등록 버튼 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">자료실</h2>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          새 자료 등록
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="제목, 파일명으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-9"
        />
      </div>

      {/* 카테고리 탭 */}
      <Tabs
        value={activeCategory}
        onValueChange={(v) => setActiveCategory(v as ResourceCategory)}
      >
        <TabsList className="grid w-full grid-cols-3">
          {(["회의록", "보고서", "기획안"] as ResourceCategory[]).map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            return (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1">
                <Icon className="w-4 h-4" />
                {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* 회의록 서브탭 */}
        <TabsContent value="회의록" className="mt-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["전체", "내부회의록", "외부회의록", "한장요약"] as const).map((sub) => (
              <Button
                key={sub}
                variant={meetingSubTab === sub ? "default" : "outline"}
                size="sm"
                onClick={() => setMeetingSubTab(sub)}
              >
                {sub}
              </Button>
            ))}
          </div>
          <ResourceList
            resources={resources}
            loading={loading}
            onDelete={handleDelete}
            onRefresh={() => { cacheRef.current.clear(); fetchResources(true); }}
          />
        </TabsContent>

        {/* 보고서 서브탭 */}
        <TabsContent value="보고서" className="mt-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["전체", "전문", "요약"] as const).map((sub) => (
              <Button
                key={sub}
                variant={reportSubTab === sub ? "default" : "outline"}
                size="sm"
                onClick={() => setReportSubTab(sub)}
              >
                {sub}
              </Button>
            ))}
          </div>
          <ResourceList
            resources={resources}
            loading={loading}
            onDelete={handleDelete}
            onRefresh={() => { cacheRef.current.clear(); fetchResources(true); }}
          />
        </TabsContent>

        {/* 기획안 */}
        <TabsContent value="기획안" className="mt-4">
          <ResourceList
            resources={resources}
            loading={loading}
            onDelete={handleDelete}
            onRefresh={() => { cacheRef.current.clear(); fetchResources(true); }}
          />
        </TabsContent>
      </Tabs>

      {/* 자료 등록 다이얼로그 */}
      <ResourceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultCategory={activeCategory}
        defaultSubCategory={getCurrentSubCategory()}
        onSuccess={handleResourceCreated}
      />
    </div>
  );
}
