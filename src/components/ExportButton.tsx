import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Business } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface ExportButtonProps {
  businesses: Business[];
}

export const ExportButton = ({ businesses }: ExportButtonProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (businesses.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a aucune entreprise à exporter",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      toast({
        title: "Enrichissement en cours",
        description: "L'IA génère le contenu optimisé pour chaque entreprise...",
      });

      const { data, error } = await supabase.functions.invoke('enrich-businesses', {
        body: { businesses }
      });

      if (error) throw error;

      const enrichedData = data.enrichedBusinesses;
      const jsonString = JSON.stringify(enrichedData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'entreprises_enrichies.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: `${enrichedData.length} entreprise${enrichedData.length > 1 ? 's' : ''} enrichie${enrichedData.length > 1 ? 's' : ''} et exportée${enrichedData.length > 1 ? 's' : ''} en JSON`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enrichissement des données",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={businesses.length === 0 || isExporting}
      variant="outline"
      className="w-full sm:w-auto"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enrichissement en cours...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exporter en JSON
        </>
      )}
    </Button>
  );
};
