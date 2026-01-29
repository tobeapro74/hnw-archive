import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireResourceAccess } from "@/lib/auth";

// GET /api/resources - 자료 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 권한 체크
    const authResult = await requireResourceAccess(request);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");
    const search = searchParams.get("search");

    const db = await getDb();
    const collection = db.collection("resources");

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = category;
    }

    if (subCategory) {
      // 보고서 "전문"은 "요약"이 아닌 모든 것
      if (category === "보고서" && subCategory === "전문") {
        filter.subCategory = { $ne: "요약" };
      } else {
        filter.subCategory = subCategory;
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { fileName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const resources = await collection
      .find(filter)
      .sort({ uploadedAt: -1 })
      .toArray();

    const result = resources.map((resource) => ({
      ...resource,
      _id: resource._id.toString(),
    }));

    // 캐싱 헤더 추가 (30초간 캐시, 백그라운드에서 갱신)
    return NextResponse.json(
      { success: true, data: result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json(
      { success: false, error: "자료 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/resources - 자료 생성
export async function POST(request: NextRequest) {
  try {
    // 권한 체크
    const authResult = await requireResourceAccess(request);
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.category || !body.fileName || !body.fileUrl || !body.fileType) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 회의록일 경우 서브카테고리 필수
    if (body.category === "회의록" && !body.subCategory) {
      return NextResponse.json(
        { success: false, error: "회의록은 서브카테고리(내부/외부)가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("resources");

    const now = new Date();
    const newResource = {
      title: body.title,
      category: body.category,
      subCategory: body.subCategory,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      fileSize: body.fileSize || 0,
      description: body.description,
      uploadedAt: now,
      uploadedBy: "system",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newResource);

    return NextResponse.json({
      success: true,
      data: {
        ...newResource,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("POST /api/resources error:", error);
    return NextResponse.json(
      { success: false, error: "자료 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
