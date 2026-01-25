"use client";

import { useState, useEffect, useMemo } from "react";
import { User, LogOut, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BottomNav } from "@/components/bottom-nav";
import { ArticleCard } from "@/components/article-card";
import { ArticleGroup } from "@/components/article-group";
import { CalendarView } from "@/components/calendar-view";
import { Article, ArticleCategory, ArticleTag, categories, tags } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ViewType = "home" | "list" | "calendar" | "admin";

interface UserInfo {
  id: string;
  name: string;
  is_admin: boolean;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | "전체">("전체");
  const [selectedTag, setSelectedTag] = useState<ArticleTag | "전체">("전체");
  const [searchQuery, setSearchQuery] = useState("");

  // 캘린더 선택된 날짜의 기사
  const [selectedDateArticles, setSelectedDateArticles] = useState<Article[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 연관 기사 모달
  const [relatedModalOpen, setRelatedModalOpen] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState<string>("");

  // 기사 목록 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/articles");
        const data = await res.json();
        if (data.success) {
          setArticles(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    checkAuth();
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

  // 필터링된 기사
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
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
  }, [articles, selectedCategory, selectedTag, searchQuery]);

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

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    articles.forEach((article) => {
      stats[article.category] = (stats[article.category] || 0) + 1;
    });
    return stats;
  }, [articles]);

  // 언론사 수
  const mediaCount = useMemo(() => {
    const mediaSet = new Set(articles.map((article) => article.mediaName).filter(Boolean));
    return mediaSet.size;
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

  // 탭 변경
  const handleTabChange = (tab: ViewType) => {
    if (tab === "admin") {
      if (!user?.is_admin) return;
      window.location.href = "/admin";
      return;
    }
    setCurrentView(tab);
    setSelectedDateArticles([]);
    setSelectedDate(null);
  };

  // 캘린더 날짜 선택
  const handleDateSelect = (date: Date, dateArticles: Article[]) => {
    setSelectedDate(date);
    setSelectedDateArticles(dateArticles);
  };

  // 홈 화면 렌더링
  const renderHome = () => {
    const totalArticles = articles.length || 1;
    const interviewCount = categoryStats["인터뷰"] || 0;
    const seminarCount = categoryStats["세미나 안내"] || 0;
    const solutionCount = categoryStats["소개 및 홍보"] || 0;

    return (
    <div className="p-4 space-y-4">
      {/* 통계 대시보드 */}
      <div className="bg-card rounded-xl p-4 shadow-sm space-y-4">
        {/* 전체 / 언론사 */}
        <div className="flex gap-6">
          <div
            className="cursor-pointer"
            onClick={() => setCurrentView("list")}
          >
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{articles.length}</span>
              <span className="text-xs text-muted-foreground">건</span>
              <span className="text-xs text-muted-foreground ml-1">전체</span>
            </div>
          </div>
          <div className="border-l pl-6">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{mediaCount}</span>
              <span className="text-xs text-muted-foreground">개</span>
              <span className="text-xs text-muted-foreground ml-1">언론사</span>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t" />

        {/* 카테고리별 게이지 */}
        <div className="space-y-3">
          <button
            className="w-full text-left"
            onClick={() => {
              setSelectedCategory("인터뷰");
              setCurrentView("list");
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">인터뷰</span>
              <span className="text-sm font-medium">{interviewCount}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(interviewCount / totalArticles) * 100}%` }}
              />
            </div>
          </button>

          <button
            className="w-full text-left"
            onClick={() => {
              setSelectedCategory("세미나 안내");
              setCurrentView("list");
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">세미나 안내</span>
              <span className="text-sm font-medium">{seminarCount}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${(seminarCount / totalArticles) * 100}%` }}
              />
            </div>
          </button>

          <button
            className="w-full text-left"
            onClick={() => {
              setSelectedCategory("소개 및 홍보");
              setCurrentView("list");
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">소개 및 홍보</span>
              <span className="text-sm font-medium">{solutionCount}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${(solutionCount / totalArticles) * 100}%` }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* 최근 기사 */}
      <section className="bg-card rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">최근 홍보</h2>
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
            groupedRecentArticles.map((group, index) => (
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
          {tags.map((tag) => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(tag.id)}
            >
              {tag.name}
            </Button>
          ))}
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
        onDateSelect={handleDateSelect}
      />

      {selectedDate && (
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
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="w-10" />
            <h1 className="text-xl font-bold text-white text-center">
              HNW 홍보 아카이브
            </h1>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <ChevronDown className="w-3 h-3 absolute bottom-0 right-0" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 bg-card rounded-lg shadow-lg border min-w-[140px] py-1 z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user.name}님</p>
                      {user.is_admin && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          관리자
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-destructive"
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
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <User className="w-5 h-5" />
              </a>
            )}
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        {currentView === "home" && renderHome()}
        {currentView === "list" && renderList()}
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
