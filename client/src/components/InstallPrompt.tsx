import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, WifiOff, Smartphone, Share, PlusSquare, MapPin, Volume2, Navigation } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  selectedLanguage?: string;
  onDownloadClick?: (language: string) => void;
}

const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'ru'];

const translations: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  offlineBenefit: string;
  install: string;
  notNow: string;
  iosTitle: string;
  iosStep1: string;
  iosStep2: string;
  iosStep3: string;
  feature1: string;
  feature2: string;
  feature3: string;
  welcomeTitle: string;
  continueWeb: string;
  installTab: string;
  downloadTab: string;
  selectLanguage: string;
  downloadAudio: string;
  selectCityFirst: string;
}> = {
  ko: {
    title: '앱 설치하기',
    subtitle: '오프라인 모드 지원',
    description: '여행 중 인터넷 없이도 GPS 오디오 가이드를 사용하세요!',
    offlineBenefit: '데이터 로밍 비용 절약 & 빠른 속도',
    install: '지금 설치하기',
    notNow: '웹으로 계속하기',
    iosTitle: 'iPhone/iPad 설치 방법',
    iosStep1: '하단의 공유 버튼을 탭하세요',
    iosStep2: '"홈 화면에 추가"를 선택하세요',
    iosStep3: '"추가"를 탭하면 완료!',
    feature1: '오프라인 지도 & 오디오',
    feature2: '10개 언어 음성 안내',
    feature3: '18개 도시 투어 가이드',
    welcomeTitle: 'GPS 오디오 가이드에 오신 것을 환영합니다',
    continueWeb: '웹에서 계속하기',
    installTab: '앱 설치',
    downloadTab: '오프라인 다운로드',
    selectLanguage: '언어 선택',
    downloadAudio: '오디오 다운로드',
    selectCityFirst: '계속하기를 눌러 도시를 선택한 후 다운로드하세요'
  },
  en: {
    title: 'Install App',
    subtitle: 'Offline Mode Supported',
    description: 'Use GPS Audio Guide without internet while traveling!',
    offlineBenefit: 'Save roaming costs & faster speed',
    install: 'Install Now',
    notNow: 'Continue on Web',
    iosTitle: 'How to Install on iPhone/iPad',
    iosStep1: 'Tap the Share button below',
    iosStep2: 'Select "Add to Home Screen"',
    iosStep3: 'Tap "Add" and done!',
    feature1: 'Offline Maps & Audio',
    feature2: 'Voice Guide in 10 Languages',
    feature3: 'Tour Guide for 18 Cities',
    welcomeTitle: 'Welcome to GPS Audio Guide',
    continueWeb: 'Continue on Web',
    installTab: 'Install App',
    downloadTab: 'Download Offline',
    selectLanguage: 'Select Language',
    downloadAudio: 'Download Audio',
    selectCityFirst: 'Click Continue to select a city and download audio'
  },
  ja: {
    title: 'アプリをインストール',
    subtitle: 'オフラインモード対応',
    description: '旅行中もインターネットなしでGPSオーディオガイドを使えます！',
    offlineBenefit: 'データローミング費用節約＆高速',
    install: '今すぐインストール',
    notNow: 'ウェブで続ける',
    iosTitle: 'iPhone/iPadへのインストール方法',
    iosStep1: '下の共有ボタンをタップ',
    iosStep2: '「ホーム画面に追加」を選択',
    iosStep3: '「追加」をタップして完了！',
    feature1: 'オフライン地図＆音声',
    feature2: '10言語の音声ガイド',
    feature3: '18都市のツアーガイド',
    welcomeTitle: 'GPSオーディオガイドへようこそ',
    continueWeb: 'ウェブで続ける',
    installTab: 'アプリをインストール',
    downloadTab: 'オフラインをダウンロード',
    selectLanguage: '言語を選択',
    downloadAudio: 'オーディオをダウンロード',
    selectCityFirst: 'ウェブで続くをクリックして、都市を選択してからダウンロードしてください'
  },
  zh: {
    title: '安装应用',
    subtitle: '支持离线模式',
    description: '旅行时无需网络即可使用GPS音频导游！',
    offlineBenefit: '节省漫游费用，速度更快',
    install: '立即安装',
    notNow: '在网页继续',
    iosTitle: 'iPhone/iPad安装方法',
    iosStep1: '点击下方的分享按钮',
    iosStep2: '选择"添加到主屏幕"',
    iosStep3: '点击"添加"即可完成！',
    feature1: '离线地图和音频',
    feature2: '10种语言语音导览',
    feature3: '18个城市导览',
    welcomeTitle: '欢迎使用GPS音频导游',
    continueWeb: '在网页继续',
    installTab: '安装应用',
    downloadTab: '离线下载',
    selectLanguage: '选择语言',
    downloadAudio: '下载音频',
    selectCityFirst: '点击"在网页继续"选择城市后下载'
  },
  es: {
    title: 'Instalar App',
    subtitle: 'Modo Offline Disponible',
    description: '¡Usa la guía de audio GPS sin internet mientras viajas!',
    offlineBenefit: 'Ahorra en roaming y más velocidad',
    install: 'Instalar Ahora',
    notNow: 'Continuar en Web',
    iosTitle: 'Cómo Instalar en iPhone/iPad',
    iosStep1: 'Toca el botón Compartir abajo',
    iosStep2: 'Selecciona "Añadir a Inicio"',
    iosStep3: '¡Toca "Añadir" y listo!',
    feature1: 'Mapas y Audio Offline',
    feature2: 'Guía de Voz en 10 Idiomas',
    feature3: 'Guía Turística para 18 Ciudades',
    welcomeTitle: 'Bienvenido a GPS Audio Guide',
    continueWeb: 'Continuar en Web',
    installTab: 'Instalar App',
    downloadTab: 'Descargar Offline',
    selectLanguage: 'Seleccionar Idioma',
    downloadAudio: 'Descargar Audio',
    selectCityFirst: 'Haz clic en Continuar para seleccionar una ciudad y descargar'
  },
  fr: {
    title: 'Installer l\'App',
    subtitle: 'Mode Hors Ligne Disponible',
    description: 'Utilisez le guide audio GPS sans internet en voyage !',
    offlineBenefit: 'Économisez le roaming & plus rapide',
    install: 'Installer Maintenant',
    notNow: 'Continuer sur le Web',
    iosTitle: 'Comment Installer sur iPhone/iPad',
    iosStep1: 'Appuyez sur le bouton Partager ci-dessous',
    iosStep2: 'Sélectionnez "Sur l\'écran d\'accueil"',
    iosStep3: 'Appuyez sur "Ajouter" et c\'est fait !',
    feature1: 'Cartes et Audio Hors Ligne',
    feature2: 'Guide Vocal en 10 Langues',
    feature3: 'Guide Touristique pour 18 Villes',
    welcomeTitle: 'Bienvenue sur GPS Audio Guide',
    continueWeb: 'Continuer sur le Web',
    installTab: 'Installer App',
    downloadTab: 'Télécharger Offline',
    selectLanguage: 'Sélectionner Langue',
    downloadAudio: 'Télécharger Audio',
    selectCityFirst: 'Cliquez sur Continuer pour sélectionner une ville et télécharger'
  },
  de: {
    title: 'App Installieren',
    subtitle: 'Offline-Modus Verfügbar',
    description: 'Nutzen Sie den GPS Audio Guide ohne Internet auf Reisen!',
    offlineBenefit: 'Roaming-Kosten sparen & schneller',
    install: 'Jetzt Installieren',
    notNow: 'Im Web Fortfahren',
    iosTitle: 'Installation auf iPhone/iPad',
    iosStep1: 'Tippen Sie auf die Teilen-Taste unten',
    iosStep2: 'Wählen Sie "Zum Home-Bildschirm"',
    iosStep3: 'Tippen Sie auf "Hinzufügen" - fertig!',
    feature1: 'Offline Karten & Audio',
    feature2: 'Sprachführer in 10 Sprachen',
    feature3: 'Reiseführer für 18 Städte',
    welcomeTitle: 'Willkommen bei GPS Audio Guide',
    continueWeb: 'Im Web Fortfahren',
    installTab: 'App Installieren',
    downloadTab: 'Offline Herunterladen',
    selectLanguage: 'Sprache Wählen',
    downloadAudio: 'Audio Herunterladen',
    selectCityFirst: 'Klicken Sie auf Fortfahren, um eine Stadt auszuwählen'
  },
  it: {
    title: 'Installa App',
    subtitle: 'Modalità Offline Disponibile',
    description: 'Usa la guida audio GPS senza internet in viaggio!',
    offlineBenefit: 'Risparmia roaming e più veloce',
    install: 'Installa Ora',
    notNow: 'Continua sul Web',
    iosTitle: 'Come Installare su iPhone/iPad',
    iosStep1: 'Tocca il pulsante Condividi sotto',
    iosStep2: 'Seleziona "Aggiungi a Home"',
    iosStep3: 'Tocca "Aggiungi" e fatto!',
    feature1: 'Mappe e Audio Offline',
    feature2: 'Guida Vocale in 10 Lingue',
    feature3: 'Guida Turistica per 18 Città',
    welcomeTitle: 'Benvenuto su GPS Audio Guide',
    continueWeb: 'Continua sul Web',
    installTab: 'Installa App',
    downloadTab: 'Scarica Offline',
    selectLanguage: 'Seleziona Lingua',
    downloadAudio: 'Scarica Audio',
    selectCityFirst: 'Clicca Continua per selezionare una città e scaricare'
  },
  pt: {
    title: 'Instalar App',
    subtitle: 'Modo Offline Disponível',
    description: 'Use o guia de áudio GPS sem internet durante a viagem!',
    offlineBenefit: 'Economize roaming e mais velocidade',
    install: 'Instalar Agora',
    notNow: 'Continuar na Web',
    iosTitle: 'Como Instalar no iPhone/iPad',
    iosStep1: 'Toque no botão Compartilhar abaixo',
    iosStep2: 'Selecione "Adicionar à Tela de Início"',
    iosStep3: 'Toque em "Adicionar" e pronto!',
    feature1: 'Mapas e Áudio Offline',
    feature2: 'Guia de Voz em 10 Idiomas',
    feature3: 'Guia Turístico para 18 Cidades',
    welcomeTitle: 'Bem-vindo ao GPS Audio Guide',
    continueWeb: 'Continuar na Web',
    installTab: 'Instalar App',
    downloadTab: 'Baixar Offline',
    selectLanguage: 'Selecionar Idioma',
    downloadAudio: 'Baixar Áudio',
    selectCityFirst: 'Clique em Continuar para selecionar uma cidade'
  },
  ru: {
    title: 'Установить приложение',
    subtitle: 'Поддержка офлайн-режима',
    description: 'Используйте GPS аудиогид без интернета в путешествии!',
    offlineBenefit: 'Экономия на роуминге и быстрее',
    install: 'Установить сейчас',
    notNow: 'Продолжить в браузере',
    iosTitle: 'Как установить на iPhone/iPad',
    iosStep1: 'Нажмите кнопку "Поделиться" ниже',
    iosStep2: 'Выберите "На экран Домой"',
    iosStep3: 'Нажмите "Добавить" и готово!',
    feature1: 'Офлайн карты и аудио',
    feature2: 'Голосовой гид на 10 языках',
    feature3: 'Гид по 18 городам',
    welcomeTitle: 'Добро пожаловать в GPS Audio Guide',
    continueWeb: 'Продолжить в браузере',
    installTab: 'Установить App',
    downloadTab: 'Загрузить Offline',
    selectLanguage: 'Выбрать Язык',
    downloadAudio: 'Загрузить Аудио',
    selectCityFirst: 'Нажмите "Продолжить", чтобы выбрать город'
  }
};

