import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { sendPushToMultiple, PushSubscription, NotificationPayload } from '@/lib/web-push';

// GET - 구독자 수 확인
export async function GET() {
  try {
    const db = await getDb();
    const count = await db.collection('push_subscriptions').countDocuments();
    return NextResponse.json({ subscribers: count });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get subscriber count', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - 푸시 알림 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: messageBody, url, tag, userId } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 구독자 조회
    const query = userId ? { userId } : {};
    const subscriptions = await db.collection('push_subscriptions')
      .find(query)
      .toArray();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers found',
        sent: 0,
      });
    }

    // 알림 페이로드 생성
    const payload: NotificationPayload = {
      title,
      body: messageBody,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'hnw-notification',
      url: url || '/',
    };

    // 푸시 발송
    const pushSubscriptions: PushSubscription[] = subscriptions.map(s => s.subscription);
    const result = await sendPushToMultiple(pushSubscriptions, payload);

    // 만료된 구독 삭제
    if (result.expiredEndpoints.length > 0) {
      await db.collection('push_subscriptions').deleteMany({
        endpoint: { $in: result.expiredEndpoints },
      });
    }

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      removed: result.expiredEndpoints.length,
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
