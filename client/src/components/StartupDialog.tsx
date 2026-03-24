/**
 * [교수님 노트: StartupDialog - 여행의 첫 관문 (Premium Offline Edition)]
 * @에이? "학생 여러분, 이 컴포넌트는 이제 단순한 환영 인사를 넘어, 
 * 사용자가 왜 프리미엄 오프라인 가이드를 선택해야 하는지 '후킹(Hooking)'하는 마케팅 창구 역할을 합니다."
 *
 * [수정 적요 - 2026-03-24]
 * - 지역별 선택적 다운로드(Europe, Asia, Country, All) UI 및 로직 통합
 * - 마케팅 후킹 멘트 강화: "Don't just look, experience", "Save roaming data" 등
 * - 글래스모피즘(Glassmorphism) 카드 스타일의 프리미엄 다운로드 플랜 UI 구현
 */
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Smartphone, Download, CheckCircle2, Globe, Map, AudioLines, CreditCard, X } from 'lucide-react';
import { City } from '@shared/schema';
import { audioService } from '@/lib/audioService';
import { LanguageSelector } from './LanguageSelector';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import { t } from '@/lib/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

// [삭제] getLangText 대신 중앙 집중식 t() 사용

export interface SavedTourData {
  cityId: string;
  cityName: string;
  tourStops: string[];
  savedAt: string;
}

export function getSavedTourData(): SavedTourData | null {
  const data = localStorage.getItem('saved-tour-progress');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export interface StartupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  // [프리미엄 로직] Home.tsx에서 전달하는 추가 Props들
  onSelectGPS?: () => void;
  onRestoreTour?: (data: { cityId: string; tourStops: string[]; tourTimePerStop: number }) => void;
  savedTourData?: any;
  isGpsAvailable?: boolean;
  isGpsLoading?: boolean;
}

