import { SolapiMessageService } from 'solapi'

/**
 * 솔라피로 SMS를 발송한다.
 *
 * 예약 처리(상태 변경/예약 생성) 흐름을 막지 않기 위해, 환경변수 미설정이나
 * 발송 실패 시에도 예외를 던지지 않고 console 로그만 남긴 뒤 false를 반환한다.
 *
 * @param to   수신 번호 (하이픈 포함 여부 무관)
 * @param text 메시지 본문
 * @param tag  로그 식별용 태그 (예: 'confirm', 'reject', 'reserve')
 * @returns 발송 성공 여부
 */
export async function sendSms(to: string, text: string, tag = 'sms'): Promise<boolean> {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const from = process.env.SOLAPI_FROM_NUMBER

  if (!apiKey || !apiSecret || !from) {
    console.warn(`[${tag}] SOLAPI 환경변수 미설정 — SMS 발송 건너뜀`)
    return false
  }

  try {
    const messageService = new SolapiMessageService(apiKey, apiSecret)
    await messageService.send({ to, from, text })
    console.log(`[${tag}] SMS 발송 완료:`, to)
    return true
  } catch (err) {
    console.error(`[${tag}] SMS 발송 실패:`, err)
    return false
  }
}
