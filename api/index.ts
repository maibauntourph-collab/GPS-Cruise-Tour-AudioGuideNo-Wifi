// [적요: Vercel 서버리스 함수 진입점]
// 빌드된 서버 번들(dist-server/index.js)에서 Express 앱을 가져와 export합니다.
// Vercel은 이 파일을 서버리스 함수로 실행합니다.
import app from '../dist-server/index.js';
export default app;
