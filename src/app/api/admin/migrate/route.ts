import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// POST - 데이터 마이그레이션 (일회성 작업)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, oldValue, newValue, collection, field } = body;

    if (action !== 'update_field') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!oldValue || !newValue || !collection || !field) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
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
