import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// 이벤트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const year = searchParams.get("year");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (category && category !== "전체") {
      filter.category = category;
    }

    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const events = await db
      .collection("events")
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    // 각 이벤트별 기사 수 계산
    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const articleCount = await db
          .collection("articles")
          .countDocuments({ eventId: event._id.toString() });
        return {
          ...event,
          _id: event._id?.toString(),
          articleCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: eventsWithCount });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { success: false, error: "이벤트 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 이벤트 생성
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    const event = {
      title: body.title,
      date: new Date(body.date),
      category: body.category,
      keywords: body.keywords || [],
      description: body.description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: body.createdBy || "admin",
    };

    const result = await db.collection("events").insertOne(event);

    return NextResponse.json({
      success: true,
      data: { ...event, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { success: false, error: "이벤트 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
