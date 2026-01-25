import { NextRequest, NextResponse } from "next/server";

// 기사 스크래핑 API - URL에서 제목, 이미지, 설명, 발행일 추출
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
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 URL입니다." },
        { status: 400 }
      );
    }

    // 웹페이지 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(15000), // 15초 타임아웃
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "페이지를 불러올 수 없습니다." },
        { status: 400 }
      );
    }

    const html = await response.text();

    // 메타데이터 추출
    const title = extractTitle(html);
    const description = extractDescription(html);
    const thumbnailUrl = extractImage(html, url);
    const publishedAt = extractPublishedDate(html);
    const mediaName = extractMediaName(parsedUrl.hostname);

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        thumbnailUrl,
        publishedAt,
        mediaName,
        articleUrl: url,
      },
    });
  } catch (error) {
    console.error("Failed to scrape article:", error);
    return NextResponse.json(
      { success: false, error: "기사 스크래핑에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 제목 추출
function extractTitle(html: string): string {
  // og:title 우선
  const ogTitlePatterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
  ];

  for (const pattern of ogTitlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  // title 태그
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    // 언론사 이름 부분 제거 (예: "기사제목 - 한국경제" -> "기사제목")
    let title = titleMatch[1].trim();
    const separators = [" - ", " | ", " :: ", " – ", " — "];
    for (const sep of separators) {
      if (title.includes(sep)) {
        title = title.split(sep)[0].trim();
        break;
      }
    }
    return decodeHtmlEntities(title);
  }

  return "";
}

// 설명 추출
function extractDescription(html: string): string {
  // og:description 우선
  const ogDescPatterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
  ];

  for (const pattern of ogDescPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  // meta description
  const descPatterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ];

  for (const pattern of descPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return "";
}

// 이미지 추출
function extractImage(html: string, baseUrl: string): string {
  // og:image
  const ogImagePatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of ogImagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return resolveUrl(match[1], baseUrl);
    }
  }

  return "";
}

// 발행일 추출
function extractPublishedDate(html: string): string | null {
  // article:published_time
  const publishedPatterns = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
    // datePublished (JSON-LD)
    /"datePublished"\s*:\s*"([^"]+)"/i,
    // 일반적인 date 메타태그
    /<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']date["']/i,
    /<meta[^>]+name=["']article:published["'][^>]+content=["']([^"']+)["']/i,
    // pubdate
    /<meta[^>]+name=["']pubdate["'][^>]+content=["']([^"']+)["']/i,
  ];

  for (const pattern of publishedPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        continue;
      }
    }
  }

  // 한국 뉴스 사이트의 날짜 형식 (예: 2025.01.26 12:30)
  const koreanDatePattern =
    /(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})\s*(\d{1,2}:\d{2})?/;
  const koreanMatch = html.match(koreanDatePattern);
  if (koreanMatch) {
    const [, year, month, day, time] = koreanMatch;
    const dateStr = time
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${time}:00`
      : `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // ignore
    }
  }

  return null;
}

// 언론사 추출
function extractMediaName(hostname: string): string {
  const cleanHost = hostname.toLowerCase().replace("www.", "");

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
    "yna.co.kr": "연합뉴스",
    "newsis.com": "뉴시스",
    "news1.kr": "뉴스1",
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
    "news.heraldcorp.com": "헤럴드경제",
    "heraldcorp.com": "헤럴드경제",
    "inews24.com": "아이뉴스24",
    "zdnet.co.kr": "ZDNet Korea",
    "theguru.co.kr": "더구루",
    "nocutnews.co.kr": "노컷뉴스",
    "newsen.com": "뉴스엔",
    "e-today.co.kr": "이투데이",
    "news.einfomax.co.kr": "연합인포맥스",
    "wowtv.co.kr": "한국경제TV",
    "viva100.com": "브릿지경제",
    "digitaltoday.co.kr": "디지털투데이",
    "joseilbo.com": "조세일보",
    "thekpm.com": "한국정경신문",
  };

  // 정확한 매칭
  if (mediaMap[cleanHost]) {
    return mediaMap[cleanHost];
  }

  // 부분 매칭
  for (const [domain, media] of Object.entries(mediaMap)) {
    if (cleanHost.includes(domain.replace("www.", ""))) {
      return media;
    }
  }

  return "";
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

    const basePath = base.pathname.substring(
      0,
      base.pathname.lastIndexOf("/") + 1
    );
    return `${base.origin}${basePath}${imageUrl}`;
  } catch {
    return imageUrl;
  }
}

// HTML 엔티티 디코딩
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}
