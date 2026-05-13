import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    .select()

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
  return NextResponse.json({ data })
}
