import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { sendPushToMultiple, PushSubscription, NotificationPayload } from '@/lib/web-push';

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const db = await getDb();

    // 오늘 날짜 설정 (KST 기준 - UTC+9)
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstDateStr = kstNow.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const today = new Date(kstDateStr + 'T00:00:00.000Z');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 금일 세미나 조회
    const seminars = await db.collection('seminars').find({
      date: { $gte: today, $lt: tomorrow },
      status: '준비중',
    }).toArray();

    // 금일 일정(회의/외근/기타) 조회
    const schedules = await db.collection('schedules').find({
      date: { $gte: today, $lt: tomorrow },
    }).toArray();

    const totalCount = seminars.length + schedules.length;

    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No schedules for today',
        notified: 0,
      });
    }

    // 'daily' 알림을 활성화한 구독자 조회
    const subscriptions = await db.collection('push_subscriptions').find({
      $or: [
        { notificationTypes: 'daily' },
        { notificationTypes: { $exists: false } }  // 기존 구독자 포함 (기본값)
      ]
    }).toArray();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers for daily notifications',
        notified: 0,
      });
    }

    // 푸시 알림 발송
    const pushSubscriptions: PushSubscription[] = subscriptions.map(s => s.subscription);
    const payload = createNotificationPayload(seminars, schedules);

    const result = await sendPushToMultiple(pushSubscriptions, payload);

    // 만료된 구독 삭제
    if (result.expiredEndpoints.length > 0) {
      const uniqueEndpoints = [...new Set(result.expiredEndpoints)];
      await db.collection('push_subscriptions').deleteMany({
        endpoint: { $in: uniqueEndpoints },
      });
    }

    // 알림 로그 저장
    await db.collection('notification_logs').insertOne({
      type: 'daily_schedule_cron',
      schedulesCount: totalCount,
      totalSent: result.success,
      expiredRemoved: result.expiredEndpoints.length,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      schedulesCount: totalCount,
      totalSent: result.success,
      expiredRemoved: result.expiredEndpoints.length,
    });
  } catch (error) {
    console.error('Daily schedule cron failed:', error);
    return NextResponse.json(
      { error: 'Daily schedule cron failed' },
      { status: 500 }
    );
  }
}

// 알림 페이로드 생성 헬퍼 함수
function createNotificationPayload(seminars: any[], schedules: any[]): NotificationPayload {
  const totalCount = seminars.length + schedules.length;

  // 알림 본문 생성
  const bodyLines: string[] = [];

  // 세미나 추가
  seminars.forEach(seminar => {
    const emoji = seminar.category === '패밀리오피스' ? '💼' : '🏢';
    const time = seminar.time || '하루종일';
    bodyLines.push(`${emoji} ${time} ${seminar.title}`);
  });

  // 일정 추가
  schedules.forEach(schedule => {
    let emoji = '📌';
    let title = '';

    if (schedule.category === '회의') {
      emoji = '💼';
      title = schedule.meetingTopic || '회의';
    } else if (schedule.category === '외근') {
      emoji = '🚗';
      title = schedule.outingTopic || '외근';
    } else {
      emoji = '📌';
      title = schedule.etcTopic || '기타 일정';
    }

    const time = schedule.time || '하루종일';
    bodyLines.push(`${emoji} ${time} ${title}`);
  });

  // 최대 3개까지만 표시, 나머지는 "외 N건"으로 표시
  const displayLines = bodyLines.slice(0, 3);
  if (bodyLines.length > 3) {
    displayLines.push(`외 ${bodyLines.length - 3}건`);
  }

  return {
    title: `📅 오늘의 일정 ${totalCount}건`,
    body: displayLines.join('\n'),
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-schedule',
    url: '/?tab=calendar',
  };
}
