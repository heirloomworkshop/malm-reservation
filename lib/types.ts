export type Status = 'pending' | 'confirmed' | 'cancelled'

export type MenuType = '점심-한정식' | '점심-코스' | '저녁-한정식' | '저녁-코스'

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
  memo: string | null
  created_at: string
  rooms?: Room | null
}

export interface BlockedDate {
  id: string
  date: string
  reason: string | null
  created_at: string
}
