import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';

interface SearchFormProps {
  onSearch: (address: string, placeId: string, maxResults: number) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [maxResults, setMaxResults] = useState('10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !placeId) return;
    onSearch(address, placeId, parseInt(maxResults));
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

          <div className="space-y-2">
            <Label htmlFor="maxResults" className="text-base font-semibold">Nombre d'entreprises à générer</Label>
            <Select value={maxResults} onValueChange={setMaxResults} disabled={isLoading}>
              <SelectTrigger id="maxResults" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 entreprises</SelectItem>
                <SelectItem value="10">10 entreprises</SelectItem>
                <SelectItem value="20">20 entreprises</SelectItem>
                <SelectItem value="50">50 entreprises</SelectItem>
              </SelectContent>
            </Select>
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
