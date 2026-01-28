import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { sendPushToMultiple, PushSubscription, NotificationPayload } from '@/lib/web-push';

// D-day 계산
function calculateDday(seminarDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(seminarDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// GET - Vercel Cron에서 호출 (매일 오전 9시 실행)
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 (선택적)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 개발 환경에서는 인증 스킵
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const db = await getDb();

    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 카테고리별 가장 가까운 세미나 찾기
    const seminarsToNotify: { seminar: any; dday: number }[] = [];

    // 패밀리오피스 - 가장 가까운 예정 세미나
    const nearestFO = await db.collection('seminars').findOne({
      category: '패밀리오피스',
      date: { $gte: today },
      status: '준비중',
    }, { sort: { date: 1 } });

    if (nearestFO) {
      seminarsToNotify.push({ seminar: nearestFO, dday: calculateDday(nearestFO.date) });
    }

    // 법인 - 가장 가까운 예정 세미나
    const nearestCorp = await db.collection('seminars').findOne({
      category: '법인',
      date: { $gte: today },
      status: '준비중',
    }, { sort: { date: 1 } });

    if (nearestCorp) {
      seminarsToNotify.push({ seminar: nearestCorp, dday: calculateDday(nearestCorp.date) });
    }

    if (seminarsToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming seminars',
        notified: 0,
      });
    }

    // 구독자 조회
    const subscriptions = await db.collection('push_subscriptions').find().toArray();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers',
        notified: 0,
      });
    }

    // 알림 발송
    const pushSubscriptions: PushSubscription[] = subscriptions.map(s => s.subscription);
    let totalSent = 0;
    const expiredEndpoints: string[] = [];

    for (const { seminar, dday } of seminarsToNotify) {
      const ddayText = dday === 0 ? 'D-Day' : `D-${dday}`;
      const categoryEmoji = seminar.category === '패밀리오피스' ? '💼' : '🏢';
      const payload: NotificationPayload = {
        title: `${categoryEmoji} ${seminar.category} 세미나 ${ddayText}`,
        body: `${seminar.title}\n📍 ${seminar.location}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `seminar-daily-${seminar.category}`,
        url: '/?tab=seminar',
      };

      const result = await sendPushToMultiple(pushSubscriptions, payload);
      totalSent += result.success;
      expiredEndpoints.push(...result.expiredEndpoints);
    }

    // 만료된 구독 삭제
    if (expiredEndpoints.length > 0) {
      const uniqueEndpoints = [...new Set(expiredEndpoints)];
      await db.collection('push_subscriptions').deleteMany({
        endpoint: { $in: uniqueEndpoints },
      });
    }

    // 알림 로그 저장
    await db.collection('notification_logs').insertOne({
      type: 'dday_cron',
      seminarsNotified: seminarsToNotify.length,
      totalSent,
      expiredRemoved: expiredEndpoints.length,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      seminarsNotified: seminarsToNotify.length,
      totalSent,
      expiredRemoved: expiredEndpoints.length,
    });
  } catch (error) {
    console.error('Cron notification failed:', error);
    return NextResponse.json(
      { error: 'Cron notification failed' },
      { status: 500 }
    );
  }
}
