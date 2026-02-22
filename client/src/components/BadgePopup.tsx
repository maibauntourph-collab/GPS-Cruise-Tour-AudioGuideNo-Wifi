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

    // [강의 노트] 난이도 및 지역별 커스터마이징 로직
    const getBadgeStyle = () => {
        if (landmark.isPremium) {
            return {
                tier: language === 'ko' ? '프리미엄' : 'Premium',
                color: 'from-emerald-400 to-cyan-500',
                border: 'border-emerald-500/30',
                shadow: 'shadow-[0_0_40px_rgba(16,185,129,0.3)]',
                icon: <Gem className="w-10 h-10" />,
                medal: <Crown className="w-5 h-5 text-emerald-500" />
            };
        }

        // 카테고리나 명칭 기반으로 임의 난이도 배정 (실제 업무에서는 DB 필드 추가 권장)
        const name = landmark.id.toLowerCase();
        if (name.includes('colosseum') || name.includes('vatican') || name.includes('eiffel')) {
            return {
                tier: language === 'ko' ? '골드 메달' : 'Gold Medal',
                color: 'from-amber-300 to-orange-500',
                border: 'border-amber-500/30',
                shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.3)]',
                icon: <Trophy className="w-10 h-10" />,
                medal: <Award className="w-5 h-5 text-amber-500" />
            };
        }

        if (landmark.category?.includes('Ancient') || name.includes('fountain') || name.length > 10) {
            return {
                tier: language === 'ko' ? '실버 메달' : 'Silver Medal',
                color: 'from-slate-300 to-slate-500',
                border: 'border-slate-400/30',
                shadow: 'shadow-[0_0_40px_rgba(148,163,184,0.3)]',
                icon: <Award className="w-10 h-10" />,
                medal: <Award className="w-5 h-5 text-slate-400" />
            };
        }

        return {
            tier: language === 'ko' ? '브론즈 메달' : 'Bronze Medal',
            color: 'from-orange-400 to-orange-700',
            border: 'border-orange-500/30',
            shadow: 'shadow-[0_0_40px_rgba(194,65,12,0.3)]',
            icon: <Award className="w-10 h-10" />,
            medal: <Award className="w-5 h-5 text-orange-600" />
        };
    };

    const getCitySymbol = () => {
        const cityId = landmark.cityId.toLowerCase();
        if (cityId === 'rome') return <Building2 className="w-20 h-20 rotate-12" />;
        if (cityId === 'paris') return <LandmarkIcon className="w-20 h-20 rotate-12" />;
        return <Castle className="w-20 h-20 rotate-12" />;
    };

    const style = getBadgeStyle();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed inset-x-4 bottom-24 sm:left-auto sm:right-4 sm:w-[380px] z-[3000]"
        >
            <Card className={`relative overflow-hidden bg-background/80 backdrop-blur-xl border-t-4 ${style.border} ${style.shadow} p-6 rounded-3xl`}>
                {/* Background Regional Symbol */}
                <div className="absolute top-0 right-0 p-4 text-primary/5">
                    {getCitySymbol()}
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${style.color} rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg transform rotate-3`}>
                        {style.icon}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                            {style.medal}
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-3 uppercase text-[10px] font-bold tracking-widest">
                                {style.tier}
                            </Badge>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mt-2">{landmarkName}</h3>
                        <p className="text-muted-foreground text-sm">
                            {language === 'ko'
                                ? '명소에 도착하셨습니다! 아래 QR을 터치하여 배지를 획득하세요.'
                                : "You've arrived! Tap the QR below to collect your badge."}
                        </p>
                    </div>

                    {/* QR Code Area */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => !isAcquired && onGet(landmark.id)}
                        className={`cursor-pointer p-4 bg-white rounded-2xl shadow-lg border-4 ${isAcquired ? 'border-green-500' : 'border-indigo-500/30'} relative transition-colors`}
                    >
                        <QRCodeSVG value={qrData} size={160} level="H" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
                            <QrCode className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        {isAcquired && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full shadow-lg"
                            >
                                <CheckCircle2 className="w-6 h-6" />
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full mt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-12 border-primary/10 hover:bg-primary/5"
                            onClick={onClose}
                        >
                            {language === 'ko' ? '나중에' : 'Later'}
                        </Button>
                        <Button
                            className={`flex-1 rounded-xl h-12 font-bold shadow-lg transition-all ${isAcquired ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}`}
                            onClick={() => !isAcquired ? onGet(landmark.id) : onClose()}
                        >
                            {isAcquired
                                ? (language === 'ko' ? '확인' : 'OK')
                                : (language === 'ko' ? '배지 획득' : 'Get It!')}
                        </Button>
                    </div>
                </div>

                {/* Close Icon */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </Card>
        </motion.div>
    );
}
