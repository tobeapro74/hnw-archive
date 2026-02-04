"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { User, LogOut, ChevronDown, Search, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BottomNav, TabType } from "@/components/bottom-nav";
import { ArticleCard } from "@/components/article-card";
import { ArticleGroup } from "@/components/article-group";
import { CalendarView } from "@/components/calendar-view";
import { YearTabs } from "@/components/dashboard/year-tabs";
import { TagSummaryCards } from "@/components/dashboard/tag-summary-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { MonthlyTimeline } from "@/components/dashboard/monthly-timeline";
import { HighlightSection } from "@/components/dashboard/highlight-section";
import { SeminarView } from "@/components/seminar";
import { ResourceView } from "@/components/resources";
import { ScheduleView } from "@/components/schedule";
import { SettingsDialog } from "@/components/settings-dialog";
import { Article, ArticleCategory, ArticleTag, categories, tags } from "@/lib/types";
import { Schedule } from "@/lib/schedule-types";
import { Seminar } from "@/lib/seminar-types";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ViewType = TabType;

interface UserInfo {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

// 자료실 접근 권한이 있는 이메일 목록
const RESOURCE_ALLOWED_EMAILS = [
  'tobeapro@gmail.com',
  'sweetas11@nhsec.com',
];

function HomeContent() {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [articles, setArticles] = useState<Article[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 필터 상태
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | "전체">("전체");
  const [selectedTag, setSelectedTag] = useState<ArticleTag | "전체">("전체");
  const [searchQuery, setSearchQuery] = useState("");

  // 캘린더 선택된 날짜의 기사, 일정, 세미나
  const [selectedDateArticles, setSelectedDateArticles] = useState<Article[]>([]);
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<Schedule[]>([]);
  const [selectedDateSeminars, setSelectedDateSeminars] = useState<Seminar[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 연관 기사 모달
  const [relatedModalOpen, setRelatedModalOpen] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState<string>("");

  // URL 쿼리 파라미터로 탭 설정 (푸시 알림 클릭 시 사용)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["home", "list", "seminar", "schedule", "resources", "calendar"].includes(tab)) {
      setCurrentView(tab as ViewType);
    }
  }, [searchParams]);

