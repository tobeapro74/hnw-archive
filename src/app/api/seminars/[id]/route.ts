import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requirePermission } from "@/lib/auth";
import {
  ChecklistItem,
  UpdateSeminarRequest,
  SeminarWithChecklist,
  calculateProgress,
  calculatePhaseProgress,
} from "@/lib/seminar-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/seminars/[id] - 세미나 상세 조회 (+ 체크리스트)
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 세미나 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const seminarsCollection = db.collection("seminars");
    const checklistCollection = db.collection("checklist_items");

    const seminar = await seminarsCollection.findOne({ _id: new ObjectId(id) });

    if (!seminar) {
      return NextResponse.json(
        { error: "세미나를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 체크리스트 조회
    const checklistItems = await checklistCollection
      .find({ seminarId: id })
      .sort({ phase: 1, order: 1 })
      .toArray();

    // 진행률 계산
    const progress = calculateProgress(checklistItems as unknown as ChecklistItem[]);
    const phaseProgress = calculatePhaseProgress(checklistItems as unknown as ChecklistItem[]);

    const result: SeminarWithChecklist = {
      ...seminar,
      _id: seminar._id!.toString(),
      checklist: checklistItems.map((item) => ({
        ...item,
        _id: item._id!.toString(),
      })),
      progress,
      phaseProgress,
    } as SeminarWithChecklist;

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/seminars/[id] error:", error);
    return NextResponse.json(
      { error: "세미나 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/seminars/[id] - 세미나 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 권한 확인
  const authResult = await requirePermission(request, 'seminars', 'update');
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body: UpdateSeminarRequest = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 세미나 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("seminars");

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateFields.title = body.title;
    if (body.date !== undefined) updateFields.date = new Date(body.date);
    if (body.location !== undefined) updateFields.location = body.location;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.corporateType !== undefined) updateFields.corporateType = body.corporateType;
    if (body.targetType !== undefined) updateFields.targetType = body.targetType;
    if (body.expectedAttendees !== undefined) updateFields.expectedAttendees = body.expectedAttendees;
    if (body.actualAttendees !== undefined) updateFields.actualAttendees = body.actualAttendees;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.parkingSupport !== undefined) updateFields.parkingSupport = body.parkingSupport;
    if (body.status !== undefined) updateFields.status = body.status;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "세미나를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      _id: result._id.toString(),
    });
  } catch (error) {
    console.error("PUT /api/seminars/[id] error:", error);
    return NextResponse.json(
      { error: "세미나 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/seminars/[id] - 세미나 삭제 (+ 체크리스트 삭제)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 권한 확인
  const authResult = await requirePermission(request, 'seminars', 'delete');
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 세미나 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const seminarsCollection = db.collection("seminars");
    const checklistCollection = db.collection("checklist_items");

    // 세미나 삭제
    const result = await seminarsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "세미나를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 연관된 체크리스트 항목 삭제
    await checklistCollection.deleteMany({ seminarId: id });

    return NextResponse.json({ success: true, message: "세미나가 삭제되었습니다." });
  } catch (error) {
    console.error("DELETE /api/seminars/[id] error:", error);
    return NextResponse.json(
      { error: "세미나 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
