import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/push/settings - 알림 타입 설정 업데이트
export async function PATCH(request: NextRequest) {
  // 로그인 확인
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { endpoint, notificationTypes } = body;

    if (!endpoint || !Array.isArray(notificationTypes)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // 유효성 검증
    const validTypes = ['dday', 'daily'];
    const isValid = notificationTypes.every(type => validTypes.includes(type));
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid notification types' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const result = await db.collection('push_subscriptions').updateOne(
      { endpoint },
      {
        $set: {
          notificationTypes,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notificationTypes });
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// GET /api/push/settings - 현재 알림 설정 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const subscription = await db.collection('push_subscriptions').findOne({
      endpoint,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // notificationTypes가 없으면 기본값 반환 (마이그레이션 전 구독자)
    const notificationTypes = subscription.notificationTypes || ['dday'];

    return NextResponse.json({
      notificationTypes,
    });
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}
