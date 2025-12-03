import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Download, Upload, AudioLines, Gauge, Globe, Mic, Headphones, Play } from 'lucide-react';
import { t } from '@/lib/translations';
import { LanguageSelector } from './LanguageSelector';
import OfflineDataDialog from './OfflineDataDialog';
import { audioService } from '@/lib/audioService';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  onTestAudio?: () => void;
  onDownloadData: (password: string) => Promise<void>;
  onUploadData: (file: File, password: string) => Promise<void>;
  onOpenAudioDownload?: () => void;
}

export default function SettingsDialog({
  isOpen,
  onClose,
  selectedLanguage,
  onLanguageChange,
  speechRate,
  onSpeechRateChange,
  onTestAudio,
  onDownloadData,
  onUploadData,
  onOpenAudioDownload
}: SettingsDialogProps) {
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [offlineMode, setOfflineMode] = useState<'download' | 'upload'>('download');
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedSystemVoice, setSelectedSystemVoice] = useState<string>('');

  // Load system voices when dialog opens or language changes
  useEffect(() => {
    if (isOpen) {
      const loadVoices = () => {
        const voices = audioService.getVoicesForLanguage(selectedLanguage);
        setSystemVoices(voices);
        
        // Get saved voice for this language
        const savedVoice = audioService.getSelectedVoiceName(selectedLanguage);
        if (savedVoice) {
          setSelectedSystemVoice(savedVoice);
        } else if (voices.length > 0) {
          setSelectedSystemVoice(voices[0].name);
        }
      };
      
      // Load immediately
      loadVoices();
      
      // Also listen for voices changed event
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Retry after a short delay (voices may not be immediately available)
      const timer = setTimeout(loadVoices, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedLanguage]);
  
  const handleSystemVoiceChange = (voiceName: string) => {
    setSelectedSystemVoice(voiceName);
    audioService.setVoiceForLanguage(selectedLanguage, voiceName);
  };
  
  const testSystemVoice = () => {
    const testTexts: Record<string, string> = {
      'en': 'Hello! This is a test of the voice.',
      'ko': '안녕하세요! 음성 테스트입니다.',
      'es': '¡Hola! Esta es una prueba de voz.',
      'fr': 'Bonjour! Ceci est un test vocal.',
      'de': 'Hallo! Dies ist ein Sprachtest.',
      'it': 'Ciao! Questo è un test vocale.',
      'zh': '你好！这是语音测试。',
      'ja': 'こんにちは！音声テストです。',
      'pt': 'Olá! Este é um teste de voz.',
      'ru': 'Привет! Это тест голоса.'
    };
    
    const text = testTexts[selectedLanguage] || testTexts['en'];
    audioService.playText(text, selectedLanguage, speechRate);
  };

  const handleDownloadClick = () => {
    setOfflineMode('download');
    setShowOfflineDialog(true);
  };

  const handleUploadClick = () => {
    setOfflineMode('upload');
    setShowOfflineDialog(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-settings">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('settings', selectedLanguage)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4" />
                {t('language', selectedLanguage)}
              </Label>
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
              />
            </div>

            {/* Speech Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4" />
                  {t('speechSpeed', selectedLanguage)}
                </Label>
                <span className="text-sm text-muted-foreground" data-testid="text-speech-rate">
                  {speechRate.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[speechRate]}
                onValueChange={(values) => onSpeechRateChange(values[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
                data-testid="slider-speech-rate"
              />
            </div>

            {/* System TTS Voice Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Mic className="w-4 h-4" />
                {selectedLanguage === 'ko' ? 'TTS 음성 선택' : 'TTS Voice Selection'}
                <span className="text-xs text-muted-foreground">
                  ({systemVoices.length} {selectedLanguage === 'ko' ? '개 사용 가능' : 'available'})
                </span>
              </Label>
              {systemVoices.length > 0 ? (
                <div className="flex gap-2">
                  <Select value={selectedSystemVoice} onValueChange={handleSystemVoiceChange}>
                    <SelectTrigger className="flex-1" data-testid="select-system-voice">
                      <SelectValue placeholder={selectedLanguage === 'ko' ? '음성 선택' : 'Select Voice'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {systemVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name} data-testid={`select-system-voice-${voice.name}`}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm truncate max-w-[280px]">{voice.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {voice.lang} {voice.localService ? '(Local)' : '(Online)'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={testSystemVoice}
                    title={selectedLanguage === 'ko' ? '테스트' : 'Test'}
                    data-testid="button-test-system-voice"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedLanguage === 'ko' 
                    ? `${selectedLanguage.toUpperCase()} 언어에 사용 가능한 음성이 없습니다.`
                    : `No voices available for ${selectedLanguage.toUpperCase()} language.`
                  }
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedLanguage === 'ko' 
                  ? '현재 선택된 언어에 대한 시스템 TTS 음성을 선택하세요.'
                  : 'Select system TTS voice for the current language.'
                }
              </p>
            </div>

            {/* Test Audio */}
            {onTestAudio && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={onTestAudio}
                data-testid="button-test-audio"
              >
                <AudioLines className="w-4 h-4" />
                {t('testAudio', selectedLanguage)}
              </Button>
            )}

            {/* MP3 Audio Download for Offline */}
            {onOpenAudioDownload && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={onOpenAudioDownload}
                data-testid="button-open-audio-download"
              >
                <Headphones className="w-4 h-4" />
                {selectedLanguage === 'ko' ? 'MP3 오디오 다운로드 (오프라인용)' : 'Download MP3 Audio (Offline)'}
              </Button>
            )}

            {/* Offline Data Backup */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm font-medium">
                {t('offlineDataBackup', selectedLanguage)}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={handleDownloadClick}
                  data-testid="button-download-data"
                >
                  <Download className="w-4 h-4" />
                  {t('downloadOfflineData', selectedLanguage)}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={handleUploadClick}
                  data-testid="button-upload-data"
                >
                  <Upload className="w-4 h-4" />
                  {t('uploadOfflineData', selectedLanguage)}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OfflineDataDialog
        isOpen={showOfflineDialog}
        onClose={() => setShowOfflineDialog(false)}
        mode={offlineMode}
        onDownload={onDownloadData}
        onUpload={onUploadData}
        selectedLanguage={selectedLanguage}
      />
    </>
  );
}
