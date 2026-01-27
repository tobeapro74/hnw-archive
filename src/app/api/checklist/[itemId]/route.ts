import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requirePermission } from "@/lib/auth";
import { UpdateChecklistItemRequest } from "@/lib/seminar-types";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// PATCH /api/checklist/[itemId] - 체크리스트 항목 수정 (완료 토글 포함)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // 권한 확인
  const authResult = await requirePermission(request, 'seminars', 'update');
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { itemId } = await params;
    const body: UpdateChecklistItemRequest = await request.json();

    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json(
        { error: "유효하지 않은 체크리스트 항목 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("checklist_items");

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {};

    if (body.isCompleted !== undefined) {
      updateFields.isCompleted = body.isCompleted;
      if (body.isCompleted) {
        updateFields.completedAt = new Date();
      } else {
        updateFields.completedAt = null;
        updateFields.completedBy = null;
      }
    }

    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.priority !== undefined) updateFields.priority = body.priority;
    if (body.dueOffset !== undefined) updateFields.dueOffset = body.dueOffset;
    if (body.order !== undefined) updateFields.order = body.order;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "수정할 필드가 없습니다." },
        { status: 400 }
      );
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(itemId) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "체크리스트 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      _id: result._id.toString(),
    });
  } catch (error) {
    console.error("PATCH /api/checklist/[itemId] error:", error);
    return NextResponse.json(
      { error: "체크리스트 항목 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/checklist/[itemId] - 체크리스트 항목 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 권한 확인
  const authResult = await requirePermission(request, 'seminars', 'delete');
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { itemId } = await params;

    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json(
        { error: "유효하지 않은 체크리스트 항목 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("checklist_items");

    const result = await collection.deleteOne({ _id: new ObjectId(itemId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "체크리스트 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "체크리스트 항목이 삭제되었습니다." });
  } catch (error) {
    console.error("DELETE /api/checklist/[itemId] error:", error);
    return NextResponse.json(
      { error: "체크리스트 항목 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
