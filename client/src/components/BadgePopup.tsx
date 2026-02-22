import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Award, CheckCircle2, QrCode, Sparkles } from 'lucide-react';
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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed inset-x-4 bottom-24 sm:left-auto sm:right-4 sm:w-[380px] z-[3000]"
        >
            <Card className="relative overflow-hidden bg-background/80 backdrop-blur-xl border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.2)] p-6 rounded-3xl">
                {/* Background Sparkles */}
                <div className="absolute top-0 right-0 p-4 text-indigo-500/20">
                    <Sparkles className="w-20 h-20 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-2">
                        <Award className="w-10 h-10" />
                    </div>

                    <div className="space-y-1">
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-3">
                            {language === 'ko' ? '새로운 투어 배지' : 'New Tour Badge'}
                        </Badge>
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
                    <div className="flex gap-2 w-full mt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-12"
                            onClick={onClose}
                        >
                            {language === 'ko' ? '나중에' : 'Later'}
                        </Button>
                        <Button
                            className={`flex-1 rounded-xl h-12 ${isAcquired ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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
