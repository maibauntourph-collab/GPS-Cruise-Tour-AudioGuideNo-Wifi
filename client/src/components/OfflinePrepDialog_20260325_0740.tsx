import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    CloudDownload,
    Smartphone,
    CheckCircle2,
    Loader2,
    WifiOff,
    Sparkles,
    Zap,
    Download,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, uiTranslations } from '@/lib/translations';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface OfflinePrepDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedLanguage: string;
}

/**
 * 🎓 오프라인 준비 다이얼로그 (OfflinePrepDialog)
 * 
 * 학생 여러분, 이 컴포넌트는 오프라인 환경에서도 앱이 완벽하게 작동할 수 있도록
 * 에셋을 미리 다운로드하고 PWA 설치를 유도하는 '프리미엄 준비 센터'입니다.
 * 글래스모피즘 디자인과 애니메이션을 통해 사용자에게 신뢰감을 줍니다.
 */
export default function OfflinePrepDialog({
    isOpen,
    onClose,
    selectedLanguage
}: OfflinePrepDialogProps) {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
    const [progress, setProgress] = useState(0);
    const [isPwaInstalled, setIsPwaInstalled] = useState(false);

    useEffect(() => {
        // 1. PWA 설치 프롬프트 이벤트 리스너
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // 2. 이미 설치되었는지 확인
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsPwaInstalled(isStandalone);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallPWA = async () => {
        if (!installPrompt) return;

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsPwaInstalled(true);
            setInstallPrompt(null);
        }
    };

    const handleDownloadTranslations = async () => {
        setDownloadStatus('downloading');
        setProgress(0);

        // 시뮬레이션: 실제로는 uiTranslations를 LocalStorage에 저장
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            setProgress((i / steps) * 100);
        }

        try {
            // 24개국어 번역 데이터를 로컬 스토리지에 캐싱
            localStorage.setItem('offline_translations_cached', 'true');
            localStorage.setItem('offline_translations_data', JSON.stringify(uiTranslations));
            localStorage.setItem('offline_translations_timestamp', new Date().toISOString());

            setDownloadStatus('completed');
        } catch (error) {
            console.error('Failed to cache translations:', error);
            setDownloadStatus('idle');
        }
    };

    const isReady = isPwaInstalled && downloadStatus === 'completed';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white/80 backdrop-blur-2xl border-white/40 shadow-2xl rounded-[2.5rem]">
                {/* 상단 헤더 섹션 - 프리미엄 그라데이션 */}
                <div className="relative bg-gradient-to-br from-[#E85D36] to-[#ff8c6d] p-8 text-white overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"
                    />

                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                                <CloudDownload className="w-6 h-6 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-white/40 backdrop-blur-sm text-[10px] py-0 px-2 uppercase tracking-widest font-bold">
                                Premium Offline
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-white mb-1">
                            {t('offlinePreparation', selectedLanguage)}
                        </DialogTitle>
                        <DialogDescription className="text-white/80 font-medium text-sm leading-relaxed">
                            {t('preparingAssets', selectedLanguage)}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* 메인 컨텐츠 영역 */}
                <div className="p-8 space-y-6">
                    {/* 단계 1: PWA 설치 */}
                    <div className={`p-4 rounded-3xl border transition-all duration-500 ${isPwaInstalled ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isPwaInstalled ? 'bg-emerald-500 text-white' : 'bg-white text-[#E85D36]'}`}>
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800">{t('installWebApp', selectedLanguage)}</h4>
                                    <p className="text-[11px] text-slate-500 font-bold">{isPwaInstalled ? 'Installed' : 'Ready to install'}</p>
                                </div>
                            </div>
                            {isPwaInstalled ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={handleInstallPWA}
                                    disabled={!installPrompt}
                                    className="bg-[#E85D36] hover:bg-[#d6522c] text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/20"
                                >
                                    {installPrompt ? 'Install' : <Loader2 className="w-3 h-3 animate-spin" />}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 단계 2: 번역 데이터 다운로드 */}
                    <div className={`p-4 rounded-3xl border transition-all duration-500 ${downloadStatus === 'completed' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${downloadStatus === 'completed' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}>
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800">{t('downloadTranslations', selectedLanguage)}</h4>
                                    <p className="text-[11px] text-slate-500 font-bold">24 Languages (UI Text)</p>
                                </div>
                            </div>
                            {downloadStatus === 'completed' ? (
                                <CheckCircle2 className="w-6 h-6 text-blue-500" />
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={handleDownloadTranslations}
                                    disabled={downloadStatus === 'downloading'}
                                    variant="outline"
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 font-black text-xs rounded-xl"
                                >
                                    {downloadStatus === 'downloading' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Download'}
                                </Button>
                            )}
                        </div>

                        {downloadStatus === 'downloading' && (
                            <div className="space-y-2 px-1">
                                <Progress value={progress} className="h-2 bg-blue-100" />
                                <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 하단 상태 요약 */}
                    <AnimatePresence>
                        {isReady && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-4 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20"
                            >
                                <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                                <div className="flex-1">
                                    <h5 className="text-xs font-black uppercase tracking-wider">{t('offlineReady', selectedLanguage)}</h5>
                                    <p className="text-[10px] font-medium opacity-90">{t('allTranslationsCached', selectedLanguage)}</p>
                                </div>
                                <Sparkles className="w-5 h-5" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                        onClick={onClose}
                    >
                        {isReady ? 'Confirm & Close' : 'Close'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
