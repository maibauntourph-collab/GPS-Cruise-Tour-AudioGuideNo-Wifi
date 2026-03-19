// Server Park 작성: Supabase 클라이언트 설정 파일 (backend/src/db.ts)
import { createClient } from '@supabase/supabase-js'

export interface Env {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
}

/**
 * 💡 Supabase 클라이언트 초기화 함수입니다.
 * 학생 여러분, Hono(Workers) 환경에서는 전역 변수 대신 각 요청(Context)의 bindings(c.env)에서 환경 변수를 가져옵니다!
 * 따라서 런타임에 동적으로 클라이언트를 생성합니다.
 */
export const getSupabase = (env: Env) => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
}
