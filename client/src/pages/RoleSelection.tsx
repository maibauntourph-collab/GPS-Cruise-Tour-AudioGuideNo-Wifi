import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, History, Route, Clock, Navigation,
  Loader2, Sparkles, Shield, User, Users, Store,
  Globe, Plane, Ship, Activity, Compass, ChevronRight,
  Languages, Heart
} from 'lucide-react';
import InstallPrompt from '@/components/InstallPrompt';
import { getSavedTourData, SavedTourData } from '@/components/StartupDialog';
import { t } from '@/lib/translations';

/**
 * [교수님 노트: 프리미엄 역할 선택 시스템]
 * 이 페이지는 단순한 버튼 나열이 아닌, 사용자의 '정체성(Identity)'을 정의하는 첫 관문입니다.
 * 
 * 디자인 포인트:
 * 1. Glassmorphism: 배경 블러와 반투명 테두리를 사용하여 깊이감 있는 세련미를 구현했습니다.
 * 2. Motion Design: framer-motion을 활용하여 요소들이 순차적으로 나타나는(Stagger) 효과를 주어 앱의 프리미엄 가치를 높였습니다.
 * 3. Gradient System: 각 역할마다 고유한 그라데이션 컬러를 부여하여 시각적 직관성을 극대화했습니다.
 */

const ROLES = [
  {
    id: 'traveler',
    path: '/home',
    icon: Compass,
    color: 'from-blue-500 to-indigo-600',
    hoverColor: 'shadow-blue-500/20',
    title: { ko: '관광객 모드', en: 'Traveler Mode' },
    desc: { ko: 'GPS 기반 오디오 가이드와 함께 도시를 탐험하세요', en: 'Explore cities with GPS-based audio guides' },
    badge: { ko: '가장 인기', en: 'Most Popular' }
  },
  {
    id: 'guide',
    path: '/guide',
    icon: MapPin,
    color: 'from-emerald-500 to-teal-600',
    hoverColor: 'shadow-emerald-500/20',
    title: { ko: '현지 가이드', en: 'Local Guide' },
    desc: { ko: '새로운 숨은 명소를 추가하고 콘텐츠를 관리하세요', en: 'Add hidden gems and manage tour content' },
    badge: null
  },
  {
    id: 'leader',
    path: '/tour-leader',
    icon: Users,
    color: 'from-amber-500 to-orange-600',
    hoverColor: 'shadow-amber-500/20',
    title: { ko: '투어 인솔자', en: 'Tour Leader' },
    desc: { ko: '그룹 멤버의 현황과 전체 투어 일정을 관리하세요', en: 'Manage group members and tour schedules' },
    badge: { ko: '관리 도구', en: 'Admin Tool' }
  },
  {
    id: 'admin',
    path: '/admin',
    icon: Shield,
    color: 'from-rose-500 to-pink-600',
    hoverColor: 'shadow-rose-500/20',
    title: { ko: '시스템 마스터', en: 'System Admin' },
    desc: { ko: '전체 플랫폼 통계 및 고도화 설정을 수행합니다', en: 'Perform platform stats and advanced settings' },
    badge: null
  }
];

