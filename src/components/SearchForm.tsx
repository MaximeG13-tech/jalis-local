import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Search } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { CategoryAutocomplete, GBPCategory } from './CategoryAutocomplete';
import { GeniusDialog } from './GeniusDialog';
import { Slider } from '@/components/ui/slider';

interface SearchFormProps {
  onSearch: (params: {
    businessName: string;
    address: string;
    placeId: string;
    category: GBPCategory | null;
    maxResults: number;
  }) => void;
  onSearchReferrals: (categories: GBPCategory[]) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, onSearchReferrals, isLoading }: SearchFormProps) => {
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GBPCategory | null>(null);
  const [maxResults, setMaxResults] = useState(10);
  const [geniusOpen, setGeniusOpen] = useState(false);

  const handleGeniusSelect = (categories: GBPCategory[]) => {
    onSearchReferrals(categories);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !address.trim() || !placeId || !selectedCategory) return;
    onSearch({
      businessName,
      address,
      placeId,
      category: selectedCategory,
      maxResults
    });
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
            <Label htmlFor="businessName" className="text-sm font-bold text-foreground uppercase tracking-wide">
              Entreprise - Nom
            </Label>
            <Input
              id="businessName"
              placeholder="Ex: Dupont & Associés"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={handleAddressSelect}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <CategoryAutocomplete
              value={selectedCategory}
              onChange={setSelectedCategory}
              disabled={isLoading}
            />
          </div>

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

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || !businessName || !address || !selectedCategory}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGeniusOpen(true)}
              disabled={!selectedCategory || isLoading}
              className="px-6 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Genius
            </Button>
          </div>

          <GeniusDialog
            open={geniusOpen}
            onOpenChange={setGeniusOpen}
            category={selectedCategory}
            onSelectCategories={handleGeniusSelect}
          />
        </form>
      </CardContent>
    </Card>
  );
};
