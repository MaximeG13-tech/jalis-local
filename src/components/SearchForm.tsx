import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { Slider } from '@/components/ui/slider';
import { BusinessTypesSelector } from './BusinessTypesSelector';
import { BusinessType } from '@/constants/businessTypes';

interface SearchFormProps {
  onSearch: (companyName: string, address: string, placeId: string, maxResults: number, selectedTypes: BusinessType[]) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState<BusinessType[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !address.trim() || !placeId) return;
    onSearch(companyName, address, placeId, maxResults, selectedTypes);
  };

  const handleAddressSelect = (selectedAddress: string, selectedPlaceId: string) => {
    setAddress(selectedAddress);
    setPlaceId(selectedPlaceId);
  };

  return (
    <Card className="border border-border shadow-card bg-card">
      <CardContent className="pt-8 pb-8 px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-bold text-foreground uppercase tracking-wide">
              Nom de votre entreprise
            </Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Ex: Jalis"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={handleAddressSelect}
            disabled={isLoading}
          />

          <BusinessTypesSelector
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
            disabled={isLoading}
          />

          <div className="space-y-4">
            <Label htmlFor="maxResults" className="text-sm font-bold text-foreground uppercase tracking-wide">
              Nombre d'entreprises
            </Label>
            <div className="px-2">
              <Slider
                id="maxResults"
                min={1}
                max={50}
                step={1}
                value={[maxResults]}
                onValueChange={(value) => setMaxResults(value[0])}
                disabled={isLoading}
                showValue
                className="cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-medium tabular-nums px-2">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 transition-all shadow-sm" 
            disabled={isLoading || !placeId || !companyName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Générer la liste de liens utiles
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
