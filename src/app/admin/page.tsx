"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Edit,
  Trash2,
  LogOut,
  ChevronLeft,
  Save,
  X,
  Newspaper,
  Search,
  Loader2,
  ExternalLink,
  Check,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Article, ArticleCategory, ArticleTag, categories, tags } from "@/lib/types";
import { formatDate, formatDateForInput } from "@/lib/utils";
import { BottomNav } from "@/components/bottom-nav";
import { UserManagement } from "@/components/admin/user-management";
import { Users } from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  is_admin: boolean;
}

interface CrawlResult {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

// URL에서 언론사 자동 추출
function extractMediaFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    const mediaMap: Record<string, string> = {
      "hankyung.com": "한국경제",
      "magazine.hankyung.com": "한경머니",
      "mk.co.kr": "매일경제",
      "sedaily.com": "서울경제",
      "edaily.co.kr": "이데일리",
      "fnnews.com": "파이낸셜뉴스",
      "mt.co.kr": "머니투데이",
      "asiae.co.kr": "아시아경제",
      "etnews.com": "전자신문",
      "dt.co.kr": "디지털타임스",
      "businesspost.co.kr": "비즈니스포스트",
      "thebell.co.kr": "더벨",
      "chosun.com": "조선일보",
      "biz.chosun.com": "조선비즈",
      "donga.com": "동아일보",
      "joongang.co.kr": "중앙일보",
      "hani.co.kr": "한겨레",
      "khan.co.kr": "경향신문",
      "kmib.co.kr": "국민일보",
      "seoul.co.kr": "서울신문",
      "munhwa.com": "문화일보",
      "segye.com": "세계일보",
      "yonhapnews.co.kr": "연합뉴스",
      "newsis.com": "뉴시스",
      "news1.kr": "뉴스1",
      "yna.co.kr": "연합뉴스",
      "kbs.co.kr": "KBS",
      "mbc.co.kr": "MBC",
      "sbs.co.kr": "SBS",
      "jtbc.co.kr": "JTBC",
      "tvchosun.com": "TV조선",
      "mbn.co.kr": "MBN",
      "ytn.co.kr": "YTN",
      "bloter.net": "블로터",
      "etoday.co.kr": "이투데이",
      "bizwatch.co.kr": "비즈워치",
      "newspim.com": "뉴스핌",
      "moneys.mt.co.kr": "머니S",
    };

    for (const [domain, media] of Object.entries(mediaMap)) {
      if (hostname === domain || hostname === `www.${domain}` || hostname.endsWith(`.${domain}`)) {
        return media;
      }
    }

    for (const [domain, media] of Object.entries(mediaMap)) {
      if (hostname.includes(domain.replace("www.", ""))) {
        return media;
      }
    }

