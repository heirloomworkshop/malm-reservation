import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'

export async function POST(req: NextRequest) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // Vercel Functions 로그에서 환경변수 확인
  console.log('[/api/reserve] 환경변수 상태:', {
    url: rawUrl ? rawUrl.slice(0, 30) + '...' : '❌ NEXT_PUBLIC_SUPABASE_URL 미설정',
    key: rawKey ? '✅ NEXT_PUBLIC_SUPABASE_ANON_KEY 설정됨' : '❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 미설정',
  })

  if (!rawUrl || !rawKey) {
    console.error('[/api/reserve] Supabase 환경변수 누락')
    return NextResponse.json(
      { error: 'Supabase 환경변수가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
    console.log('[/api/reserve] insert payload:', JSON.stringify(body))
  } catch (e) {
    console.error('[/api/reserve] 요청 파싱 실패:', e)
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 })
  }

  const supabase = createClient(rawUrl, rawKey)

  const { data, error } = await supabase
    .from('reservations')
    .insert(body)
    .select('*, rooms(name)')

  if (error) {
    console.error('[/api/reserve] Supabase insert 에러:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return NextResponse.json(
      { error: { message: error.message, code: error.code, details: error.details, hint: error.hint } },
      { status: 500 }
    )
  }

  console.log('[/api/reserve] insert 성공:', data)

  // 예약 생성 성공 직후 관리자에게 알림 SMS 발송.
  // 발송 실패는 예약 생성 결과에 영향을 주지 않는다.
  const reservation = Array.isArray(data) ? data[0] : null
  const adminPhone = process.env.ADMIN_PHONE_NUMBER
  if (reservation && adminPhone) {
    const roomName = reservation.rooms?.name ?? '-'
    const text = [
      '[다이닝 맑음] 새 예약 신청',
      `${reservation.name} / ${reservation.date} ${reservation.time} / ${reservation.guests}명`,
      `${reservation.menu_type} / ${roomName}`,
      '관리자 페이지에서 확인해주세요.',
    ].join('\n')

    await sendSms(adminPhone, text, 'reserve')
  } else if (!adminPhone) {
    console.warn('[/api/reserve] ADMIN_PHONE_NUMBER 미설정 — 관리자 알림 건너뜀')
  }

  return NextResponse.json({ data })
}
