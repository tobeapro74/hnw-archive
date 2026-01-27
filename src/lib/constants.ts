import { Mic, Megaphone, Lightbulb, Zap, Star, FileText } from "lucide-react";
import { ArticleCategory, ArticleTag } from "./types";

// 카테고리별 색상
export const categoryColors: Record<ArticleCategory, string> = {
  "인터뷰": "purple",
  "세미나 안내": "orange",
  "소개 및 홍보": "cyan",
};

export const categoryBgColors: Record<ArticleCategory, string> = {
  "인터뷰": "bg-purple-500",
  "세미나 안내": "bg-orange-500",
  "소개 및 홍보": "bg-cyan-500",
};

export const categoryTextColors: Record<ArticleCategory, string> = {
  "인터뷰": "text-purple-500",
  "세미나 안내": "text-orange-500",
  "소개 및 홍보": "text-cyan-500",
};

export const categoryLightBgColors: Record<ArticleCategory, string> = {
  "인터뷰": "bg-purple-100",
  "세미나 안내": "bg-orange-100",
  "소개 및 홍보": "bg-cyan-100",
};

// 태그별 색상
export const tagColors: Record<ArticleTag, string> = {
  "단독기사": "red",
  "특집기사": "indigo",
  "보도기사": "green",
};

export const tagBgColors: Record<ArticleTag, string> = {
  "단독기사": "bg-red-500",
  "특집기사": "bg-indigo-500",
  "보도기사": "bg-green-500",
};

export const tagTextColors: Record<ArticleTag, string> = {
  "단독기사": "text-red-500",
  "특집기사": "text-indigo-500",
  "보도기사": "text-green-500",
};

export const tagLightBgColors: Record<ArticleTag, string> = {
  "단독기사": "bg-red-100",
  "특집기사": "bg-indigo-100",
  "보도기사": "bg-green-100",
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
  "인터뷰": "#8b5cf6", // purple-500
  "세미나 안내": "#f97316", // orange-500
  "소개 및 홍보": "#06b6d4", // cyan-500
};

export const tagHexColors: Record<ArticleTag, string> = {
  "단독기사": "#ef4444", // red-500
  "특집기사": "#6366f1", // indigo-500
  "보도기사": "#22c55e", // green-500
};
