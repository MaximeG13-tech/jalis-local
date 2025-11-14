import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Business } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface ExportButtonProps {
  businesses: Business[];
  companyName?: string;
  companyPlaceId?: string;
  address?: string;
  maxResults?: number;
}

export const ExportButton = ({ businesses, companyName, companyPlaceId }: ExportButtonProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer effect to track elapsed time during export
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isExporting) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isExporting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (businesses.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Il n'y a aucune entreprise à exporter",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Enrichissement en cours",
        description: "L'IA génère le contenu optimisé pour chaque entreprise...",
      });

      const { data, error } = await supabase.functions.invoke('enrich-businesses', {
        body: { 
          businesses, 
          companyName: companyName || "votre entreprise",
          companyPlaceId: companyPlaceId 
        }
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
    <div className="flex flex-col items-center gap-2">
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
      {isExporting && (
        <p className="text-sm text-muted-foreground">
          Temps écoulé : {formatTime(elapsedTime)}
        </p>
      )}
    </div>
  );
};
