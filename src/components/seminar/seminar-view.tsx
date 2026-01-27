"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Seminar,
  SeminarRequest,
  SeminarCategory,
  calculateDday,
} from "@/lib/seminar-types";
import { SeminarCalendar } from "./seminar-calendar";
import { SeminarCard, SeminarListItem } from "./seminar-card";
import { SeminarStats } from "./seminar-stats";
import { SeminarDetailDialog } from "./seminar-detail-dialog";
import { SeminarFormDialog } from "./seminar-form-dialog";
import { SeminarRequestFormDialog, SeminarRequestCard } from "./seminar-request-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // 날짜 선택 팝업
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDateItems, setSelectedDateItems] = useState<{
    date: Date;
    seminars: Seminar[];
    requests: SeminarRequest[];
  } | null>(null);

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

  // 요청 삭제
  const handleDeleteRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r._id !== requestId));
  };

  // 요청 클릭
  const handleRequestClick = (request: SeminarRequest) => {
    setEditingRequest(request);
    setRequestFormDialogOpen(true);
  };

  // 날짜 클릭 (여러 항목이 있을 때)
  const handleDateClick = (date: Date, daySeminars: Seminar[], dayRequests: SeminarRequest[]) => {
    if (daySeminars.length + dayRequests.length > 1) {
      setSelectedDateItems({ date, seminars: daySeminars, requests: dayRequests });
      setDatePickerOpen(true);
    }
  };

  // 사용 가능한 연도
  const availableYears = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="min-h-screen pb-20">
      {/* 필터 및 버튼 */}
      <div className="sticky top-0 z-30 border-b bg-background">
        <div className="px-4 py-3 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleNewRequest}>
            비정기
          </Button>
          <Button size="sm" onClick={handleNewSeminar}>
            정기
          </Button>
          <div className="flex-1" />
          {/* 뷰 모드 토글 */}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
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

        {/* 필터 (드롭다운) */}
        <div className="px-4 pb-3 flex items-center gap-2">
          {/* 연도 */}
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[90px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 유형 (정기/비정기) */}
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as FilterType)}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="정기">정기</SelectItem>
              <SelectItem value="비정기">비정기</SelectItem>
            </SelectContent>
          </Select>

          {/* 카테고리 */}
          <Select
            value={filterCategory}
            onValueChange={(value) => setFilterCategory(value as SeminarCategory | "all")}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              <SelectItem value="패밀리오피스">패밀리오피스</SelectItem>
              <SelectItem value="법인">법인</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
        ) : (
          <>
            {/* 통계 */}
            <SeminarStats seminars={filteredSeminars} requests={requests} />

            {/* 캘린더/리스트 뷰 */}
            {viewMode === "calendar" ? (
              <SeminarCalendar
                seminars={filteredSeminars}
                requests={requests}
                onDateClick={handleDateClick}
                onSeminarClick={handleSeminarClick}
                onRequestClick={handleRequestClick}
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
        onDelete={handleDeleteRequest}
      />

      {/* 날짜 선택 팝업 */}
      {datePickerOpen && selectedDateItems && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setDatePickerOpen(false)}>
          <div
            className="w-full max-w-lg bg-background rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {selectedDateItems.date.toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
              </h3>
              <button onClick={() => setDatePickerOpen(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {selectedDateItems.seminars.map((seminar) => (
                <button
                  key={seminar._id}
                  onClick={() => {
                    setDatePickerOpen(false);
                    handleSeminarClick(seminar);
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      seminar.category === "패밀리오피스" ? "bg-violet-500" : "bg-sky-500"
                    )} />
                    <span className="font-medium">{seminar.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {seminar.location} · {seminar.seminarType}
                  </div>
                </button>
              ))}
              {selectedDateItems.requests.map((request) => (
                <button
                  key={request._id}
                  onClick={() => {
                    setDatePickerOpen(false);
                    handleRequestClick(request);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-medium">{request.targetCorporation}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{request.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {request.requestingCenter} · {request.topics?.join(", ")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
