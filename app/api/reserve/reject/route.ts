import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'

export async function POST(req: NextRequest) {
  let body: { id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 })
  }

  const { id } = body
  if (!id) {
    return NextResponse.json({ error: 'id 필드가 필요합니다.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !reservation) {
    return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // SMS 발송 실패는 예약 상태 변경(거절)에 영향을 주지 않는다.
  const text = [
    '[다이닝 맑음] 안녕하세요. 신청해주신 예약이 마감되어 해당 시간 예약이 어려울 것 같습니다.',
    `${reservation.date} ${reservation.time} / ${reservation.guests}명`,
    '감사합니다.',
  ].join('\n')

  await sendSms(reservation.phone, text, 'reject')

  return NextResponse.json({ success: true })
}
