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
import { t } from '@/lib/translations';

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
        title: t('routeDeleted', selectedLanguage),
      });
      setDeleteRouteId(null);
    },
    onError: (error) => {
      toast({
        title: t('deleteFailed', selectedLanguage),
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
      return `${hours}${t('timeHours', selectedLanguage)} ${mins}${t('timeMinutes', selectedLanguage)}`;
    }
    return `${minutes}${t('timeMinutes', selectedLanguage)}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(
      selectedLanguage === 'ko' ? 'ko-KR' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const getCountryName = (code: string) => {
    const countryMap: Record<string, string> = {
      IT: 'countryItaly',
      PH: 'countryPhilippines',
      FR: 'countryFrance',
      ES: 'countrySpain',
      DE: 'countryGermany',
      JP: 'countryJapan',
      KR: 'countrySouthKorea',
      CN: 'countryChina',
      GB: 'countryUK',
      GR: 'countryGreece',
      TH: 'countryThailand',
      VN: 'countryVietnam',
    };
    const key = countryMap[code];
    return key ? t(key, selectedLanguage) : code;
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
              {t('myRoutes', selectedLanguage)}
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
              {t('noSavedRoutes', selectedLanguage)}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('createRoutePrompt', selectedLanguage)}
            </p>
            <Link href="/">
              <Button data-testid="button-go-to-map">
                {t('goToMap', selectedLanguage)}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((route) => {
              const stops = Array.isArray(route.stops) ? route.stops : [];

              const handleRestore = () => {
                const tourData = {
                  cityId: route.cityId,
                  tourStops: stops.map((s: any) => s.landmarkId),
                  tourTimePerStop: 45, // default
                  restoredAt: new Date().toISOString()
                };
                localStorage.setItem('restored-tour-data', JSON.stringify(tourData));

                toast({
                  title: t('restoringRoute', selectedLanguage),
                  description: t('redirectingToMap', selectedLanguage),
                });

                // Navigate to home page
                window.location.href = '/';
              };

              return (
                <Card key={route.id} className="hover-elevate transition-all duration-200" data-testid={`card-route-${route.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{route.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Globe className="w-3 h-3" />
                          {getCountryName(route.countryCode)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteRouteId(route.id);
                          }}
                          data-testid={`button-delete-route-${route.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {stops.length} {t('stopUnit', selectedLanguage)}
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
                  <CardFooter className="pt-0 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(route.createdAt)}
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRestore}
                      className="bg-primary hover:bg-primary/90"
                      data-testid={`button-restore-route-${route.id}`}
                    >
                      {t('startRoute', selectedLanguage)}
                    </Button>
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
              {t('deleteRoute', selectedLanguage)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteRouteConfirm', selectedLanguage)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('cancel', selectedLanguage)}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRouteId && deleteRouteMutation.mutate(deleteRouteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete', selectedLanguage)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
