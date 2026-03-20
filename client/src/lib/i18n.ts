/**
 * [Dodari | 2026-03-20] 🌐 Legacy i18n Bridge
 * 학생들에게: 빌드 도구가 `@/lib/i18n`을 찾지 못해 발생하는 오류를 해결하기 위한 브릿지 파일입니다.
 * 실제 다국어 로직은 `translations.ts`에 있으므로 이를 다시 내보냅니다.
 */

import { getTranslatedContent, t } from './translations';

export { getTranslatedContent, t };

// [연구소장] 향후 모든 참조를 translations.ts로 옮긴 뒤 이 파일은 삭제할 예정입니다.
