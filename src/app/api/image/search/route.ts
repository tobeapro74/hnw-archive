import { NextRequest, NextResponse } from "next/server";

// 네이버 이미지 검색 API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const display = searchParams.get("display") || "20"; // 결과 개수 (최대 100)
    const start = searchParams.get("start") || "1"; // 시작 위치
    const sort = searchParams.get("sort") || "sim"; // 정렬: sim(정확도순), date(최신순)
    const filter = searchParams.get("filter") || "all"; // 크기: all, large, medium, small

    if (!query) {
      return NextResponse.json(
        { success: false, error: "검색어가 필요합니다" },
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

    console.log("이미지 검색 쿼리:", query);

    // 네이버 이미지 검색 API 호출
    const response = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}&filter=${filter}`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("네이버 API 오류:", errorText);
      return NextResponse.json(
        { success: false, error: "이미지 검색에 실패했습니다" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 결과 가공
    const images: ImageResult[] = data.items.map((item: NaverImageItem) => ({
      title: decodeHtmlEntities(item.title.replace(/<[^>]*>/g, "")),
      link: item.link, // 이미지 원본 URL
      thumbnail: item.thumbnail, // 썸네일 URL
      sizeheight: item.sizeheight,
      sizewidth: item.sizewidth,
    }));

    return NextResponse.json({
      success: true,
      data: images,
      query: query,
      total: data.total,
      display: data.display,
      start: data.start,
    });
  } catch (error) {
    console.error("이미지 검색 오류:", error);
    return NextResponse.json(
      { success: false, error: "이미지 검색에 실패했습니다" },
      { status: 500 }
    );
  }
}

interface NaverImageItem {
  title: string;
  link: string;
  thumbnail: string;
  sizeheight: string;
  sizewidth: string;
}

interface ImageResult {
  title: string;
  link: string;
  thumbnail: string;
  sizeheight: string;
  sizewidth: string;
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
