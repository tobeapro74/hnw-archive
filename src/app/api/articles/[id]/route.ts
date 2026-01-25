import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// 단일 기사 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const article = await db
      .collection("articles")
      .findOne({ _id: new ObjectId(id) });

    if (!article) {
      return NextResponse.json(
        { success: false, error: "기사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...article, _id: article._id?.toString() }
    });
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return NextResponse.json(
      { success: false, error: "기사를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 기사 수정
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
      keyword: body.keyword,
      publishedAt: new Date(body.publishedAt),
      category: body.category,
      tag: body.tag,
      thumbnailUrl: body.thumbnailUrl || "",
      articleUrl: body.articleUrl || "",
      mediaName: body.mediaName || "",
      description: body.description || "",
      eventName: body.eventName || "",
      updatedAt: new Date(),
    };

    const result = await db
      .collection("articles")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "기사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { _id: id, ...updateData } });
  } catch (error) {
    console.error("Failed to update article:", error);
    return NextResponse.json(
      { success: false, error: "기사 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 기사 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const result = await db
      .collection("articles")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "기사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "기사가 삭제되었습니다." });
  } catch (error) {
    console.error("Failed to delete article:", error);
    return NextResponse.json(
      { success: false, error: "기사 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
