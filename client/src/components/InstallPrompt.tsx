import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, WifiOff, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  selectedLanguage?: string;
}

const translations: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  offlineBenefit: string;
  install: string;
  notNow: string;
}> = {
  ko: {
    title: '앱 설치 권장',
    subtitle: '오프라인 모드 지원',
    description: '여행 중 인터넷 없이도 사용할 수 있습니다!',
    offlineBenefit: '데이터 로밍 비용 절약 & 빠른 속도',
    install: '설치하기',
    notNow: '나중에'
  },
  en: {
    title: 'Install App',
    subtitle: 'Offline Mode Supported',
    description: 'Use without internet while traveling!',
    offlineBenefit: 'Save roaming costs & faster speed',
    install: 'Install',
    notNow: 'Not now'
  },
  ja: {
    title: 'アプリをインストール',
    subtitle: 'オフラインモード対応',
    description: '旅行中もインターネットなしで使用できます！',
    offlineBenefit: 'データローミング費用節約＆高速',
    install: 'インストール',
    notNow: '後で'
  },
  zh: {
    title: '安装应用',
    subtitle: '支持离线模式',
    description: '旅行时无需网络即可使用！',
    offlineBenefit: '节省漫游费用，速度更快',
    install: '安装',
    notNow: '稍后'
  },
  es: {
    title: 'Instalar App',
    subtitle: 'Modo Offline Disponible',
    description: '¡Úsala sin internet mientras viajas!',
    offlineBenefit: 'Ahorra en roaming y más velocidad',
    install: 'Instalar',
    notNow: 'Ahora no'
  },
  fr: {
    title: 'Installer l\'App',
    subtitle: 'Mode Hors Ligne Disponible',
    description: 'Utilisez sans internet en voyage !',
    offlineBenefit: 'Économisez le roaming & plus rapide',
    install: 'Installer',
    notNow: 'Plus tard'
  },
  de: {
    title: 'App Installieren',
    subtitle: 'Offline-Modus Verfügbar',
    description: 'Nutzen Sie ohne Internet auf Reisen!',
    offlineBenefit: 'Roaming-Kosten sparen & schneller',
    install: 'Installieren',
    notNow: 'Später'
  },
  it: {
    title: 'Installa App',
    subtitle: 'Modalità Offline Disponibile',
    description: 'Usala senza internet in viaggio!',
    offlineBenefit: 'Risparmia roaming e più veloce',
    install: 'Installa',
    notNow: 'Non ora'
  },
  pt: {
    title: 'Instalar App',
    subtitle: 'Modo Offline Disponível',
    description: 'Use sem internet enquanto viaja!',
    offlineBenefit: 'Economize roaming e mais velocidade',
    install: 'Instalar',
    notNow: 'Agora não'
  },
  ru: {
    title: 'Установить приложение',
    subtitle: 'Поддержка офлайн-режима',
    description: 'Используйте без интернета в путешествии!',
    offlineBenefit: 'Экономия на роуминге и быстрее',
    install: 'Установить',
    notNow: 'Позже'
  }
};

export default function InstallPrompt({ selectedLanguage = 'ko' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const t = translations[selectedLanguage] || translations.ko;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
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
    } else {
      console.log('[PWA] User dismissed install');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div
      data-testid="prompt-install-pwa"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-card border-2 border-primary/30 rounded-lg shadow-2xl p-4 backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Smartphone className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground">
              {t.title}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              <WifiOff className="w-3 h-3" />
              {t.subtitle}
            </span>
          </div>
          <p className="text-sm text-foreground font-medium mb-1">
            {t.description}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {t.offlineBenefit}
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-install-pwa"
            >
              <Download className="w-4 h-4 mr-1" />
              {t.install}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              data-testid="button-dismiss-install"
            >
              {t.notNow}
            </Button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-md hover-elevate active-elevate-2 flex items-center justify-center"
          data-testid="button-close-install"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
