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
import { MapPin, Smartphone, Download, CheckCircle2, Globe, Map, AudioLines, CreditCard } from 'lucide-react';
import { City } from '@shared/schema';
import { audioService } from '@/lib/audioService';
import { LanguageSelector } from './LanguageSelector';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';

function getLangText(lang: string, ko: string, en: string, th: string): string {
  if (lang === 'ko') return ko;
  if (lang === 'th') return th;
  return en;
}

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
}

export function StartupDialog({
  isOpen,
  onClose,
  selectedLanguage,
  onLanguageChange,
  cities,
  selectedCityId,
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
    if (status === 'fetching_cities') return getLangText(selectedLanguage, '도시 정보 확인 중...', 'Checking cities...', 'กำลังตรวจสอบเมือง...');
    if (status === 'fetching_landmarks') return getLangText(selectedLanguage, `가이드 다운로드 (${current}/${total})`, `Downloading Guides (${current}/${total})`, `ดาวน์โหลดคู่มือ (${current}/${total})`);
    if (status === 'caching_images') return getLangText(selectedLanguage, `현장 사진 최적화 중 (${current}/${total})`, `Optimizing Photos (${current}/${total})`, `ปรับรูปภาพให้เหมาะสม (${current}/${total})`);
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="max-w-[400px] w-[90vw] p-0 overflow-hidden border-0 bg-white rounded-[2.5rem] shadow-2xl h-[90vh] max-h-[850px] flex flex-col justify-between [&>button]:hidden">
        <DialogTitle className="sr-only">Premium Tour Onboarding</DialogTitle>
        <DialogDescription className="sr-only">Experience the world without boundaries</DialogDescription>

        {step === 1 ? (
          <div className="flex-1 flex flex-col items-center bg-[#F8F9FA] overflow-y-auto">
            {/* Top Branding Section */}
            <div className="w-full bg-[#E85D36] p-8 pb-10 flex flex-col items-center rounded-b-[3rem] shadow-xl text-white relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
              >
                <span className="text-xl">×</span>
              </button>

              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <Globe className="w-8 h-8 text-white animate-pulse" />
              </div>

              <h1 className="text-[20px] font-black tracking-tight leading-tight text-center mb-4">
                {getLangText(selectedLanguage, '당신의 AI 개인 가이드', 'Your Personal AI Guide', 'ไกด์ส่วนตัว AI ของคุณ')}
              </h1>

              <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-md w-full max-w-[300px] border border-white/20">
                <div className="flex-1 bg-white text-[#E85D36] py-2 rounded-xl flex items-center justify-center gap-2 font-black text-xs shadow-sm">
                  {getLangText(selectedLanguage, '오프라인 마스터', 'Offline Master', 'มาสเตอร์ออฟไลน์')}
                </div>
                <div className="flex-1 text-white py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs opacity-90">
                  <ShieldCheck className="w-3 h-3" />
                  {getLangText(selectedLanguage, '인터넷 불필요', 'No Internet', 'ไม่ต้องเน็ต')}
                </div>
              </div>
            </div>

            {/* Feature Hooking Section */}
            <div className="w-full px-6 pt-8 flex flex-col gap-3">
              <p className="text-center text-[12px] font-black text-[#E85D36] uppercase tracking-widest mb-1">
                {getLangText(selectedLanguage, '왜 투어 세트를 예약해야 하나요?', 'Why Premium Tour?', 'ทำไมต้องพรีเมียม?')}
              </p>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#E85D36]" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-slate-800">
                    {getLangText(selectedLanguage, '현지 가이드 비용 $200 절약', 'Save $200 on Local Guides', 'ประหยัดเงิน $200 สำหรับไกด์ท้องถิ่น')}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500">
                    {getLangText(selectedLanguage, '비싼 현지 가이드 없이도 전문가의 설명을 듣습니다.', 'Professional commentary without expensive costs.', 'คำบรรยายระดับมืออาชีพโดยไม่ต้องเสียเงินแพงๆ')}
                  </p>
                </div>
              </div>

              {/* [NEW] Download Plan Selection */}
              <div className="mt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                  {getLangText(selectedLanguage, '프리미엄 다운로드 범위 선택', 'Select Download Scope', 'เลือกแผนการดาวน์โหลด')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: { ko: '글로벌 익스플로러', en: 'Global Explorer', th: 'แผนที่ทั่วโลก' }, size: '~200MB' },
                    { id: 'europe', label: { ko: '유럽 전체투어', en: 'Grand Europe', th: 'ทัวร์ยุโรป' }, size: '~120MB' },
                    { id: 'asia', label: { ko: '아시아 정복', en: 'Asia Special', th: 'เอเชียสเปเชียล' }, size: '~50MB' },
                    { id: 'country', label: { ko: `${currentCountry.substring(0, 6)}.. 전용`, en: `${currentCountry.substring(0, 6)}.. Only`, th: `${currentCountry.substring(0, 6)}` }, size: '~10MB' },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedScope({ type: plan.id as any })}
                      className={`flex flex-col items-start justify-between p-3 rounded-2xl border-2 transition-all ${selectedScope.type === plan.id
                        ? 'border-[#E85D36] bg-orange-50/50 shadow-md scale-[1.02]'
                        : 'border-slate-100 bg-white opacity-70 hover:opacity-100'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedScope.type === plan.id ? 'border-[#E85D36]' : 'border-slate-300'}`}>
                          {selectedScope.type === plan.id && <div className="w-1.5 h-1.5 rounded-full bg-[#E85D36]" />}
                        </div>
                        <span className={`text-[10px] font-black leading-tight ${selectedScope.type === plan.id ? 'text-slate-800' : 'text-slate-500'}`}>
                          {getLangText(selectedLanguage, plan.label.ko, plan.label.en, plan.label.th)}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 tabular-nums bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {plan.size}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 mt-10">
            <div className="w-24 h-24 bg-[#E85D36] rounded-[2rem] flex items-center justify-center mb-8 shadow-lg shadow-orange-500/30">
              <MapPin className="w-12 h-12 text-white stroke-[2.5]" />
            </div>

            <h1 className="text-[26px] font-black text-slate-800 tracking-tight mb-4 text-center">
              {getLangText(selectedLanguage, '기다림 없는 투어', 'Zero-Wait Tour', 'ทัวร์ไม่ต้องรอ')}
            </h1>

            <p className="text-center text-[15px] font-medium text-slate-500 leading-relaxed px-2">
              {getLangText(selectedLanguage,
                '인터넷 없이도 전 세계 기항지에서 자동으로 가이드가 시작됩니다.',
                'Guide starts automatically at ports worldwide without internet.',
                'ไกด์เริ่มต้นโดยอัตโนมัติทั่วโลกโดยไม่ต้องใช้อินเทอร์เน็ต'
              )}
            </p>

            <div className="flex gap-2 mt-8 mb-4">
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="w-5 h-2 rounded-full bg-[#E85D36]" />
            </div>
          </div>
        )}

        <div className="p-6 pb-8 w-full flex flex-col items-center gap-3 bg-[#F8F9FA] rounded-t-[2.5rem] border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] shrink-0">
          <div className="w-full bg-white rounded-xl px-4 py-2.5 flex items-center gap-3 border border-slate-200 shadow-sm">
            <Globe className="w-4 h-4 text-slate-400" />
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>

          <Button
            className="w-full h-14 rounded-xl bg-[#E85D36] hover:bg-[#d6522c] text-white font-black text-lg shadow-xl shadow-orange-500/30 transition-transform active:scale-95 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden"
            onClick={handleNext}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm tracking-tight">{getLangText(selectedLanguage, '프리미엄 데이터 구축 중...', 'Building Data...', 'กำลังสร้างข้อมูล...')}</span>
                </div>
                <span className="text-[9px] font-medium opacity-80 uppercase tracking-widest">{getStatusText()}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5" />
                  <span className="tracking-tight">{step === 1 ? getLangText(selectedLanguage, '프리미엄 투어 시작', 'Start Premium Tour', 'เริ่มพรีเมียมทัวร์') : getLangText(selectedLanguage, '탐험 시작', 'Start Exploring', 'เริ่มการสำรวจ')}</span>
                </div>
              </>
            )}

            {isDownloading && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                />
              </div>
            )}
          </Button>

          {isComplete && step === 1 && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[11px] animate-bounce">
              <CheckCircle2 className="w-3 h-3" />
              {getLangText(selectedLanguage, '오프라인 저장 완료!', 'Offline Storage Ready!', 'บันทึกออฟไลน์แล้ว!')}
            </div>
          )}

          <div className="flex w-full gap-2 mt-1">
            <button
              className="flex-1 h-10 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 font-bold hover:text-slate-600 active:scale-95 transition-all text-[11px]"
              onClick={() => {
                audioService.unlockAudio();
                onClose();
              }}
            >
              {getLangText(selectedLanguage, '나중에 하기', 'Maybe Later', 'ไว้ทีหลัง')}
            </button>
            <div className="flex-[1.5] flex items-center justify-center bg-slate-100 rounded-lg px-2 text-[9px] font-bold text-slate-400 text-center leading-tight">
              {getLangText(selectedLanguage, '로밍 데이터 무제한 절약', 'Unlimited Roaming Data Saved', 'ประหยัดข้อมูลโรมมิ่งแบบไม่อั้น')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StartupDialog;
