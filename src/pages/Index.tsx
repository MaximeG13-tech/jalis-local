import { useState } from 'react';
import { Business } from '@/types/business';
import { GooglePlacesService } from '@/services/GooglePlacesService';
import { SearchForm } from '@/components/SearchForm';
import { ResultsTable } from '@/components/ResultsTable';
import { ExportButton } from '@/components/ExportButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useToast } from '@/hooks/use-toast';
import { Building2, Sparkles } from 'lucide-react';

const Index = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const handleSearch = async (address: string, placeId: string, maxResults: number) => {
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/30 to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.08),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 backdrop-blur-sm border border-primary/20">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Prospection Intelligente
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Trouvez vos clients
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Générez automatiquement une liste d'entreprises qualifiées avec site web et téléphone
          </p>
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
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {businesses.length} entreprise{businesses.length > 1 ? 's' : ''} trouvée{businesses.length > 1 ? 's' : ''}
                </h2>
                <ExportButton businesses={businesses} />
              </div>
              <ResultsTable businesses={businesses} />
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!isLoading && businesses.length === 0 && (
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Filtrage intelligent</h3>
                <p className="text-sm text-muted-foreground">
                  Uniquement les entreprises avec téléphone ET site web
                </p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Données complètes</h3>
                <p className="text-sm text-muted-foreground">
                  Nom, adresse, téléphone, site web et lien Google Maps
                </p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold mb-2">Rapide et optimisé</h3>
                <p className="text-sm text-muted-foreground">
                  Résultats en quelques secondes avec minimisation des coûts API
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