export default function RoleSelection() {
  const [, setLocation] = useLocation();
  const [savedTourData, setSavedTourData] = useState<SavedTourData | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('selected-language');
    return saved || 'ko';
  });

  useEffect(() => {
    // [적요: 이전 데이터 복원] 기존에 진행 중이던 투어 데이터가 있는지 확인합니다.
    const saved = getSavedTourData();
    setSavedTourData(saved);
  }, []);

  const toggleLanguage = () => {
    const newLang = selectedLanguage === 'ko' ? 'en' : 'ko';
    setSelectedLanguage(newLang);
    localStorage.setItem('selected-language', newLang);
  };

  const handleRoleSelect = (path: string, id: string) => {
    if (id === 'traveler') {
      // 로직 유지: GPS 기반 시작 여부 팝업 등이 필요할 수 있으므로 home으로 먼저 보냄
      localStorage.setItem('startup-mode', 'gps');
    }
    setLocation(path);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(selectedLanguage === 'ko' ? 'ko-KR' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white selection:bg-primary/30 relative overflow-hidden flex flex-col">
      {/* Background Aesthetic Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Container - FIXED/STICKY */}
      <header className="sticky top-0 z-50 w-full bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">
              GPS Cruise <span className="text-blue-500">Tour</span>
              {/* [강의 노트: 서브 브랜드 네임 반영]
                  사용자 경험의 깊이를 더하기 위해 '여행의 네비게이터'라는 감성적인 서브 타이틀을 추가했습니다. */}
              <span className="block text-[8px] tracking-[0.4em] text-blue-400 opacity-60 font-medium not-italic">
                {selectedLanguage === 'ko' ? '여행의 네비게이터' : 'Travel Navigator'}
              </span>
            </span>
          </motion.div>

          <div className="flex items-center gap-2">
            {/* 🚀 [Server Park] Deployment Timestamp for verification */}
            <Badge
              variant="outline"
              className="px-2 py-0.5 h-6 text-[9px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/30 backdrop-blur-md rounded-full whitespace-nowrap hidden xs:flex items-center gap-1 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Dep: 2026-02-23 21:38
            </Badge>

            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
            >
              <Languages className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold uppercase">{selectedLanguage}</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content - SCROLLABLE */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-20">
        <div className="container mx-auto px-6 py-12 flex flex-col items-center">
          <div className="max-w-4xl w-full">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-12"
            >
              <Badge variant="outline" className="mb-4 border-blue-500/30 text-blue-400 bg-blue-500/5 px-3 py-1 rounded-full">
                {t('gpsAudioGuide', selectedLanguage)}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">
                {selectedLanguage === 'ko' ? '당신의 도시 탐험을' : 'Elevate Your City'}<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  {selectedLanguage === 'ko' ? '새롭게 정의하세요' : 'Exploration Experience'}
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                {t('chooseStartMethod', selectedLanguage)}
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.3 }
                }
              }}
            >
              {ROLES.map((role) => (
                <motion.div
                  key={role.id}
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    show: { y: 0, opacity: 1 }
                  }}
                >
                  <button
                    onClick={() => {
                      // [Bug Doctor] 모바일 오디오 잠금 해제를 위한 골든 타임
                      import('@/lib/audioService').then(({ audioService }) => audioService.unlockAudio());
                      handleRoleSelect(role.path, role.id);
                    }}
                    className={`w-full group relative p-8 rounded-[2.5rem] glass-premium aurora-border-premium border border-white/10 hover:bg-white/[0.08] transition-all duration-500 text-left overflow-hidden flex flex-col justify-between h-64 hover:scale-[1.02] hover:${role.hoverColor} hover:shadow-2xl backdrop-blur-sm`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-700`} />

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${role.color} flex items-center justify-center shadow-lg`}>
                          <role.icon className="w-7 h-7 text-white" />
                        </div>
                        {role.badge && (
                          <Badge className="bg-white/10 border-none text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                            {selectedLanguage === 'ko' ? role.badge.ko : role.badge.en}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                        {selectedLanguage === 'ko' ? role.title.ko : role.title.en}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-4">
                        {selectedLanguage === 'ko' ? role.desc.ko : role.desc.en}
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-400 transition-colors">Get Started</span>
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-all duration-300 shadow-inner">
                        <ChevronRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </motion.div>

            {/* Restoration Block */}
            <AnimatePresence>
              {savedTourData && savedTourData.tourStops.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-8"
                >
                  <button
                    onClick={() => {
                      // [Bug Doctor] 복원 시에도 오디오 해제
                      import('@/lib/audioService').then(({ audioService }) => audioService.unlockAudio());
                      localStorage.setItem('startup-mode', 'restore');
                      localStorage.setItem('restore-city-id', savedTourData.cityId);
                      setLocation('/home');
                    }}
                    className="w-full p-6 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all flex items-center justify-between group backdrop-blur-md"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <History className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-bold text-orange-400">
                          {selectedLanguage === 'ko' ? '진행 중인 투어 계속하기' : 'Continue Previous Tour'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                          {savedTourData.cityName} • {formatDate(savedTourData.savedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-orange-500/20 border-none text-orange-400 px-4 py-1.5 font-black">
                      {savedTourData.tourStops.length} STOPS
                    </Badge>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 text-center"
            >
              <InstallPrompt selectedLanguage={selectedLanguage} />
              <p className="text-[10px] text-gray-600 mt-12 uppercase tracking-[0.3em] font-medium opacity-50">
                Powered by GPS Cruise Assistant • Build v1.4.1 Premium
              </p>
            </motion.div>
          </div>
        </div>

        {/* Footer Branding - Inside Inner Scroll */}
        <footer className="py-12 container mx-auto px-6 border-t border-white/5 mt-12">
          <div className="flex flex-col items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-gray-800 flex items-center justify-center overflow-hidden shadow-xl">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="user" className="w-full h-full object-cover opacity-80" />
                </div>
              ))}
            </div>
            <p className="text-[12px] text-gray-500 font-medium tracking-wide">
              Join <span className="text-blue-400 font-bold">2,450+</span> global explorers defining their journeys today.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