    return "";
  } catch {
    return "";
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 로그인 폼
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [loginError, setLoginError] = useState("");

  // 기사 편집 다이얼로그
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isNewArticle, setIsNewArticle] = useState(false);

  // 삭제 확인 다이얼로그
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);

  // 크롤링 다이얼로그
  const [crawlDialogOpen, setCrawlDialogOpen] = useState(false);
  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([]);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [selectedCrawlArticles, setSelectedCrawlArticles] = useState<Set<number>>(new Set());
  const [savingCrawledArticles, setSavingCrawledArticles] = useState(false);
  const [savedKeyword, setSavedKeyword] = useState("");
  const [savedEventName, setSavedEventName] = useState("");
  const [savedCategory, setSavedCategory] = useState<ArticleCategory>("세미나 안내");
  const [savedArticleId, setSavedArticleId] = useState<string | null>(null);
  const [savedRelatedArticles, setSavedRelatedArticles] = useState<Article[]>([]); // 이미 저장된 관련 기사들
  const [pendingArticle, setPendingArticle] = useState<Partial<Article> | null>(null); // 검색 전 임시 저장할 기사
  const [savedPublishedAt, setSavedPublishedAt] = useState<Date | null>(null); // 발행일 (프론트엔드 필터링용)

  // 기사 일괄 선택/수정
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [batchEditCategory, setBatchEditCategory] = useState<ArticleCategory | "">("");
  const [batchEditEventName, setBatchEditEventName] = useState("");
  const [batchEditPublishedAt, setBatchEditPublishedAt] = useState<Date | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);

  // 기존 이벤트명 목록 (자동완성용)
  const existingEventNames = [...new Set(articles.map(a => a.eventName).filter(Boolean))] as string[];

  // OG 이미지 가져오기 상태
  const [fetchingOgImage, setFetchingOgImage] = useState(false);

  // 기사 스크래핑 상태
  const [scrapingArticle, setScrapingArticle] = useState(false);

  // 일괄 OG 이미지 업데이트 상태
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, success: 0 });

  // 탭 상태
  const [activeAdminTab, setActiveAdminTab] = useState<"articles" | "users">("articles");

  // 필터 상태
  const [filterCategory, setFilterCategory] = useState<ArticleCategory | "전체">("전체");
  const [filterTag, setFilterTag] = useState<ArticleTag | "전체">("전체");
  const [searchQuery, setSearchQuery] = useState("");

  // 필터링된 기사 목록
  const filteredArticles = articles.filter((article) => {
    if (filterCategory !== "전체" && article.category !== filterCategory) return false;
    if (filterTag !== "전체" && article.tag !== filterTag) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.keyword?.toLowerCase().includes(query) ||
        article.mediaName?.toLowerCase().includes(query) ||
        article.eventName?.toLowerCase().includes(query)
      );
    }
    return true;
  }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // 카테고리별 통계
  const categoryStats = {
    "인터뷰": articles.filter(a => a.category === "인터뷰").length,
    "세미나 안내": articles.filter(a => a.category === "세미나 안내").length,
    "소개 및 홍보": articles.filter(a => a.category === "소개 및 홍보").length,
  };

  // 태그별 통계
  const tagStatsData = {
    "보도기사": articles.filter(a => a.tag === "보도기사").length,
    "특집기사": articles.filter(a => a.tag === "특집기사").length,
    "단독기사": articles.filter(a => a.tag === "단독기사").length,
  };

  // OG 이미지 가져오기
  const fetchOgImage = async () => {
    if (!editingArticle?.articleUrl) return;

    setFetchingOgImage(true);
    try {
      const res = await fetch(`/api/og-image?url=${encodeURIComponent(editingArticle.articleUrl)}`);
      const data = await res.json();

      if (data.success && data.data?.ogImage) {
        setEditingArticle({
          ...editingArticle,
          thumbnailUrl: data.data.ogImage,
        });
      } else {
        toast.error("이미지를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("OG image fetch error:", error);
      toast.error("이미지 가져오기에 실패했습니다.");
    } finally {
      setFetchingOgImage(false);
    }
  };

  // URL에서 기사 정보 스크래핑
  const scrapeArticle = async (url: string) => {
    if (!url) return;

    setScrapingArticle(true);
    try {
      const res = await fetch(`/api/article-scrape?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (data.success && data.data) {
        const scraped = data.data;
        setEditingArticle((prev) => ({
          ...prev,
          title: scraped.title || prev?.title || "",
          keyword: scraped.keyword || prev?.keyword || "",
          description: scraped.description || prev?.description || "",
          thumbnailUrl: scraped.thumbnailUrl || prev?.thumbnailUrl || "",
          mediaName: scraped.mediaName || prev?.mediaName || "",
          articleUrl: scraped.articleUrl || url,
          publishedAt: scraped.publishedAt ? new Date(scraped.publishedAt) : prev?.publishedAt || new Date(),
        }));
      } else {
        toast.error(data.error || "기사 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("Article scrape error:", error);
      toast.error("기사 스크래핑에 실패했습니다.");
    } finally {
      setScrapingArticle(false);
    }
  };

  // 기존 기사 일괄 OG 이미지 업데이트
  const batchUpdateOgImages = async () => {
    // 기사 URL이 있는 기사들
    const articlesWithUrl = articles.filter((article) => article.articleUrl);
    // 이미 썸네일이 있는 기사 수
    const articlesWithThumbnail = articlesWithUrl.filter((article) => article.thumbnailUrl);
    // 썸네일이 없고 기사 URL이 있는 기사들만 필터링 (이미 썸네일이 있는 기사는 건너뜀)
    const articlesToUpdate = articlesWithUrl.filter((article) => !article.thumbnailUrl);

    if (articlesToUpdate.length === 0) {
      toast.warning("업데이트할 기사가 없습니다.");
      return;
    }

    const confirmMsg = `썸네일 일괄 다운로드\n\n• 전체 기사: ${articles.length}개\n• 이미 썸네일 있음 (건너뜀): ${articlesWithThumbnail.length}개\n• 다운로드 대상: ${articlesToUpdate.length}개\n\n계속하시겠습니까?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    setBatchUpdating(true);
    setBatchProgress({ current: 0, total: articlesToUpdate.length, success: 0 });

    let successCount = 0;

    for (let i = 0; i < articlesToUpdate.length; i++) {
      const article = articlesToUpdate[i];
      setBatchProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        // OG 이미지 가져오기
        const ogRes = await fetch(`/api/og-image?url=${encodeURIComponent(article.articleUrl!)}`);
        const ogData = await ogRes.json();

        if (ogData.success && ogData.data?.ogImage) {
          // 기사 업데이트
          const updateRes = await fetch(`/api/articles/${article._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...article,
              thumbnailUrl: ogData.data.ogImage,
            }),
          });

          if (updateRes.ok) {
            successCount++;
            setBatchProgress((prev) => ({ ...prev, success: successCount }));
          }
        }
      } catch (error) {
        console.error(`Failed to update article ${article._id}:`, error);
      }

      // 서버 부하 방지를 위한 딜레이
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setBatchUpdating(false);
    toast.success(`${successCount}/${articlesToUpdate.length}개 기사의 썸네일이 업데이트되었습니다.`);
    fetchArticles();
  };

  // 기사 목록 조회
  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/articles");
      const data = await res.json();
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    }
  };

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.data.is_admin) {
          setUser(data.data);
          fetchArticles();
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.data.is_admin) {
          setUser(data.data);
          fetchArticles();
        } else {
          setLoginError("관리자 권한이 없습니다.");
        }
      } else {
        setLoginError(data.error || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("로그인에 실패했습니다.");
    }
  };

  // 회원가입
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, adminKey }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.data.is_admin) {
          await handleLogin(e);
        } else {
          setLoginError("관리자 키가 올바르지 않습니다.");
        }
      } else {
        setLoginError(data.error || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("Register error:", error);
      setLoginError("회원가입에 실패했습니다.");
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 새 기사 추가
  const handleNewArticle = () => {
    setEditingArticle({
      title: "",
      keyword: "",
      interviewee: "",
      publishedAt: new Date(),
      category: "세미나 안내",
      tag: "보도기사",
      thumbnailUrl: "",
      articleUrl: "",
      mediaName: "",
      description: "",
      eventName: "",
    });
    setIsNewArticle(true);
    setEditDialogOpen(true);
  };

  // 기사 편집
  const handleEditArticle = (article: Article) => {
    setEditingArticle({ ...article });
    setIsNewArticle(false);
    setEditDialogOpen(true);
  };

  // 관련 기사 검색 (저장 전 검색)
  const handleSearchRelated = () => {
    if (!editingArticle) return;

    const keyword = editingArticle.keyword;
    const interviewee = (editingArticle as { interviewee?: string }).interviewee;
    const category = editingArticle.category || "세미나 안내";
    const eventName = editingArticle.eventName || "";
    const publishedAt = editingArticle.publishedAt ? new Date(editingArticle.publishedAt) : new Date();

    // 검색할 키워드 확인
    let searchKeyword = "";
    if (category === "인터뷰") {
      if (interviewee && interviewee.trim()) {
        searchKeyword = keyword && keyword.trim() && keyword !== "NH투자증권"
          ? `${interviewee}, ${keyword}`
          : interviewee;
      }
    } else {
      if (keyword && keyword.trim() && keyword !== "NH투자증권") {
        searchKeyword = keyword;
      }
    }

    if (!searchKeyword) {
      toast.warning("검색할 키워드를 입력해주세요.");
      return;
    }

    // 임시 저장 (아직 DB에 저장하지 않음)
    setPendingArticle(editingArticle);
    setSavedKeyword(searchKeyword);
    setSavedEventName(eventName);
    setSavedCategory(category as ArticleCategory);

    setEditDialogOpen(false);
    setSavedPublishedAt(publishedAt); // 프론트엔드 필터링용 발행일 저장
    startCrawling(searchKeyword, publishedAt, eventName, undefined, editingArticle);
  };

  // 기사 저장 (수정 시에만 사용)
  const handleSaveArticle = async () => {
    if (!editingArticle) return;

    try {
      const url = isNewArticle
        ? "/api/articles"
        : `/api/articles/${editingArticle._id}`;
      const method = isNewArticle ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingArticle),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("기사를 저장했습니다.");
        setEditDialogOpen(false);
        setEditingArticle(null);
        fetchArticles();
      } else {
        toast.error(data.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("저장에 실패했습니다.");
    }
  };

  // 크롤링 시작 (keyword 기준, 발행일 ±1주일 필터링)
  const startCrawling = async (keyword: string, publishedAt: Date, eventName?: string, currentArticleId?: string, justSavedArticle?: Partial<Article>) => {
    setCrawlDialogOpen(true);
    setCrawlLoading(true);
    setCrawlResults([]);
    setSavedRelatedArticles([]);
    setSelectedCrawlArticles(new Set());

    try {
      // 1. 이미 저장된 관련 기사 조회 (같은 eventName을 가진 기사들)
      const relatedArticles: Article[] = [];

      // 방금 저장한 기사 추가
      if (justSavedArticle && currentArticleId) {
        relatedArticles.push({
          ...justSavedArticle,
          _id: currentArticleId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "admin",
        } as Article);
      }

      // 같은 eventName을 가진 기존 기사들 추가
      if (eventName) {
        const existingRelated = articles.filter(a =>
          a.eventName === eventName && a._id !== currentArticleId
        );
        relatedArticles.push(...existingRelated);
      }

      setSavedRelatedArticles(relatedArticles);

      // 2. NH투자증권 + keyword로 검색 (쉼표로 구분된 키워드를 정리)
      const cleanedKeywords = keyword.split(',').map(k => k.trim()).filter(k => k).join(',');
      const keywords = `NH투자증권,${cleanedKeywords}`;

      const res = await fetch(
        `/api/news/search?keywords=${encodeURIComponent(keywords)}`
      );
      const data = await res.json();

      if (data.success) {
        // 오직 제목에서 NH투자/NH증권 포함 여부만 필터링
        const filteredResults = (data.data || []).filter((article: CrawlResult) => {
          const titleLower = article.title.toLowerCase();
          return titleLower.includes('nh투자') || titleLower.includes('nh증권');
        });

        console.log("검색 결과:", {
          원본: data.data?.length || 0,
          "제목필터후": filteredResults.length,
          기준발행일: publishedAt.toISOString().split('T')[0],
        });

        // 날짜 기준 내림차순 정렬 (최신이 위로)
        const sortedResults = filteredResults.sort((a: CrawlResult, b: CrawlResult) => {
          const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return dateB - dateA;
        });
        setCrawlResults(sortedResults);
      }
    } catch (error) {
      console.error("Crawl error:", error);
    } finally {
      setCrawlLoading(false);
    }
  };

  // 크롤링 기사 선택 토글
  const toggleCrawlSelection = (index: number) => {
    const newSelected = new Set(selectedCrawlArticles);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCrawlArticles(newSelected);
  };

  // URL에서 언론사명 추출
  const extractMediaName = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      const sourceMap: Record<string, string> = {
        "www.hankyung.com": "한국경제",
        "www.mk.co.kr": "매일경제",
        "www.edaily.co.kr": "이데일리",
        "www.mt.co.kr": "머니투데이",
        "www.sedaily.com": "서울경제",
        "www.fnnews.com": "파이낸셜뉴스",
        "www.etnews.com": "전자신문",
        "www.newsis.com": "뉴시스",
        "www.yna.co.kr": "연합뉴스",
        "news.heraldcorp.com": "헤럴드경제",
        "www.asiae.co.kr": "아시아경제",
        "www.thebell.co.kr": "더벨",
        "biz.chosun.com": "조선비즈",
        "www.donga.com": "동아일보",
        "www.joongang.co.kr": "중앙일보",
        "www.hani.co.kr": "한겨레",
        "www.khan.co.kr": "경향신문",
        "www.bridgenews.co.kr": "브릿지경제",
        "www.wowtv.co.kr": "한국경제TV",
        "www.etoday.co.kr": "이투데이",
        "www.newspim.com": "뉴스핌",
        "www.infostock.co.kr": "인포스탁데일리",
      };
      return sourceMap[hostname] || hostname.replace("www.", "");
    } catch {
      return "";
    }
  };

  // 선택된 크롤링 기사 저장 (원본 기사 + 선택한 기사 모두 저장)
  const saveCrawledArticles = async () => {
    setSavingCrawledArticles(true);
    let savedCount = 0;
    let skippedCount = 0;

    try {
      // 원본 기사 URL (중복 체크용)
      const originalUrl = pendingArticle?.articleUrl || "";

      // 1. 원본 기사 저장 (pendingArticle이 있으면)
      if (pendingArticle) {
        // mediaName이 비어있으면 URL에서 추출
        const articleToSave = {
          ...pendingArticle,
          mediaName: pendingArticle.mediaName || extractMediaName(pendingArticle.articleUrl || ""),
        };

        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleToSave),
        });

        if (res.ok) {
          savedCount++;
        }
      }

      // 2. 선택된 크롤링 기사 저장 (원본과 중복되는 URL은 제외)
      for (const index of selectedCrawlArticles) {
        const result = crawlResults[index];
        if (!result) continue;

        // 원본 기사와 같은 URL이면 건너뛰기
        if (originalUrl && result.link === originalUrl) {
          skippedCount++;
          continue;
        }

        const articleData = {
          title: result.title,
          keyword: savedKeyword,
          publishedAt: result.pubDate ? new Date(result.pubDate) : new Date(),
          category: savedCategory,
          tag: "보도기사" as ArticleTag,
          thumbnailUrl: "",
          articleUrl: result.link,
          mediaName: result.source,
          description: "",
          eventName: savedEventName,
        };

        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleData),
        });

        if (res.ok) {
          savedCount++;
        }
      }

      toast.success(`${savedCount}개의 기사가 저장되었습니다.`);
      setCrawlDialogOpen(false);
      setPendingArticle(null);
      fetchArticles();
    } catch (error) {
      console.error("Save crawled articles error:", error);
      toast.error("기사 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingCrawledArticles(false);
    }
  };

  // 기사 삭제
  const handleDeleteArticle = async () => {
    if (!deletingArticleId) return;

    try {
      const res = await fetch(`/api/articles/${deletingArticleId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("기사를 삭제했습니다.");
        setDeleteDialogOpen(false);
        setDeletingArticleId(null);
        fetchArticles();
      } else {
        toast.error(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("삭제에 실패했습니다.");
    }
  };

  // 기사 선택 토글
  const toggleArticleSelection = (articleId: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articles.map(a => a._id!)));
    }
  };

  // 일괄 수정 다이얼로그 열기
  const openBatchEditDialog = () => {
    setBatchEditCategory("");
    setBatchEditEventName("");
    setBatchEditPublishedAt(null);
    setBatchEditDialogOpen(true);
  };

  // 일괄 수정 적용
  const handleBatchEdit = async () => {
    if (selectedArticles.size === 0) return;

    setBatchSaving(true);
    let successCount = 0;

    try {
      for (const articleId of selectedArticles) {
        const article = articles.find(a => a._id === articleId);
        if (!article) continue;

        const updateData: Partial<Article> = {};
        if (batchEditCategory) updateData.category = batchEditCategory;
        if (batchEditEventName) updateData.eventName = batchEditEventName;
        if (batchEditPublishedAt) updateData.publishedAt = batchEditPublishedAt;

        // 변경할 내용이 없으면 스킵
        if (Object.keys(updateData).length === 0) continue;

        const res = await fetch(`/api/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (res.ok) successCount++;
      }

      toast.success(`${successCount}/${selectedArticles.size}개 기사가 수정되었습니다.`);
      setBatchEditDialogOpen(false);
      setSelectedArticles(new Set());
      fetchArticles();
    } catch (error) {
      console.error("Batch edit error:", error);
      toast.error("일괄 수정 중 오류가 발생했습니다.");
    } finally {
      setBatchSaving(false);
    }
  };

  // 일괄 삭제
  const handleBatchDelete = async () => {
    if (selectedArticles.size === 0) return;

    if (!confirm(`선택한 ${selectedArticles.size}개의 기사를 삭제하시겠습니까?`)) return;

    let successCount = 0;
    for (const articleId of selectedArticles) {
      try {
        const res = await fetch(`/api/articles/${articleId}`, {
          method: "DELETE",
        });
        if (res.ok) successCount++;
      } catch (error) {
        console.error("Delete error:", error);
      }
    }

    toast.success(`${successCount}/${selectedArticles.size}개 기사가 삭제되었습니다.`);
    setSelectedArticles(new Set());
    fetchArticles();
  };

  // 같은 이벤트의 기사 수 계산
  const getRelatedArticleCount = (eventName: string | undefined) => {
    if (!eventName) return 0;
    return articles.filter(a => a.eventName === eventName).length;
  };

  // 발행일 당일 기사만 필터링 (원본 인덱스 포함)
  const filteredCrawlResultsWithIndex = savedPublishedAt
    ? crawlResults
        .map((article, originalIndex) => ({ ...article, originalIndex }))
        .filter((article) => {
          if (!article.pubDate) return false;
          const articleDate = new Date(article.pubDate);
          const targetDate = new Date(savedPublishedAt);

          // 디버그 로그 (처음 5개만)
          if (article.originalIndex < 5) {
            console.log("날짜 비교:", {
              원본pubDate: article.pubDate,
              articleDate: articleDate.toISOString(),
              articleYear: articleDate.getFullYear(),
              articleMonth: articleDate.getMonth() + 1,
              articleDay: articleDate.getDate(),
              targetDate: targetDate.toISOString(),
              targetYear: targetDate.getFullYear(),
              targetMonth: targetDate.getMonth() + 1,
              targetDay: targetDate.getDate(),
            });
          }

          return (
            articleDate.getFullYear() === targetDate.getFullYear() &&
            articleDate.getMonth() === targetDate.getMonth() &&
            articleDate.getDate() === targetDate.getDate()
          );
        })
    : crawlResults.map((article, originalIndex) => ({ ...article, originalIndex }));

  const filteredCrawlResults = filteredCrawlResultsWithIndex;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // 로그인 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">HNW 홍보 아카이브</h1>
            <p className="text-muted-foreground mt-1">관리자 로그인</p>
          </div>

          <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
            <div className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="text-sm font-medium">이름</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름 입력"
                    required={!isLoginMode}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">이메일</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 입력"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">비밀번호</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                />
              </div>
              {!isLoginMode && (
                <div>
                  <label className="text-sm font-medium">관리자 키</label>
                  <Input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="관리자 키 입력"
                    required={!isLoginMode}
                  />
                </div>
              )}

              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}

              <Button type="submit" className="w-full">
                {isLoginMode ? "로그인" : "회원가입"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setLoginError("");
                }}
              >
                {isLoginMode ? "회원가입하기" : "로그인하기"}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => router.push("/")}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              홈으로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 탭 변경 핸들러
  const handleTabChange = (tab: "home" | "list" | "seminar" | "schedule" | "resources" | "calendar" | "admin") => {
    if (tab === "admin") return; // 이미 admin 페이지
    router.push(tab === "home" ? "/" : `/?tab=${tab}`);
  };

  // 관리자 대시보드
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 safe-area-top sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">관리자</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* 탭 버튼 */}
        <div className="flex border-t border-white/20">
          <button
            onClick={() => setActiveAdminTab("articles")}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              activeAdminTab === "articles"
                ? "text-white border-b-2 border-white"
                : "text-white/70 hover:text-white active:text-white"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            기사 관리
          </button>
          <button
            onClick={() => setActiveAdminTab("users")}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              activeAdminTab === "users"
                ? "text-white border-b-2 border-white"
                : "text-white/70 hover:text-white active:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            사용자 관리
          </button>
        </div>
      </header>

      {/* 콘텐츠 */}
      {activeAdminTab === "users" ? (
        <div className="p-4">
          <UserManagement />
        </div>
      ) : (
      <div className="p-4 space-y-4">
        {/* 상단 액션 버튼 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-bold text-foreground">{articles.length}</span>건
            {filterCategory !== "전체" || filterTag !== "전체" || searchQuery ? (
              <span className="ml-1">(필터: {filteredArticles.length}건)</span>
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={batchUpdateOgImages}
              disabled={batchUpdating}
            >
              {batchUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {batchProgress.current}/{batchProgress.total}
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-1" />
                  썸네일
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleNewArticle}>
              <Plus className="w-4 h-4 mr-1" />
              새 기사
            </Button>
          </div>
        </div>

        {batchUpdating && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between text-xs text-blue-700 mb-1">
              <span>썸네일 가져오는 중...</span>
              <span>성공: {batchProgress.success}개</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 카테고리별 필터 카드 */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setFilterCategory(filterCategory === "인터뷰" ? "전체" : "인터뷰")}
            className={`p-3 rounded-lg border transition-all ${
              filterCategory === "인터뷰"
                ? "bg-purple-500 text-white border-purple-500"
                : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
            }`}
          >
            <div className="text-lg font-bold">{categoryStats["인터뷰"]}</div>
            <div className="text-xs">인터뷰</div>
          </button>
          <button
            onClick={() => setFilterCategory(filterCategory === "세미나 안내" ? "전체" : "세미나 안내")}
            className={`p-3 rounded-lg border transition-all ${
              filterCategory === "세미나 안내"
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
            }`}
          >
            <div className="text-lg font-bold">{categoryStats["세미나 안내"]}</div>
            <div className="text-xs">세미나</div>
          </button>
          <button
            onClick={() => setFilterCategory(filterCategory === "소개 및 홍보" ? "전체" : "소개 및 홍보")}
            className={`p-3 rounded-lg border transition-all ${
              filterCategory === "소개 및 홍보"
                ? "bg-cyan-500 text-white border-cyan-500"
                : "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
            }`}
          >
            <div className="text-lg font-bold">{categoryStats["소개 및 홍보"]}</div>
            <div className="text-xs">소개/홍보</div>
          </button>
        </div>

        {/* 태그별 필터 */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterTag(filterTag === "보도기사" ? "전체" : "보도기사")}
            className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
              filterTag === "보도기사"
                ? "bg-green-500 text-white border-green-500"
                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            }`}
          >
            보도 <span className="font-bold">{tagStatsData["보도기사"]}</span>
          </button>
          <button
            onClick={() => setFilterTag(filterTag === "특집기사" ? "전체" : "특집기사")}
            className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
              filterTag === "특집기사"
                ? "bg-indigo-500 text-white border-indigo-500"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            특집 <span className="font-bold">{tagStatsData["특집기사"]}</span>
          </button>
          <button
            onClick={() => setFilterTag(filterTag === "단독기사" ? "전체" : "단독기사")}
            className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
              filterTag === "단독기사"
                ? "bg-red-500 text-white border-red-500"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
          >
            단독 <span className="font-bold">{tagStatsData["단독기사"]}</span>
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="제목, 키워드, 언론사, 이벤트명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 필터 초기화 */}
        {(filterCategory !== "전체" || filterTag !== "전체" || searchQuery) && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground">
              {filterCategory !== "전체" && <Badge variant="secondary" className="mr-1">{filterCategory}</Badge>}
              {filterTag !== "전체" && <Badge variant="outline" className="mr-1">{filterTag}</Badge>}
              {searchQuery && <span className="text-xs">&quot;{searchQuery}&quot;</span>}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory("전체");
                setFilterTag("전체");
                setSearchQuery("");
              }}
            >
              <X className="w-4 h-4 mr-1" />
              필터 초기화
            </Button>
          </div>
        )}

        {/* 기사 목록 */}
        <div className="space-y-3">
          {/* 일괄 선택 툴바 */}
          {filteredArticles.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const filteredIds = new Set(filteredArticles.map(a => a._id!));
                      const allSelected = filteredArticles.every(a => selectedArticles.has(a._id!));
                      if (allSelected) {
                        setSelectedArticles(new Set());
                      } else {
                        setSelectedArticles(filteredIds);
                      }
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      filteredArticles.length > 0 && filteredArticles.every(a => selectedArticles.has(a._id!))
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {filteredArticles.length > 0 && filteredArticles.every(a => selectedArticles.has(a._id!)) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {selectedArticles.size > 0
                      ? `${selectedArticles.size}개 선택됨`
                      : `${filteredArticles.length}개 기사`}
                  </span>
                </div>
                {selectedArticles.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openBatchEditDialog}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      일괄 수정
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      일괄 삭제
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => {
              const relatedCount = getRelatedArticleCount(article.eventName);
              const isSelected = selectedArticles.has(article._id!);
              return (
                <Card key={article._id} className={`p-4 ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
                  <div className="flex gap-3">
                    {/* 체크박스 */}
                    <button
                      onClick={() => toggleArticleSelection(article._id!)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-5 transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>

                    {/* 썸네일 */}
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg overflow-hidden">
                      {article.thumbnailUrl ? (
                        <img
                          src={article.thumbnailUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* 콘텐츠 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-1.5 mb-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {article.tag}
                        </Badge>
                        {article.eventName && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            {article.eventName} ({relatedCount})
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(article.publishedAt)}
                        {article.mediaName && ` · ${article.mediaName}`}
                      </p>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditArticle(article)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          setDeletingArticleId(article._id!);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : articles.length === 0 ? (
              <EmptyState icon={Newspaper} title="등록된 기사가 없습니다." />
          ) : (
              <EmptyState
                icon={Search}
                title="필터 조건에 맞는 기사가 없습니다."
                action={{
                  label: "필터 초기화",
                  onClick: () => {
                    setFilterCategory("전체");
                    setFilterTag("전체");
                    setSearchQuery("");
                  },
                }}
              />
          )}
        </div>
      </div>
      )}

      {/* 기사 편집 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewArticle ? "새 기사 추가" : "기사 수정"}
            </DialogTitle>
          </DialogHeader>

          {editingArticle && (
            <div className="space-y-4">
              {/* URL 입력 (최상단) */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="text-sm font-medium text-blue-700">기사 URL</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editingArticle.articleUrl || ""}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, articleUrl: e.target.value })
                    }
                    placeholder="https://... 기사 URL을 입력하세요"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => scrapeArticle(editingArticle.articleUrl || "")}
                    disabled={!editingArticle.articleUrl || scrapingArticle}
                  >
                    {scrapingArticle ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        불러오는 중
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-1" />
                        불러오기
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  URL 입력 후 &quot;불러오기&quot;를 클릭하면 기사 정보가 자동으로 채워집니다
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">제목 *</label>
                <Input
                  value={editingArticle.title || ""}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, title: e.target.value })
                  }
                  placeholder="기사 제목"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">검색 조건:</span> 제목에 NH투자 / NH증권 포함 + 발행일 당일
              </p>

              {/* 인터뷰이 (인터뷰 카테고리일 때만) */}
              {editingArticle.category === "인터뷰" && (
                <div>
                  <label className="text-sm font-medium">인터뷰이 *</label>
                  <Input
                    value={editingArticle.interviewee || ""}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, interviewee: e.target.value })
                    }
                    placeholder="인터뷰이 이름 (크롤링 키워드로 사용)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    NH투자증권 + 인터뷰이 이름으로 관련 기사를 검색합니다
                  </p>
                </div>
              )}

              {/* 연관 이벤트명 */}
              <div>
                <label className="text-sm font-medium">연관 이벤트명</label>
                <Input
                  value={editingArticle.eventName || ""}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, eventName: e.target.value })
                  }
                  placeholder="예: 넥스트젠 세미나"
                  list="eventNames"
                />
                <datalist id="eventNames">
                  {existingEventNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground mt-1">
                  같은 이벤트명을 가진 기사들이 자동으로 그룹됩니다
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">발행일 *</label>
                <Input
                  type="date"
                  value={formatDateForInput(editingArticle.publishedAt || new Date())}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      publishedAt: new Date(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">카테고리 *</label>
                  <Select
                    value={editingArticle.category}
                    onValueChange={(value) =>
                      setEditingArticle({
                        ...editingArticle,
                        category: value as ArticleCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">태그 *</label>
                  <Select
                    value={editingArticle.tag}
                    onValueChange={(value) =>
                      setEditingArticle({
                        ...editingArticle,
                        tag: value as ArticleTag,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">언론사</label>
                <Input
                  value={editingArticle.mediaName || ""}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, mediaName: e.target.value })
                  }
                  placeholder="예: 한국경제, 매일경제"
                />
              </div>

              <div>
                <label className="text-sm font-medium">썸네일</label>
                <div className="flex gap-2">
                  <Input
                    value={editingArticle.thumbnailUrl || ""}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, thumbnailUrl: e.target.value })
                    }
                    placeholder="https://... (URL 불러오기 시 자동 입력)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchOgImage}
                    disabled={!editingArticle.articleUrl || fetchingOgImage}
                    title="이미지 다시 가져오기"
                  >
                    {fetchingOgImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {editingArticle.thumbnailUrl && (
                  <div className="mt-2 relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={editingArticle.thumbnailUrl}
                      alt="썸네일 미리보기"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">설명</label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={editingArticle.description || ""}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, description: e.target.value })
                  }
                  placeholder="기사 요약 또는 메모"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            {isNewArticle ? (
              <Button onClick={handleSearchRelated}>
                <Search className="w-4 h-4 mr-2" />
                관련 기사 검색
              </Button>
            ) : (
              <Button onClick={handleSaveArticle}>
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기사 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            이 기사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteArticle}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄 수정 다이얼로그 */}
      <Dialog open={batchEditDialogOpen} onOpenChange={setBatchEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일괄 수정 ({selectedArticles.size}개 기사)</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            선택한 기사들의 <span className="font-medium text-foreground">카테고리, 이벤트명, 발행일</span>을 일괄 변경합니다.
            <br />
            <span className="text-xs">변경하지 않을 항목은 빈칸으로 두세요.</span>
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <select
                value={batchEditCategory}
                onChange={(e) => setBatchEditCategory(e.target.value as ArticleCategory | "")}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">변경 안함</option>
                <option value="인터뷰">인터뷰</option>
                <option value="세미나 안내">세미나 안내</option>
                <option value="소개 및 홍보">소개 및 홍보</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">이벤트명</label>
              <Input
                value={batchEditEventName}
                onChange={(e) => setBatchEditEventName(e.target.value)}
                placeholder="빈칸이면 변경 안함"
                list="batch-event-names"
              />
              <datalist id="batch-event-names">
                {existingEventNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-medium">발행일</label>
              <Input
                type="date"
                value={batchEditPublishedAt ? batchEditPublishedAt.toISOString().split('T')[0] : ""}
                onChange={(e) => setBatchEditPublishedAt(e.target.value ? new Date(e.target.value) : null)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">빈칸이면 변경 안함</p>
            </div>

            {/* 수정 불가 필드 안내 */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">일괄 수정 불가:</span> 제목, 태그, 썸네일, 기사URL, 언론사 등은 개별 수정만 가능합니다.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBatchEditDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleBatchEdit}
              disabled={batchSaving || (!batchEditCategory && !batchEditEventName && !batchEditPublishedAt)}
            >
              {batchSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  적용 중...
                </>
              ) : (
                `${selectedArticles.size}개 기사에 적용`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 크롤링 다이얼로그 */}
      <Dialog open={crawlDialogOpen} onOpenChange={setCrawlDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              관련 기사 검색
            </DialogTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">핵심키워드:</span> NH투자 / NH증권</p>
              <p><span className="font-medium text-foreground">기타키워드:</span> {savedKeyword.split(',').map(k => k.trim()).filter(k => k && k.toLowerCase() !== 'nh투자증권').join(', ')}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              핵심키워드 + 기타키워드 매칭 / 발행일 이후 1개월 이내만 표시
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setCrawlDialogOpen(false);
                // pendingArticle이 있으면 (새 기사 검색 중) 다시 수정 모드로 열기
                if (pendingArticle) {
                  setEditingArticle(pendingArticle);
                  setIsNewArticle(true);
                  setEditDialogOpen(true);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-1" />
              설정 수정하러 가기
            </Button>
          </DialogHeader>

          {!crawlLoading && (savedRelatedArticles.length > 0 || filteredCrawlResults.length > 0) && (
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                저장됨 {savedRelatedArticles.length}건 / 검색됨 {filteredCrawlResults.length}건 (전체 {crawlResults.length}건) / {selectedCrawlArticles.size}건 선택
              </span>
              {filteredCrawlResults.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filteredIndices = new Set(filteredCrawlResults.map(r => r.originalIndex));
                    const allSelected = filteredCrawlResults.every(r => selectedCrawlArticles.has(r.originalIndex));
                    if (allSelected) {
                      setSelectedCrawlArticles(new Set());
                    } else {
                      setSelectedCrawlArticles(filteredIndices);
                    }
                  }}
                >
                  {filteredCrawlResults.every(r => selectedCrawlArticles.has(r.originalIndex)) ? "전체해제" : "전체선택"}
                </Button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {crawlLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">검색 중...</span>
              </div>
            ) : (
              <>
                {/* 저장된 관련 기사 섹션 */}
                {savedRelatedArticles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      저장된 관련 기사 ({savedRelatedArticles.length}건)
                    </h4>
                    <div className="space-y-2">
                      {savedRelatedArticles.map((article) => (
                        <div
                          key={article._id}
                          className="p-3 border rounded-lg bg-green-50 border-green-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2">
                                {article.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{article.mediaName || "알 수 없음"}</span>
                                <span>·</span>
                                <span>{formatDate(article.publishedAt)}</span>
                                <Badge variant="secondary" className="text-[10px] h-4">저장됨</Badge>
                              </div>
                            </div>
                            {article.articleUrl && (
                              <a
                                href={article.articleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 p-1 hover:bg-green-100 rounded"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 새로 검색된 기사 섹션 */}
                {filteredCrawlResults.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
                      <Search className="w-4 h-4" />
                      새로 검색된 기사 ({filteredCrawlResults.length}건)
                    </h4>
                    <div className="space-y-2">
                      {filteredCrawlResults.map((result) => (
                          <div
                            key={result.originalIndex}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedCrawlArticles.has(result.originalIndex)
                                ? "border-blue-500 bg-blue-50"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => toggleCrawlSelection(result.originalIndex)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                  selectedCrawlArticles.has(result.originalIndex)
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedCrawlArticles.has(result.originalIndex) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {result.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span>{result.source}</span>
                                  <span>·</span>
                                  <span>
                                    {result.pubDate
                                      ? new Date(result.pubDate).toLocaleDateString("ko-KR")
                                      : "날짜 없음"}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 p-1 hover:bg-muted rounded"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </a>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                ) : savedRelatedArticles.length === 0 ? (
                  <EmptyState icon={Search} title="검색 결과가 없습니다." />
                ) : null}
              </>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-muted-foreground">
                {pendingArticle ? "원본 기사 + " : ""}{selectedCrawlArticles.size}개 선택됨
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCrawlDialogOpen(false);
                    setPendingArticle(null);
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={saveCrawledArticles}
                  disabled={!pendingArticle && selectedCrawlArticles.size === 0 || savingCrawledArticles}
                >
                  {savingCrawledArticles ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {pendingArticle
                        ? selectedCrawlArticles.size > 0
                          ? `${1 + selectedCrawlArticles.size}개 기사 저장`
                          : "원본 기사만 저장"
                        : "선택 기사 저장"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav
        activeTab="admin"
        onTabChange={handleTabChange}
        isAdmin={true}
      />
    </div>
  );
}
