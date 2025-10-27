import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BusinessType, BUSINESS_TYPES } from "@/constants/businessTypes";
import { Loader2, Sparkles, Link2, CheckCircle2 } from "lucide-react";
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
  const [gmbLink, setGmbLink] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!gmbLink.trim()) {
      toast({
        title: "Lien manquant",
        description: "Veuillez coller votre lien Google My Business",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-business-activity', {
        body: { gmbLink: gmbLink.trim() }
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
    setGmbLink("");
    setAnalysisResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset
    setGmbLink("");
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
            Collez votre lien Google My Business pour une analyse automatique
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!analysisResult ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="gmbLink" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Lien de votre fiche Google My Business
                </Label>
                <Input
                  id="gmbLink"
                  type="text"
                  placeholder="Ex: https://maps.app.goo.gl/abc123..."
                  value={gmbLink}
                  onChange={(e) => setGmbLink(e.target.value)}
                  disabled={isAnalyzing}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Vous pouvez copier le lien depuis votre profil Google Business ou Google Maps
                </p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !gmbLink.trim()}
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
