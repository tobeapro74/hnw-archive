import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { Schedule, UpdateScheduleRequest } from "@/lib/schedule-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/schedules/[id] - 일정 상세 조회
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 일정 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("schedules");

    const schedule = await collection.findOne({ _id: new ObjectId(id) });

    if (!schedule) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...schedule,
      _id: schedule._id!.toString(),
    });
  } catch (error) {
    console.error("GET /api/schedules/[id] error:", error);
    return NextResponse.json(
      { error: "일정 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/schedules/[id] - 일정 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 로그인 확인
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body: UpdateScheduleRequest = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 일정 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("schedules");

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.category !== undefined) updateFields.category = body.category;
    if (body.date !== undefined) updateFields.date = new Date(body.date);
    if (body.time !== undefined) updateFields.time = body.time;
    if (body.location !== undefined) updateFields.location = body.location;
    if (body.meetingType !== undefined) updateFields.meetingType = body.meetingType;
    if (body.meetingTopic !== undefined) updateFields.meetingTopic = body.meetingTopic;
    if (body.outingType !== undefined) updateFields.outingType = body.outingType;
    if (body.center !== undefined) updateFields.center = body.center;
    if (body.rmName !== undefined) updateFields.rmName = body.rmName;
    if (body.contact !== undefined) updateFields.contact = body.contact;
    if (body.customerName !== undefined) updateFields.customerName = body.customerName;
    if (body.customerInfo !== undefined) updateFields.customerInfo = body.customerInfo;
    if (body.outingTopic !== undefined) updateFields.outingTopic = body.outingTopic;
    if (body.preparationItems !== undefined) updateFields.preparationItems = body.preparationItems;
    if (body.etcTopic !== undefined) updateFields.etcTopic = body.etcTopic;
    if (body.etcDescription !== undefined) updateFields.etcDescription = body.etcDescription;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      _id: result._id.toString(),
    });
  } catch (error) {
    console.error("PUT /api/schedules/[id] error:", error);
    return NextResponse.json(
      { error: "일정 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - 일정 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 로그인 확인
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 일정 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("schedules");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "일정이 삭제되었습니다." });
  } catch (error) {
    console.error("DELETE /api/schedules/[id] error:", error);
    return NextResponse.json(
      { error: "일정 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
