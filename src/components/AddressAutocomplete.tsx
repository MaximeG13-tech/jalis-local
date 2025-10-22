import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: string, placeId: string) => void;
  disabled?: boolean;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

export const AddressAutocomplete = ({ value, onChange, onSelect, disabled }: AddressAutocompleteProps) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const fetchPredictions = async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-autocomplete', {
        body: { input }
      });

      if (error) throw error;

      if (data?.predictions && data.predictions.length > 0) {
        setPredictions(data.predictions);
        setShowSuggestions(true);
      } else {
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setPredictions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
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
    if (onSelect) {
      onSelect(prediction.description, prediction.place_id);
    }
    setShowSuggestions(false);
    setPredictions([]);
  };

  return (
    <div ref={wrapperRef} className="space-y-4 relative">
      <Label htmlFor="address" className="text-sm font-bold text-foreground uppercase tracking-wide">
        Adresse ou nom de l'entreprise
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
                placeholder="Ex: 160 Rue Albert Einstein, 13013 Marseille"
                disabled={disabled}
                required
                className="h-12 text-base pl-11"
                autoComplete="off"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-sm">Commencez à taper pour voir les suggestions automatiques</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
    </div>
  );
};