export function StartupDialog({
  isOpen,
  onClose,
  selectedLanguage,
  onLanguageChange,
  cities,
  selectedCityId,
  onCityChange,
  onSelectGPS,
  onRestoreTour,
  savedTourData,
  isGpsAvailable,
  isGpsLoading
}: StartupDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedScope, setSelectedScope] = useState<{ type: 'all' | 'asia' | 'europe' | 'country' }>({ type: 'all' });
  const { progress, downloadData, isDownloading, isComplete } = useOfflineDownload();

  // Find country of current city
  const currentCity = cities.find(c => c.id === selectedCityId);
  const currentCountry = currentCity?.country || 'South Korea';

  const handleNext = async () => {
    if (step === 1) {
      const scope = selectedScope.type === 'country'
        ? { type: 'country' as const, countryName: currentCountry }
        : selectedScope.type === 'asia'
          ? { type: 'asia' as const }
          : selectedScope.type === 'europe'
            ? { type: 'europe' as const }
            : { type: 'all' as const };

      await downloadData(scope);
      setStep(2);
    } else if (step === 2) {
      audioService.unlockAudio();
      onClose();
    }
  };

  const getStatusText = () => {
    if (!isDownloading) return '';
    const { status, current, total } = progress;
    if (status === 'fetching_cities') return t('checkingCities', selectedLanguage) || 'Checking cities...';
    if (status === 'fetching_landmarks') return `${t('downloadingGuides', selectedLanguage) || 'Downloading Guides'} (${current}/${total})`;
    if (status === 'caching_images') return `${t('optimizingPhotos', selectedLanguage) || 'Optimizing Photos'} (${current}/${total})`;
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="max-w-[400px] w-[90vw] p-0 overflow-hidden border border-white/40 bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-glass h-[90vh] max-h-[850px] flex flex-col justify-between [&>button]:hidden ring-1 ring-black/5">
        <DialogTitle className="sr-only">Premium Tour Onboarding</DialogTitle>
        <DialogDescription className="sr-only">Experience the world without boundaries</DialogDescription>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col items-center bg-white/40 backdrop-blur-2xl overflow-y-auto"
            >
              {/* Top Branding Section */}
              <div className="w-full bg-gradient-to-br from-[#E85D36] to-[#ff7e5a] p-8 pb-10 flex flex-col items-center rounded-b-[3.5rem] shadow-2xl text-white relative shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mb-6 backdrop-blur-xl border border-white/30 shadow-inner"
                >
                  <Globe className="w-10 h-10 text-white" />
                </motion.div>

                <h1 className="text-[22px] font-black tracking-tight leading-tight text-center mb-6">
                  {t('personalAiGuide', selectedLanguage) || 'Your Personal AI Guide'}
                </h1>

                <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-xl w-full max-w-[320px] border border-white/20 shadow-lg">
                  <div className="flex-1 bg-white/90 backdrop-blur-md text-[#E85D36] py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-xs shadow-sm">
                    {t('offlineMaster', selectedLanguage) || 'Offline Master'}
                  </div>
                  <div className="flex-1 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs opacity-90">
                    <ShieldCheck className="w-4 h-4" />
                    {t('noInternet', selectedLanguage) || 'No Internet'}
                  </div>
                </div>
              </div>

              {/* Feature Hooking Section */}
              <div className="w-full px-6 pt-8 flex flex-col gap-4">
                <p className="text-center text-[11px] font-black text-[#E85D36] uppercase tracking-[0.2em] mb-1 opacity-80">
                  {t('whyPremium', selectedLanguage) || 'Why Premium Tour?'}
                </p>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-orange-100 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 shadow-inner">
                    <CheckCircle2 className="w-5 h-5 text-[#E85D36]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-slate-800 mb-0.5">
                      {t('saveGuideCost', selectedLanguage) || 'Save $200 on Local Guides'}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {t('saveGuideCostDesc', selectedLanguage) || 'Professional commentary without expensive costs.'}
                    </p>
                  </div>
                </motion.div>

                {/* Download Plan Selection */}
                <div className="mt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
                    {t('selectDownloadScope', selectedLanguage) || 'Select Download Scope'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pb-8">
                    {[
                      { id: 'all', key: 'globalExplorer', size: '~200MB' },
                      { id: 'europe', key: 'grandEurope', size: '~120MB' },
                      { id: 'asia', key: 'asiaSpecial', size: '~50MB' },
                      { id: 'country', key: 'countryOnly', size: '~10MB' },
                    ].map((plan) => (
                      <motion.button
                        key={plan.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedScope({ type: plan.id as any })}
                        className={`flex flex-col items-start justify-between p-4 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden ${selectedScope.type === plan.id
                          ? 'border-[#E85D36] bg-white shadow-xl shadow-orange-500/10'
                          : 'border-white bg-white/50 backdrop-blur-sm opacity-70 hover:opacity-100 shadow-sm'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedScope.type === plan.id ? 'border-[#E85D36]' : 'border-slate-200'}`}>
                            {selectedScope.type === plan.id && <motion.div layoutId="plan-dot" className="w-2 h-2 rounded-full bg-[#E85D36]" />}
                          </div>
                          <span className={`text-[11px] font-black leading-tight transition-colors ${selectedScope.type === plan.id ? 'text-slate-800' : 'text-slate-500'}`}>
                            {t(plan.key, selectedLanguage) || plan.id}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                          {plan.size}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-10"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-28 h-28 bg-[#E85D36] rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-orange-500/30 border-4 border-white"
              >
                <MapPin className="w-14 h-14 text-white stroke-[2.5]" />
              </motion.div>

              <h1 className="text-[28px] font-black text-slate-800 tracking-tight mb-4 text-center">
                {t('wifiOfflineOk', selectedLanguage) || 'WiFi Offline OK'}
              </h1>

              <p className="text-center text-[15px] font-semibold text-slate-400 leading-relaxed px-4 break-keep">
                {t('gpsAutoGuideDesc', selectedLanguage) || 'GPS-based audio guide. Explanations play automatically at ports worldwide without internet.'}
              </p>

              <div className="flex gap-2.5 mt-10">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <motion.div
                  layoutId="indicator"
                  className="w-6 h-2 rounded-full bg-[#E85D36]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8 w-full flex flex-col items-center gap-4 bg-white/80 backdrop-blur-xl rounded-t-[3.5rem] border-t border-white shadow-[0_-15px_40px_rgba(0,0,0,0.03)] shrink-0 z-20">
          <div className="w-full bg-slate-50 rounded-2xl px-5 py-3 flex items-center gap-4 border border-slate-100">
            <Globe className="w-5 h-5 text-slate-400" />
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>

          <Button
            className="w-full h-16 rounded-2xl bg-[#E85D36] hover:bg-[#d6522c] text-white font-black text-lg shadow-2xl shadow-orange-500/40 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 relative overflow-hidden group border-b-4 border-orange-700"
            onClick={handleNext}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full"
                  />
                  <span className="text-sm tracking-tight">{t('buildingData', selectedLanguage) || 'Building Data...'}</span>
                </div>
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{getStatusText()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Download className="w-6 h-6 group-hover:bounce" />
                <span className="tracking-tight text-xl">
                  {step === 1 ? (t('startPremiumTour', selectedLanguage) || 'Start Premium Tour') : (t('done', selectedLanguage) || 'Start Exploring')}
                </span>
              </div>
            )}

            {isDownloading && (
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </Button>

          {isComplete && step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-emerald-600 font-bold text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('offlineStorageReady', selectedLanguage) || 'Offline Storage Ready!'}
            </motion.div>
          )}

          <div className="flex w-full gap-3 mt-1">
            <button
              className="flex-1 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 font-black hover:text-slate-600 hover:border-slate-300 active:scale-95 transition-all text-sm"
              onClick={() => {
                audioService.unlockAudio();
                onClose();
              }}
            >
              {t('maybeLater', selectedLanguage) || 'Maybe Later'}
            </button>
            <div className="flex-[1.5] flex items-center justify-center bg-emerald-50 rounded-xl px-4 text-[10px] font-black text-emerald-600/80 text-center leading-tight border border-emerald-100 shadow-sm">
              {t('unlimitedRoamingSaved', selectedLanguage) || 'Unlimited Roaming Saved'}
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

export default StartupDialog;
