// [적요: Drizzle ORM 마이그레이션 설정]
// DB 스키마 변경 시 마이그레이션 파일을 생성하는 설정입니다.
// 환경변수 키: NOWIFIGPSTOURS
import { defineConfig } from "drizzle-kit";

if (!process.env.NOWIFIGPSTOURS) {
  throw new Error("NOWIFIGPSTOURS env var is required for database connection");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NOWIFIGPSTOURS,
  },
});
