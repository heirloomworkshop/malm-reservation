export type Status = 'pending' | 'confirmed' | 'cancelled'

export type MenuType = '저녁 코스' | '점심 한정식'

export interface Room {
  id: string
  name: string
  capacity_min: number
  capacity_max: number
}

export interface Reservation {
  id: string
  name: string
  phone: string
  date: string
  time: string
  guests: number
  room_id: string | null
  menu_type: MenuType
  status: Status
  menu_requests: string | null
  allergies: string | null
  created_at: string
  rooms?: Room | null
}

export interface BlockedDate {
  id: string
  date: string
  reason: string | null
  created_at: string
}
