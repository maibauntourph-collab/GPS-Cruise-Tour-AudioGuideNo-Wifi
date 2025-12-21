import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { ArrowLeft, MapPin, Clock, Route, Trash2, Calendar, Globe } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SavedRoute } from '@shared/schema';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('gps-audio-guide-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('gps-audio-guide-session-id', sessionId);
  }
  return sessionId;
}

export default function MyRoutes() {
  const [selectedLanguage] = useState(() => localStorage.getItem('selected-language') || 'ko');
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sessionId = getOrCreateSessionId();

  const { data: routes, isLoading } = useQuery<SavedRoute[]>({
    queryKey: ['/api/routes', { sessionId }],
    queryFn: async () => {
      const res = await fetch(`/api/routes?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch routes');
      return res.json();
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      await apiRequest('DELETE', `/api/routes/${routeId}?sessionId=${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes', { sessionId }] });
      toast({
        title: selectedLanguage === 'ko' ? '경로가 삭제되었습니다' : 'Route deleted',
      });
      setDeleteRouteId(null);
    },
    onError: (error) => {
      toast({
        title: selectedLanguage === 'ko' ? '삭제 실패' : 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const formatDistance = (meters?: number | null) => {
    if (!meters) return '-';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return '-';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return selectedLanguage === 'ko' 
        ? `${hours}시간 ${mins}분` 
        : `${hours}h ${mins}min`;
    }
    return selectedLanguage === 'ko' ? `${minutes}분` : `${minutes}min`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(
      selectedLanguage === 'ko' ? 'ko-KR' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const getCountryName = (code: string) => {
    const countries: Record<string, { ko: string; en: string }> = {
      IT: { ko: '이탈리아', en: 'Italy' },
      PH: { ko: '필리핀', en: 'Philippines' },
      FR: { ko: '프랑스', en: 'France' },
      ES: { ko: '스페인', en: 'Spain' },
      DE: { ko: '독일', en: 'Germany' },
      JP: { ko: '일본', en: 'Japan' },
      KR: { ko: '한국', en: 'South Korea' },
      CN: { ko: '중국', en: 'China' },
      GB: { ko: '영국', en: 'United Kingdom' },
      GR: { ko: '그리스', en: 'Greece' },
      TH: { ko: '태국', en: 'Thailand' },
      VN: { ko: '베트남', en: 'Vietnam' },
    };
    return countries[code]?.[selectedLanguage === 'ko' ? 'ko' : 'en'] || code;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">
              {selectedLanguage === 'ko' ? '저장된 경로' : 'My Routes'}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !routes || routes.length === 0 ? (
          <div className="text-center py-12">
            <Route className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {selectedLanguage === 'ko' ? '저장된 경로가 없습니다' : 'No saved routes'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {selectedLanguage === 'ko' 
                ? '지도에서 투어 경로를 만들고 저장해보세요'
                : 'Create a tour route on the map and save it'}
            </p>
            <Link href="/">
              <Button data-testid="button-go-to-map">
                {selectedLanguage === 'ko' ? '지도로 이동' : 'Go to Map'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((route) => {
              const stops = Array.isArray(route.stops) ? route.stops : [];
              
              return (
                <Card key={route.id} className="hover-elevate" data-testid={`card-route-${route.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{route.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Globe className="w-3 h-3" />
                          {getCountryName(route.countryCode)}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteRouteId(route.id)}
                        data-testid={`button-delete-route-${route.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {stops.length} {selectedLanguage === 'ko' ? '정류장' : 'stops'}
                      </Badge>
                      {route.totalDistance && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Route className="w-3 h-3" />
                          {formatDistance(route.totalDistance)}
                        </Badge>
                      )}
                      {route.totalDuration && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(route.totalDuration)}
                        </Badge>
                      )}
                    </div>
                    
                    {route.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {route.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      {stops.slice(0, 3).map((s: any) => s.name).join(' → ')}
                      {stops.length > 3 && ` → +${stops.length - 3}`}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(route.createdAt)}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedLanguage === 'ko' ? '경로 삭제' : 'Delete Route'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLanguage === 'ko' 
                ? '이 경로를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
                : 'Are you sure you want to delete this route? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {selectedLanguage === 'ko' ? '취소' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRouteId && deleteRouteMutation.mutate(deleteRouteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {selectedLanguage === 'ko' ? '삭제' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
