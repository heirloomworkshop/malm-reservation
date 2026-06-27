'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Reservation, Status, BlockedDate } from '@/lib/types'

const STATUS_LABEL: Record<Status, string> = {
  pending: '대기',
  confirmed: '확정',
  cancelled: '거절',
}
const STATUS_COLOR: Record<Status, string> = {
  pending: '#c9a84c',
  confirmed: '#5c9e6e',
  cancelled: '#9e5c5c',
}
const STATUS_BG: Record<Status, string> = {
  pending: 'rgba(201,168,76,0.12)',
  confirmed: 'rgba(92,158,110,0.12)',
  cancelled: 'rgba(158,92,92,0.12)',
}

type FilterStatus = Status | 'all'
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

// ── 캘린더 ──────────────────────────────────────────────────

function MonthCalendar({
  reservations,
  blockedDates,
  selectedDate,
  onSelect,
}: {
  reservations: Reservation[]
  blockedDates: BlockedDate[]
  selectedDate: string | null
  onSelect: (date: string | null) => void
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const datesWithRes = new Set(reservations.map((r) => r.date))
  const blockedSet = new Set(blockedDates.map((b) => b.date))

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center"
          style={{ color: 'var(--color-muted)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-display text-xl font-light tracking-wide"
          style={{ color: 'var(--foreground)' }}>
          {year}년 {month + 1}월
        </span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center"
          style={{ color: 'var(--color-muted)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_KO.map((d, i) => (
          <div key={d} className="text-center text-xs py-1"
            style={{ color: i === 0 ? '#9e5c5c' : i === 6 ? '#5c7a9e' : 'var(--color-muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const dateStr = toDateStr(year, month, day)
          const hasRes = datesWithRes.has(dateStr)
          const isBlocked = blockedSet.has(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = dateStr === new Date().toISOString().split('T')[0]

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(isSelected ? null : dateStr)}
              className="flex flex-col items-center py-1.5 transition-all duration-100 relative"
              style={{
                background: isBlocked
                  ? 'rgba(158,92,92,0.08)'
                  : isSelected
                  ? 'rgba(201,168,76,0.12)'
                  : 'transparent',
                borderBottom: isSelected
                  ? `1px solid ${isBlocked ? '#9e5c5c' : 'var(--color-gold)'}`
                  : '1px solid transparent',
              }}
            >
              <span
                className="text-xs"
                style={{
                  color: isBlocked
                    ? '#9e5c5c'
                    : isSelected
                    ? 'var(--color-gold)'
                    : isToday
                    ? 'var(--foreground)'
                    : 'var(--color-muted)',
                  fontWeight: isToday ? 600 : 400,
                  textDecoration: isBlocked ? 'line-through' : 'none',
                  opacity: isBlocked ? 0.7 : 1,
                }}
              >
                {day}
              </span>
              {/* 예약 있음: 금색 점 */}
              {hasRes && !isBlocked && (
                <span className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: 'var(--color-gold)' }} />
              )}
              {/* 마감: 빨간 점 */}
              {isBlocked && (
                <span className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: '#9e5c5c' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>예약</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#9e5c5c' }} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>마감</span>
        </div>
      </div>

      {selectedDate && (
        <button
          onClick={() => onSelect(null)}
          className="mt-3 w-full text-xs py-2 transition-colors"
          style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}
        >
          날짜 필터 해제
        </button>
      )}
    </div>
  )
}

// ── 마감 관리 패널 ───────────────────────────────────────────

function BlockedDatePanel({
  date,
  blockedDates,
  onBlock,
  onUnblock,
  loading,
}: {
  date: string
  blockedDates: BlockedDate[]
  onBlock: (date: string, reason: string) => void
  onUnblock: (id: string) => void
  loading: boolean
}) {
  const blocked = blockedDates.find((b) => b.date === date)
  const [reason, setReason] = useState('')

  useEffect(() => { setReason('') }, [date])

  return (
    <div className="border p-4 mt-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <p className="text-xs tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--color-gold)' }}>
        {date} 예약 관리
      </p>

      {blocked ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2.5 py-1 tracking-wide"
              style={{ color: '#9e5c5c', background: 'rgba(158,92,92,0.12)' }}>
              마감
            </span>
          </div>
          {blocked.reason && (
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              사유: {blocked.reason}
            </p>
          )}
          <button
            disabled={loading}
            onClick={() => onUnblock(blocked.id)}
            className="w-full py-2 text-xs tracking-wide border transition-opacity disabled:opacity-40"
            style={{
              borderColor: 'rgba(92,158,110,0.3)',
              color: '#5c9e6e',
              background: 'rgba(92,158,110,0.08)',
            }}
          >
            {loading ? '처리 중...' : '마감 해제'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2.5 py-1 tracking-wide"
              style={{ color: '#5c9e6e', background: 'rgba(92,158,110,0.12)' }}>
              예약 가능
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="마감 사유 입력 (선택)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-none resize-none mb-2"
          />
          <button
            disabled={loading}
            onClick={() => { onBlock(date, reason); setReason('') }}
            className="w-full py-2 text-xs tracking-wide border transition-opacity disabled:opacity-40"
            style={{
              borderColor: 'rgba(158,92,92,0.3)',
              color: '#9e5c5c',
              background: 'rgba(158,92,92,0.08)',
            }}
          >
            {loading ? '처리 중...' : '이 날짜 마감 처리'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── 예약 카드 ────────────────────────────────────────────────

function ReservationCard({
  reservation: r,
  updating,
  onUpdateStatus,
  onDelete,
}: {
  reservation: Reservation
  updating: boolean
  onUpdateStatus: (id: string, status: Status) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border transition-all duration-150"
      style={{
        borderColor: r.status === 'pending' ? 'var(--color-border-light)' : 'var(--color-border)',
        background: 'var(--color-surface)',
      }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 tracking-wide"
                style={{ color: STATUS_COLOR[r.status], background: STATUS_BG[r.status] }}>
                {STATUS_LABEL[r.status]}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {r.menu_type}
              </span>
              {r.rooms && (
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  · {r.rooms.name}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-base font-medium" style={{ color: 'var(--foreground)' }}>
                {r.name}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {r.phone}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
              <span>{r.date} {r.time}</span>
              <span>{r.guests}명</span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center transition-transform"
            style={{
              color: 'var(--color-muted)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {r.status === 'pending' && (
          <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(r.id, 'confirmed')}
              className="flex-1 py-2 text-xs tracking-[0.15em] uppercase font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'rgba(92,158,110,0.15)', color: '#5c9e6e', border: '1px solid rgba(92,158,110,0.3)' }}
            >
              확정
            </button>
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(r.id, 'cancelled')}
              className="flex-1 py-2 text-xs tracking-[0.15em] uppercase font-medium transition-opacity disabled:opacity-40"
              style={{ background: 'rgba(158,92,92,0.15)', color: '#9e5c5c', border: '1px solid rgba(158,92,92,0.3)' }}
            >
              거절
            </button>
          </div>
        )}

        {r.status === 'cancelled' && (
          <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(r.id, 'pending')}
              className="text-xs px-3 py-1.5 transition-opacity disabled:opacity-40"
              style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
            >
              대기로 되돌리기
            </button>
            <button
              disabled={updating}
              onClick={() => { if (window.confirm('이 예약을 완전히 삭제하시겠습니까?')) onDelete(r.id) }}
              className="text-xs px-3 py-1.5 transition-opacity disabled:opacity-40"
              style={{ color: '#9e5c5c', border: '1px solid rgba(158,92,92,0.4)' }}
            >
              삭제
            </button>
          </div>
        )}

        {r.status === 'confirmed' && (
          <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(r.id, 'pending')}
              className="text-xs px-3 py-1.5 transition-opacity disabled:opacity-40"
              style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
            >
              대기로 되돌리기
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="pt-3 space-y-3">
            {r.memo ? (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-gold)' }}>요청사항</p>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--foreground)' }}>{r.memo}</p>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>요청사항 없음</p>
            )}
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              신청일: {new Date(r.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 관리자 페이지 ─────────────────────────────────────────────

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [blockingLoading, setBlockingLoading] = useState(false)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reservations')
      .select('*, rooms(id, name, capacity_min, capacity_max)')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (data) setReservations(data as Reservation[])
    setLoading(false)
  }, [])

  const fetchBlockedDates = useCallback(async () => {
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date', { ascending: true })
    if (data) setBlockedDates(data as BlockedDate[])
  }, [])

  useEffect(() => {
    fetchReservations()
    fetchBlockedDates()
  }, [fetchReservations, fetchBlockedDates])

  async function updateStatus(id: string, status: Status) {
    setUpdating(id)
    if (status === 'confirmed') {
      await fetch('/api/reserve/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } else if (status === 'cancelled') {
      await fetch('/api/reserve/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } else {
      await supabase.from('reservations').update({ status }).eq('id', id)
    }
    await fetchReservations()
    setUpdating(null)
  }

  async function deleteReservation(id: string) {
    setUpdating(id)
    await supabase.from('reservations').delete().eq('id', id)
    await fetchReservations()
    setUpdating(null)
  }

  async function blockDate(date: string, reason: string) {
    setBlockingLoading(true)
    await supabase.from('blocked_dates').insert({ date, reason: reason.trim() || null })
    await fetchBlockedDates()
    setBlockingLoading(false)
  }

  async function unblockDate(id: string) {
    setBlockingLoading(true)
    await supabase.from('blocked_dates').delete().eq('id', id)
    await fetchBlockedDates()
    setBlockingLoading(false)
  }

  const filtered = reservations.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (selectedDate && r.date !== selectedDate) return false
    return true
  })

  const pendingCount = reservations.filter((r) => r.status === 'pending').length
  const todayStr = new Date().toISOString().split('T')[0]
  const todayCount = reservations.filter((r) => r.date === todayStr).length

  const FILTERS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '대기' },
    { value: 'confirmed', label: '확정' },
    { value: 'cancelled', label: '거절' },
  ]

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-display text-3xl font-light tracking-wide"
                style={{ color: 'var(--foreground)' }}>맑음</span>
              <span className="text-xs tracking-widest uppercase ml-3"
                style={{ color: 'var(--color-gold)' }}>관리자</span>
            </Link>
          </div>
          <button
            onClick={() => { fetchReservations(); fetchBlockedDates() }}
            className="text-xs tracking-widest uppercase px-4 py-2 border transition-colors"
            style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-muted)' }}
          >
            새로고침
          </button>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: '전체 예약', value: reservations.length },
            { label: '대기 중', value: pendingCount, highlight: pendingCount > 0 },
            { label: '오늘 예약', value: todayCount },
            { label: '마감 날짜', value: blockedDates.length },
          ].map((stat) => (
            <div key={stat.label} className="p-4 border"
              style={{
                borderColor: stat.highlight ? 'var(--color-gold-dim)' : 'var(--color-border)',
                background: stat.highlight ? 'rgba(201,168,76,0.04)' : 'var(--color-surface)',
              }}>
              <p className="text-2xl font-display font-light"
                style={{ color: stat.highlight ? 'var(--color-gold)' : 'var(--foreground)' }}>
                {stat.value}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-6">

          {/* 사이드바 */}
          <div>
            <MonthCalendar
              reservations={reservations}
              blockedDates={blockedDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
            {selectedDate && (
              <BlockedDatePanel
                date={selectedDate}
                blockedDates={blockedDates}
                onBlock={blockDate}
                onUnblock={unblockDate}
                loading={blockingLoading}
              />
            )}
          </div>

          {/* 예약 목록 */}
          <div>
            {/* 상태 필터 탭 */}
            <div className="flex gap-0 mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase transition-all border-b-2 -mb-px"
                  style={{
                    borderBottomColor: filterStatus === f.value ? 'var(--color-gold)' : 'transparent',
                    color: filterStatus === f.value ? 'var(--color-gold)' : 'var(--color-muted)',
                  }}
                >
                  {f.label}
                  {f.value !== 'all' && (
                    <span className="ml-1.5">
                      ({reservations.filter((r) => r.status === f.value).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16" style={{ color: 'var(--color-muted)' }}>
                <p className="text-sm tracking-widest">불러오는 중...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {selectedDate ? `${selectedDate} 예약이 없습니다.` : '예약이 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    updating={updating === r.id}
                    onUpdateStatus={updateStatus}
                    onDelete={deleteReservation}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
