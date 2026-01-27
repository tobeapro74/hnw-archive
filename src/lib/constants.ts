import { Mic, Megaphone, Lightbulb, Zap, Star, FileText } from "lucide-react";
import { ArticleCategory, ArticleTag } from "./types";

// 카테고리별 색상
export const categoryColors: Record<ArticleCategory, string> = {
  "인터뷰": "rose",
  "세미나 안내": "amber",
  "소개 및 홍보": "teal",
};

export const categoryBgColors: Record<ArticleCategory, string> = {
  "인터뷰": "bg-rose-500",
  "세미나 안내": "bg-amber-500",
  "소개 및 홍보": "bg-teal-500",
};

export const categoryTextColors: Record<ArticleCategory, string> = {
  "인터뷰": "text-rose-600",
  "세미나 안내": "text-amber-600",
  "소개 및 홍보": "text-teal-600",
};

export const categoryLightBgColors: Record<ArticleCategory, string> = {
  "인터뷰": "bg-rose-50",
  "세미나 안내": "bg-amber-50",
  "소개 및 홍보": "bg-teal-50",
};

// 태그별 색상
export const tagColors: Record<ArticleTag, string> = {
  "단독기사": "rose",
  "특집기사": "violet",
  "보도기사": "emerald",
};

export const tagBgColors: Record<ArticleTag, string> = {
  "단독기사": "bg-rose-500",
  "특집기사": "bg-violet-500",
  "보도기사": "bg-emerald-500",
};

export const tagTextColors: Record<ArticleTag, string> = {
  "단독기사": "text-rose-600",
  "특집기사": "text-violet-600",
  "보도기사": "text-emerald-600",
};

export const tagLightBgColors: Record<ArticleTag, string> = {
  "단독기사": "bg-rose-50",
  "특집기사": "bg-violet-50",
  "보도기사": "bg-emerald-50",
};

// 카테고리별 아이콘
export const categoryIcons: Record<ArticleCategory, typeof Mic> = {
  "인터뷰": Mic,
  "세미나 안내": Megaphone,
  "소개 및 홍보": Lightbulb,
};

// 태그별 아이콘
export const tagIcons: Record<ArticleTag, typeof Zap> = {
  "단독기사": Zap,
  "특집기사": Star,
  "보도기사": FileText,
};

// 차트용 HEX 색상
export const categoryHexColors: Record<ArticleCategory, string> = {
  "인터뷰": "#f43f5e", // rose-500
  "세미나 안내": "#f59e0b", // amber-500
  "소개 및 홍보": "#14b8a6", // teal-500
};

export const tagHexColors: Record<ArticleTag, string> = {
  "단독기사": "#f43f5e", // rose-500
  "특집기사": "#8b5cf6", // violet-500
  "보도기사": "#10b981", // emerald-500
};
