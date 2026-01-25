import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// 단일 이벤트 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const event = await db
      .collection("events")
      .findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 연관 기사 목록 조회
    const articles = await db
      .collection("articles")
      .find({ eventId: id })
      .sort({ isRepresentative: -1, publishedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        _id: event._id?.toString(),
        articles: articles.map((a) => ({ ...a, _id: a._id?.toString() })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return NextResponse.json(
      { success: false, error: "이벤트를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 이벤트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await request.json();

    const updateData = {
      title: body.title,
      date: new Date(body.date),
      category: body.category,
      keywords: body.keywords || [],
      description: body.description || "",
      updatedAt: new Date(),
    };

    const result = await db
      .collection("events")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { _id: id, ...updateData } });
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json(
      { success: false, error: "이벤트 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 이벤트 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // 연관 기사들의 eventId를 null로 설정
    await db
      .collection("articles")
      .updateMany({ eventId: id }, { $unset: { eventId: "", isRepresentative: "" } });

    const result = await db
      .collection("events")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "이벤트가 삭제되었습니다." });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json(
      { success: false, error: "이벤트 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
