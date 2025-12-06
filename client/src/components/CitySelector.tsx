import { useState, useEffect, useMemo } from 'react';
import { City } from '@shared/schema';
import { MapPin, Globe, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CitySelectorProps {
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  selectedLanguage?: string;
}

export function CitySelector({ cities, selectedCityId, onCityChange, selectedLanguage = 'en' }: CitySelectorProps) {
  // Extract unique countries from cities
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    cities.forEach(city => {
      if (city.country) {
        countrySet.add(city.country);
      }
    });
    return Array.from(countrySet).sort();
  }, [cities]);

  // Get the country of the currently selected city
  const selectedCity = cities.find(c => c.id === selectedCityId);
  const [selectedCountry, setSelectedCountry] = useState<string>(selectedCity?.country || countries[0] || '');

  // Update selected country when city changes externally
  useEffect(() => {
    const city = cities.find(c => c.id === selectedCityId);
    if (city && city.country !== selectedCountry) {
      setSelectedCountry(city.country);
    }
  }, [selectedCityId, cities]);

  // Filter cities by selected country
  const filteredCities = useMemo(() => {
    return cities.filter(city => city.country === selectedCountry);
  }, [cities, selectedCountry]);

  // Ensure the selected city is in the filtered list, or use the first city from filtered list
  const effectiveCityId = useMemo(() => {
    const isInFilteredList = filteredCities.some(c => c.id === selectedCityId);
    if (isInFilteredList) {
      return selectedCityId;
    }
    return filteredCities[0]?.id || selectedCityId;
  }, [filteredCities, selectedCityId]);

  // When country changes, auto-select the first city of that country
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    const firstCityOfCountry = cities.find(c => c.country === country);
    if (firstCityOfCountry) {
      onCityChange(firstCityOfCountry.id);
    }
  };

  // Labels based on language
  const labels = {
    selectCountry: selectedLanguage === 'ko' ? '나라 선택' : 'Select Country',
    selectCity: selectedLanguage === 'ko' ? '도시 선택' : 'Select City',
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Country Selector */}
      <div className="flex items-center gap-1.5">
        <Globe className="w-4 h-4 text-primary shrink-0" />
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger className="h-9 min-w-[140px]" data-testid="select-country">
            <SelectValue placeholder={labels.selectCountry} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country} data-testid={`option-country-${country}`}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />

      {/* City Selector */}
      <div className="flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <Select value={effectiveCityId} onValueChange={onCityChange}>
          <SelectTrigger className="h-9 min-w-[160px]" data-testid="select-city">
            <SelectValue placeholder={labels.selectCity} />
          </SelectTrigger>
          <SelectContent>
            {filteredCities.map((city) => (
              <SelectItem key={city.id} value={city.id} data-testid={`option-city-${city.id}`}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
