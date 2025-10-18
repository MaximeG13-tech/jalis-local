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

// Mapping étendu de rapporteurs d'affaires par mots-clés
const REFERRAL_MAPPING: Record<string, string[]> = {
  // Immobilier & Juridique
  'notary': ['real estate', 'mortgage', 'home builder', 'architect', 'home inspector', 'lawyer', 'surveyor'],
  'lawyer': ['notary', 'accountant', 'consultant', 'insurance', 'tax', 'financial advisor'],
  'real estate': ['notary', 'mortgage', 'moving', 'architect', 'home inspector', 'contractor', 'surveyor'],
  'mortgage': ['notary', 'real estate', 'bank', 'financial advisor', 'insurance', 'accountant'],
  'architect': ['notary', 'real estate', 'contractor', 'interior design', 'landscape', 'engineer'],
  
  // Construction & Artisans
  'plumber': ['property management', 'real estate', 'contractor', 'architect', 'electrician', 'hvac'],
  'electrician': ['property management', 'real estate', 'contractor', 'architect', 'plumber', 'security'],
  'painter': ['property management', 'real estate', 'architect', 'interior design', 'contractor'],
  'carpenter': ['architect', 'contractor', 'real estate', 'furniture', 'interior design'],
  'contractor': ['architect', 'real estate', 'plumber', 'electrician', 'painter', 'inspector'],
  'roofer': ['contractor', 'real estate', 'property management', 'architect', 'insurance'],
  
  // Beauté & Bien-être
  'hair salon': ['beauty salon', 'photographer', 'wedding', 'makeup', 'nail salon', 'spa'],
  'beauty salon': ['hair salon', 'photographer', 'wedding', 'spa', 'nail salon', 'cosmetic'],
  'barber': ['beauty salon', 'hair salon', 'massage', 'spa', 'fashion'],
  
  // Santé
  'doctor': ['pharmacy', 'physical therapist', 'nurse', 'laboratory', 'optician', 'medical'],
  'dentist': ['orthodontist', 'pharmacy', 'radiologist', 'laboratory', 'surgeon', 'dental'],
  'physical therapist': ['doctor', 'osteopath', 'pharmacy', 'gym', 'sports', 'rehabilitation'],
  'pharmacy': ['doctor', 'dentist', 'laboratory', 'optician', 'medical supply', 'hospital'],
  
  // Services professionnels
  'accountant': ['lawyer', 'consultant', 'bank', 'insurance', 'notary', 'tax', 'financial'],
  'insurance': ['accountant', 'lawyer', 'real estate', 'bank', 'financial advisor', 'consultant'],
  'bank': ['accountant', 'insurance', 'financial advisor', 'mortgage', 'lawyer', 'investment'],
  
  // Commerce & Restauration
  'restaurant': ['caterer', 'wine', 'bakery', 'florist', 'wedding', 'event', 'bar'],
  'bakery': ['restaurant', 'caterer', 'grocery', 'cafe', 'chocolate', 'pastry'],
  'cafe': ['bakery', 'restaurant', 'bar', 'ice cream', 'book store', 'gift shop'],
  
  // Automobile
  'auto repair': ['body shop', 'car wash', 'auto insurance', 'towing', 'gas station', 'tire'],
  'body shop': ['auto repair', 'auto insurance', 'car dealer', 'car wash', 'paint'],
  'car dealer': ['auto repair', 'insurance', 'bank', 'car wash', 'accessories'],
  
  // Éducation & Formation
  'driving school': ['auto repair', 'insurance', 'car dealer', 'gas station'],
  'music school': ['instrument', 'recording', 'event', 'theater', 'dance school'],
  'dance school': ['music school', 'event', 'photographer', 'costume', 'theater'],
  
  // Événementiel
  'wedding planner': ['photographer', 'caterer', 'florist', 'beauty salon', 'venue', 'decoration'],
  'photographer': ['wedding planner', 'event', 'printing', 'frame', 'studio', 'videographer'],
  'caterer': ['wedding planner', 'event', 'restaurant', 'florist', 'venue', 'party rental'],
  'florist': ['wedding planner', 'event', 'funeral', 'gift shop', 'garden center'],
  
  // Tourisme & Hôtellerie
  'hotel': ['travel agency', 'tour', 'restaurant', 'taxi', 'car rental', 'tourist'],
  'travel agency': ['hotel', 'tour', 'airline', 'car rental', 'insurance', 'passport'],
  
  // Services à domicile
  'cleaning service': ['property management', 'real estate', 'carpet', 'window', 'moving'],
  'lawn care': ['landscaping', 'tree service', 'garden center', 'property management'],
  'landscaping': ['architect', 'lawn care', 'tree service', 'property management', 'garden'],
  
  // Animaux
  'veterinarian': ['pet groomer', 'pet store', 'animal hospital', 'pet sitting', 'breeder'],
  'pet groomer': ['veterinarian', 'pet store', 'dog trainer', 'pet sitting'],
  'pet store': ['veterinarian', 'pet groomer', 'dog trainer', 'pet food', 'aquarium'],
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
    // Load from raw text file and convert
    fetch('/gcid_raw.txt')
      .then(res => res.text())
      .then(text => {
        const categoriesArray = JSON.parse(text);
        const converted = categoriesArray.map((category: string) => ({
          id: `gcid:${category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          displayName: category
        }));
        setCategories(converted);
        console.log(`Genius: chargé ${converted.length} catégories GBP`);
      })
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
    
    // Recherche des mots-clés dans le nom de la catégorie (en anglais car la base GBP est en anglais)
    const categoryLower = category.displayName.toLowerCase();
    let keywords: string[] = [];
    
    // Recherche dans le mapping avec matching partiel
    for (const [key, values] of Object.entries(REFERRAL_MAPPING)) {
      if (categoryLower.includes(key) || key.includes(categoryLower.split(' ')[0])) {
        keywords = values;
        break;
      }
    }
    
    // Si aucun mapping trouvé, suggestions génériques pertinentes
    if (keywords.length === 0) {
      keywords = ['marketing', 'advertising', 'insurance', 'consulting', 'legal', 'financial'];
    }
    
    // Recherche des catégories correspondantes dans la base GBP complète
    const foundSuggestions: GBPCategory[] = [];
    
    for (const keyword of keywords) {
      if (foundSuggestions.length >= 5) break;
      
      // Recherche avec matching partiel pour trouver des catégories pertinentes
      const matches = categories.filter(cat => {
        const catLower = cat.displayName.toLowerCase();
        return (
          catLower.includes(keyword) &&
          cat.id !== category.id &&
          !foundSuggestions.some(s => s.id === cat.id)
        );
      });
      
      // Prendre plusieurs résultats par mot-clé si nécessaire
      const toAdd = Math.min(matches.length, Math.max(1, Math.floor((5 - foundSuggestions.length) / (keywords.length - keywords.indexOf(keyword)))));
      foundSuggestions.push(...matches.slice(0, toAdd));
    }
    
    console.log(`Genius: ${foundSuggestions.length} suggestions trouvées pour "${category.displayName}"`);
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
