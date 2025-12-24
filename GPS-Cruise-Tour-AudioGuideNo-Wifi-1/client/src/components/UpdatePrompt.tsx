import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

interface UpdatePromptProps {
  isVisible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
  selectedLanguage?: string;
}

const translations: Record<string, { title: string; description: string; updateNow: string; later: string }> = {
  en: {
    title: 'Update Available',
    description: 'A new version is available. Update now for the latest features and improvements. Your data will be preserved.',
    updateNow: 'Update Now',
    later: 'Later'
  },
  ko: {
    title: '업데이트 가능',
    description: '새 버전을 사용할 수 있습니다. 지금 업데이트하여 최신 기능과 개선 사항을 받으세요. 데이터는 그대로 유지됩니다.',
    updateNow: '지금 업데이트',
    later: '나중에'
  },
  es: {
    title: 'Actualización disponible',
    description: 'Hay una nueva versión disponible. Actualice ahora para obtener las últimas funciones y mejoras. Sus datos se conservarán.',
    updateNow: 'Actualizar ahora',
    later: 'Más tarde'
  },
  fr: {
    title: 'Mise à jour disponible',
    description: 'Une nouvelle version est disponible. Mettez à jour maintenant pour les dernières fonctionnalités. Vos données seront préservées.',
    updateNow: 'Mettre à jour',
    later: 'Plus tard'
  },
  de: {
    title: 'Update verfügbar',
    description: 'Eine neue Version ist verfügbar. Aktualisieren Sie jetzt für die neuesten Funktionen. Ihre Daten bleiben erhalten.',
    updateNow: 'Jetzt aktualisieren',
    later: 'Später'
  },
  it: {
    title: 'Aggiornamento disponibile',
    description: 'È disponibile una nuova versione. Aggiorna ora per le ultime funzionalità. I tuoi dati saranno conservati.',
    updateNow: 'Aggiorna ora',
    later: 'Dopo'
  },
  zh: {
    title: '更新可用',
    description: '有新版本可用。立即更新以获取最新功能和改进。您的数据将被保留。',
    updateNow: '立即更新',
    later: '稍后'
  },
  ja: {
    title: 'アップデート可能',
    description: '新しいバージョンが利用可能です。今すぐ更新して最新の機能を入手してください。データは保持されます。',
    updateNow: '今すぐ更新',
    later: '後で'
  },
  pt: {
    title: 'Atualização disponível',
    description: 'Uma nova versão está disponível. Atualize agora para os últimos recursos. Seus dados serão preservados.',
    updateNow: 'Atualizar agora',
    later: 'Depois'
  },
  ru: {
    title: 'Доступно обновление',
    description: 'Доступна новая версия. Обновите сейчас, чтобы получить последние функции. Ваши данные сохранятся.',
    updateNow: 'Обновить',
    later: 'Позже'
  }
};

export default function UpdatePrompt({ 
  isVisible, 
  onUpdate, 
  onDismiss,
  selectedLanguage = 'en'
}: UpdatePromptProps) {
  if (!isVisible) return null;

  const t = translations[selectedLanguage] || translations.en;

  return (
    <div 
      className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[2000] animate-in slide-in-from-top-5 fade-in duration-300"
      data-testid="update-prompt"
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl p-4 max-w-sm mx-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
            <p className="text-xs text-white/90 mb-3">{t.description}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-white text-blue-600 hover:bg-white/90 h-8 text-xs font-medium"
                onClick={onUpdate}
                data-testid="button-update-now"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {t.updateNow}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 text-xs"
                onClick={onDismiss}
                data-testid="button-update-later"
              >
                {t.later}
              </Button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-white/70 hover:text-white p-1"
            data-testid="button-update-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
