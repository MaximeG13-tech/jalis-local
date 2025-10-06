import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { GOOGLE_PLACES_API_KEY } from '@/config/api.config';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

export const AddressAutocomplete = ({ value, onChange, disabled }: AddressAutocompleteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeAutocomplete();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=fr`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.head.appendChild(script);
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'fr' },
        fields: ['formatted_address', 'name'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        } else if (place.name) {
          onChange(place.name);
        }
      });

      setIsLoading(false);
    };

    loadGoogleMaps();
  }, [onChange]);

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="address" className="text-base font-semibold">
        Adresse ou nom de l'entreprise
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </div>
        <Input
          ref={inputRef}
          id="address"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: 1 Place du Capitole, Toulouse"
          disabled={disabled || isLoading}
          required
          className="h-12 text-base pl-11"
          autoComplete="off"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        💡 Commencez à taper pour voir les suggestions automatiques
      </p>
    </div>
  );
};

