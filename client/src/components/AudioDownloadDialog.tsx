import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Headphones, Loader2, Check, X, Volume2, Trash2, HardDrive } from 'lucide-react';
import { TTS_VOICES, VoiceId, getSavedVoice, getVoiceForLanguage } from '@/lib/voiceSettings';
import { offlineStorage } from '@/lib/offlineStorage';
import { getTranslatedContent } from '@/lib/translations';
import type { Landmark } from '@shared/schema';

interface AudioDownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
  landmarks: Landmark[];
  selectedLanguage: string;
}

interface DownloadStatus {
  landmarkId: string;
  landmarkName: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  error?: string;
}

export default function AudioDownloadDialog({
  isOpen,
  onClose,
  cityId,
  cityName,
  landmarks,
  selectedLanguage
}: AudioDownloadDialogProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(() => 
    getSavedVoice() || getVoiceForLanguage(selectedLanguage)
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatuses, setDownloadStatuses] = useState<DownloadStatus[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [audioStats, setAudioStats] = useState<{ count: number; sizeMB: string } | null>(null);
  const [cachedLandmarks, setCachedLandmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadAudioStats();
      checkCachedAudio();
    }
  }, [isOpen, landmarks, selectedLanguage]);

  const loadAudioStats = async () => {
    const stats = await offlineStorage.getAudioStorageStats();
    setAudioStats({
      count: stats.count,
      sizeMB: (stats.totalSizeBytes / (1024 * 1024)).toFixed(2)
    });
  };

  const checkCachedAudio = async () => {
    const cached = new Set<string>();
    for (const landmark of landmarks) {
      const hasAudio = await offlineStorage.hasAudio(landmark.id, selectedLanguage);
      if (hasAudio) {
        cached.add(landmark.id);
      }
    }
    setCachedLandmarks(cached);
  };

  const downloadAllAudio = async () => {
    setIsDownloading(true);
    const landmarksToDownload = landmarks.filter(l => !cachedLandmarks.has(l.id));
    
    const statuses: DownloadStatus[] = landmarksToDownload.map(l => ({
      landmarkId: l.id,
      landmarkName: getTranslatedContent(l, selectedLanguage, 'name') || l.name,
      status: 'pending' as const
    }));
    setDownloadStatuses(statuses);

    let completed = 0;
    const total = landmarksToDownload.length;

    for (let i = 0; i < landmarksToDownload.length; i++) {
      const landmark = landmarksToDownload[i];
      
      setDownloadStatuses(prev => prev.map(s => 
        s.landmarkId === landmark.id ? { ...s, status: 'downloading' } : s
      ));

      try {
        const translatedNarration = getTranslatedContent(landmark, selectedLanguage, 'narration');
        const translatedDescription = getTranslatedContent(landmark, selectedLanguage, 'description');
        const text = translatedNarration || translatedDescription || '';
        if (!text) {
          throw new Error('No text available for this language');
        }

        const response = await fetch('/api/audio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landmarkId: landmark.id,
            language: selectedLanguage,
            text,
            voiceId: selectedVoice
          })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        
        const audioResponse = await fetch(result.audioUrl);
        if (!audioResponse.ok) {
          throw new Error('Failed to download audio file');
        }

        const audioBlob = await audioResponse.blob();
        
        await offlineStorage.saveAudio({
          landmarkId: landmark.id,
          language: selectedLanguage,
          audioBlob,
          duration: result.duration || 0,
          sizeBytes: audioBlob.size,
          checksum: result.checksum,
          voiceId: selectedVoice
        });

        setDownloadStatuses(prev => prev.map(s => 
          s.landmarkId === landmark.id ? { ...s, status: 'complete' } : s
        ));
        
        setCachedLandmarks(prev => new Set(Array.from(prev).concat(landmark.id)));
      } catch (error: any) {
        console.error(`Failed to download audio for ${landmark.id}:`, error);
        setDownloadStatuses(prev => prev.map(s => 
          s.landmarkId === landmark.id ? { ...s, status: 'error', error: error.message } : s
        ));
      }

      completed++;
      setOverallProgress((completed / total) * 100);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsDownloading(false);
    loadAudioStats();
  };

  const clearAllAudio = async () => {
    await offlineStorage.clearAllAudio();
    setCachedLandmarks(new Set());
    setDownloadStatuses([]);
    loadAudioStats();
  };

  const uncachedCount = landmarks.length - cachedLandmarks.size;
  const voiceInfo = TTS_VOICES[selectedVoice];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-audio-download">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            {selectedLanguage === 'ko' ? 'MP3 오디오 다운로드' : 'Download MP3 Audio'}
          </DialogTitle>
          <DialogDescription>
            {selectedLanguage === 'ko' 
              ? `${cityName} 오프라인 오디오 가이드`
              : `Offline audio guide for ${cityName}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                {selectedLanguage === 'ko' ? '저장 현황' : 'Storage Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{selectedLanguage === 'ko' ? '캐시된 오디오' : 'Cached Audio'}:</span>
                <span className="font-medium">{audioStats?.count || 0} {selectedLanguage === 'ko' ? '개' : 'files'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{selectedLanguage === 'ko' ? '저장 공간' : 'Storage Used'}:</span>
                <span className="font-medium">{audioStats?.sizeMB || '0'} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{selectedLanguage === 'ko' ? '이 도시 다운로드됨' : 'Downloaded for this city'}:</span>
                <span className="font-medium">{cachedLandmarks.size} / {landmarks.length}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {selectedLanguage === 'ko' ? '음성 스타일 선택' : 'Select Voice Style'}
            </label>
            <Select 
              value={selectedVoice} 
              onValueChange={(v) => setSelectedVoice(v as VoiceId)}
              disabled={isDownloading}
            >
              <SelectTrigger data-testid="select-download-voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TTS_VOICES) as VoiceId[]).map((voiceId) => {
                  const voice = TTS_VOICES[voiceId];
                  return (
                    <SelectItem key={voiceId} value={voiceId}>
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3 h-3" />
                        <span>{selectedLanguage === 'ko' ? voice.nameKo : voice.name}</span>
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
                ? `선택된 음성: ${voiceInfo.nameKo} (${voiceInfo.descriptionKo})`
                : `Selected: ${voiceInfo.name} (${voiceInfo.description})`
              }
            </p>
          </div>

          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{selectedLanguage === 'ko' ? '전체 진행률' : 'Overall Progress'}</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          {downloadStatuses.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2">
              {downloadStatuses.map((status) => (
                <div 
                  key={status.landmarkId} 
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="truncate flex-1 mr-2">{status.landmarkName}</span>
                  {status.status === 'pending' && (
                    <Badge variant="outline" className="text-xs">
                      {selectedLanguage === 'ko' ? '대기' : 'Pending'}
                    </Badge>
                  )}
                  {status.status === 'downloading' && (
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {selectedLanguage === 'ko' ? '다운로드중' : 'Downloading'}
                    </Badge>
                  )}
                  {status.status === 'complete' && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      {selectedLanguage === 'ko' ? '완료' : 'Done'}
                    </Badge>
                  )}
                  {status.status === 'error' && (
                    <Badge variant="destructive" className="text-xs">
                      <X className="w-3 h-3 mr-1" />
                      {selectedLanguage === 'ko' ? '실패' : 'Failed'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={downloadAllAudio}
              disabled={isDownloading || uncachedCount === 0}
              className="w-full"
              data-testid="button-download-all-audio"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {selectedLanguage === 'ko' ? '다운로드 중...' : 'Downloading...'}
                </>
              ) : uncachedCount === 0 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {selectedLanguage === 'ko' ? '모든 오디오 다운로드됨' : 'All Audio Downloaded'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {selectedLanguage === 'ko' 
                    ? `${uncachedCount}개 오디오 다운로드`
                    : `Download ${uncachedCount} Audio Files`
                  }
                </>
              )}
            </Button>
            
            {cachedLandmarks.size > 0 && (
              <Button
                variant="outline"
                onClick={clearAllAudio}
                disabled={isDownloading}
                className="w-full text-destructive hover:text-destructive"
                data-testid="button-clear-audio"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {selectedLanguage === 'ko' ? '모든 오디오 삭제' : 'Clear All Audio'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
