import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import type { DbLandmark, DbCity } from "@shared/schema";

export interface LandmarkFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  landmark: DbLandmark | null;
  cities: DbCity[];
  onSave: (data: Partial<DbLandmark>) => void;
  isPending: boolean;
  defaultCityId?: string;
  defaultCategory?: string;
}

type LandmarkFormData = {
  id: string;
  cityId: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  narration: string;
  description: string;
  category: string;
  detailedDescription: string;
  yearBuilt: string;
  architect: string;
};

export function LandmarkFormDialog({ 
  isOpen, 
  onClose, 
  landmark, 
  cities, 
  onSave, 
  isPending,
  defaultCityId,
  defaultCategory 
}: LandmarkFormDialogProps) {
  const [formData, setFormData] = useState<LandmarkFormData>({
    id: '',
    cityId: defaultCityId || (cities.length > 0 ? cities[0].id : ''),
    name: '',
    lat: 0,
    lng: 0,
    radius: 50,
    narration: '',
    description: '',
    category: defaultCategory || '',
    detailedDescription: '',
    yearBuilt: '',
    architect: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (landmark) {
        setFormData({
          id: landmark.id,
          cityId: landmark.cityId,
          name: landmark.name,
          lat: landmark.lat,
          lng: landmark.lng,
          radius: landmark.radius,
          narration: landmark.narration,
          description: landmark.description || '',
          category: landmark.category || '',
          detailedDescription: landmark.detailedDescription || '',
          yearBuilt: landmark.yearBuilt || '',
          architect: landmark.architect || ''
        });
      } else {
        const initialCityId = defaultCityId || (cities.length > 0 ? cities[0].id : '');
        setFormData({
          id: '', 
          cityId: initialCityId, 
          name: '', 
          lat: 0, 
          lng: 0,
          radius: 50, 
          narration: '', 
          description: '', 
          category: defaultCategory || '',
          detailedDescription: '', 
          yearBuilt: '', 
          architect: ''
        });
      }
    }
  }, [isOpen, landmark, cities, defaultCityId, defaultCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.cityId || !formData.name || !formData.narration) {
      alert('필수 항목을 모두 입력하세요: ID, 도시, 이름, 안내문');
      return;
    }
    
    if (formData.lat === undefined || formData.lng === undefined) {
      alert('위도와 경도를 올바르게 입력하세요');
      return;
    }
    
    onSave(formData);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'Ancient Rome': '고대 로마',
      'Religious': '종교',
      'Monuments': '기념물',
      'Piazzas': '광장',
      'Museums': '박물관',
      'Activity': '액티비티',
      'Restaurant': '식당',
      'Gift Shop': '기념품 가게'
    };
    return labels[category] || category;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-landmark-form">
        <DialogHeader>
          <DialogTitle>{landmark ? '장소 수정' : '새 장소 추가'}</DialogTitle>
          <DialogDescription className="sr-only">
            {landmark ? '기존 장소의 정보를 수정합니다' : '새로운 장소를 추가합니다'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landmark-id">ID *</Label>
              <Input
                id="landmark-id"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                placeholder="예: rome_colosseum"
                disabled={!!landmark}
                required
                data-testid="input-landmark-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-city">도시 *</Label>
              <Select value={formData.cityId} onValueChange={(v) => setFormData(prev => ({ ...prev, cityId: v }))}>
                <SelectTrigger data-testid="select-landmark-city">
                  <SelectValue placeholder="도시 선택" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-name">이름 *</Label>
            <Input
              id="landmark-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: 콜로세움"
              required
              data-testid="input-landmark-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-category">카테고리</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
              <SelectTrigger data-testid="select-landmark-category">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ancient Rome">{getCategoryLabel('Ancient Rome')}</SelectItem>
                <SelectItem value="Religious">{getCategoryLabel('Religious')}</SelectItem>
                <SelectItem value="Monuments">{getCategoryLabel('Monuments')}</SelectItem>
                <SelectItem value="Piazzas">{getCategoryLabel('Piazzas')}</SelectItem>
                <SelectItem value="Museums">{getCategoryLabel('Museums')}</SelectItem>
                <SelectItem value="Activity">{getCategoryLabel('Activity')}</SelectItem>
                <SelectItem value="Restaurant">{getCategoryLabel('Restaurant')}</SelectItem>
                <SelectItem value="Gift Shop">{getCategoryLabel('Gift Shop')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landmark-lat">위도 *</Label>
              <Input
                id="landmark-lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                required
                data-testid="input-landmark-lat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-lng">경도 *</Label>
              <Input
                id="landmark-lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                required
                data-testid="input-landmark-lng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-radius">반경 (m)</Label>
              <Input
                id="landmark-radius"
                type="number"
                value={formData.radius}
                onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) || 50 }))}
                required
                data-testid="input-landmark-radius"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-narration">안내문 (음성 텍스트) *</Label>
            <Textarea
              id="landmark-narration"
              value={formData.narration}
              onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
              placeholder="사용자가 이 장소에 접근할 때 읽어줄 텍스트..."
              rows={3}
              required
              data-testid="input-landmark-narration"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-description">간단한 설명</Label>
            <Textarea
              id="landmark-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="지도 마커에 표시될 짧은 설명..."
              rows={2}
              data-testid="input-landmark-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark-detailed">상세 설명</Label>
            <Textarea
              id="landmark-detailed"
              value={formData.detailedDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, detailedDescription: e.target.value }))}
              placeholder="상세 패널에 표시될 긴 설명..."
              rows={5}
              data-testid="input-landmark-detailed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landmark-year">건축 연도</Label>
              <Input
                id="landmark-year"
                value={formData.yearBuilt}
                onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: e.target.value }))}
                placeholder="예: 80 AD"
                data-testid="input-landmark-year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark-architect">건축가</Label>
              <Input
                id="landmark-architect"
                value={formData.architect}
                onChange={(e) => setFormData(prev => ({ ...prev, architect: e.target.value }))}
                placeholder="예: 베스파시아누스"
                data-testid="input-landmark-architect"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>취소</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-landmark">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
