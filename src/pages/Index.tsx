import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { ResultsTable } from '@/components/ResultsTable';
import { ExportButton } from '@/components/ExportButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Business } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GBPCategory } from '@/components/CategoryAutocomplete';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [referralBusinesses, setReferralBusinesses] = useState<Record<string, Business[]>>({});
  const [selectedReferralCategories, setSelectedReferralCategories] = useState<GBPCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSearch, setLastSearch] = useState<{
    businessName: string;
    address: string;
    placeId: string;
    category: GBPCategory | null;
    maxResults: number;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const { toast } = useToast();

  const handleSearch = async ({
    businessName,
    address,
    placeId,
    category,
    maxResults
  }: {
    businessName: string;
    address: string;
    placeId: string;
    category: GBPCategory | null;
    maxResults: number;
  }) => {
    if (!category) return;
    
    setIsLoading(true);
    setBusinesses([]);
    setProgress(0);

    try {
      // Get place details to extract lat/lng
      const { data: placeData, error: placeError } = await supabase.functions.invoke('google-place-details', {
        body: { placeId }
      });

      if (placeError || !placeData?.result?.geometry?.location) {
        throw new Error('Impossible de récupérer les coordonnées de l\'adresse');
      }

      const { lat, lng } = placeData.result.geometry.location;
      
      setLastSearch({ businessName, address, placeId, category, maxResults, latitude: lat, longitude: lng });

      // Construct text query with category name (French) and location
      const categoryName = category.displayNameFr || category.displayName;
      const textQuery = `${categoryName} à ${address}`;

      const { data, error } = await supabase.functions.invoke('google-search-text', {
        body: {
          textQuery,
          latitude: lat,
          longitude: lng,
          maxResultCount: maxResults
        }
      });

      if (error) throw error;

      const results: Business[] = (data.results || []).map((place: any) => ({
        name: place.name || 'N/A',
        category: categoryName,
        address: place.formattedAddress || 'N/A',
        phone: place.nationalPhoneNumber || 'N/A',
        website: place.websiteUri || 'N/A',
        mapsUrl: place.googleMapsUri || '#',
        rating: place.rating,
        userRatingsTotal: place.userRatingCount
      }));

      setBusinesses(results);
      
      toast({
        title: "Recherche terminée",
        description: `${results.length} entreprise${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleSearchReferrals = async (categories: GBPCategory[]) => {
    if (!lastSearch) return;
    
    setSelectedReferralCategories(categories);
    const newReferralBusinesses: Record<string, Business[]> = {};

    for (const category of categories) {
      try {
        const categoryName = category.displayNameFr || category.displayName;
        const textQuery = `${categoryName} à ${lastSearch.address}`;

        const { data: searchData, error: searchError } = await supabase.functions.invoke('google-search-text', {
          body: {
            textQuery,
            latitude: lastSearch.latitude,
            longitude: lastSearch.longitude,
            maxResultCount: 10
          }
        });

        if (searchError) throw searchError;

        newReferralBusinesses[category.id] = (searchData.results || []).map((place: any) => ({
          name: place.name || 'N/A',
          category: categoryName,
          address: place.formattedAddress || 'N/A',
          phone: place.nationalPhoneNumber || 'N/A',
          website: place.websiteUri || 'N/A',
          mapsUrl: place.googleMapsUri || '#',
          rating: place.rating,
          userRatingsTotal: place.userRatingCount
        }));

        toast({
          title: "Recherche terminée",
          description: `${newReferralBusinesses[category.id].length} entreprises trouvées pour ${categoryName}`,
        });
      } catch (error) {
        console.error(`Erreur recherche ${category.displayNameFr || category.displayName}:`, error);
        toast({
          title: "Erreur",
          description: `Impossible de charger les entreprises pour ${category.displayNameFr || category.displayName}`,
          variant: "destructive",
        });
      }
    }

    setReferralBusinesses(newReferralBusinesses);
  };

  const handleNewSearch = () => {
    setBusinesses([]);
    setReferralBusinesses({});
    setSelectedReferralCategories([]);
    setLastSearch(null);
    window.location.reload();
  };

  const handleRegenerate = () => {
    if (lastSearch) {
      handleSearch(lastSearch);
    }
  };

  const handleRemoveBusiness = (index: number) => {
    const newBusinesses = businesses.filter((_, i) => i !== index);
    setBusinesses(newBusinesses);
    toast({
      title: "Entreprise supprimée",
      description: "L'entreprise a été retirée de la liste",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Génération de liens utiles
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight tracking-tight mt-8 mb-12">
            Guide local automatisé<br />avec l'IA
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Search Form */}
          <div className="max-w-3xl mx-auto">
            <SearchForm 
              onSearch={handleSearch}
              onSearchReferrals={handleSearchReferrals}
              isLoading={isLoading} 
            />
          </div>

          {/* Progress Indicator */}
          {isLoading && progress > 0 && (
            <ProgressIndicator current={progress} total={lastSearch?.maxResults || 0} />
          )}

          {/* Results */}
          {businesses.length > 0 && (
            <>
              <ResultsTable 
                businesses={businesses} 
                onRemove={handleRemoveBusiness}
              />
              <ExportButton 
                businesses={businesses} 
                companyName={lastSearch?.businessName}
                address={lastSearch?.address}
                maxResults={lastSearch?.maxResults}
              />
            </>
          )}

          {/* Referral businesses section */}
          {selectedReferralCategories.length > 0 && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold">Rapporteurs d'affaires</h2>
              </div>

              {selectedReferralCategories.map((category) => {
                const categoryBusinesses = referralBusinesses[category.id] || [];
                const categoryName = category.displayNameFr || category.displayName;

                return (
                  <Card key={category.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{categoryName}</h3>
                      <span className="text-sm text-muted-foreground">
                        {categoryBusinesses.length} entreprises
                      </span>
                    </div>

                    {categoryBusinesses.length > 0 ? (
                      <ResultsTable 
                        businesses={categoryBusinesses}
                        onRemove={(index) => {
                          setReferralBusinesses({
                            ...referralBusinesses,
                            [category.id]: categoryBusinesses.filter((_, i) => i !== index)
                          });
                        }}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Aucune entreprise trouvée pour cette catégorie</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => handleSearchReferrals([category])}
                        >
                          Rechercher à nouveau
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Index;
