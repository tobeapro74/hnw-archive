"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, FileText, Calendar as CalendarIcon, List } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Seminar,
  SeminarRequest,
  SeminarCategory,
  SeminarType,
  calculateDday,
} from "@/lib/seminar-types";
import { SeminarCalendar, MiniCalendar } from "./seminar-calendar";
import { SeminarCard, SeminarListItem } from "./seminar-card";
import { SeminarStats, SeminarTypeStats } from "./seminar-stats";
import { SeminarDetailDialog } from "./seminar-detail-dialog";
import { SeminarFormDialog } from "./seminar-form-dialog";
import { SeminarRequestFormDialog, SeminarRequestCard } from "./seminar-request-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ViewMode = "calendar" | "list";
type FilterType = "all" | "정기" | "비정기";

export function SeminarView() {
  const [seminars, setSeminars] = useState<(Seminar & { progress?: { total: number; completed: number; percentage: number } })[]>([]);
  const [requests, setRequests] = useState<SeminarRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCategory, setFilterCategory] = useState<SeminarCategory | "all">("all");

  // Dialogs
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSeminarId, setSelectedSeminarId] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
  const [requestFormDialogOpen, setRequestFormDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<SeminarRequest | null>(null);

  // 연도 필터
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [seminarsRes, requestsRes] = await Promise.all([
          fetch(`/api/seminars?year=${selectedYear}`),
          fetch(`/api/seminar-requests?year=${selectedYear}`),
        ]);

        if (seminarsRes.ok) {
          const data = await seminarsRes.json();
          setSeminars(data);
        }

        if (requestsRes.ok) {
          const data = await requestsRes.json();
          setRequests(data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // 필터링된 세미나
  const filteredSeminars = useMemo(() => {
    return seminars.filter((seminar) => {
      if (filterType !== "all" && seminar.seminarType !== filterType) return false;
      if (filterCategory !== "all" && seminar.category !== filterCategory) return false;
      return true;
    });
  }, [seminars, filterType, filterCategory]);

  // 다가오는 세미나 (D-day 기준 정렬)
  const upcomingSeminars = useMemo(() => {
    return filteredSeminars
      .filter((s) => calculateDday(s.date) >= 0 && s.status === "준비중")
      .sort((a, b) => calculateDday(a.date) - calculateDday(b.date))
      .slice(0, 5);
  }, [filteredSeminars]);

  // 세미나 클릭
  const handleSeminarClick = (seminar: Seminar) => {
    setSelectedSeminarId(seminar._id!);
    setDetailDialogOpen(true);
  };

  // 새 세미나 등록
  const handleNewSeminar = () => {
    setEditingSeminar(null);
    setFormDialogOpen(true);
  };

  // 세미나 편집
  const handleEditSeminar = (seminar: Seminar) => {
    setDetailDialogOpen(false);
    setEditingSeminar(seminar);
    setFormDialogOpen(true);
  };

  // 세미나 저장
  const handleSaveSeminar = (savedSeminar: Seminar) => {
    if (editingSeminar) {
      setSeminars((prev) =>
        prev.map((s) => (s._id === savedSeminar._id ? { ...s, ...savedSeminar } : s))
      );
    } else {
      setSeminars((prev) => [savedSeminar as typeof prev[0], ...prev]);
    }
  };

  // 세미나 삭제
  const handleDeleteSeminar = (seminarId: string) => {
    setSeminars((prev) => prev.filter((s) => s._id !== seminarId));
  };

  // 새 비정기 세미나 요청
  const handleNewRequest = () => {
    setEditingRequest(null);
    setRequestFormDialogOpen(true);
  };

  // 요청 저장
  const handleSaveRequest = (savedRequest: SeminarRequest) => {
    if (editingRequest) {
      setRequests((prev) =>
        prev.map((r) => (r._id === savedRequest._id ? savedRequest : r))
      );
    } else {
      setRequests((prev) => [savedRequest, ...prev]);
    }
  };

  // 요청 클릭
  const handleRequestClick = (request: SeminarRequest) => {
    setEditingRequest(request);
    setRequestFormDialogOpen(true);
  };

  // 사용 가능한 연도
  const availableYears = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="min-h-screen pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 border-b" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">세미나 관리</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleNewRequest}>
              <FileText className="w-4 h-4 mr-1" />
              요청등록
            </Button>
            <Button size="sm" onClick={handleNewSeminar}>
              <Plus className="w-4 h-4 mr-1" />
              세미나
            </Button>
          </div>
        </div>

        {/* 연도 & 필터 */}
        <div className="px-4 pb-3 space-y-2">
          {/* 연도 탭 */}
          <div className="flex gap-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  selectedYear === year
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {year}
              </button>
            ))}
          </div>

          {/* 유형 & 카테고리 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {(["all", "정기", "비정기"] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                    filterType === type
                      ? type === "정기"
                        ? "bg-emerald-500 text-white"
                        : type === "비정기"
                        ? "bg-amber-500 text-white"
                        : "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {type === "all" ? "전체" : type}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex gap-1">
              {(["all", "패밀리오피스", "법인"] as (SeminarCategory | "all")[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                    filterCategory === cat
                      ? cat === "패밀리오피스"
                        ? "bg-purple-500 text-white"
                        : cat === "법인"
                        ? "bg-blue-500 text-white"
                        : "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat === "all" ? "전체" : cat}
                </button>
              ))}
            </div>

            {/* 뷰 모드 토글 */}
            <div className="ml-auto flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === "calendar" ? "bg-background shadow-sm" : ""
                )}
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === "list" ? "bg-background shadow-sm" : ""
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 컨텐츠 */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
        ) : (
          <>
            {/* 통계 */}
            <SeminarStats seminars={filteredSeminars} />

            {/* 캘린더/리스트 뷰 */}
            {viewMode === "calendar" ? (
              <SeminarCalendar
                seminars={filteredSeminars}
                onSeminarClick={handleSeminarClick}
              />
            ) : (
              <div className="space-y-2">
                {filteredSeminars.length > 0 ? (
                  filteredSeminars
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((seminar) => (
                      <SeminarListItem
                        key={seminar._id}
                        seminar={seminar}
                        onClick={() => handleSeminarClick(seminar)}
                      />
                    ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    등록된 세미나가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 다가오는 세미나 */}
            {upcomingSeminars.length > 0 && viewMode === "calendar" && (
              <div>
                <h3 className="text-sm font-semibold mb-2">다가오는 세미나</h3>
                <div className="space-y-2">
                  {upcomingSeminars.map((seminar) => (
                    <SeminarCard
                      key={seminar._id}
                      seminar={seminar}
                      onClick={() => handleSeminarClick(seminar)}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 비정기 세미나 요청 */}
            {requests.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">비정기 세미나 요청</h3>
                  <Badge variant="secondary">{requests.length}건</Badge>
                </div>
                <div className="space-y-2">
                  {requests.slice(0, 3).map((request) => (
                    <SeminarRequestCard
                      key={request._id}
                      request={request}
                      onClick={() => handleRequestClick(request)}
                    />
                  ))}
                  {requests.length > 3 && (
                    <Button variant="ghost" className="w-full text-sm">
                      {requests.length - 3}개 더보기
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 세미나 현황 통계 */}
            <SeminarTypeStats seminars={filteredSeminars} />
          </>
        )}
      </div>

      {/* Dialogs */}
      <SeminarDetailDialog
        seminarId={selectedSeminarId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEditSeminar}
        onDelete={handleDeleteSeminar}
      />

      <SeminarFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        seminar={editingSeminar}
        onSave={handleSaveSeminar}
      />

      <SeminarRequestFormDialog
        open={requestFormDialogOpen}
        onOpenChange={setRequestFormDialogOpen}
        request={editingRequest}
        onSave={handleSaveRequest}
      />
    </div>
  );
}
