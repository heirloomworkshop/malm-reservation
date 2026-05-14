'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, isSupabaseConfigured, supabaseUrl } from '@/lib/supabase'
import { Room, MenuType, BlockedDate } from '@/lib/types'

type TimePeriod = '점심' | '저녁'
type MenuCategory = '한정식' | '코스'

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string; sub: string }[] = [
  { value: '점심', label: '점심', sub: '11:00부터' },
  { value: '저녁', label: '저녁', sub: '17:00부터' },
]

const MENU_CATEGORY_OPTIONS: { value: MenuCategory; label: string }[] = [
  { value: '한정식', label: '한정식' },
  { value: '코스', label: '코스' },
]

const TIME_SLOTS: Record<TimePeriod, string[]> = {
  '점심': ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
  '저녁': ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
}

interface FormState {
  name: string
  phone: string
  date: string
  time: string
  guests: number
  room_id: string
  time_period: TimePeriod | ''
  menu_category: MenuCategory | ''
  menu_requests: string
  allergies: string
}

const emptyForm: FormState = {
  name: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
  room_id: '',
  time_period: '',
  menu_category: '',
  menu_requests: '',
  allergies: '',
}

export default function BookPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [dateError, setDateError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('[Supabase 환경변수 확인]', {
      configured: isSupabaseConfigured,
      url: supabaseUrl.replace(/^(https:\/\/[^.]{4})[^/]+/, '$1***'),
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 20) + '...'
        : '❌ 미설정',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? '✅ 설정됨'
        : '❌ 미설정',
    })

    supabase.from('rooms').select('*').order('name').then(({ data, error }) => {
      if (error) console.error('[rooms fetch error]', error)
      if (data) setRooms(data)
    })
    supabase.from('blocked_dates').select('*').then(({ data, error }) => {
      if (error) console.error('[blocked_dates fetch error]', error)
      if (data) setBlockedDates(data)
    })
  }, [])

  const today = new Date().toISOString().split('T')[0]

  function set(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  function handleTimePeriodChange(value: TimePeriod) {
    setForm((prev) => ({ ...prev, time_period: value, time: '' }))
    setError('')
  }

  function handleMenuCategoryChange(value: MenuCategory) {
    setForm((prev) => ({ ...prev, menu_category: value }))
    setError('')
  }

  function handleDateChange(value: string) {
    set('date', value)
    const blocked = blockedDates.find((b) => b.date === value)
    if (blocked) {
      setDateError(
        blocked.reason
          ? `해당 날짜는 예약이 마감되었습니다. (사유: ${blocked.reason})`
          : '해당 날짜는 예약이 마감되었습니다.'
      )
    } else {
      setDateError('')
    }
  }

  const currentTimeSlots = form.time_period ? TIME_SLOTS[form.time_period] : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.time_period) { setError('시간대를 선택해주세요.'); return }
    if (!form.menu_category) { setError('메뉴를 선택해주세요.'); return }
    if (!form.name.trim()) { setError('이름을 입력해주세요.'); return }
    if (!form.phone.trim()) { setError('연락처를 입력해주세요.'); return }
    if (!form.date) { setError('날짜를 선택해주세요.'); return }
    if (dateError) { setError(dateError); return }
    if (!form.time) { setError('시간을 선택해주세요.'); return }
    if (!form.room_id) { setError('공간을 선택해주세요.'); return }
    if (form.guests < 1) { setError('인원을 입력해주세요.'); return }

    setSubmitting(true)
    setError('')

    const menu_type: MenuType = `${form.time_period}-${form.menu_category}` as MenuType

    const memoParts = []
    if (form.menu_requests.trim()) memoParts.push(`[메뉴 요청] ${form.menu_requests.trim()}`)
    if (form.allergies.trim()) memoParts.push(`[알레르기] ${form.allergies.trim()}`)

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      date: form.date,
      time: form.time,
      guests: form.guests,
      room_id: form.room_id,
      menu_type,
      status: 'pending',
      memo: memoParts.join('\n') || null,
    }

    console.log('[insert payload]', payload)

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        const errMsg = json?.error?.message ?? json?.error ?? '알 수 없는 오류'
        const errCode = json?.error?.code ?? res.status
        console.error('[/api/reserve 응답 에러]', json)
        setError(`예약 저장 중 오류가 발생했습니다. (${errCode}: ${errMsg})`)
        setSubmitting(false)
        return
      }

      setSuccess(true)
    } catch (e) {
      console.error('[fetch /api/reserve 실패]', e)
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--background)' }}>
        <div className="text-center animate-fadein max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-2"
            style={{ borderColor: 'var(--color-gold)' }}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
              style={{ color: 'var(--color-gold)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-light mb-3" style={{ color: 'var(--foreground)' }}>
            예약 신청 완료
          </h2>
          <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-muted)' }}>
            예약 신청이 접수되었습니다.
          </p>
          <p className="text-sm leading-relaxed mb-10" style={{ color: 'var(--color-muted)' }}>
            확정 여부는 입력하신 연락처로 안내드립니다.
          </p>
          <button
            onClick={() => { setSuccess(false); setForm(emptyForm); setDateError('') }}
            className="text-xs tracking-[0.2em] uppercase px-8 py-3 border transition-colors"
            style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-muted)' }}
          >
            새 예약 신청
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-16 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-xl mx-auto">

        {/* Supabase 미설정 경고 */}
        {!isSupabaseConfigured && (
          <div className="mb-6 px-4 py-3 text-xs text-center border"
            style={{ borderColor: '#5a3a0a', background: 'rgba(90,58,10,0.2)', color: '#e0a050' }}>
            ⚠ Supabase 환경변수가 설정되지 않았습니다. Vercel 대시보드에서 환경변수를 확인해주세요.
          </div>
        )}

        {/* 헤더 */}
        <div className="text-center mb-12 animate-fadein">
          <Link href="/" className="inline-block">
            <h1 className="font-display text-5xl font-light"
              style={{ color: 'var(--foreground)', letterSpacing: '0.06em' }}>
              맑음
            </h1>
          </Link>
          <div className="w-10 border-t mx-auto mt-6 mb-6"
            style={{ borderColor: 'var(--color-gold-dim)' }} />
          <p className="text-sm tracking-widest uppercase"
            style={{ color: 'var(--color-muted)' }}>
            예약 신청
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1단계: 시간대 선택 */}
          <section>
            <Label>시간대 선택</Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {TIME_PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTimePeriodChange(opt.value)}
                  className="text-left px-5 py-4 border transition-all duration-150"
                  style={{
                    borderColor: form.time_period === opt.value
                      ? 'var(--color-gold)' : 'var(--color-border)',
                    background: form.time_period === opt.value
                      ? 'rgba(201,168,76,0.06)' : 'var(--color-surface)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        borderColor: form.time_period === opt.value
                          ? 'var(--color-gold)' : 'var(--color-border-light)',
                      }}
                    >
                      {form.time_period === opt.value && (
                        <span className="w-2 h-2 rounded-full"
                          style={{ background: 'var(--color-gold)' }} />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {opt.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {opt.sub}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 2단계: 메뉴 선택 */}
          <section>
            <Label>메뉴 선택</Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {MENU_CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleMenuCategoryChange(opt.value)}
                  className="text-left px-5 py-4 border transition-all duration-150"
                  style={{
                    borderColor: form.menu_category === opt.value
                      ? 'var(--color-gold)' : 'var(--color-border)',
                    background: form.menu_category === opt.value
                      ? 'rgba(201,168,76,0.06)' : 'var(--color-surface)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        borderColor: form.menu_category === opt.value
                          ? 'var(--color-gold)' : 'var(--color-border-light)',
                      }}
                    >
                      {form.menu_category === opt.value && (
                        <span className="w-2 h-2 rounded-full"
                          style={{ background: 'var(--color-gold)' }} />
                      )}
                    </span>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {opt.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 공간 선택 */}
          <section>
            <Label>공간 선택</Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => set('room_id', room.id)}
                  className="text-left px-4 py-3.5 border transition-all duration-150"
                  style={{
                    borderColor: form.room_id === room.id
                      ? 'var(--color-gold)' : 'var(--color-border)',
                    background: form.room_id === room.id
                      ? 'rgba(201,168,76,0.06)' : 'var(--color-surface)',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {room.name}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* 예약자 정보 */}
          <section className="space-y-4">
            <Label>예약자 정보</Label>
            <div>
              <FieldLabel>이름</FieldLabel>
              <input
                type="text"
                required
                placeholder="홍길동"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-4 py-3 text-sm border rounded-none"
              />
            </div>
            <div>
              <FieldLabel>연락처</FieldLabel>
              <input
                type="tel"
                required
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full px-4 py-3 text-sm border rounded-none"
              />
            </div>
          </section>

          {/* 예약 일시 */}
          <section className="space-y-4">
            <Label>예약 일시</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>날짜</FieldLabel>
                <input
                  type="date"
                  required
                  min={today}
                  value={form.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-3 text-sm border rounded-none"
                  style={dateError ? { borderColor: '#9e5c5c' } : {}}
                />
                {dateError && (
                  <p className="text-xs mt-1.5" style={{ color: '#e07070' }}>{dateError}</p>
                )}
              </div>
              <div>
                <FieldLabel>시간</FieldLabel>
                <select
                  required
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  disabled={!form.time_period}
                  className="w-full px-4 py-3 text-sm border rounded-none disabled:opacity-40"
                >
                  <option value="">
                    {form.time_period ? '선택' : '시간대 먼저 선택'}
                  </option>
                  {currentTimeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <FieldLabel>인원</FieldLabel>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={form.guests}
                onChange={(e) => set('guests', Number(e.target.value))}
                className="w-full px-4 py-3 text-sm border rounded-none"
              />
            </div>
          </section>

          {/* 요청사항 */}
          <section className="space-y-4">
            <Label>요청사항</Label>
            <div>
              <FieldLabel>
                메뉴 요청사항{' '}
                <span style={{ color: 'var(--color-border-light)' }}>선택</span>
              </FieldLabel>
              <textarea
                rows={3}
                placeholder="원하시는 메뉴나 특별 요청사항을 입력해주세요"
                value={form.menu_requests}
                onChange={(e) => set('menu_requests', e.target.value)}
                className="w-full px-4 py-3 text-sm border rounded-none resize-none"
              />
            </div>
            <div>
              <FieldLabel>
                알레르기 및 특이사항{' '}
                <span style={{ color: 'var(--color-border-light)' }}>선택</span>
              </FieldLabel>
              <textarea
                rows={2}
                placeholder="알레르기, 식이 제한, 기타 특이사항"
                value={form.allergies}
                onChange={(e) => set('allergies', e.target.value)}
                className="w-full px-4 py-3 text-sm border rounded-none resize-none"
              />
            </div>
          </section>

          {error && (
            <p className="text-sm text-center py-3 px-4 border"
              style={{ color: '#e07070', borderColor: '#5a2020', background: 'rgba(90,32,32,0.15)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !!dateError}
            className="w-full py-4 text-xs tracking-[0.25em] uppercase font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--color-gold)', color: '#0a0908' }}
          >
            {submitting ? '처리 중...' : '예약 신청하기'}
          </button>

          <p className="text-center text-xs pb-8" style={{ color: 'var(--color-muted)' }}>
            예약 신청 후 확정까지 최대 24시간이 소요될 수 있습니다.
          </p>
        </form>
      </div>
    </main>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs tracking-[0.2em] uppercase font-medium"
      style={{ color: 'var(--color-gold)' }}>
      {children}
    </p>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
      {children}
    </p>
  )
}
