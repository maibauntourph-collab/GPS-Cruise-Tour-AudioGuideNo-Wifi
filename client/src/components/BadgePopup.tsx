import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Award, CheckCircle2, QrCode, Sparkles, Building2, Landmark as LandmarkIcon, Castle, Trophy, Crown, Gem } from 'lucide-react';
import { Landmark } from '@shared/schema';
import { getTranslatedContent } from '@/lib/translations';
import { generateBadgeQRData } from '@/lib/qrUtils';

/**
 * [디자이너 킴의 매직 UI] BadgePopup 컴포넌트
 * 학생 여러분, 명소 도착의 설렘을 배가시키는 화려한 팝업입니다.
 * 유리모피즘 스타일과 애니메이션을 적극 활용했습니다.
 */

interface BadgePopupProps {
    landmark: Landmark;
    language: string;
    onClose: () => void;
    onGet: (landmarkId: string) => void;
    isAcquired?: boolean;
}

export default function BadgePopup({ landmark, language, onClose, onGet, isAcquired = false }: BadgePopupProps) {
    const landmarkName = getTranslatedContent(landmark, language, 'name');
    const qrData = generateBadgeQRData(landmark.id);

    // [디자이너 킴의 매직 UI] 난이도 및 지역별 커스터마이징 로직 (HSL 기반 프리미엄 스타일)
    const getBadgeStyle = () => {
        if (landmark.isPremium) {
            return {
                tier: language === 'ko' ? '프리미엄' : 'Premium',
                color: 'from-[#10b981] via-[#06b6d4] to-[#3b82f6]', // 에메랄드-시안-블루 그라데이션
                border: 'border-emerald-500/40',
                shadow: 'shadow-[0_0_50px_rgba(16,185,129,0.4)]',
                icon: <Gem className="w-12 h-12" />,
                medal: <Crown className="w-5 h-5 text-emerald-400" />,
                glow: 'bg-emerald-500/20'
            };
        }

        const name = landmark.id.toLowerCase();
        // [강의 노트] 명소의 역사적 중요도에 따른 자동 티어 배정 로직
        if (name.includes('colosseum') || name.includes('vatican') || name.includes('eiffel') || name.includes('notre')) {
            return {
                tier: language === 'ko' ? '골드 퀘스트' : 'Gold Quest',
                color: 'from-[#f59e0b] via-[#fbbf24] to-[#d97706]', // 황금빛 그라데이션
                border: 'border-amber-400/40',
                shadow: 'shadow-[0_0_50px_rgba(245,158,11,0.4)]',
                icon: <Trophy className="w-12 h-12" />,
                medal: <Sparkles className="w-5 h-5 text-amber-400" />,
                glow: 'bg-amber-500/20'
            };
        }

        if (landmark.category?.includes('Ancient') || name.includes('fountain') || landmark.category === 'Museum') {
            return {
                tier: language === 'ko' ? '실버 익스플로러' : 'Silver Explorer',
                color: 'from-[#94a3b8] via-[#cbd5e1] to-[#64748b]', // 은빛 슬레이트 그라데이션
                border: 'border-slate-300/40',
                shadow: 'shadow-[0_0_50px_rgba(148,163,184,0.4)]',
                icon: <Award className="w-12 h-12" />,
                medal: <Award className="w-5 h-5 text-slate-300" />,
                glow: 'bg-slate-400/20'
            };
        }

        return {
            tier: language === 'ko' ? '브론즈 어드벤처' : 'Bronze Adventure',
            color: 'from-[#c2410c] via-[#ea580c] to-[#9a3412]', // 구리빛 오렌지 그라데이션
            border: 'border-orange-500/40',
            shadow: 'shadow-[0_0_50px_rgba(194,65,12,0.4)]',
            icon: <LandmarkIcon className="w-12 h-12" />,
            medal: <CheckCircle2 className="w-5 h-5 text-orange-500" />,
            glow: 'bg-orange-600/20'
        };
    };

    const getCitySymbol = () => {
        const cityId = (landmark.cityId || '').toLowerCase();
        if (cityId === 'rome') return <Building2 className="w-32 h-32 absolute -bottom-8 -right-8 text-primary/10 rotate-12" />;
        if (cityId === 'paris') return <LandmarkIcon className="w-32 h-32 absolute -bottom-8 -right-8 text-primary/10 rotate-12" />;
        return <Castle className="w-32 h-32 absolute -bottom-8 -right-8 text-primary/10 rotate-12" />;
    };

    const style = getBadgeStyle();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed inset-x-4 bottom-28 sm:left-auto sm:right-8 sm:w-[440px] z-[3000]"
        >
            <Card className={`relative overflow-hidden bg-background/40 backdrop-blur-[32px] border-t-2 ${style.border} ${style.shadow} p-10 rounded-[3rem] transition-all duration-700`}>
                {/* [디자이너 킴의 매직] 배경 글로우 효과 */}
                <div className={`absolute -top-32 -left-32 w-64 h-64 ${style.glow} blur-[100px] rounded-full pointer-events-none opacity-60`} />

                {/* Regional Symbol Ornament */}
                <div className="absolute -bottom-4 -right-4 overflow-hidden w-40 h-40 pointer-events-none opacity-[0.08]">
                    {getCitySymbol()}
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-8">
                    <motion.div
                        animate={{
                            rotate: [5, -5, 5],
                            scale: [1, 1.1, 1],
                            y: [0, -5, 0]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-24 h-24 bg-gradient-to-br ${style.color} rounded-[2rem] flex items-center justify-center text-white mb-2 shadow-2xl shadow-primary/20 transform rotate-6 relative`}
                    >
                        {style.icon}
                        <div className="absolute -top-3 -right-3 bg-white/30 backdrop-blur-xl p-2 rounded-full border border-white/40 shadow-xl">
                            {style.medal}
                        </div>
                    </motion.div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-center">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-5 py-2 uppercase text-[12px] font-black tracking-[0.25em] rounded-full backdrop-blur-md">
                                {style.tier}
                            </Badge>
                        </div>
                        <h3 className="text-4xl font-black tracking-tight mt-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
                            {landmarkName}
                        </h3>
                        <p className="text-muted-foreground/90 text-sm font-semibold leading-relaxed px-6">
                            {language === 'ko'
                                ? '명소의 정기가 느껴지시나요? 아래 QR 코드를 탭하여 당신만의 특별한 콜렉션을 완성하세요!'
                                : "Can you feel the aura? Tap the QR code below to complete your exclusive digital collection!"}
                        </p>
                    </div>

                    {/* QR Code Canvas with Deep Glass Border */}
                    <motion.div
                        whileHover={{ scale: 1.04, rotate: -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => !isAcquired && onGet(landmark.id)}
                        className={`cursor-pointer p-6 bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border-[8px] ${isAcquired ? 'border-emerald-500' : 'border-primary/5'} relative transition-all duration-500 overflow-hidden group`}
                    >
                        <QRCodeSVG value={qrData} size={200} level="H" includeMargin={false} />

                        {/* Interactive Shine Effect */}
                        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {isAcquired && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-emerald-500/15 backdrop-blur-[3px]"
                            >
                                <motion.div
                                    initial={{ y: 20 }}
                                    animate={{ y: 0 }}
                                    className="bg-emerald-500 text-white p-5 rounded-full shadow-[0_10px_40px_rgba(16,185,129,0.6)]"
                                >
                                    <CheckCircle2 className="w-12 h-12" />
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Action Buttons: Ultra-Premium Style */}
                    <div className="flex gap-5 w-full mt-6">
                        <Button
                            variant="ghost"
                            className="flex-1 rounded-[1.5rem] h-16 font-black text-muted-foreground/70 hover:bg-muted/30 hover:text-foreground transition-all text-lg"
                            onClick={onClose}
                        >
                            {language === 'ko' ? '나중에' : 'Later'}
                        </Button>
                        <Button
                            className={`flex-1 rounded-[1.5rem] h-16 font-black shadow-2xl transition-all relative overflow-hidden group text-lg ${isAcquired ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-primary/90'
                                }`}
                            onClick={() => !isAcquired ? onGet(landmark.id) : onClose()}
                        >
                            <span className="relative z-10">
                                {isAcquired
                                    ? (language === 'ko' ? '완료' : 'Done')
                                    : (language === 'ko' ? '배지 수집' : 'Collect')}
                            </span>
                            {!isAcquired && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Close Button: Discreet Glass Style */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-3 text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 rounded-full transition-all backdrop-blur-sm"
                >
                    <X className="w-5 h-5" />
                </button>
            </Card>
        </motion.div>
    );
}
