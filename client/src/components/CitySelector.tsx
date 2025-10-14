import { City } from '@shared/schema';
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
      <select
        value={selectedCityId}
        onChange={(e) => onCityChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="select-city"
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id} data-testid={`option-city-${city.id}`}>
            {city.name}, {city.country}
          </option>
        ))}
      </select>
    </div>
  );
}
