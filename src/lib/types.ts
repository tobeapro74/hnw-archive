// 기사 카테고리
export type ArticleCategory = "인터뷰" | "세미나 안내" | "소개 및 홍보";

// 기사 태그
export type ArticleTag = "단독기사" | "특집기사" | "보도기사";

// 이벤트/캠페인 타입
export interface Event {
  _id?: string;
  title: string;           // 예: "2026 1Q 패밀리오피스 세미나"
  date: Date;              // 이벤트 날짜
  category: ArticleCategory;
  keywords: string[];      // 검색 키워드 (예: ["패밀리오피스", "세미나"])
  description?: string;    // 예: "삼성동 파르나스 호텔 개최"
  articleCount?: number;   // 연관 기사 수 (조회 시 계산)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 기사 타입
export interface Article {
  _id?: string;
  title: string;
  keyword: string;
  interviewee?: string;    // 인터뷰이 (인터뷰 카테고리용)
  publishedAt: Date;
  category: ArticleCategory;
  tag: ArticleTag;
  thumbnailUrl?: string;
  articleUrl?: string;
  mediaName?: string;
  description?: string;
  eventName?: string;      // 연관 이벤트명 (예: "넥스트젠 세미나")
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 사용자 권한 타입
export interface UserPermissions {
  articles: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  seminars: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

// 기본 권한 (일반 사용자)
export const DEFAULT_PERMISSIONS: UserPermissions = {
  articles: { create: false, update: false, delete: false },
  seminars: { create: false, update: false, delete: false },
};

// 관리자 권한
export const ADMIN_PERMISSIONS: UserPermissions = {
  articles: { create: true, update: true, delete: true },
  seminars: { create: true, update: true, delete: true },
};

// 사용자 타입
export interface User {
  _id?: string;
  email: string;
  password?: string;
  name: string;
  is_admin: boolean;
  permissions?: UserPermissions;
  created_at: Date;
  updated_at?: Date;
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// JWT 페이로드
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  is_admin: boolean;
}

// 카테고리 옵션
export const categories: { id: ArticleCategory; name: string; icon: string }[] = [
  { id: "인터뷰", name: "인터뷰", icon: "🎤" },
  { id: "세미나 안내", name: "세미나 안내", icon: "📢" },
  { id: "소개 및 홍보", name: "소개 및 홍보", icon: "💡" },
];

// 태그 옵션
export const tags: { id: ArticleTag; name: string; color: string }[] = [
  { id: "단독기사", name: "단독기사", color: "bg-red-500" },
  { id: "특집기사", name: "특집기사", color: "bg-blue-500" },
  { id: "보도기사", name: "보도기사", color: "bg-green-500" },
];
