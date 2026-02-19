// [적요: Vercel 서버리스 함수 진입점]
// server/index.ts의 default export(handler 함수)를 그대로 re-export합니다.
// Vercel은 이 파일을 서버리스 함수로 인식하여 요청을 처리합니다.
export { default } from '../server/index';
