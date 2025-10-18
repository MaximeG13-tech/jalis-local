import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { GBPCategory } from './CategoryAutocomplete';

interface GeniusSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: GBPCategory | null;
  onSelectCategory: (category: GBPCategory) => void;
}

// Mapping de rapporteurs d'affaires par mots-clés
const REFERRAL_MAPPING: Record<string, string[]> = {
  // Immobilier
  notaire: ['agent immobilier', 'constructeur', 'courtier crédit', 'architecte', 'diagnostiqueur'],
  'agent immobilier': ['notaire', 'courtier crédit', 'déménageur', 'architecte', 'diagnostiqueur'],
  architecte: ['notaire', 'constructeur', 'agent immobilier', 'décorateur', 'paysagiste'],
  
  // Artisans
  plombier: ['syndic', 'agent immobilier', 'rénovation', 'architecte', 'gestionnaire biens'],
  électricien: ['syndic', 'agent immobilier', 'rénovation', 'architecte', 'domotique'],
  peintre: ['syndic', 'agent immobilier', 'architecte', 'décorateur', 'rénovation'],
  
  // Beauté/Bien-être
  coiffeur: ['esthéticien', 'photographe', 'wedding planner', 'robe mariée', 'maquilleur'],
  'institut beauté': ['coiffeur', 'photographe', 'wedding planner', 'spa', 'onglerie'],
  
  // Santé
  médecin: ['pharmacie', 'kinésithérapeute', 'infirmier', 'laboratoire', 'opticien'],
  dentiste: ['orthodontiste', 'prothésiste', 'pharmacie', 'radiologue', 'laboratoire'],
  kinésithérapeute: ['médecin', 'ostéopathe', 'pharmacie', 'salle sport', 'podologue'],
  
  // Services
  avocat: ['notaire', 'expert-comptable', 'huissier', 'assurance', 'conseil entreprise'],
  'expert-comptable': ['avocat', 'conseil entreprise', 'banque', 'assurance', 'notaire'],
  
  // Commerce
  restaurant: ['traiteur', 'cave vin', 'pâtisserie', 'fleuriste', 'wedding planner'],
  'boulangerie pâtisserie': ['restaurant', 'traiteur', 'épicerie', 'café', 'chocolatier'],
  
  // Auto
  garagiste: ['carrossier', 'station lavage', 'assurance auto', 'dépanneur', 'station-service'],
  carrossier: ['garagiste', 'assurance auto', 'expert auto', 'station lavage', 'vitrier auto'],
};

export const GeniusSuggestionsDialog = ({ 
  open, 
  onOpenChange, 
  category,
  onSelectCategory 
}: GeniusSuggestionsDialogProps) => {
  const [categories, setCategories] = useState<GBPCategory[]>([]);
  const [suggestions, setSuggestions] = useState<GBPCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/gcid_categories.json')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Erreur chargement catégories:', err));
  }, []);

  useEffect(() => {
    if (open && category && categories.length > 0) {
      generateSuggestions();
    }
  }, [open, category, categories]);

  const generateSuggestions = () => {
    if (!category) return;
    
    setLoading(true);
    
    // Recherche des mots-clés dans le nom de la catégorie
    const categoryLower = category.displayName.toLowerCase();
    let keywords: string[] = [];
    
    for (const [key, values] of Object.entries(REFERRAL_MAPPING)) {
      if (categoryLower.includes(key)) {
        keywords = values;
        break;
      }
    }
    
    // Si aucun mapping trouvé, suggestions génériques
    if (keywords.length === 0) {
      keywords = ['marketing', 'comptable', 'assurance', 'conseil', 'juridique'];
    }
    
    // Recherche des catégories correspondantes
    const foundSuggestions: GBPCategory[] = [];
    
    for (const keyword of keywords) {
      if (foundSuggestions.length >= 5) break;
      
      const matches = categories.filter(cat => 
        cat.displayName.toLowerCase().includes(keyword) &&
        cat.id !== category.id &&
        !foundSuggestions.some(s => s.id === cat.id)
      );
      
      foundSuggestions.push(...matches.slice(0, 1));
    }
    
    setSuggestions(foundSuggestions.slice(0, 5));
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Genius - Rapporteurs d'affaires
          </DialogTitle>
          <DialogDescription>
            Suggestions de catégories complémentaires pour {category?.displayName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {suggestions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune suggestion trouvée pour cette catégorie.
              </p>
            ) : (
              suggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  className="w-full justify-between h-auto py-4 px-4 hover:bg-purple-50"
                  onClick={() => {
                    onSelectCategory(suggestion);
                    onOpenChange(false);
                  }}
                >
                  <span className="text-left font-medium">{suggestion.displayName}</span>
                  <span className="text-xs text-muted-foreground">Voir les entreprises →</span>
                </Button>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
