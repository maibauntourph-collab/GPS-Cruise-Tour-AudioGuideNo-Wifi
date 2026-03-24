import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, WifiOff, Smartphone, Share, PlusSquare, MapPin, Volume2, Navigation, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t as translate } from '@/lib/translations';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  selectedLanguage?: string;
  onDownloadClick?: (language: string) => void;
  onClose?: () => void; // 🎖️ [Dodari] 시퀀스 제어를 위한 클로즈 콜백 추가
}

const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'ru'];

// [삭제] 로컬 translations 객체를 제거하고 중앙 t() 함수로 대체

export default function InstallPrompt({ selectedLanguage = 'ko', onDownloadClick, onClose }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'download'>('install');
  const [selectedDownloadLanguage, setSelectedDownloadLanguage] = useState(selectedLanguage || 'ko');

  const t = (key: string) => translate(key, selectedLanguage);

  useEffect(() => {
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsIOS(checkIOS);
    setIsStandalone(checkStandalone);

    if (checkStandalone) {
      if (onClose) onClose();
      return;
    }

    const hasShownSession = sessionStorage.getItem('pwa-welcome-shown');

    if (!hasShownSession) {
      setShowPrompt(true);
    } else {
      if (onClose) onClose();
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
      localStorage.removeItem('pwa-install-dismissed-at');
    } else {
      console.log('[PWA] User dismissed install');
    }

    // 🎖️ [Fix] Set session flag to prevent reappearance
    sessionStorage.setItem('pwa-welcome-shown', 'true');

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());

    // 🎖️ [Fix] Set session flag to prevent reappearance
    sessionStorage.setItem('pwa-welcome-shown', 'true');

    if (onClose) onClose(); // 🎖️ [Dodari] 닫힘 알림
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && !isStandalone && (
        <motion.div
          key="install-prompt-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden"
        >
          <motion.div
            key="install-prompt-dialog"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-glass overflow-hidden flex flex-col border border-white/40 ring-1 ring-black/5"
          >
            <div className="relative bg-gradient-to-br from-[#E85D36] to-[#ff7e5a] p-8 text-center flex-shrink-0 text-white shadow-lg shadow-orange-500/10">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-inner border border-white/30"
              >
                <Smartphone className="w-10 h-10 text-white" />
              </motion.div>

              <h1 className="text-2xl font-black mb-3 tracking-tight">
                {t('welcomeTitle')}
              </h1>

              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <WifiOff className="w-4 h-4 text-white" />
                <span className="text-xs font-black uppercase tracking-wider">{t('offlineModeSupported')}</span>
              </div>

              <div className="flex gap-2 mt-8 justify-center p-1 bg-black/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <button
                  onClick={() => setActiveTab('install')}
                  className={`flex-1 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'install'
                    ? 'bg-white text-[#E85D36] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {t('installTab')}
                </button>
                <button
                  onClick={() => setActiveTab('download')}
                  className={`flex-1 px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'download'
                    ? 'bg-white text-[#E85D36] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('downloadTab')}
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 min-h-0 bg-slate-50/30">
              <AnimatePresence mode="wait">
                {activeTab === 'install' ? (
                  <motion.div
                    key="tab-install"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <p className="text-center text-slate-500 font-bold leading-relaxed px-4 text-sm">
                      {t('installDescription')}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white shadow-sm transition-all hover:bg-white/80">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <MapPin className="w-5 h-5 text-[#E85D36]" />
                        </div>
                        <span className="text-sm font-black text-slate-700">{t('featureOfflineMaps')}</span>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white shadow-sm transition-all hover:bg-white/80">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <Globe className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-black text-slate-700">{t('featureVoiceGuide')}</span>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white shadow-sm transition-all hover:bg-white/80">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <Navigation className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-sm font-black text-slate-700">{t('featureCityGuide')}</span>
                      </div>
                    </div>

                    {isIOS ? (
                      <div className="p-6 bg-[#E85D36]/5 rounded-3xl border border-[#E85D36]/10">
                        <h3 className="text-xs font-black text-[#E85D36] mb-5 tracking-widest uppercase text-center">
                          {t('iosInstallTitle')}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-white text-[#E85D36] flex items-center justify-center text-sm font-black shadow-sm border border-orange-100 italic">1</div>
                            <div className="flex-1 flex items-center gap-3">
                              <Share className="w-5 h-5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-500">{t('iosStep1')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-white text-[#E85D36] flex items-center justify-center text-sm font-black shadow-sm border border-orange-100 italic">2</div>
                            <div className="flex-1 flex items-center gap-3">
                              <PlusSquare className="w-5 h-5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-500">{t('iosStep2')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-white text-[#E85D36] flex items-center justify-center text-sm font-black shadow-sm border border-orange-100 italic">3</div>
                            <span className="text-sm font-bold text-slate-500">{t('iosStep3')}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3 pt-2">
                      {deferredPrompt && !isIOS ? (
                        <Button
                          onClick={handleInstall}
                          className="w-full h-16 text-lg font-black bg-[#E85D36] hover:bg-[#d6522c] rounded-2xl shadow-xl shadow-orange-500/30 border-b-4 border-orange-700 active:scale-[0.98] transition-all"
                        >
                          <Download className="w-6 h-6 mr-3" />
                          {t('installNow')}
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        className="w-full h-14 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isIOS ? t('continueWeb') : (deferredPrompt ? t('maybeLater') : t('continueWeb'))}
                      </Button>
                    </div>

                    <p className="text-[10px] font-black text-emerald-600/60 text-center tracking-widest uppercase">
                      {t('offlineBenefit')}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-download"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <h2 className="text-lg font-black text-slate-800">{t('downloadAudio')}</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('selectLanguage')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto px-1 py-1 custom-scrollbar">
                      {['en', 'ko', 'ja', 'zh-CN', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'vi', 'th', 'id', 'ar', 'hi', 'tr'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedDownloadLanguage(lang)}
                          className={`p-4 rounded-2xl text-xs font-black transition-all border-2 ${selectedDownloadLanguage === lang
                            ? 'bg-orange-50 border-[#E85D36] text-[#E85D36] shadow-lg shadow-orange-500/5'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                            }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={() => {
                          if (onDownloadClick) {
                            onDownloadClick(selectedDownloadLanguage);
                            handleDismiss();
                          }
                        }}
                        className="w-full h-16 text-lg font-black bg-[#E85D36] hover:bg-[#d6522c] rounded-2xl shadow-xl shadow-orange-500/30 border-b-4 border-orange-700 active:scale-[0.98] transition-all"
                      >
                        <Download className="w-6 h-6 mr-3" />
                        {t('startDownload')}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        className="w-full h-14 text-sm font-black text-slate-400 hover:text-slate-600"
                      >
                        {t('continueWeb')}
                      </Button>
                    </div>

                    <p className="text-[10px] font-black text-slate-400 text-center tracking-tight leading-relaxed px-4 opacity-80">
                      {t('selectCityFirst')}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
