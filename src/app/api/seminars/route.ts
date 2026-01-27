import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requirePermission } from "@/lib/auth";
import {
  Seminar,
  ChecklistItem,
  CreateSeminarRequest,
  defaultChecklistTemplates,
} from "@/lib/seminar-types";

// GET /api/seminars - 세미나 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const seminarType = searchParams.get("seminarType");

    const db = await getDb();
    const collection = db.collection<Seminar>("seminars");

    // 필터 조건 구성
    const filter: Record<string, unknown> = {};

    if (year) {
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (month && year) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month) - 1; // 0-indexed
      const startDate = new Date(yearNum, monthNum, 1);
      const endDate = new Date(yearNum, monthNum + 1, 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (seminarType) {
      filter.seminarType = seminarType;
    }

    const seminars = await collection
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    // 각 세미나의 체크리스트 진행률 계산
    const checklistCollection = db.collection<ChecklistItem>("checklist_items");
    const seminarsWithProgress = await Promise.all(
      seminars.map(async (seminar) => {
        const checklistItems = await checklistCollection
          .find({ seminarId: seminar._id!.toString() })
          .toArray();

        const total = checklistItems.length;
        const completed = checklistItems.filter((item) => item.isCompleted).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...seminar,
          _id: seminar._id!.toString(),
          progress: { total, completed, percentage },
        };
      })
    );

    return NextResponse.json(seminarsWithProgress);
  } catch (error) {
    console.error("GET /api/seminars error:", error);
    return NextResponse.json(
      { error: "세미나 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/seminars - 세미나 생성 (+ 기본 체크리스트 자동 생성)
export async function POST(request: NextRequest) {
  // 권한 확인
  const authResult = await requirePermission(request, 'seminars', 'create');
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body: CreateSeminarRequest = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.date || !body.location || !body.category) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const seminarsCollection = db.collection<Seminar>("seminars");
    const checklistCollection = db.collection<ChecklistItem>("checklist_items");

    const now = new Date();
    const newSeminar: Omit<Seminar, "_id"> = {
      title: body.title,
      seminarType: body.seminarType || "정기",
      date: new Date(body.date),
      location: body.location,
      category: body.category,
      corporateType: body.corporateType,
      targetType: body.targetType,
      expectedAttendees: body.expectedAttendees,
      description: body.description,
      status: "준비중",
      requestId: body.requestId,
      createdAt: now,
      updatedAt: now,
    };

    // 세미나 생성
    const result = await seminarsCollection.insertOne(newSeminar as Seminar);
    const seminarId = result.insertedId.toString();

    // 기본 체크리스트 항목 생성
    const checklistItems: Omit<ChecklistItem, "_id">[] = defaultChecklistTemplates.map(
      (template) => ({
        seminarId,
        phase: template.phase,
        title: template.title,
        description: template.description,
        isCompleted: false,
        priority: template.priority,
        dueOffset: template.dueOffset,
        order: template.order,
      })
    );

    if (checklistItems.length > 0) {
      await checklistCollection.insertMany(checklistItems as ChecklistItem[]);
    }

    return NextResponse.json({
      ...newSeminar,
      _id: seminarId,
      progress: { total: checklistItems.length, completed: 0, percentage: 0 },
    });
  } catch (error) {
    console.error("POST /api/seminars error:", error);
    return NextResponse.json(
      { error: "세미나 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
