import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SolapiMessageService } from 'solapi'

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
    .update({ status: 'confirmed' })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const from = process.env.SOLAPI_FROM_NUMBER

  if (apiKey && apiSecret && from) {
    try {
      const messageService = new SolapiMessageService(apiKey, apiSecret)
      const text = [
        '[다이닝 맑음] 예약이 확정되었습니다.',
        `${reservation.date} ${reservation.time} / ${reservation.guests}명 / ${reservation.menu_type}`,
        '취소는 010-4141-3037로 부탁드립니다.',
      ].join('\n')

      await messageService.send({
        to: reservation.phone,
        from,
        text,
      })
      console.log('[confirm] SMS 발송 완료:', reservation.phone)
    } catch (smsError) {
      console.error('[confirm] SMS 발송 실패:', smsError)
    }
  } else {
    console.warn('[confirm] SOLAPI 환경변수 미설정 — SMS 발송 건너뜀')
  }

  return NextResponse.json({ success: true })
}
