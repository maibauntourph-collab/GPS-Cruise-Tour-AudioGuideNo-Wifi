import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Download, Upload, AudioLines, Gauge, Globe, Volume2, Mic, User, Users, Headphones } from 'lucide-react';
import { t } from '@/lib/translations';
import { LanguageSelector } from './LanguageSelector';
import OfflineDataDialog from './OfflineDataDialog';
import { TTS_VOICES, VoiceId, getVoiceForLanguage, getSavedVoice, saveVoice, getVoiceName, getVoiceDescription } from '@/lib/voiceSettings';

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
  selectedVoice?: VoiceId;
  onVoiceChange?: (voice: VoiceId) => void;
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
  selectedVoice,
  onVoiceChange,
  onOpenAudioDownload
}: SettingsDialogProps) {
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [offlineMode, setOfflineMode] = useState<'download' | 'upload'>('download');
  
  const [currentVoice, setCurrentVoice] = useState<VoiceId>(() => {
    return getSavedVoice() || getVoiceForLanguage(selectedLanguage);
  });

  useEffect(() => {
    if (selectedVoice) {
      setCurrentVoice(selectedVoice);
    }
  }, [selectedVoice]);

  const handleVoiceChange = (voiceId: VoiceId) => {
    setCurrentVoice(voiceId);
    saveVoice(voiceId);
    onVoiceChange?.(voiceId);
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return <User className="w-3 h-3" />;
      case 'female': return <User className="w-3 h-3 text-pink-500" />;
      default: return <Users className="w-3 h-3" />;
    }
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

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Mic className="w-4 h-4" />
                {selectedLanguage === 'ko' ? '음성 스타일' : 'Voice Style'}
              </Label>
              <Select value={currentVoice} onValueChange={(value) => handleVoiceChange(value as VoiceId)}>
                <SelectTrigger className="w-full" data-testid="select-voice">
                  <SelectValue placeholder={selectedLanguage === 'ko' ? '음성 선택' : 'Select Voice'} />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TTS_VOICES) as VoiceId[]).map((voiceId) => {
                    const voice = TTS_VOICES[voiceId];
                    return (
                      <SelectItem key={voiceId} value={voiceId} data-testid={`select-voice-${voiceId}`}>
                        <div className="flex items-center gap-2">
                          {getGenderIcon(voice.gender)}
                          <span className="font-medium">
                            {selectedLanguage === 'ko' ? voice.nameKo : voice.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            - {selectedLanguage === 'ko' ? voice.descriptionKo : voice.description}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedLanguage === 'ko' 
                  ? `현재 언어(${selectedLanguage.toUpperCase()}) 기본: ${TTS_VOICES[getVoiceForLanguage(selectedLanguage)].nameKo}`
                  : `Default for ${selectedLanguage.toUpperCase()}: ${TTS_VOICES[getVoiceForLanguage(selectedLanguage)].name}`
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
