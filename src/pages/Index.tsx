import { useState } from 'react';
import { Business } from '@/types/business';
import { GooglePlacesService } from '@/services/GooglePlacesService';
import { SearchForm } from '@/components/SearchForm';
import { ResultsTable } from '@/components/ResultsTable';
import { ExportButton } from '@/components/ExportButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, RotateCcw } from 'lucide-react';

const Index = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastSearch, setLastSearch] = useState<{ 
    companyName: string;
    address: string; 
    placeId: string; 
    maxResults: number;
  } | null>(null);
  const { toast } = useToast();

  const handleSearch = async (
    companyName: string,
    address: string, 
    placeId: string, 
    maxResults: number
  ) => {
    setLastSearch({ companyName, address, placeId, maxResults });
    setIsLoading(true);
    setBusinesses([]);
    setProgress({ current: 0, total: maxResults });

    try {
      const results = await GooglePlacesService.searchBusinesses(
        companyName,
        placeId,
        maxResults,
        (current, total) => {
          setProgress({ current, total });
        }
      );

      setBusinesses(results);
      
      toast({
        title: "Recherche terminée",
        description: `${results.length} entreprise${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`,
      });
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      });
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleRegenerate = () => {
    if (lastSearch) {
      handleSearch(
        lastSearch.companyName,
        lastSearch.address, 
        lastSearch.placeId, 
        lastSearch.maxResults
      );
    }
  };

  const handleNewSearch = () => {
    setBusinesses([]);
    setLastSearch(null);
    toast({
      title: "Recherche réinitialisée",
      description: "Vous pouvez effectuer une nouvelle recherche",
    });
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
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Progress Indicator */}
          {isLoading && progress.total > 0 && (
            <ProgressIndicator current={progress.current} total={progress.total} />
          )}

          {/* Results */}
          {businesses.length > 0 && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-6 bg-card rounded-lg border border-border shadow-card">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {businesses.length} entreprise{businesses.length > 1 ? 's' : ''} trouvée{businesses.length > 1 ? 's' : ''}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    Résultats prêts à être exportés
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    disabled={isLoading}
                    className="gap-2 font-semibold"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Régénérer
                  </Button>
                  <Button
                    onClick={handleNewSearch}
                    variant="outline"
                    disabled={isLoading}
                    className="gap-2 font-semibold"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Nouvelle recherche
                  </Button>
                  <ExportButton 
                    businesses={businesses}
                    companyName={lastSearch?.companyName}
                    address={lastSearch?.address}
                    maxResults={lastSearch?.maxResults}
                  />
                </div>
              </div>
              <ResultsTable businesses={businesses} onRemove={handleRemoveBusiness} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Index;
