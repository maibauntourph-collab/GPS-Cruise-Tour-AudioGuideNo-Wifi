import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, MapPin, Clock, Route } from 'lucide-react';
import { Landmark } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SaveRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourStops: Landmark[];
  tourRouteInfo: { distance: number; duration: number } | null;
  cityId: string;
  countryCode: string;
  selectedLanguage: string;
}

export default function SaveRouteDialog({
  open,
  onOpenChange,
  tourStops,
  tourRouteInfo,
  cityId,
  countryCode,
  selectedLanguage
}: SaveRouteDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveRouteMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      description: string; 
      countryCode: string;
      cityId: string;
      stops: Array<{ landmarkId: string; name: string; lat: number; lng: number; order: number }>;
      totalDistance?: number;
      totalDuration?: number;
    }) => {
      const response = await apiRequest('POST', '/api/routes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: selectedLanguage === 'ko' ? '경로가 저장되었습니다' : 'Route saved successfully',
        description: selectedLanguage === 'ko' ? '내 경로에서 확인할 수 있습니다' : 'You can view it in My Routes',
      });
      setTitle('');
      setDescription('');
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: selectedLanguage === 'ko' ? '저장 실패' : 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: selectedLanguage === 'ko' ? '제목을 입력하세요' : 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }

    const stops = tourStops.map((stop, index) => ({
      landmarkId: stop.id,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      order: index + 1
    }));

    saveRouteMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      countryCode,
      cityId,
      stops,
      totalDistance: tourRouteInfo?.distance,
      totalDuration: tourRouteInfo ? Math.round(tourRouteInfo.duration / 60) : undefined
    });
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return selectedLanguage === 'ko' 
        ? `${hours}시간 ${mins}분` 
        : `${hours}h ${mins}min`;
    }
    return selectedLanguage === 'ko' ? `${minutes}분` : `${minutes}min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            {selectedLanguage === 'ko' ? '경로 저장' : 'Save Route'}
          </DialogTitle>
          <DialogDescription>
            {selectedLanguage === 'ko' 
              ? '현재 투어 경로를 저장하여 나중에 다시 사용할 수 있습니다.'
              : 'Save your current tour route to use it later.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">{tourStops.length} {selectedLanguage === 'ko' ? '개 정류장' : 'stops'}</span>
            </div>
            {tourRouteInfo && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Route className="w-4 h-4" />
                  <span>{formatDistance(tourRouteInfo.distance)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(tourRouteInfo.duration)}</span>
                </div>
              </>
            )}
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              {tourStops.slice(0, 3).map(s => s.name).join(' → ')}
              {tourStops.length > 3 && ` → +${tourStops.length - 3}`}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-title">
              {selectedLanguage === 'ko' ? '경로 이름' : 'Route Name'} *
            </Label>
            <Input
              id="route-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedLanguage === 'ko' ? '예: 로마 반일 투어' : 'e.g., Rome Half-Day Tour'}
              data-testid="input-route-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description">
              {selectedLanguage === 'ko' ? '설명 (선택)' : 'Description (optional)'}
            </Label>
            <Textarea
              id="route-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={selectedLanguage === 'ko' ? '경로에 대한 메모...' : 'Notes about this route...'}
              rows={3}
              data-testid="input-route-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-save-route"
          >
            {selectedLanguage === 'ko' ? '취소' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveRouteMutation.isPending}
            data-testid="button-confirm-save-route"
          >
            {saveRouteMutation.isPending 
              ? (selectedLanguage === 'ko' ? '저장 중...' : 'Saving...')
              : (selectedLanguage === 'ko' ? '저장' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
