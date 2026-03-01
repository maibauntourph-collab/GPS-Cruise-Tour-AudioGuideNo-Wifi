import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

/**
 * [디자이너 킴 | 2026-02-28] 오프라인 인디케이터 프리미엄 고도화
 * 학생들에게: 단순히 나타나고 사라지는 것이 아니라, framer-motion을 이용해
 * 부드러운 글래스모피즘(Glassmorphism) 효과와 애니메이션을 적용했습니다.
 * 또한 다국어(한국어/영어)를 완벽히 지원하도록 수정했습니다.
 */
export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const labels = {
    ko: {
      online: '네트워크 연결됨',
      offline: '오프라인 모드 - 캐시된 데이터 사용 중'
    },
    en: {
      online: 'Back online',
      offline: 'Offline mode - Using cached data'
    }
  };

  const currentLabels = labels[language as keyof typeof labels] || labels.en;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          data-testid={isOnline ? "indicator-online" : "indicator-offline"}
          className={`fixed top-6 left-1/2 z-[9999] flex items-center gap-3 px-5 py-2.5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-xl transition-colors duration-500 ${isOnline
              ? 'bg-emerald-500/80 text-white'
              : 'bg-rose-500/80 text-white'
            }`}
        >
          {isOnline ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Wifi className="w-5 h-5" />
              </motion.div>
              <span className="font-semibold tracking-tight">{currentLabels.online}</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <WifiOff className="w-5 h-5" />
              </motion.div>
              <span className="font-semibold tracking-tight">{currentLabels.offline}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
