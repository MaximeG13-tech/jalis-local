import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { GOOGLE_PLACES_API_KEY } from '@/config/api.config';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

export const AddressAutocomplete = ({ value, onChange, disabled }: AddressAutocompleteProps) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const autocompleteService = useRef<any>(null);

  useEffect(() => {
    // Load Google Maps JavaScript API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=fr`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      };
      document.head.appendChild(script);
    } else {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  const fetchPredictions = (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteService.current) {
      return;
    }

    setIsLoading(true);
    
    autocompleteService.current.getPlacePredictions(
      {
        input: input,
        componentRestrictions: { country: 'fr' },
        language: 'fr',
      },
      (predictions: any[], status: string) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(
            predictions.map((p) => ({
              description: p.description,
              place_id: p.place_id,
            }))
          );
          setShowSuggestions(true);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 400);
  };

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    onChange(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);
  };

  return (
    <div ref={wrapperRef} className="space-y-2 relative">
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
          id="address"
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.length >= 3 && predictions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Ex: 1 Place du Capitole, Toulouse"
          disabled={disabled}
          required
          className="h-12 text-base pl-11"
          autoComplete="off"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <div className="absolute z-50 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectPrediction(prediction);
              }}
              className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-start gap-3 border-b border-border last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <span className="text-sm text-foreground">{prediction.description}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        💡 Commencez à taper pour voir les suggestions automatiques
      </p>
    </div>
  );
};

