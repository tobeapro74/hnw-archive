import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// GET - 인덱스 생성 (성능 최적화)
export async function GET() {
  try {
    const db = await getDb();
    const results: Record<string, string> = {};

    // seminars 컬렉션 인덱스
    const seminars = db.collection('seminars');
    await seminars.createIndex({ date: -1 }, { background: true });
    await seminars.createIndex({ category: 1, status: 1 }, { background: true });
    await seminars.createIndex({ seminarType: 1 }, { background: true });
    results.seminars = 'date, category+status, seminarType 인덱스 생성 완료';

    // checklist_items 컬렉션 인덱스
    const checklist = db.collection('checklist_items');
    await checklist.createIndex({ seminarId: 1 }, { background: true });
    results.checklist_items = 'seminarId 인덱스 생성 완료';

    // articles 컬렉션 인덱스
    const articles = db.collection('articles');
    await articles.createIndex({ publishedAt: -1 }, { background: true });
    await articles.createIndex({ category: 1 }, { background: true });
    await articles.createIndex({ tag: 1 }, { background: true });
    await articles.createIndex({ eventId: 1 }, { background: true });
    results.articles = 'publishedAt, category, tag, eventId 인덱스 생성 완료';

    // seminar_requests 컬렉션 인덱스
    const requests = db.collection('seminar_requests');
    await requests.createIndex({ requestedDate: -1 }, { background: true });
    await requests.createIndex({ status: 1 }, { background: true });
    results.seminar_requests = 'requestedDate, status 인덱스 생성 완료';

    // events 컬렉션 인덱스
    const events = db.collection('events');
    await events.createIndex({ date: -1 }, { background: true });
    results.events = 'date 인덱스 생성 완료';

    // resources 컬렉션 인덱스
    const resources = db.collection('resources');
    await resources.createIndex({ category: 1, subCategory: 1 }, { background: true });
    await resources.createIndex({ uploadedAt: -1 }, { background: true });
    results.resources = 'category+subCategory, uploadedAt 인덱스 생성 완료';

    return NextResponse.json({
      success: true,
      message: '모든 인덱스 생성 완료',
      indexes: results,
    });
  } catch (error) {
    console.error('Index creation error:', error);
    return NextResponse.json(
      { error: 'Index creation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - 데이터 마이그레이션 (일회성 작업)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, oldValue, newValue, collection, field, email } = body;

    const db = await getDb();

    // 사용자 관리자 승격
    if (action === 'make_admin' && email) {
      const result = await db.collection('users').updateOne(
        { email },
        { $set: { is_admin: true } }
      );
      return NextResponse.json({
        success: true,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      });
    }

    // 부분 문자열 교체 (fileName 등에서 사용)
    if (action === 'replace_substring') {
      if (!oldValue || !newValue || !collection || !field) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // 해당 필드에 oldValue를 포함하는 문서들 찾기
      const docs = await db.collection(collection)
        .find({ [field]: { $regex: oldValue } })
        .toArray();

      let modifiedCount = 0;
      for (const doc of docs) {
        const newFieldValue = (doc[field] as string).replace(new RegExp(oldValue, 'g'), newValue);
        await db.collection(collection).updateOne(
          { _id: doc._id },
          { $set: { [field]: newFieldValue } }
        );
        modifiedCount++;
      }

      return NextResponse.json({
        success: true,
        matched: docs.length,
        modified: modifiedCount,
      });
    }

    // 기존 필드 업데이트 로직
    if (action !== 'update_field') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!oldValue || !newValue || !collection || !field) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.collection(collection).updateMany(
      { [field]: oldValue },
      { $set: { [field]: newValue } }
    );

    return NextResponse.json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
