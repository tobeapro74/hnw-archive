import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { UpdateSeminarRequestInput } from "@/lib/seminar-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/seminar-requests/[id] - 비정기 세미나 요청 상세 조회
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 요청 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("seminar_requests");

    const seminarRequest = await collection.findOne({ _id: new ObjectId(id) });

    if (!seminarRequest) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...seminarRequest,
      _id: seminarRequest._id!.toString(),
    });
  } catch (error) {
    console.error("GET /api/seminar-requests/[id] error:", error);
    return NextResponse.json(
      { error: "요청 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/seminar-requests/[id] - 비정기 세미나 요청 수정
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateSeminarRequestInput = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 요청 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("seminar_requests");

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.requestingCenter !== undefined) updateFields.requestingCenter = body.requestingCenter;
    if (body.requestLocation !== undefined) updateFields.requestLocation = body.requestLocation;
    if (body.targetCorporation !== undefined) updateFields.targetCorporation = body.targetCorporation;
    if (body.minAttendees !== undefined) updateFields.minAttendees = body.minAttendees;
    if (body.maxAttendees !== undefined) updateFields.maxAttendees = body.maxAttendees;
    if (body.requestedDate !== undefined) updateFields.requestedDate = new Date(body.requestedDate);
    if (body.topic !== undefined) updateFields.topic = body.topic;
    if (body.topicDetail !== undefined) updateFields.topicDetail = body.topicDetail;
    if (body.receiver !== undefined) updateFields.receiver = body.receiver;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.seminarId !== undefined) updateFields.seminarId = body.seminarId;
    if (body.notes !== undefined) updateFields.notes = body.notes;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      _id: result._id.toString(),
    });
  } catch (error) {
    console.error("PUT /api/seminar-requests/[id] error:", error);
    return NextResponse.json(
      { error: "요청 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/seminar-requests/[id] - 비정기 세미나 요청 삭제
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 요청 ID입니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("seminar_requests");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "요청이 삭제되었습니다." });
  } catch (error) {
    console.error("DELETE /api/seminar-requests/[id] error:", error);
    return NextResponse.json(
      { error: "요청 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
