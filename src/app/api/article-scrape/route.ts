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
    const keyword = extractKeywords(title, description);

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        thumbnailUrl,
        publishedAt,
        mediaName,
        keyword,
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

// 제목과 설명에서 검색용 키워드 추출 (5개 이내)
function extractKeywords(title: string, description: string): string {
  // 제외할 단어들 (불용어, 핵심키워드, 일반적인 단어)
  const stopWords = new Set([
    // 핵심 키워드 (자동 적용되므로 제외)
    "nh투자증권", "nh증권", "nh투자", "nh", "투자증권",
    // 조사, 접속사
    "의", "을", "를", "이", "가", "에", "와", "과", "로", "으로", "에서", "까지", "부터", "도", "만", "은", "는",
    // 일반적인 동사/형용사
    "있다", "없다", "하다", "되다", "한다", "했다", "된다", "됐다", "있는", "없는", "하는", "되는",
    // 일반적인 명사
    "것", "수", "등", "때", "중", "내", "후", "전", "위", "년", "월", "일", "억", "만", "원", "달러",
    // 뉴스 관련 일반 단어
    "기자", "뉴스", "속보", "단독", "특집", "인터뷰", "기사", "보도", "발표", "공개", "관련",
    // 기타 불용어
    "및", "또는", "그리고", "하지만", "그러나", "따라서", "때문에", "통해", "대한", "위한", "따른",
  ]);

  // 텍스트 결합 (제목 우선)
  const text = `${title} ${description}`.toLowerCase();

  // 특수문자 제거하고 단어 추출
  const words = text
    .replace(/[^\w\s가-힣]/g, " ")
    .split(/\s+/)
    .filter(word => word.length >= 2);

  // 키워드 후보 추출
  const keywordCandidates: Map<string, number> = new Map();

  for (const word of words) {
    // 불용어 제외
    if (stopWords.has(word)) continue;
    // 숫자만 있는 단어 제외
    if (/^\d+$/.test(word)) continue;
    // 너무 짧거나 긴 단어 제외
    if (word.length < 2 || word.length > 20) continue;

    const count = keywordCandidates.get(word) || 0;
    keywordCandidates.set(word, count + 1);
  }

  // 복합 키워드 추출 (인접한 2-3개 단어 조합)
  const titleWords = title
    .replace(/[^\w\s가-힣]/g, " ")
    .split(/\s+/)
    .filter(word => word.length >= 2);

  for (let i = 0; i < titleWords.length - 1; i++) {
    // 2단어 조합
    const twoWord = `${titleWords[i]} ${titleWords[i + 1]}`.toLowerCase();
    if (!Array.from(stopWords).some(sw => twoWord.includes(sw))) {
      const existing = keywordCandidates.get(twoWord) || 0;
      keywordCandidates.set(twoWord, existing + 2); // 복합어에 가중치
    }

    // 3단어 조합
    if (i < titleWords.length - 2) {
      const threeWord = `${titleWords[i]} ${titleWords[i + 1]} ${titleWords[i + 2]}`.toLowerCase();
      if (threeWord.length <= 15 && !Array.from(stopWords).some(sw => threeWord.includes(sw))) {
        const existing = keywordCandidates.get(threeWord) || 0;
        keywordCandidates.set(threeWord, existing + 3); // 3단어 조합에 더 높은 가중치
      }
    }
  }

  // 고유명사 패턴 추출 (대문자로 시작하는 영어, 따옴표 안의 단어 등)
  const properNounPatterns = [
    /["']([^"']+)["']/g, // 따옴표 안의 단어
    /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g, // 영어 고유명사
  ];

  for (const pattern of properNounPatterns) {
    let match;
    while ((match = pattern.exec(title)) !== null) {
      const noun = match[1].trim().toLowerCase();
      if (noun.length >= 2 && noun.length <= 20 && !stopWords.has(noun)) {
        const existing = keywordCandidates.get(noun) || 0;
        keywordCandidates.set(noun, existing + 3); // 고유명사에 가중치
      }
    }
  }

  // 점수순 정렬 후 상위 5개 선택
  const sortedKeywords = Array.from(keywordCandidates.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyword]) => keyword);

  // 중복 제거 (부분 문자열 관계인 경우 긴 것 우선)
  const finalKeywords: string[] = [];
  for (const kw of sortedKeywords) {
    const isSubstring = finalKeywords.some(
      existing => existing.includes(kw) || kw.includes(existing)
    );
    if (!isSubstring) {
      finalKeywords.push(kw);
    }
  }

  return finalKeywords.slice(0, 5).join(", ");
}
