import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Resource } from "@/lib/resource-types";

// GET /api/resources/[id] - 자료 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<Resource>("resources");

    const resource = await collection.findOne({ _id: new ObjectId(id) });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: "자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...resource,
        _id: resource._id!.toString(),
      },
    });
  } catch (error) {
    console.error("GET /api/resources/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "자료를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/resources/[id] - 자료 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = await getDb();
    const collection = db.collection<Resource>("resources");

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };
    delete updateData._id;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        _id: result._id!.toString(),
      },
    });
  } catch (error) {
    console.error("PUT /api/resources/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "자료 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id] - 자료 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<Resource>("resources");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/resources/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "자료 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
