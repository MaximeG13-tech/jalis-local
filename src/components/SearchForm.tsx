import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { Slider } from '@/components/ui/slider';

interface SearchFormProps {
  onSearch: (address: string, placeId: string, maxResults: number) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [maxResults, setMaxResults] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !placeId) return;
    onSearch(address, placeId, maxResults);
  };

  const handleAddressSelect = (selectedAddress: string, selectedPlaceId: string) => {
    setAddress(selectedAddress);
    setPlaceId(selectedPlaceId);
  };

  return (
    <Card className="border-2 border-primary/10 shadow-elegant backdrop-blur-sm bg-card/80">
      <CardContent className="pt-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={handleAddressSelect}
            disabled={isLoading}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxResults" className="text-base font-semibold">
                Nombre d'entreprises à générer
              </Label>
              <div className="flex items-center justify-center min-w-[60px] h-10 px-4 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-lg font-bold text-primary">{maxResults}</span>
              </div>
            </div>
            <div className="pt-2">
              <Slider
                id="maxResults"
                min={1}
                max={50}
                step={1}
                value={[maxResults]}
                onValueChange={(value) => setMaxResults(value[0])}
                disabled={isLoading}
                className="cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>1</span>
                <span>50</span>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all shadow-elegant" 
            disabled={isLoading || !placeId}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Générer la liste
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
