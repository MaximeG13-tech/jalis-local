import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Business } from '@/types/business';
import { GooglePlacesService } from '@/services/GooglePlacesService';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  businesses: Business[];
}

export const ExportButton = ({ businesses }: ExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    if (businesses.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a aucune entreprise à exporter",
        variant: "destructive",
      });
      return;
    }

    GooglePlacesService.downloadJson(businesses);
    toast({
      title: "Export réussi",
      description: `${businesses.length} entreprise${businesses.length > 1 ? 's' : ''} exportée${businesses.length > 1 ? 's' : ''} en JSON`,
    });
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={businesses.length === 0}
      variant="outline"
      className="w-full sm:w-auto"
    >
      <Download className="mr-2 h-4 w-4" />
      Exporter en JSON
    </Button>
  );
};
