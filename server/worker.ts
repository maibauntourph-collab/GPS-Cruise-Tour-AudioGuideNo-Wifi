import app from "./app";
import { setEnv } from "./env";
import { updateDbPhotos } from "./scripts/update-db-photos";

// [적요: Cloudflare Workers 진입점]
// export default { fetch: app.fetch, scheduled: ... } 형태로 내보내야 합니다.

export default {
    fetch(request: Request, env: any, ctx: any) {
        setEnv(env);
        return app.fetch(request, env, ctx);
    },

    /**
     * [적요: Cron Trigger 핸들러]
     * wrangler.toml의 [triggers] 설정에 따라 매시간 실행됩니다.
     * 각 지역별 현지 시간이 새벽 3시일 때만 DB 이미지 동기화를 수행합니다.
     */
    async scheduled(event: any, env: any, ctx: any) {
        setEnv(env);

        // 현재 UTC 시각
        const now = new Date();
        const utcHour = now.getUTCHours();

        const triggerTimezones = [
            { name: "Asia/Manila (etc)", offset: 8 },    // UTC+8
            { name: "Asia/Bangkok", offset: 7 },         // UTC+7
            { name: "Europe/Rome (etc)", offset: 1 },    // UTC+1
            { name: "Europe/London", offset: 0 },        // UTC+0
            { name: "America/Anchorage", offset: -9 }    // UTC-9
        ];

        const targetHour = 3; // 새벽 3시

        const isTimeMatch = triggerTimezones.some(tz => {
            const localHour = (utcHour + tz.offset + 24) % 24;
            return localHour === targetHour;
        });

        if (isTimeMatch) {
            console.log(`🚀 [Cron] Running scheduled DB photo update for matched timezone (UTC ${utcHour}:00)`);
            ctx.waitUntil(updateDbPhotos());
        } else {
            console.log(`💤 [Cron] Not 03:00 in any target timezone. (UTC ${utcHour}:00)`);
        }
    }
};
