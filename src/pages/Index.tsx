import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchForm } from '@/components/SearchForm';
import { EnrichedResultsTable } from '@/components/EnrichedResultsTable';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, RotateCcw, Download } from 'lucide-react';

interface EnrichedBusiness {
  name: string;
  activity: string;
  city: string;
  extract: string;
  description: string;
}

const Index = () => {
  const [businesses, setBusinesses] = useState<EnrichedBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastSearch, setLastSearch] = useState<{ 
    address: string; 
    placeId: string; 
    maxResults: number;
    companyName: string;
  } | null>(null);
  const { toast } = useToast();

  const handleSearch = async (
    address: string, 
    placeId: string, 
    maxResults: number,
    companyName: string
  ) => {
    setLastSearch({ address, placeId, maxResults, companyName });
    setIsLoading(true);
    setBusinesses([]);
    setProgress({ current: 0, total: maxResults });

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-partner-guide',
        {
          body: {
            activityDescription: "Recherche d'apporteurs d'affaires",
            address: address,
            maxResults: maxResults,
            companyName: companyName,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const enrichedBusinesses = data?.enrichedBusinesses || [];
      setBusinesses(enrichedBusinesses);
      
      toast({
        title: "Recherche terminée",
        description: `${enrichedBusinesses.length} entreprise${enrichedBusinesses.length > 1 ? 's' : ''} trouvée${enrichedBusinesses.length > 1 ? 's' : ''}`,
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
        lastSearch.maxResults,
        lastSearch.companyName
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

  const handleExport = () => {
    const dataStr = JSON.stringify(businesses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apporteurs-affaires-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi",
      description: "Les données ont été exportées avec succès",
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
                  <Button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="gap-2 font-semibold"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Exporter JSON
                  </Button>
                </div>
              </div>
              <EnrichedResultsTable businesses={businesses} onRemove={handleRemoveBusiness} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Index;
