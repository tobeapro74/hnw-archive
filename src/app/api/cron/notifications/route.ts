import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { sendPushToMultiple, PushSubscription, NotificationPayload } from '@/lib/web-push';

// D-day 알림을 보낼 날짜들 (세미나 날짜 기준)
const NOTIFICATION_DAYS = [7, 3, 1, 0]; // D-7, D-3, D-1, D-day

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

    // 오늘 날짜 (한국 시간 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 알림 대상 세미나 찾기
    const seminarsToNotify: { seminar: any; dday: number }[] = [];

    for (const days of NOTIFICATION_DAYS) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);

      // 해당 날짜의 세미나 찾기
      const seminars = await db.collection('seminars').find({
        date: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: '준비중',
      }).toArray();

      seminars.forEach(seminar => {
        seminarsToNotify.push({ seminar, dday: days });
      });
    }

    if (seminarsToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No seminars to notify',
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
      const ddayText = dday === 0 ? '오늘' : `D-${dday}`;
      const payload: NotificationPayload = {
        title: `세미나 ${ddayText}`,
        body: `${seminar.title} - ${seminar.location}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `seminar-dday-${seminar._id}`,
        url: '/?view=seminar',
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
