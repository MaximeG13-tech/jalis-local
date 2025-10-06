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
import logo from '@/assets/logo.svg';

const Index = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastSearch, setLastSearch] = useState<{ 
    address: string; 
    placeId: string; 
    maxResults: number;
  } | null>(null);
  const { toast } = useToast();

  const handleSearch = async (
    address: string, 
    placeId: string, 
    maxResults: number
  ) => {
    setLastSearch({ address, placeId, maxResults });
    setIsLoading(true);
    setBusinesses([]);
    setProgress({ current: 0, total: maxResults });

    try {
      const results = await GooglePlacesService.searchBusinesses(
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/30 to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.08),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <img 
            src={logo} 
            alt="Logo JLo" 
            className="h-24 w-auto mx-auto mb-6"
          />
          
          <div className="inline-flex items-center justify-center gap-3 mb-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 backdrop-blur-sm border border-primary/20">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Génération de liens utiles
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Guide local automatisé avec l'IA
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
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {businesses.length} entreprise{businesses.length > 1 ? 's' : ''} trouvée{businesses.length > 1 ? 's' : ''}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Régénérer
                  </Button>
                  <Button
                    onClick={handleNewSearch}
                    variant="outline"
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Nouvelle recherche
                  </Button>
                  <ExportButton 
                    businesses={businesses}
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
