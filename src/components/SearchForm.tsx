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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import geniusIcon from '@/assets/genius-icon.png';

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
  const [isGeniusLoading, setIsGeniusLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !address.trim() || !placeId) return;
    onSearch(companyName, address, placeId, maxResults, selectedTypes);
  };

  const handleAddressSelect = (selectedAddress: string, selectedPlaceId: string) => {
    setAddress(selectedAddress);
    setPlaceId(selectedPlaceId);
  };

  const handleGeniusClick = async () => {
    if (!companyName.trim() || !address.trim()) {
      toast({
        title: "Information manquante",
        description: "Veuillez renseigner le nom et l'adresse de votre entreprise",
        variant: "destructive",
      });
      return;
    }

    setIsGeniusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-complementary-types', {
        body: { companyName, address }
      });

      if (error) throw error;

      if (data.suggestedTypes && data.suggestedTypes.length > 0) {
        // Import BUSINESS_TYPES to map the suggested types to BusinessType objects
        const { BUSINESS_TYPES } = await import('@/constants/businessTypes');
        const suggestedBusinessTypes = BUSINESS_TYPES.filter(type => 
          data.suggestedTypes.includes(type.googlePlaceType)
        );
        
        setSelectedTypes(suggestedBusinessTypes);
        toast({
          title: "✨ Suggestions Genius",
          description: `${suggestedBusinessTypes.length} type(s) d'activités complémentaires suggéré(s)`,
        });
      } else {
        toast({
          title: "Aucune suggestion",
          description: "Impossible de générer des suggestions pour le moment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Genius error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération des suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGeniusLoading(false);
    }
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
            <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
              Types d'activités recherchées
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <BusinessTypesSelector
                  selectedTypes={selectedTypes}
                  onTypesChange={setSelectedTypes}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="button"
                onClick={handleGeniusClick}
                disabled={isLoading || isGeniusLoading || !companyName.trim() || !address.trim()}
                className="h-10 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
                title="Obtenir des suggestions intelligentes"
              >
                {isGeniusLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <img src={geniusIcon} alt="Genius" className="h-5 w-5" />
                )}
              </Button>
            </div>
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
