import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getSupabase } from './db'

const app = new Hono<{ Bindings: { SUPABASE_URL: string; SUPABASE_KEY: string } }>()

// Server Park: CORS 설정 (모든 도메인 허용 - 실제 적용 시 특정 도메인으로 제한 가능)
app.use('/*', cors())

app.get('/', (c) => {
  return c.json({ message: 'NoWiFi GPS Tours API is running smoothly at Edge! 🚀' })
})

// 인근 랜드마크 조회 테스트 API
app.get('/api/landmarks/nearby', async (c) => {
  const lat = c.req.query('lat')
  const lng = c.req.query('lng')

  if (!lat || !lng) {
    return c.json({ error: 'lat and lng are required' }, 400)
  }

  // TODO: Supabase 연동 시 getSupabase(c.env) 호출하여 PostGIS DB 조회
  // 임시 목업 데이터 반환 (Designer Kim 테스트용)
  const mockLandmarks = [
    { id: '1', name_ko: '경복궁', name_zh: '景福宫', lat: 37.5796, lng: 126.9770, audio_url_zh: 'https://example.com/audio/korean_palace.mp3' },
    { id: '2', name_ko: '남산타워', name_zh: '南山首尔塔', lat: 37.5511, lng: 126.9882, audio_url_zh: 'https://example.com/audio/namsan.mp3' }
  ]

  return c.json({
    message: 'Success',
    center: { lat, lng },
    landmarks: mockLandmarks
  })
})

export default app
