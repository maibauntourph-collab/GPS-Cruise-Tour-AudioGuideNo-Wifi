import { City } from '@shared/schema';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CitySelectorProps {
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  selectedLanguage?: string;
}

export function CitySelector({ cities, selectedCityId, onCityChange, selectedLanguage = 'en' }: CitySelectorProps) {
  // Labels based on language
  const labels = {
    selectCity: selectedLanguage === 'ko' ? '도시 선택' : 'Select City',
  };

  return (
    <div className="flex items-center gap-1.5">
      <MapPin className="w-4 h-4 text-primary shrink-0" />
      <Select value={selectedCityId} onValueChange={onCityChange}>
        <SelectTrigger className="h-9 min-w-[160px]" data-testid="select-city">
          <SelectValue placeholder={labels.selectCity} />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id} data-testid={`option-city-${city.id}`}>
              {city.country ? `${city.name} (${city.country})` : city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