export default function InstallPrompt({ selectedLanguage = 'ko', onDownloadClick }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'download'>('install');
  const [selectedDownloadLanguage, setSelectedDownloadLanguage] = useState(selectedLanguage || 'ko');

  const t = translations[selectedLanguage] || translations.ko;

  useEffect(() => {
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
    
    setIsIOS(checkIOS);
    setIsStandalone(checkStandalone);

    if (checkStandalone) {
      return;
    }

    const hasSeenPrompt = localStorage.getItem('pwa-install-seen');
    const dismissedAt = localStorage.getItem('pwa-install-dismissed-at');
    
    const shouldShowAgain = !dismissedAt || 
      (Date.now() - parseInt(dismissedAt)) > 24 * 60 * 60 * 1000;

    if (!hasSeenPrompt || shouldShowAgain) {
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('pwa-install-seen', 'true');
      }, 500);
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

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div
      data-testid="prompt-install-pwa"
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-primary/95 via-primary/90 to-primary/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-6 text-center flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            data-testid="button-close-install"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {t.welcomeTitle}
          </h1>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/30 rounded-full">
            <WifiOff className="w-4 h-4 text-green-200" />
            <span className="text-sm font-medium text-green-100">{t.subtitle}</span>
          </div>
          
          <div className="flex gap-2 mt-4 justify-center">
            <button
              onClick={() => setActiveTab('install')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'install'
                  ? 'bg-white text-primary'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t.installTab}
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'download'
                  ? 'bg-white text-primary'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Download className="w-4 h-4" />
              {t.downloadTab}
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'install' ? (
            <>
              <p className="text-center text-foreground font-medium mb-6">
                {t.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-foreground">{t.feature1}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-foreground">{t.feature2}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm text-foreground">{t.feature3}</span>
                </div>
              </div>

              {isIOS ? (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 text-center">
                    {t.iosTitle}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <Share className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{t.iosStep1}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <PlusSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{t.iosStep2}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                      <span className="text-muted-foreground">{t.iosStep3}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {deferredPrompt && !isIOS ? (
                  <Button
                    onClick={handleInstall}
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                    data-testid="button-install-pwa"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {t.install}
                  </Button>
                ) : null}
                
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="w-full h-12 text-base"
                  data-testid="button-dismiss-install"
                >
                  {isIOS ? t.continueWeb : (deferredPrompt ? t.notNow : t.continueWeb)}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                {t.offlineBenefit}
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">{t.downloadTab}</h2>
                <p className="text-sm text-muted-foreground">{t.selectLanguage}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedDownloadLanguage(lang)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedDownloadLanguage === lang
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    data-testid={`button-language-${lang}`}
                  >
                    {translations[lang]?.title.split(' ')[0] || lang}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    if (onDownloadClick) {
                      onDownloadClick(selectedDownloadLanguage);
                      handleDismiss();
                    }
                  }}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                  data-testid="button-start-download"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t.downloadAudio}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="w-full h-12 text-base"
                  data-testid="button-skip-download"
                >
                  {t.continueWeb}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                {t.selectCityFirst}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
