import { City } from '@shared/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface CitySelectorProps {
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
}

export function CitySelector({ cities, selectedCityId, onCityChange }: CitySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-primary shrink-0" />
      <Select value={selectedCityId} onValueChange={onCityChange}>
        <SelectTrigger className="w-[180px]" data-testid="select-city">
          <SelectValue placeholder="Select a city" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id} data-testid={`option-city-${city.id}`}>
              {city.name}, {city.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
