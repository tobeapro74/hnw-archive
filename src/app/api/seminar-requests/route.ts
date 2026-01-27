import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requirePermission } from "@/lib/auth";
import {
  SeminarRequest,
  CreateSeminarRequestInput,
} from "@/lib/seminar-types";

// GET /api/seminar-requests - 비정기 세미나 요청 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const db = await getDb();
    const collection = db.collection<SeminarRequest>("seminar_requests");

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (year) {
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);
      filter.requestedDate = { $gte: startDate, $lt: endDate };
    }

    if (month && year) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month) - 1;
      const startDate = new Date(yearNum, monthNum, 1);
      const endDate = new Date(yearNum, monthNum + 1, 1);
      filter.requestedDate = { $gte: startDate, $lt: endDate };
    }

    const requests = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      requests.map((req) => ({
        ...req,
        _id: req._id!.toString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/seminar-requests error:", error);
    return NextResponse.json(
      { error: "비정기 세미나 요청 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/seminar-requests - 비정기 세미나 요청 생성
export async function POST(request: NextRequest) {
  // 권한 확인
  const authResult = await requirePermission(request, 'seminars', 'create');
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body: CreateSeminarRequestInput = await request.json();

    // 필수 필드 검증
    if (
      !body.requestingCenter ||
      !body.requestLocation ||
      !body.targetCorporation ||
      !body.requestedDate ||
      !body.topics ||
      body.topics.length === 0 ||
      !body.receiver
    ) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection<SeminarRequest>("seminar_requests");

    const now = new Date();
    const newRequest: Omit<SeminarRequest, "_id"> = {
      requestingCenter: body.requestingCenter,
      requestLocation: body.requestLocation,
      targetCorporation: body.targetCorporation,
      minAttendees: body.minAttendees || 0,
      maxAttendees: body.maxAttendees || 0,
      requestedDate: new Date(body.requestedDate),
      topics: body.topics,
      topicDetail: body.topicDetail,
      receiver: body.receiver,
      centerContact: body.centerContact,
      status: "요청접수",
      notes: body.notes,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newRequest as SeminarRequest);

    return NextResponse.json({
      ...newRequest,
      _id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("POST /api/seminar-requests error:", error);
    return NextResponse.json(
      { error: "비정기 세미나 요청 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
