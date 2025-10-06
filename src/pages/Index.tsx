import { useState } from 'react';
import { Business } from '@/types/business';
import { GooglePlacesService } from '@/services/GooglePlacesService';
import { ApiKeyConfig } from '@/components/ApiKeyConfig';
import { SearchForm } from '@/components/SearchForm';
import { ResultsTable } from '@/components/ResultsTable';
import { ExportButton } from '@/components/ExportButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useToast } from '@/hooks/use-toast';
import { Building2 } from 'lucide-react';

const Index = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const handleSearch = async (address: string, maxResults: number) => {
    const apiKey = GooglePlacesService.getApiKey();
    
    if (!apiKey) {
      toast({
        title: "Configuration requise",
        description: "Veuillez configurer votre clé API Google Places",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setBusinesses([]);
    setProgress({ current: 0, total: maxResults });

    try {
      const results = await GooglePlacesService.searchBusinesses(
        address,
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
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Prospection Entreprises
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trouvez rapidement des entreprises locales avec site web et numéro de téléphone pour votre prospection commerciale
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* API Configuration */}
          <ApiKeyConfig />

          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Progress Indicator */}
          {isLoading && progress.total > 0 && (
            <ProgressIndicator current={progress.current} total={progress.total} />
          )}

          {/* Results */}
          {businesses.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <ExportButton businesses={businesses} />
              </div>
              <ResultsTable businesses={businesses} />
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!isLoading && businesses.length === 0 && (
          <div className="mt-12 text-center text-sm text-muted-foreground space-y-2">
            <p>💡 Astuce : L'application filtre automatiquement les entreprises pour ne garder que celles avec téléphone ET site web</p>
            <p>⚡ Optimisé pour minimiser les appels API et maximiser l'efficacité</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
