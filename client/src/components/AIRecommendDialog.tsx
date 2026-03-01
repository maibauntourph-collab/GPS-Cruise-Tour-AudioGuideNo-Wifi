import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Crown,
  Zap
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

type CategoryType = 'landmarks' | 'restaurants' | 'activities' | 'shopping';

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
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>(['landmarks']);
  const [error, setError] = useState<string | null>(null);

  const getFilteredLandmarks = (categories: CategoryType[]): Landmark[] => {
    if (categories.length === 0) return landmarks;

    return landmarks.filter(l => {
      if (categories.includes('landmarks') &&
        l.category !== 'Activity' && l.category !== 'Restaurant' && l.category !== 'Gift Shop') return true;
      if (categories.includes('restaurants') && l.category === 'Restaurant') return true;
      if (categories.includes('activities') && l.category === 'Activity') return true;
      if (categories.includes('shopping') && l.category === 'Gift Shop') return true;
      return false;
    });
  };

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const filteredLandmarks = getFilteredLandmarks(selectedCategories);

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
        categories: selectedCategories
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

    const allRecommended = recommendation.itinerary
      .sort((a, b) => a.order - b.order)
      .map(item => landmarks.find(l => l.id === item.landmarkId))
      .filter((l): l is Landmark => l !== undefined);

    // Apply category filter to results
    if (selectedCategories.length === 0) {
      return allRecommended;
    }

    return allRecommended.filter(l => {
      if (selectedCategories.includes('landmarks') &&
        l.category !== 'Activity' && l.category !== 'Restaurant' && l.category !== 'Gift Shop') return true;
      if (selectedCategories.includes('restaurants') && l.category === 'Restaurant') return true;
      if (selectedCategories.includes('activities') && l.category === 'Activity') return true;
      if (selectedCategories.includes('shopping') && l.category === 'Gift Shop') return true;
      return false;
    });
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
    if (category === 'Gift Shop') return <Zap className="w-3.5 h-3.5" />;
    return <LandmarkIcon className="w-3.5 h-3.5" />;
  };

  const getCategoryColor = (category: string | null | undefined) => {
    // [교수님 테마 가이드: 시각적 직관성 확보]
    // Landmark: Blue (신뢰와 깊이)
    // Activity: Emerald/Green (에너지와 활력)
    // Restaurant: Orange (식욕과 즐거움)
    // Gift Shop: Purple (특별함과 감동)
    if (category === 'Restaurant') return 'bg-orange-500/10 text-orange-600 border-orange-200';
    if (category === 'Activity') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    if (category === 'Gift Shop') return 'bg-purple-500/10 text-purple-600 border-purple-200';
    return 'bg-blue-500/10 text-blue-600 border-blue-200';
  };

  const recommendedLandmarks = getRecommendedLandmarks();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            {t('aiTourRecommendation', selectedLanguage)}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {cityName} - {t('aiRecommendationDesc', selectedLanguage)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Multi-Category Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {selectedLanguage === 'ko' ? '추천 카테고리 선택 (복수 선택 가능)' : 'SELECT CATEGORIES (MULTI-SELECT)'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'landmarks', icon: LandmarkIcon, label: t('landmarks', selectedLanguage), color: 'blue' },
                  { id: 'restaurants', icon: Utensils, label: t('restaurants', selectedLanguage), color: 'orange' },
                  { id: 'activities', icon: Activity, label: t('activities', selectedLanguage), color: 'emerald' },
                  { id: 'shopping', icon: Zap, label: selectedLanguage === 'ko' ? '쇼핑' : 'Shopping', color: 'purple' }
                ].map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategories.includes(cat.id as CategoryType) ? 'default' : 'outline'}
                    size="sm"
                    className={`h-9 justify-start gap-2 transition-all ${selectedCategories.includes(cat.id as CategoryType)
                        ? `ring-2 ring-${cat.color}-500/20 shadow-md bg-${cat.color}-600 hover:bg-${cat.color}-700 border-none text-white`
                        : 'hover:bg-primary/5'
                      }`}
                    onClick={() => {
                      if (selectedCategories.includes(cat.id as CategoryType)) {
                        setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                      } else {
                        setSelectedCategories([...selectedCategories, cat.id as CategoryType]);
                      }
                    }}
                  >
                    <cat.icon className={`w-3.5 h-3.5 ${selectedCategories.includes(cat.id as CategoryType) ? 'animate-pulse' : ''}`} />
                    <span className="text-xs">{cat.label}</span>
                  </Button>
                ))}
              </div>
            </div>

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
                          {landmark.isPremium && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-700 border-amber-200 gap-1">
                              <Crown className="w-2.5 h-2.5" />
                              {selectedLanguage === 'ko' ? '프리미엄' : 'Premium'}
                            </Badge>
                          )}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
