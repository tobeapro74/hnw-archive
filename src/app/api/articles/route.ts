import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// 기사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const keyword = searchParams.get("keyword");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (category && category !== "전체") {
      filter.category = category;
    }

    if (tag && tag !== "전체") {
      filter.tag = tag;
    }

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { keyword: { $regex: keyword, $options: "i" } },
        { mediaName: { $regex: keyword, $options: "i" } },
      ];
    }

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.publishedAt = { $gte: startDate, $lte: endDate };
    }

    const articles = await db
      .collection("articles")
      .find(filter)
      .sort({ publishedAt: -1 })
      .toArray();

    // ObjectId를 string으로 변환
    const result = articles.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { success: false, error: "기사 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 기사 생성
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    const article = {
      title: body.title,
      keyword: body.keyword,
      publishedAt: new Date(body.publishedAt),
      category: body.category,
      tag: body.tag,
      thumbnailUrl: body.thumbnailUrl || "",
      articleUrl: body.articleUrl || "",
      mediaName: body.mediaName || "",
      description: body.description || "",
      eventName: body.eventName || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: body.createdBy || "admin",
    };

    const result = await db.collection("articles").insertOne(article);

    return NextResponse.json({
      success: true,
      data: { ...article, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error("Failed to create article:", error);
    return NextResponse.json(
      { success: false, error: "기사 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
