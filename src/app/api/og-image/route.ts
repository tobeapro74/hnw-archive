import { NextRequest, NextResponse } from "next/server";

// OG 이미지 추출 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL이 필요합니다." },
        { status: 400 }
      );
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 URL입니다." },
        { status: 400 }
      );
    }

    // 웹페이지 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OGImageBot/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "페이지를 불러올 수 없습니다." },
        { status: 400 }
      );
    }

    const html = await response.text();

    // OG 이미지 추출
    const ogImage = extractOgImage(html);

    // OG 이미지가 없으면 첫 번째 이미지 태그에서 추출 시도
    const fallbackImage = ogImage || extractFirstImage(html, url);

    if (!fallbackImage) {
      return NextResponse.json({
        success: true,
        data: { ogImage: null, message: "이미지를 찾을 수 없습니다." },
      });
    }

    // 상대 경로를 절대 경로로 변환
    const absoluteImageUrl = resolveUrl(fallbackImage, url);

    return NextResponse.json({
      success: true,
      data: { ogImage: absoluteImageUrl },
    });
  } catch (error) {
    console.error("Failed to extract OG image:", error);
    return NextResponse.json(
      { success: false, error: "OG 이미지 추출에 실패했습니다." },
      { status: 500 }
    );
  }
}

// OG 이미지 메타 태그 추출
function extractOgImage(html: string): string | null {
  // og:image 메타 태그 패턴들
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']og:image["']/i,
    // Twitter 카드 이미지
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// 첫 번째 이미지 태그 추출 (fallback)
function extractFirstImage(html: string, baseUrl: string): string | null {
  // 본문 내 이미지 추출 (작은 아이콘 제외)
  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgPattern.exec(html)) !== null) {
    const src = match[1];
    // 작은 아이콘이나 트래킹 픽셀 제외
    if (
      !src.includes("icon") &&
      !src.includes("logo") &&
      !src.includes("pixel") &&
      !src.includes("1x1") &&
      !src.includes("tracking") &&
      !src.endsWith(".gif") &&
      !src.includes("data:image")
    ) {
      return src;
    }
  }

  return null;
}

// 상대 URL을 절대 URL로 변환
function resolveUrl(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  try {
    const base = new URL(baseUrl);

    if (imageUrl.startsWith("//")) {
      return `${base.protocol}${imageUrl}`;
    }

    if (imageUrl.startsWith("/")) {
      return `${base.origin}${imageUrl}`;
    }

    // 상대 경로
    const basePath = base.pathname.substring(0, base.pathname.lastIndexOf("/") + 1);
    return `${base.origin}${basePath}${imageUrl}`;
  } catch {
    return imageUrl;
  }
}
