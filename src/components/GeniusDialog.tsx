import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BusinessType, BUSINESS_TYPES } from "@/constants/businessTypes";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GeniusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuggest: (types: BusinessType[]) => void;
}

interface AnalysisResult {
  detected_activity: string;
  primary_type: string;
  suggestions: string[];
}

export const GeniusDialog = ({ open, onOpenChange, onSuggest }: GeniusDialogProps) => {
  const [businessActivity, setBusinessActivity] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!businessActivity.trim()) {
      toast({
        title: "Activité manquante",
        description: "Veuillez indiquer votre activité",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-business-activity', {
        body: { businessActivity: businessActivity.trim() }
      });

      if (error) {
        throw new Error(error.message || "Erreur lors de l'analyse");
      }

      if (!data || !data.suggestions) {
        throw new Error("Aucune suggestion reçue");
      }

      setAnalysisResult(data);
      
      toast({
        title: "✨ Analyse terminée",
        description: `${data.suggestions.length} partenaires suggérés`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Impossible d'analyser votre activité",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!analysisResult) return;

    // Convertir les type_ids en BusinessType[]
    const matchingTypes = BUSINESS_TYPES.filter(type => 
      analysisResult.suggestions.includes(type.id)
    );

    onSuggest(matchingTypes);
    onOpenChange(false);
    
    // Reset pour la prochaine fois
    setBusinessActivity("");
    setAnalysisResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset
    setBusinessActivity("");
    setAnalysisResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <DialogTitle>Genius - Trouvez vos partenaires</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Indiquez votre activité pour une analyse automatique
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!analysisResult ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessActivity" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quelle est votre activité ?
                </Label>
                <Input
                  id="businessActivity"
                  type="text"
                  placeholder="Ex: Entreprise de logiciels, Restaurant italien, Coiffeur..."
                  value={businessActivity}
                  onChange={(e) => setBusinessActivity(e.target.value)}
                  disabled={isAnalyzing}
                />
                <p className="text-xs text-muted-foreground">
                  Saisissez votre activité telle qu'elle apparaît sur Google Maps
                </p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !businessActivity.trim()}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyser mon activité
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Activité détectée</p>
                  <p className="text-lg font-bold text-foreground">
                    {analysisResult.detected_activity}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Partenaires suggérés par l'IA
                  </p>
                  <div className="space-y-2">
                    {analysisResult.suggestions.map((typeId) => {
                      const businessType = BUSINESS_TYPES.find(t => t.id === typeId);
                      return (
                        <div
                          key={typeId}
                          className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                        >
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                          <span className="font-medium text-foreground">
                            {businessType?.label || typeId}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Appliquer ces suggestions
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
