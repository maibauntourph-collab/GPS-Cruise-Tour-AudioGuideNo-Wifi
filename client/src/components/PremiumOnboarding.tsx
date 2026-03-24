/**
 * [교수님 노트: PremiumOnboarding - AI 추천 일정 직후 노출되는 프리미엄 전환 유도 컴포넌트]
 *
 * @역할
 * 사용자가 "AI 추천 일정 적용" 버튼을 누른 직후, 이미 가치를 체감한 상태에서
 * 오프라인 프리미엄 기능을 제안하는 'Aha! Moment' 마케팅 컴포넌트입니다.
 *
 * @디자인 가이드
 * - Glassmorphism: 반투명 배경 + 배경 블러 (bg-white/80 backdrop-blur-xl)
 * - Framer Motion: 부드러운 여닫기 애니메이션
 * - 색상: #E85D36 (오렌지) 기조의 프리미엄 브랜딩
 *
 * @수정 적요 - 2026-03-25
 * - 신규 생성: 24개국 다국어 표준화 완료 후 프리미엄 온보딩 로직 추가
 * - t() 함수 연동: translations.ts의 중앙 집중식 번역 시스템 사용
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    WifiOff,
    Download,
    Globe,
    ShieldCheck,
    Sparkles,
    X,
    ChevronRight,
    MapPin,
    Crown
} from 'lucide-react';
import { t } from '@/lib/translations';

interface PremiumOnboardingProps {
    /** 다이얼로그 표시 여부 */
    isOpen: boolean;
    /** 닫기 핸들러 (나중에 할게요) */
    onClose: () => void;
    /** 프리미엄 시작 핸들러 (StartupDialog 다시 열기) */
    onStartPremium: () => void;
    /** 현재 선택된 언어 */
    selectedLanguage: string;
    /** AI가 추천한 명소 수 */
    recommendedCount?: number;
}

export default function PremiumOnboarding({
    isOpen,
    onClose,
    onStartPremium,
    selectedLanguage,
    recommendedCount = 0,
}: PremiumOnboardingProps) {
    // 중앙 집중식 t() 함수로 다국어 텍스트를 가져옵니다.
    // 학생들에게: 이렇게 하면 언어를 바꿔도 코드를 수정하지 않아도 됩니다!
    const lang = selectedLanguage;

    const features = [
        {
            // 오프라인 마스터 기능 설명
            icon: <WifiOff className="w-5 h-5 text-[#E85D36]" />,
            title: t('offlineMaster', lang) || 'Offline Master',
            desc: t('prepareOfflineDesc', lang) || 'Enjoy sightseeing without WiFi.',
            color: 'bg-orange-50'
        },
        {
            // 로밍비 절약 기능 설명
            icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
            title: t('unlimitedRoamingSaved', lang) || 'Roaming Saved',
            desc: t('saveGuideCostDesc', lang) || 'No roaming fees.',
            color: 'bg-emerald-50'
        },
        {
            // 24개국 글로벌 지원 설명
            icon: <Globe className="w-5 h-5 text-blue-500" />,
            title: t('globalExplorer', lang) || 'Global Explorer',
            desc: '24 languages supported',
            color: 'bg-blue-50'
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                // ① 배경 오버레이: 반투명 어둡게 처리하여 집중도를 높입니다.
                <motion.div
                    key="premium-onboarding-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={onClose} // 배경 클릭 시 닫기
                >
                    {/* ② 메인 카드: Glassmorphism 스타일 */}
                    <motion.div
                        key="premium-onboarding-card"
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden"
                        onClick={e => e.stopPropagation()} // 카드 내부 클릭은 닫기 방지
                    >
                        {/* 헤더: 오렌지 그라디언트 배경 */}
                        <div className="relative bg-gradient-to-br from-[#E85D36] to-[#ff7e5a] px-8 pt-8 pb-10 text-white">
                            {/* 닫기 버튼 */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* 아이콘: 추천 완료 뱃지 */}
                            <motion.div
                                initial={{ scale: 0.5, rotate: -15 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-xl border border-white/30 shadow-inner"
                            >
                                <Crown className="w-8 h-8 text-white" />
                            </motion.div>

                            {/* 제목: AI 추천 완료 메시지 */}
                            <h2 className="text-xl font-black tracking-tight mb-1">
                                <Sparkles className="inline w-4 h-4 mr-1.5 opacity-80" />
                                {recommendedCount > 0
                                    ? `${recommendedCount} ${selectedLanguage === 'ko' ? '곳의 완벽한 일정!' : selectedLanguage === 'ja' ? 'のルートが完成！' : `stops ready!`}`
                                    : t('startPremiumTour', lang) || 'Start Premium Tour'}
                            </h2>
                            <p className="text-sm font-semibold text-white/80">
                                {t('noInternet', lang) || 'No Internet'} · {t('offlineMaster', lang) || 'Offline Master'}
                            </p>
                        </div>

                        {/* 바디: 기능 리스트 */}
                        <div className="px-8 py-6 space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                {t('whyPremium', lang) || 'Why Premium?'}
                            </p>

                            {/* 프리미엄 기능 3가지를 카드로 표시 */}
                            {features.map((feat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + i * 0.08 }}
                                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    {/* 아이콘 배경: 각 기능별로 색상이 다릅니다. */}
                                    <div className={`w-10 h-10 ${feat.color} rounded-xl flex items-center justify-center shrink-0 shadow-inner`}>
                                        {feat.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{feat.title}</p>
                                        <p className="text-xs font-medium text-slate-400">{feat.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* 푸터: CTA 버튼 */}
                        <div className="px-8 pb-8 space-y-3">
                            {/* 프리미엄 시작 버튼 (메인 CTA) */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={onStartPremium}
                                className="w-full h-14 bg-[#E85D36] hover:bg-[#d6522c] text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/30 border-b-4 border-orange-700 flex items-center justify-center gap-3 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                {t('startPremiumTour', lang) || 'Start Premium Tour'}
                                <ChevronRight className="w-4 h-4 opacity-70" />
                            </motion.button>

                            {/* 나중에 버튼 (세컨더리 CTA) */}
                            <button
                                onClick={onClose}
                                className="w-full h-11 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {t('maybeLater', lang) || 'Maybe Later'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
