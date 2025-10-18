import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { Slider } from '@/components/ui/slider';
import { CategoryAutocomplete, GBPCategory } from './CategoryAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { GeniusSuggestionsDialog } from './GeniusSuggestionsDialog';

interface SearchFormProps {
  onSearch: (companyName: string, address: string, placeId: string, maxResults: number, category: GBPCategory | null) => void;
  isLoading: boolean;
  onReset?: () => void;
}

export const SearchForm = ({ onSearch, isLoading, onReset }: SearchFormProps) => {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<GBPCategory | null>(null);
  const [geniusDialogOpen, setGeniusDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !address.trim() || !placeId || !selectedCategory) return;
    onSearch(companyName, address, placeId, maxResults, selectedCategory);
  };

  const handleAddressSelect = (selectedAddress: string, selectedPlaceId: string) => {
    setAddress(selectedAddress);
    setPlaceId(selectedPlaceId);
  };

  const handleGeniusClick = () => {
    if (!selectedCategory) {
      toast({
        title: "Catégorie manquante",
        description: "Veuillez d'abord sélectionner une catégorie d'activité",
        variant: "destructive",
      });
      return;
    }
    setGeniusDialogOpen(true);
  };

  const handleSelectSuggestion = (category: GBPCategory) => {
    setSelectedCategory(category);
    toast({
      title: "✨ Catégorie suggérée",
      description: `Recherche pour: ${category.displayName}`,
    });
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

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <CategoryAutocomplete
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="button"
                onClick={handleGeniusClick}
                disabled={isLoading || !selectedCategory}
                className="h-[42px] px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 mt-[28px]"
                title="Genius - Suggestions intelligentes de rapporteurs d'affaires"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <GeniusSuggestionsDialog
            open={geniusDialogOpen}
            onOpenChange={setGeniusDialogOpen}
            category={selectedCategory}
            onSelectCategory={handleSelectSuggestion}
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
            disabled={isLoading || !placeId || !companyName.trim() || !selectedCategory}
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
