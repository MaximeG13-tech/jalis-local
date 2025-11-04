import { useState } from 'react';
import { Business } from '@/types/business';
import { GooglePlacesService } from '@/services/GooglePlacesService';
import { SearchForm } from '@/components/SearchForm';
import { ResultsTable } from '@/components/ResultsTable';
import { ExportButton } from '@/components/ExportButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, RotateCcw, AlertCircle } from 'lucide-react';
import { BusinessType } from '@/constants/businessTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Index = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [excludedPlaceIds, setExcludedPlaceIds] = useState<Set<string>>(new Set());
  const [lastSearch, setLastSearch] = useState<{ 
    companyName: string;
    address: string; 
    placeId: string; 
    maxResults: number;
    selectedTypes: BusinessType[];
    companyPlaceId: string;
  } | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitDialogData, setLimitDialogData] = useState<{ found: number; requested: number } | null>(null);
  const { toast } = useToast();

  const handleSearch = async (
    companyName: string,
    address: string, 
    placeId: string, 
    maxResults: number,
    selectedTypes: BusinessType[],
    companyPlaceId: string,
    isRegeneration: boolean = false
  ) => {
    setLastSearch({ companyName, address, placeId, maxResults, selectedTypes, companyPlaceId });
    setIsLoading(true);
    setBusinesses([]);
    setProgress({ current: 0, total: maxResults });

    try {
      const results = await GooglePlacesService.searchBusinesses(
        companyName,
        placeId,
        maxResults,
        selectedTypes,
        (current, total) => {
          setProgress({ current, total });
        },
        isRegeneration ? excludedPlaceIds : undefined
      );

      // Ajouter les nouveaux place_ids à la liste d'exclusion
      const newExcludedIds = new Set(excludedPlaceIds);
      results.forEach(business => {
        // Extraire le place_id du lien maps
        const placeIdMatch = business.lien_maps.match(/query_place_id=([^&]+)/);
        if (placeIdMatch) {
          newExcludedIds.add(placeIdMatch[1]);
        }
      });
      setExcludedPlaceIds(newExcludedIds);

      setBusinesses(results);
      
      // Afficher un avertissement si moins d'entreprises trouvées que demandé
      if (results.length < maxResults) {
        setLimitDialogData({ found: results.length, requested: maxResults });
        setShowLimitDialog(true);
      }
      
      toast({
        title: isRegeneration ? "Nouvelles entreprises générées" : "Recherche terminée",
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
        lastSearch.maxResults,
        lastSearch.selectedTypes,
        lastSearch.companyPlaceId,
        true // isRegeneration = true
      );
    }
  };

  const handleNewSearch = () => {
    setBusinesses([]);
    setLastSearch(null);
    setExcludedPlaceIds(new Set()); // Reset exclusions
    // Force page reload to reset the form completely including selected types
    window.location.reload();
  };

  const handleRemoveBusiness = (index: number) => {
    const newBusinesses = businesses.filter((_, i) => i !== index);
    setBusinesses(newBusinesses);
    toast({
      title: "Entreprise supprimée",
      description: "L'entreprise a été retirée de la liste",
    });
  };

  const handleUpdateBusiness = (index: number, updatedBusiness: Business) => {
    setBusinesses(prev => prev.map((business, i) => i === index ? updatedBusiness : business));
    toast({
      title: "Nom modifié",
      description: "Le nom de l'entreprise a été mis à jour",
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
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRegenerate}
                      variant="outline"
                      disabled={isLoading}
                      className="gap-2 font-semibold flex-1 sm:flex-none"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Régénérer
                    </Button>
                    <Button
                      onClick={handleNewSearch}
                      variant="outline"
                      disabled={isLoading}
                      className="gap-2 font-semibold flex-1 sm:flex-none"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Nouvelle recherche
                    </Button>
                  </div>
                  <ExportButton 
                    businesses={businesses}
                    companyName={lastSearch?.companyName}
                    companyPlaceId={lastSearch?.companyPlaceId}
                    address={lastSearch?.address}
                    maxResults={lastSearch?.maxResults}
                  />
                </div>
              </div>
              <ResultsTable 
                businesses={businesses} 
                onRemove={handleRemoveBusiness}
                onUpdate={handleUpdateBusiness}
              />
            </div>
          )}
        </div>

        {/* Dialog d'avertissement pour résultats limités */}
        <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <DialogTitle>Résultats limités</DialogTitle>
              </div>
              <DialogDescription className="text-base space-y-2">
                <p>
                  Votre recherche demandait <strong>{limitDialogData?.requested} entreprises</strong>, mais nous n'avons trouvé que <strong>{limitDialogData?.found} entreprise{(limitDialogData?.found ?? 0) > 1 ? 's' : ''} exploitable{(limitDialogData?.found ?? 0) > 1 ? 's' : ''}</strong> dans cette zone.
                </p>
                <p className="text-muted-foreground">
                  L'application vous présente toutes les entreprises disponibles correspondant à vos critères.
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setShowLimitDialog(false)}>
                Compris
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
