import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  ChecklistItem,
  CreateChecklistItemRequest,
} from "@/lib/seminar-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/seminars/[id]/checklist - 체크리스트 조회
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

    // 세미나 존재 여부 확인
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

    return NextResponse.json(
      checklistItems.map((item) => ({
        ...item,
        _id: item._id!.toString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/seminars/[id]/checklist error:", error);
    return NextResponse.json(
      { error: "체크리스트를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/seminars/[id]/checklist - 체크리스트 항목 추가
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: CreateChecklistItemRequest = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "유효하지 않은 세미나 ID입니다." },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    if (!body.phase || !body.title) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const seminarsCollection = db.collection("seminars");
    const checklistCollection = db.collection("checklist_items");

    // 세미나 존재 여부 확인
    const seminar = await seminarsCollection.findOne({ _id: new ObjectId(id) });
    if (!seminar) {
      return NextResponse.json(
        { error: "세미나를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 같은 단계의 마지막 order 찾기
    const lastItem = await checklistCollection
      .find({ seminarId: id, phase: body.phase })
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const nextOrder = lastItem.length > 0 ? (lastItem[0] as unknown as ChecklistItem).order + 1 : 1;

    const newItem: Omit<ChecklistItem, "_id"> = {
      seminarId: id,
      phase: body.phase,
      title: body.title,
      description: body.description,
      isCompleted: false,
      priority: body.priority || 2,
      dueOffset: body.dueOffset,
      order: nextOrder,
    };

    const result = await checklistCollection.insertOne(newItem);

    return NextResponse.json({
      ...newItem,
      _id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("POST /api/seminars/[id]/checklist error:", error);
    return NextResponse.json(
      { error: "체크리스트 항목 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}
