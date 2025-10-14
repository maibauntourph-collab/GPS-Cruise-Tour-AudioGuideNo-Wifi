import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Lock } from 'lucide-react';
import { t } from '@/lib/translations';

interface OfflineDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'download' | 'upload';
  onDownload: (password: string) => Promise<void>;
  onUpload: (file: File, password: string) => Promise<void>;
  selectedLanguage?: string;
}

export function OfflineDataDialog({
  isOpen,
  onClose,
  mode,
  onDownload,
  onUpload,
  selectedLanguage = 'en'
}: OfflineDataDialogProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError(t('passwordRequired', selectedLanguage));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (mode === 'download') {
        await onDownload(password);
      } else {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
          setError(t('selectFileToUpload', selectedLanguage));
          return;
        }
        await onUpload(file, password);
      }
      
      // Close dialog on success
      setPassword('');
      onClose();
    } catch (err) {
      setError(t('invalidPasswordOrFile', selectedLanguage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-offline-data">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'download' ? <Download className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {mode === 'download' 
              ? t('downloadOfflineData', selectedLanguage)
              : t('uploadOfflineData', selectedLanguage)
            }
          </DialogTitle>
          <DialogDescription>
            {mode === 'download' 
              ? 'Encrypt and download your travel data for offline use'
              : 'Upload and decrypt your encrypted travel data'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === 'upload' && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">
                {t('selectFileToUpload', selectedLanguage)}
              </Label>
              <Input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                accept=".gpstour"
                data-testid="input-file-upload"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('enterPassword', selectedLanguage)}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
              data-testid="input-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSubmit();
                }
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" data-testid="text-error">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            data-testid="button-cancel"
          >
            {t('close', selectedLanguage)}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? 'Processing...' : mode === 'download' 
              ? t('encryptAndDownload', selectedLanguage)
              : t('decryptAndLoad', selectedLanguage)
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
