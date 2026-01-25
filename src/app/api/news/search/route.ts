import { NextRequest, NextResponse } from "next/server";

// 네이버 뉴스 검색 API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.get("keywords");
    const dateFrom = searchParams.get("dateFrom"); // YYYY-MM-DD
    const dateTo = searchParams.get("dateTo"); // YYYY-MM-DD
    const display = searchParams.get("display") || "100"; // 결과 개수 (최대 100)
    const start = searchParams.get("start") || "1"; // 시작 위치
    const sort = searchParams.get("sort") || "sim"; // 정렬: sim(정확도순), date(최신순) - 과거 기사 검색을 위해 정확도순 기본

    if (!keywords) {
      return NextResponse.json(
        { success: false, error: "키워드가 필요합니다" },
        { status: 400 }
      );
    }

    // 네이버 API 키 확인
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "네이버 API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    // 키워드 파싱: NH투자증권/NH증권 (필수) + 나머지 (OR)
    const keywordList = keywords.split(",").map((k) => k.trim());
    const otherKeywords = keywordList.filter(
      (k) => k.toLowerCase() !== "nh투자증권" && k.toLowerCase() !== "nh증권"
    );

    // 검색 쿼리 생성
    // 네이버는 OR 연산자를 지원하지 않으므로 별도 검색 후 합침
    const queries: string[] = [];

    if (otherKeywords.length > 0) {
      // NH투자증권 + 키워드, NH증권 + 키워드 각각 검색
      for (const keyword of otherKeywords) {
        queries.push(`NH투자증권 ${keyword}`);
        queries.push(`NH증권 ${keyword}`);
      }
    } else {
      // 키워드가 없으면 NH투자증권, NH증권만 검색
      queries.push("NH투자증권");
      queries.push("NH증권");
    }

    console.log("검색 쿼리들:", queries);

    // 모든 쿼리 병렬 실행
    const fetchPromises = queries.map((query) =>
      fetch(
        `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}`,
        {
          headers: {
            "X-Naver-Client-Id": clientId,
            "X-Naver-Client-Secret": clientSecret,
          },
        }
      )
    );

    const responses = await Promise.all(fetchPromises);

    // 결과 합치기
    let allArticles: NewsArticle[] = [];

    for (const response of responses) {
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          const articles = data.items.map((item: NaverNewsItem) => ({
            title: decodeHtmlEntities(item.title.replace(/<[^>]*>/g, "")),
            link: item.originallink || item.link,
            pubDate: item.pubDate,
            source: extractSource(item.originallink || item.link),
            description: decodeHtmlEntities(item.description.replace(/<[^>]*>/g, "")),
          }));
          allArticles = allArticles.concat(articles);
        }
      }
    }

    // 날짜 필터링
    if (dateFrom || dateTo) {
      allArticles = allArticles.filter((article) => {
        const articleDate = new Date(article.pubDate);

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (articleDate < fromDate) return false;
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (articleDate > toDate) return false;
        }

        return true;
      });
    }

    // 중복 제거 (제목 기준)
    const uniqueArticles = allArticles.filter(
      (article, index, self) =>
        index === self.findIndex((a) => a.title === article.title)
    );

    // 날짜순 정렬 (최신순)
    uniqueArticles.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    return NextResponse.json({
      success: true,
      data: uniqueArticles,
      query: queries.join(" | "),
      total: uniqueArticles.length,
    });
  } catch (error) {
    console.error("뉴스 검색 오류:", error);
    return NextResponse.json(
      { success: false, error: "뉴스 검색에 실패했습니다" },
      { status: 500 }
    );
  }
}

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

function extractSource(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // 주요 언론사 매핑
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
    };
    return sourceMap[hostname] || hostname.replace("www.", "");
  } catch {
    return "알 수 없음";
  }
}

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
