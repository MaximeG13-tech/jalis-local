import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface SearchFormProps {
  onSearch: (address: string, placeId: string, maxResults: number, searchMode: 'all' | 'partners', activityDescription?: string) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [maxResults, setMaxResults] = useState('10');
  const [searchMode, setSearchMode] = useState<'all' | 'partners'>('all');
  const [activityDescription, setActivityDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !placeId) return;
    if (searchMode === 'partners' && !activityDescription.trim()) return;
    onSearch(address, placeId, parseInt(maxResults), searchMode, activityDescription);
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

          <div className="space-y-3">
            <Label className="text-base font-semibold">Type de recherche</Label>
            <RadioGroup value={searchMode} onValueChange={(value) => setSearchMode(value as 'all' | 'partners')}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-input hover:bg-accent/5 transition-colors">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer flex-1 font-normal">
                  Tout type d'activités
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-input hover:bg-accent/5 transition-colors">
                <RadioGroupItem value="partners" id="partners" />
                <Label htmlFor="partners" className="cursor-pointer flex-1 font-normal">
                  Rapporteurs d'affaires (partenaires B2B)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {searchMode === 'partners' && (
            <div className="space-y-2">
              <Label htmlFor="activity" className="text-base font-semibold">
                Décrivez votre activité
              </Label>
              <Textarea
                id="activity"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Ex: Je vends des camping-cars neufs et d'occasion. Mon activité consiste à conseiller les clients sur le choix du véhicule adapté à leurs besoins..."
                className="min-h-[120px] resize-none"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                L'IA utilisera cette description pour identifier des partenaires pertinents (non concurrents)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxResults" className="text-base font-semibold">
              Nombre d'entreprises à générer
            </Label>
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
            disabled={isLoading || !placeId || (searchMode === 'partners' && !activityDescription.trim())}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {searchMode === 'partners' ? 'Préparation...' : 'Recherche en cours...'}
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                {searchMode === 'partners' ? 'Préparer la recherche' : 'Générer la liste'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
