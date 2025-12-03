import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Loader2, 
  MapPin, 
  Clock, 
  Utensils, 
  Activity, 
  Landmark as LandmarkIcon,
  ChevronRight,
  AlertCircle,
  Route,
  Plus
} from 'lucide-react';
import { Landmark } from '@shared/schema';
import { t, getTranslatedContent } from '@/lib/translations';
import { apiRequest } from '@/lib/queryClient';

interface AIRecommendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
  landmarks: Landmark[];
  selectedLanguage: string;
  userPosition?: { latitude: number; longitude: number } | null;
  onAddToTour: (landmarks: Landmark[]) => void;
  onSelectLandmark: (landmark: Landmark) => void;
}

interface TourRecommendation {
  itinerary: Array<{
    landmarkId: string;
    order: number;
  }>;
  explanation: string;
  totalEstimatedTime: number;
}

type RecommendationType = 'all' | 'landmarks' | 'restaurants' | 'activities';

export default function AIRecommendDialog({
  isOpen,
  onClose,
  cityId,
  cityName,
  landmarks,
  selectedLanguage,
  userPosition,
  onAddToTour,
  onSelectLandmark
}: AIRecommendDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<TourRecommendation | null>(null);
  const [recommendationType, setRecommendationType] = useState<RecommendationType>('all');
  const [error, setError] = useState<string | null>(null);

  const getFilteredLandmarks = (type: RecommendationType): Landmark[] => {
    switch (type) {
      case 'landmarks':
        return landmarks.filter(l => 
          l.category !== 'Activity' && 
          l.category !== 'Restaurant' && 
          l.category !== 'Gift Shop'
        );
      case 'restaurants':
        return landmarks.filter(l => l.category === 'Restaurant');
      case 'activities':
        return landmarks.filter(l => l.category === 'Activity');
      default:
        return landmarks;
    }
  };

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const filteredLandmarks = getFilteredLandmarks(recommendationType);
      
      if (filteredLandmarks.length === 0) {
        setError(t('noLandmarksFound', selectedLanguage));
        setIsLoading(false);
        return;
      }

      const response = await apiRequest('POST', '/api/ai/recommend-tour', {
        cityId,
        language: selectedLanguage,
        userPosition: userPosition ? {
          latitude: userPosition.latitude,
          longitude: userPosition.longitude
        } : undefined,
        filterType: recommendationType
      });

      const data = await response.json() as TourRecommendation;
      setRecommendation(data);
      
      toast({
        title: t('aiRecommendationReady', selectedLanguage),
        description: t('aiRecommendationSuccess', selectedLanguage),
      });
    } catch (err: any) {
      console.error('AI recommendation error:', err);
      setError(err.message || t('aiRecommendationError', selectedLanguage));
      toast({
        title: t('error', selectedLanguage),
        description: err.message || t('aiRecommendationError', selectedLanguage),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendedLandmarks = (): Landmark[] => {
    if (!recommendation) return [];
    
    return recommendation.itinerary
      .sort((a, b) => a.order - b.order)
      .map(item => landmarks.find(l => l.id === item.landmarkId))
      .filter((l): l is Landmark => l !== undefined);
  };

  const handleAddAllToTour = () => {
    const recommendedLandmarks = getRecommendedLandmarks();
    if (recommendedLandmarks.length > 0) {
      onAddToTour(recommendedLandmarks);
      toast({
        title: t('addedToTour', selectedLanguage),
        description: `${recommendedLandmarks.length} ${t('landmarksAddedToTour', selectedLanguage)}`,
      });
      onClose();
    }
  };

  const getCategoryIcon = (category: string | null | undefined) => {
    if (category === 'Restaurant') return <Utensils className="w-3.5 h-3.5" />;
    if (category === 'Activity') return <Activity className="w-3.5 h-3.5" />;
    return <LandmarkIcon className="w-3.5 h-3.5" />;
  };

  const getCategoryColor = (category: string | null | undefined) => {
    if (category === 'Restaurant') return 'bg-orange-500/10 text-orange-600 border-orange-200';
    if (category === 'Activity') return 'bg-blue-500/10 text-blue-600 border-blue-200';
    return 'bg-amber-500/10 text-amber-700 border-amber-200';
  };

  const recommendedLandmarks = getRecommendedLandmarks();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            {t('aiTourRecommendation', selectedLanguage)}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {cityName} - {t('aiRecommendationDesc', selectedLanguage)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="p-4 space-y-4">
            {/* Category Filter Tabs */}
            <Tabs value={recommendationType} onValueChange={(v) => setRecommendationType(v as RecommendationType)}>
              <TabsList className="grid w-full grid-cols-4 h-9">
                <TabsTrigger value="all" className="text-xs" data-testid="tab-recommend-all">
                  {t('all', selectedLanguage)}
                </TabsTrigger>
                <TabsTrigger value="landmarks" className="text-xs" data-testid="tab-recommend-landmarks">
                  <LandmarkIcon className="w-3 h-3 mr-1" />
                  {t('landmarks', selectedLanguage)}
                </TabsTrigger>
                <TabsTrigger value="restaurants" className="text-xs" data-testid="tab-recommend-restaurants">
                  <Utensils className="w-3 h-3 mr-1" />
                  {t('restaurants', selectedLanguage)}
                </TabsTrigger>
                <TabsTrigger value="activities" className="text-xs" data-testid="tab-recommend-activities">
                  <Activity className="w-3 h-3 mr-1" />
                  {t('activities', selectedLanguage)}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Get Recommendation Button */}
            <Button 
              onClick={handleGetRecommendation} 
              disabled={isLoading}
              className="w-full gap-2"
              data-testid="button-get-ai-recommendation"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('generatingRecommendation', selectedLanguage)}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('getAIRecommendation', selectedLanguage)}
                </>
              )}
            </Button>

            {/* Error State */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Recommendation Results */}
            {recommendation && recommendedLandmarks.length > 0 && (
              <div className="space-y-3">
                {/* Summary */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Route className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{recommendedLandmarks.length} {t('stops', selectedLanguage)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{recommendation.totalEstimatedTime} {t('minutes', selectedLanguage)}</span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <p className="text-sm leading-relaxed">{recommendation.explanation}</p>
                </div>

                {/* Itinerary List */}
                <div className="space-y-2">
                  {recommendedLandmarks.map((landmark, index) => (
                    <div 
                      key={landmark.id}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onSelectLandmark(landmark)}
                      data-testid={`recommended-landmark-${landmark.id}`}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getTranslatedContent(landmark, selectedLanguage, 'name')}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className={`text-xs px-1.5 py-0 h-5 ${getCategoryColor(landmark.category)}`}>
                            {getCategoryIcon(landmark.category)}
                            <span className="ml-1">{landmark.category || t('landmark', selectedLanguage)}</span>
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>

                {/* Add All to Tour Button */}
                <Button 
                  onClick={handleAddAllToTour}
                  variant="outline"
                  className="w-full gap-2"
                  data-testid="button-add-all-to-tour"
                >
                  <Plus className="w-4 h-4" />
                  {t('addAllToTour', selectedLanguage)}
                </Button>
              </div>
            )}

            {/* Empty State - Before First Request */}
            {!isLoading && !recommendation && !error && (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t('aiRecommendationHint', selectedLanguage)}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
