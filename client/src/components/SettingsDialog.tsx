import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Settings, Download, Upload, AudioLines, Gauge, Globe, Mic, Headphones, Play, Check, Volume2, User, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { t } from '@/lib/translations';
import { LanguageSelector } from './LanguageSelector';
import OfflineDataDialog from './OfflineDataDialog';
import { audioService } from '@/lib/audioService';

interface VoiceInfo {
  voice: SpeechSynthesisVoice;
  quality: 'premium' | 'standard';
  gender: 'male' | 'female' | 'unknown';
}

function analyzeVoice(voice: SpeechSynthesisVoice): VoiceInfo {
  const nameLower = voice.name.toLowerCase();
  
  const premiumKeywords = ['neural', 'wavenet', 'premium', 'enhanced', 'natural', 'high-quality', 'google'];
  const isPremium = premiumKeywords.some(keyword => nameLower.includes(keyword));
  
  const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'hazel', 'susan', 'heera', 'hedda', 'helia', 'lucia', 'paulina', 'sabina', 'monica', 'laura', 'elsa', 'cosette', 'caroline', 'julie', 'amelie', 'kyoko', 'o-ren', 'mei-jia', 'yuna', 'sora'];
  const maleKeywords = ['male', 'man', 'david', 'mark', 'richard', 'george', 'daniel', 'sean', 'james', 'rishi', 'pablo', 'jorge', 'luca', 'thomas', 'guillaume', 'otoya', 'ting-ting'];
  
  let gender: 'male' | 'female' | 'unknown' = 'unknown';
  if (femaleKeywords.some(k => nameLower.includes(k))) {
    gender = 'female';
  } else if (maleKeywords.some(k => nameLower.includes(k))) {
    gender = 'male';
  }
  
  return {
    voice,
    quality: isPremium ? 'premium' : 'standard',
    gender
  };
}

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
  
  const testSystemVoice = () => {
    const text = testTexts[selectedLanguage] || testTexts['en'];
    audioService.playText(text, selectedLanguage, speechRate);
  };
  
  const previewVoice = (voiceName: string) => {
    const text = testTexts[selectedLanguage] || testTexts['en'];
    audioService.stop();
    
    const voice = systemVoices.find(v => v.name === voiceName);
    if (voice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = speechRate;
      utterance.lang = voice.lang;
      speechSynthesis.speak(utterance);
    }
  };
  
  const voiceInfoList = systemVoices.map(analyzeVoice);

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

            {/* System TTS Voice Selection - Horizontal Scrolling Cards */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm">
                <Mic className="w-4 h-4" />
                {selectedLanguage === 'ko' ? 'TTS 음성 선택' : 'TTS Voice Selection'}
                <Badge variant="secondary" className="text-xs">
                  {systemVoices.length} {selectedLanguage === 'ko' ? '개' : 'voices'}
                </Badge>
              </Label>
              
              {voiceInfoList.length > 0 ? (
                <>
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-3 pb-3">
                      {voiceInfoList.map((info) => {
                        const isSelected = selectedSystemVoice === info.voice.name;
                        const voiceSlug = info.voice.name.replace(/\s+/g, '-').toLowerCase();
                        
                        return (
                          <button
                            key={info.voice.name}
                            onClick={() => handleSystemVoiceChange(info.voice.name)}
                            className={`
                              relative flex flex-col min-w-[180px] p-3 rounded-lg border-2 transition-all
                              text-left cursor-pointer
                              ${isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border bg-card hover:border-primary/50'
                              }
                            `}
                            aria-pressed={isSelected}
                            data-testid={`card-voice-${voiceSlug}`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mb-2">
                              <User className={`w-4 h-4 ${
                                info.gender === 'female' ? 'text-pink-500' : 
                                info.gender === 'male' ? 'text-blue-500' : 
                                'text-muted-foreground'
                              }`} />
                              <span className="font-medium text-sm truncate max-w-[120px]" title={info.voice.name}>
                                {info.voice.name.split(' ').slice(0, 2).join(' ')}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mb-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {info.voice.lang}
                              </Badge>
                              <Badge 
                                variant={info.quality === 'premium' ? 'default' : 'secondary'} 
                                className="text-[10px] px-1.5 py-0 gap-0.5"
                              >
                                {info.quality === 'premium' && <Sparkles className="w-2.5 h-2.5" />}
                                {info.quality === 'premium' 
                                  ? (selectedLanguage === 'ko' ? '프리미엄' : 'Premium') 
                                  : (selectedLanguage === 'ko' ? '표준' : 'Standard')
                                }
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                {info.voice.localService ? (
                                  <>
                                    <WifiOff className="w-3 h-3" />
                                    <span>{selectedLanguage === 'ko' ? '로컬' : 'Local'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Wifi className="w-3 h-3" />
                                    <span>{selectedLanguage === 'ko' ? '온라인' : 'Online'}</span>
                                  </>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  previewVoice(info.voice.name);
                                }}
                                title={selectedLanguage === 'ko' ? '미리듣기' : 'Preview'}
                                data-testid={`button-voice-preview-${voiceSlug}`}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={testSystemVoice}
                    data-testid="button-test-system-voice"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {selectedLanguage === 'ko' ? '선택된 음성 테스트' : 'Test Selected Voice'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {selectedLanguage === 'ko' 
                      ? `${selectedLanguage.toUpperCase()} 언어에 사용 가능한 음성이 없습니다.`
                      : `No voices available for ${selectedLanguage.toUpperCase()} language.`
                    }
                  </p>
                </div>
              )}
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
