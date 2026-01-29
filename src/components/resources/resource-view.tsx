"use client";

import { useState, useEffect } from "react";
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

export function ResourceView() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>("회의록");
  const [meetingSubTab, setMeetingSubTab] = useState<MeetingSubCategory | "전체">("전체");
  const [reportSubTab, setReportSubTab] = useState<ReportSubCategory | "전체">("전체");
  const [formOpen, setFormOpen] = useState(false);

  // 자료 목록 조회
  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("category", activeCategory);

      // 회의록 서브카테고리
      if (activeCategory === "회의록" && meetingSubTab !== "전체") {
        params.set("subCategory", meetingSubTab);
      }
      // 보고서 서브카테고리
      if (activeCategory === "보고서" && reportSubTab !== "전체") {
        params.set("subCategory", reportSubTab);
      }

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const res = await fetch(`/api/resources?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setResources(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [activeCategory, meetingSubTab, reportSubTab]);

  // 검색
  const handleSearch = () => {
    fetchResources();
  };

  // 자료 등록 완료
  const handleResourceCreated = () => {
    setFormOpen(false);
    fetchResources();
  };

  // 자료 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchResources();
      }
    } catch (error) {
      console.error("Failed to delete resource:", error);
    }
  };

  const categoryConfig: Record<ResourceCategory, { icon: typeof FileText; label: string }> = {
    "회의록": { icon: Users, label: "회의록" },
    "보고서": { icon: Briefcase, label: "보고서" },
    "기획안": { icon: ClipboardList, label: "기획안" },
  };

  // 현재 선택된 서브카테고리 반환
  const getCurrentSubCategory = () => {
    if (activeCategory === "회의록" && meetingSubTab !== "전체") {
      return meetingSubTab;
    }
    if (activeCategory === "보고서" && reportSubTab !== "전체") {
      return reportSubTab;
    }
    return undefined;
  };

  return (
    <div className="p-4 space-y-4">
      {/* 검색 + 등록 버튼 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="자료 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          등록
        </Button>
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
            {(["전체", "내부회의록", "외부회의록", "핵심요약"] as const).map((sub) => (
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
            onRefresh={fetchResources}
          />
        </TabsContent>

        {/* 보고서 서브탭 */}
        <TabsContent value="보고서" className="mt-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["전체", "초안", "완료", "요약"] as const).map((sub) => (
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
            onRefresh={fetchResources}
          />
        </TabsContent>

        {/* 기획안 */}
        <TabsContent value="기획안" className="mt-4">
          <ResourceList
            resources={resources}
            loading={loading}
            onDelete={handleDelete}
            onRefresh={fetchResources}
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
