import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings, Download, Upload, AudioLines, Gauge, Globe, Volume2 } from 'lucide-react';
import { t } from '@/lib/translations';
import { LanguageSelector } from './LanguageSelector';
import { OfflineDataDialog } from './OfflineDataDialog';

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
}

export function SettingsDialog({
  isOpen,
  onClose,
  selectedLanguage,
  onLanguageChange,
  speechRate,
  onSpeechRateChange,
  onTestAudio,
  onDownloadData,
  onUploadData
}: SettingsDialogProps) {
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [offlineMode, setOfflineMode] = useState<'download' | 'upload'>('download');

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