  // 기사 목록 + 일정 목록 + 세미나 목록 + 로그인 상태 병렬 조회 (성능 최적화)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const [articlesRes, schedulesRes, seminarsRes, authRes] = await Promise.all([
          fetch("/api/articles"),
          fetch(`/api/schedules?year=${currentYear}`),
          fetch("/api/seminars"),
          fetch("/api/auth/me"),
        ]);

        const [articlesData, schedulesData, seminarsData, authData] = await Promise.all([
          articlesRes.json(),
          schedulesRes.json(),
          seminarsRes.json(),
          authRes.json(),
        ]);

        if (articlesData.success) {
          setArticles(articlesData.data);
        }
        if (Array.isArray(schedulesData)) {
          setSchedules(schedulesData);
        }
        if (Array.isArray(seminarsData)) {
          setSeminars(seminarsData);
        }
        if (authData.success) {
          setUser(authData.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 로그아웃
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserMenuOpen(false);
      if (currentView === "admin") {
        setCurrentView("home");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 연도별 필터링된 기사
  const yearFilteredArticles = useMemo(() => {
    if (selectedYear === "all") return articles;
    return articles.filter((article) => {
      const year = new Date(article.publishedAt).getFullYear();
      return year === selectedYear;
    });
  }, [articles, selectedYear]);

  // 필터링된 기사
  const filteredArticles = useMemo(() => {
    return yearFilteredArticles.filter((article) => {
      if (selectedCategory !== "전체" && article.category !== selectedCategory) {
        return false;
      }
      if (selectedTag !== "전체" && article.tag !== selectedTag) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(query) ||
          article.keyword.toLowerCase().includes(query) ||
          article.mediaName?.toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [yearFilteredArticles, selectedCategory, selectedTag, searchQuery]);

  // 최근 기사 (홈 화면용)
  const recentArticles = useMemo(() => {
    return articles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);
  }, [articles]);

  // 이벤트별로 그룹화된 기사 (필터링된 기사 기준)
  const groupedArticles = useMemo(() => {
    const groups: { eventName: string | null; articles: Article[] }[] = [];
    const processedEventNames = new Set<string>();

    filteredArticles.forEach((article) => {
      if (article.eventName) {
        // 이미 처리된 이벤트명이면 스킵
        if (processedEventNames.has(article.eventName)) return;

        // 같은 이벤트의 모든 기사 찾기 (날짜순 정렬)
        const eventArticles = filteredArticles
          .filter(a => a.eventName === article.eventName)
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        groups.push({ eventName: article.eventName, articles: eventArticles });
        processedEventNames.add(article.eventName);
      } else {
        // 이벤트명 없는 기사는 개별 처리
        groups.push({ eventName: null, articles: [article] });
      }
    });

    return groups;
  }, [filteredArticles]);

  // 이벤트별로 그룹화된 최근 기사 (홈 화면용)
  const groupedRecentArticles = useMemo(() => {
    const groups: { eventName: string | null; articles: Article[] }[] = [];
    const processedEventNames = new Set<string>();

    recentArticles.forEach((article) => {
      if (article.eventName) {
        if (processedEventNames.has(article.eventName)) return;

        const eventArticles = articles
          .filter(a => a.eventName === article.eventName)
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        groups.push({ eventName: article.eventName, articles: eventArticles });
        processedEventNames.add(article.eventName);
      } else {
        groups.push({ eventName: null, articles: [article] });
      }
    });

    return groups;
  }, [recentArticles, articles]);

  // 사용 가능한 연도 목록
  const availableYears = useMemo(() => {
    const years = new Set(articles.map((a) => new Date(a.publishedAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [articles]);

  // 카테고리별 통계 (연도 필터 적용)
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    yearFilteredArticles.forEach((article) => {
      stats[article.category] = (stats[article.category] || 0) + 1;
    });
    return stats;
  }, [yearFilteredArticles]);

  // 태그별 통계 (연도 필터 적용)
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {
      "보도기사": 0,
      "특집기사": 0,
      "단독기사": 0,
    };
    yearFilteredArticles.forEach((article) => {
      if (stats[article.tag] !== undefined) {
        stats[article.tag] += 1;
      }
    });
    return stats;
  }, [yearFilteredArticles]);

  // 태그별 distinct 통계 (중복 제거)
  // - 보도기사: 이벤트명만으로 중복 판단 (같은 이벤트가 며칠에 걸쳐 발행될 수 있음)
  // - 단독기사/특집기사: 이벤트명 + 발행일로 중복 판단 (같은 인터뷰이라도 다른 날짜면 별개 기사)
  const tagDistinctStats = useMemo(() => {
    const stats: Record<string, number> = {
      "보도기사": 0,
      "특집기사": 0,
      "단독기사": 0,
    };

    (["보도기사", "특집기사", "단독기사"] as const).forEach((tag) => {
      const tagArticles = yearFilteredArticles.filter((a) => a.tag === tag);
      const uniqueKeys = new Set<string>();
      let noEventCount = 0;

      tagArticles.forEach((article) => {
        if (article.eventName) {
          if (tag === "보도기사") {
            // 보도기사: 이벤트명만으로 중복 판단
            uniqueKeys.add(article.eventName);
          } else {
            // 단독기사/특집기사: 이벤트명 + 발행일로 중복 판단
            const dateStr = new Date(article.publishedAt).toISOString().split("T")[0];
            uniqueKeys.add(`${article.eventName}|${dateStr}`);
          }
        } else {
          noEventCount += 1;
        }
      });

      stats[tag] = uniqueKeys.size + noEventCount;
    });

    return stats;
  }, [yearFilteredArticles]);

  // 월별 데이터 (연도 필터 적용)
  // "전체" 선택 시: 최근 12개월 롤링 데이터
  // 특정 연도 선택 시: 해당 연도 데이터 표시
  const timelineYear = selectedYear === "all" ? new Date().getFullYear() : selectedYear;

  // 롤링 12개월 데이터 (전체 선택 시 사용)
  const rollingMonthlyData = useMemo(() => {
    if (selectedYear !== "all") return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 최근 12개월 생성 (현재 월 포함, 과거 11개월)
    const months: { year: number; month: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      months.push({ year: targetYear, month: targetMonth, count: 0 });
    }

    // 기사 수 집계
    articles.forEach((article) => {
      const date = new Date(article.publishedAt);
      const articleYear = date.getFullYear();
      const articleMonth = date.getMonth();

      const idx = months.findIndex(m => m.year === articleYear && m.month === articleMonth);
      if (idx !== -1) {
        months[idx].count += 1;
      }
    });

    return months;
  }, [articles, selectedYear]);

  // 단일 연도 월별 데이터 (특정 연도 선택 시 사용)
  const monthlyData = useMemo(() => {
    const data = Array(12).fill(0);
    if (selectedYear === "all") return data;

    articles.forEach((article) => {
      const date = new Date(article.publishedAt);
      if (date.getFullYear() === selectedYear) {
        data[date.getMonth()] += 1;
      }
    });
    return data;
  }, [articles, selectedYear]);

  // 하이라이트 기사 (단독/특집 중 최신 5개)
  const highlightArticles = useMemo(() => {
    return yearFilteredArticles
      .filter((a) => a.tag === "단독기사" || a.tag === "특집기사")
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 5);
  }, [yearFilteredArticles]);

  // 언론사 수
  const mediaCount = useMemo(() => {
    const mediaSet = new Set(yearFilteredArticles.map((article) => article.mediaName).filter(Boolean));
    return mediaSet.size;
  }, [yearFilteredArticles]);

  // 이벤트 총 개수
  const totalEventCount = useMemo(() => {
    return new Set(articles.map(a => a.eventName).filter(Boolean)).size;
  }, [articles]);

  // 같은 이벤트의 연관 기사 수 계산
  const getRelatedArticleCount = (eventName: string | undefined) => {
    if (!eventName) return 0;
    return articles.filter(a => a.eventName === eventName).length;
  };

  // 연관 기사 목록 가져오기 (언론사 가나다순 정렬)
  const getRelatedArticles = (eventName: string) => {
    return articles
      .filter(a => a.eventName === eventName)
      .sort((a, b) => (a.mediaName || "").localeCompare(b.mediaName || "", "ko"));
  };

  // 연관 기사 모달 열기
  const handleShowRelatedArticles = (eventName: string) => {
    setSelectedEventName(eventName);
    setRelatedModalOpen(true);
  };

  // 일정 다시 가져오기
  const fetchSchedules = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const res = await fetch(`/api/schedules?year=${currentYear}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSchedules(data);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    }
  };

  // 탭 변경
  const handleTabChange = async (tab: TabType) => {
    if (tab === "admin") {
      if (!user?.is_admin) return;
      window.location.href = "/admin";
      return;
    }

    // 캘린더 탭으로 이동할 때 일정 먼저 가져오기
    if (tab === "calendar") {
      await fetchSchedules();
    }

    setCurrentView(tab);
    setSelectedDateArticles([]);
    setSelectedDate(null);
  };

  // 캘린더 날짜 선택
  const handleDateSelect = (date: Date, dateArticles: Article[], dateSchedules: Schedule[], dateSeminars: Seminar[]) => {
    setSelectedDate(date);
    setSelectedDateArticles(dateArticles);
    setSelectedDateSchedules(dateSchedules);
    setSelectedDateSeminars(dateSeminars);
  };

  // 태그 클릭 핸들러
  const handleTagClick = (tag: ArticleTag) => {
    setSelectedTag(tag);
    setCurrentView("list");
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (category: ArticleCategory) => {
    setSelectedCategory(category);
    setCurrentView("list");
  };

  // 월 클릭 핸들러
  const handleMonthClick = (_month: number) => {
    // 해당 월의 기사로 목록 화면 이동
    setCurrentView("list");
  };

  // 홈 화면 렌더링
  const renderHome = () => {
    return (
      <div className="p-4 space-y-4">
        {/* 연도 탭 */}
        <YearTabs
          years={availableYears}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        {/* 하이라이트 섹션 */}
        {highlightArticles.length > 0 && (
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <HighlightSection articles={highlightArticles} />
          </div>
        )}

        {/* 태그별 요약 카드 */}
        <TagSummaryCards
          tagStats={tagStats as Record<ArticleTag, number>}
          distinctStats={tagDistinctStats as Record<ArticleTag, number>}
          onTagClick={handleTagClick}
        />

        {/* 카테고리 차트 + 월별 타임라인 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 카테고리 도넛 차트 */}
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <CategoryChart
              stats={categoryStats as Record<ArticleCategory, number>}
              total={yearFilteredArticles.length}
              onCategoryClick={handleCategoryClick}
            />
          </div>

          {/* 월별 타임라인 */}
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <MonthlyTimeline
              monthlyData={monthlyData}
              year={timelineYear}
              onMonthClick={handleMonthClick}
              rollingData={rollingMonthlyData ?? undefined}
            />
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <button
              className="flex-1 text-center"
              onClick={() => setCurrentView("list")}
            >
              <div className="text-2xl font-bold text-primary">{yearFilteredArticles.length}</div>
              <div className="text-xs text-muted-foreground">전체 기사</div>
            </button>
            <div className="w-px h-10 bg-border" />
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-primary">{totalEventCount}</div>
              <div className="text-xs text-muted-foreground">이벤트</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-primary">{mediaCount}</div>
              <div className="text-xs text-muted-foreground">언론사</div>
            </div>
          </div>
        </div>

        {/* 최근 이벤트별 기사 */}
        <section className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">최근 이벤트별 기사</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("list")}
            >
              더보기
            </Button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                로딩 중...
              </div>
            ) : groupedRecentArticles.length > 0 ? (
              groupedRecentArticles.slice(0, 5).map((group, index) => (
                <ArticleGroup
                  key={group.eventName || `single-${index}`}
                  articles={group.articles}
                  eventName={group.eventName || ""}
                  onShowRelated={handleShowRelatedArticles}
                />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                등록된 기사가 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  // 목록 화면 렌더링
  const renderList = () => (
    <div className="p-4 space-y-4">
      {/* 연도 탭 */}
      <YearTabs
        years={availableYears}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="기사 제목, 키워드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 카테고리 필터 */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategory === "전체" ? "default" : "secondary"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedCategory("전체")}
          >
            전체
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "secondary"}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* 태그 필터 */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedTag === "전체" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTag("전체")}
          >
            전체
          </Button>
          {tags.map((tag) => {
            const distinctCount = tagDistinctStats[tag.id] || 0;
            return (
              <Button
                key={tag.id}
                variant={selectedTag === tag.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag.id)}
              >
                {tag.name} <span className="ml-1 opacity-70">{distinctCount}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* 기사 목록 */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            로딩 중...
          </div>
        ) : groupedArticles.length > 0 ? (
          groupedArticles.map((group, index) => (
            <ArticleGroup
              key={group.eventName || `single-${index}`}
              articles={group.articles}
              eventName={group.eventName || ""}
              onShowRelated={handleShowRelatedArticles}
            />
          ))
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            조건에 맞는 기사가 없습니다.
          </div>
        )}
      </div>
    </div>
  );

  // 캘린더 화면 렌더링
  const renderCalendar = () => (
    <div className="p-4 space-y-4">
      <CalendarView
        articles={articles}
        schedules={schedules}
        seminars={seminars}
        onDateSelect={handleDateSelect}
      />

      {selectedDate && (
        <div className="space-y-4">
          {/* 기사 목록 */}
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <h3 className="text-base font-semibold mb-3">
              {formatDate(selectedDate)} 기사
            </h3>
            <div className="space-y-3">
              {selectedDateArticles.length > 0 ? (
                selectedDateArticles.map((article) => (
                  <ArticleCard
                    key={article._id}
                    article={article}
                    relatedCount={getRelatedArticleCount(article.eventName)}
                    onShowRelated={handleShowRelatedArticles}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  해당 날짜에 기사가 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* 일정 목록 */}
          {selectedDateSchedules.length > 0 && (
            <div className="bg-card rounded-xl p-4 shadow-sm">
              <h3 className="text-base font-semibold mb-3">
                {formatDate(selectedDate)} 일정
              </h3>
              <div className="space-y-3">
                {selectedDateSchedules.map((schedule) => (
                  <div
                    key={schedule._id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant={schedule.category === "회의" ? "default" : schedule.category === "외근" ? "secondary" : "outline"}>
                        {schedule.category === "회의" ? "💼" : schedule.category === "외근" ? "🚗" : "📌"} {schedule.category}
                      </Badge>
                      {schedule.category === "회의" && schedule.meetingType && (
                        <span className="text-sm text-muted-foreground">{schedule.meetingType}</span>
                      )}
                      {schedule.category === "외근" && schedule.outingType && (
                        <span className="text-sm text-muted-foreground">{schedule.outingType}</span>
                      )}
                    </div>
                    <h4 className="font-medium mb-1">
                      {schedule.meetingTopic || schedule.outingTopic || schedule.etcTopic || schedule.etcDescription || "일정"}
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      <p>🕐 {schedule.time}</p>
                      <p>📍 {schedule.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 세미나 목록 */}
          {selectedDateSeminars.length > 0 && (
            <div className="bg-card rounded-xl p-4 shadow-sm">
              <h3 className="text-base font-semibold mb-3">
                {formatDate(selectedDate)} 세미나
              </h3>
              <div className="space-y-3">
                {selectedDateSeminars.map((seminar) => (
                  <div
                    key={seminar._id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant={seminar.category === "패밀리오피스" ? "default" : "secondary"}>
                        {seminar.category === "패밀리오피스" ? "👨‍👩‍👧‍👦" : "🏢"} {seminar.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{seminar.seminarType}</span>
                    </div>
                    <h4 className="font-medium mb-1">{seminar.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>📍 {seminar.location}</p>
                      {seminar.expectedAttendees && (
                        <p>👥 예상 참석자: {seminar.expectedAttendees}명</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 연관 기사 목록
  const relatedArticles = selectedEventName ? getRelatedArticles(selectedEventName) : [];

  return (
    <>
      <div className="min-h-screen pb-20 bg-background">
        {/* 헤더 */}
        <header className="bg-gradient-to-r from-blue-700 to-blue-600 safe-area-top sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center">
            {/* 좌측: 뒤로가기 버튼 (홈이 아닐 때만) - 우측과 동일한 너비 */}
            <div className="w-[80px] flex justify-start">
              {currentView !== "home" && (
                <button
                  onClick={() => setCurrentView("home")}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 중앙: 타이틀 */}
            <h1 className="flex-1 font-bold text-white text-center leading-tight">
              {currentView === "home" && (
                <span className="flex flex-col">
                  <span className="text-sm opacity-80">HNW</span>
                  <span className="text-base">홍보 아카이브</span>
                </span>
              )}
              {currentView === "list" && "홍보 목록"}
              {currentView === "seminar" && "세미나 관리"}
              {currentView === "schedule" && "일정 관리"}
              {currentView === "resources" && "자료실"}
              {currentView === "calendar" && "홍보 캘린더"}
              {currentView === "admin" && "기사관리"}
            </h1>

            {/* 우측: 설정 + 사용자 메뉴 - 고정 너비 */}
            <div className="w-[80px] flex items-center justify-end gap-1">
              {/* 설정 버튼 (알림 포함) */}
              <SettingsDialog />

              {/* 사용자 메뉴 */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <ChevronDown className="w-3 h-3 absolute bottom-0 right-0" />
                  </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border min-w-[140px] py-1 z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name}님</p>
                      {user.is_admin && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          관리자
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-rose-500"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
              ) : (
                <a
                  href="/admin"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <User className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        {currentView === "home" && renderHome()}
        {currentView === "list" && renderList()}
        {currentView === "seminar" && <SeminarView />}
        {currentView === "schedule" && <ScheduleView />}
        {currentView === "resources" && <ResourceView />}
        {currentView === "calendar" && renderCalendar()}
        {currentView === "admin" && user?.is_admin && (
          <div className="p-4">
            <div className="bg-card rounded-xl p-6 shadow-sm text-center">
              <p className="text-muted-foreground mb-4">
                관리자 페이지로 이동합니다.
              </p>
              <Button asChild>
                <a href="/admin">관리자 페이지</a>
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNav
        activeTab={currentView}
        onTabChange={handleTabChange}
        isAdmin={user?.is_admin}
        hasResourceAccess={user?.is_admin || (user?.email ? RESOURCE_ALLOWED_EMAILS.includes(user.email) : false)}
      />

      {/* 연관 기사 모달 */}
      <Dialog open={relatedModalOpen} onOpenChange={setRelatedModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedEventName}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              연관 기사 {relatedArticles.length}건
            </p>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {relatedArticles.map((article, index) => (
              <a
                key={article._id}
                href={article.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {article.mediaName} · {formatDate(article.publishedAt)}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <HomeContent />
    </Suspense>
  );
}
