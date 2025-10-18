import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, RefreshCw, Edit } from 'lucide-react';
import { GBPCategory } from './CategoryAutocomplete';
import { CategoryAutocomplete } from './CategoryAutocomplete';

interface GeniusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: GBPCategory | null;
  onSelectCategories: (categories: GBPCategory[]) => void;
}

// Mapping étendu de rapporteurs d'affaires par mots-clés (en français)
const REFERRAL_MAPPING: Record<string, string[]> = {
  // Immobilier & Juridique
  'notaire': ['immobilier', 'crédit', 'maison', 'architecte', 'diagnostic', 'avocat', 'géomètre'],
  'avocat': ['notaire', 'comptable', 'consultant', 'assurance', 'fiscal', 'financier'],
  'immobilier': ['notaire', 'crédit', 'déménagement', 'architecte', 'diagnostic', 'rénovation', 'géomètre'],
  'crédit': ['notaire', 'immobilier', 'banque', 'financier', 'assurance', 'comptable'],
  'architecte': ['notaire', 'immobilier', 'rénovation', 'intérieur', 'paysagiste', 'ingénieur'],
  
  // Construction & Artisans
  'plombier': ['syndic', 'immobilier', 'rénovation', 'architecte', 'électricien', 'chauffage'],
  'électricien': ['syndic', 'immobilier', 'rénovation', 'architecte', 'plombier', 'sécurité'],
  'peintre': ['syndic', 'immobilier', 'architecte', 'intérieur', 'rénovation'],
  'menuisier': ['architecte', 'rénovation', 'immobilier', 'meuble', 'intérieur'],
  'rénovation': ['architecte', 'immobilier', 'plombier', 'électricien', 'peintre', 'diagnostic'],
  'couvreur': ['rénovation', 'immobilier', 'syndic', 'architecte', 'assurance'],
  
  // Beauté & Bien-être
  'coiffure': ['beauté', 'photographe', 'mariage', 'maquillage', 'ongle', 'spa'],
  'beauté': ['coiffure', 'photographe', 'mariage', 'spa', 'ongle', 'cosmétique'],
  'barbier': ['beauté', 'coiffure', 'massage', 'spa', 'mode'],
  
  // Santé
  'médecin': ['pharmacie', 'kinésithérapeute', 'infirmier', 'laboratoire', 'opticien', 'médical'],
  'dentiste': ['orthodontiste', 'pharmacie', 'radiologie', 'laboratoire', 'chirurgien', 'dentaire'],
  'kinésithérapeute': ['médecin', 'ostéopathe', 'pharmacie', 'sport', 'réhabilitation'],
  'pharmacie': ['médecin', 'dentiste', 'laboratoire', 'opticien', 'médical', 'hôpital'],
  'ostéopathe': ['kinésithérapeute', 'médecin', 'sport', 'bien-être'],
  
  // Services professionnels
  'comptable': ['avocat', 'consultant', 'banque', 'assurance', 'notaire', 'fiscal', 'financier'],
  'assurance': ['comptable', 'avocat', 'immobilier', 'banque', 'financier', 'consultant'],
  'banque': ['comptable', 'assurance', 'financier', 'crédit', 'avocat', 'investissement'],
  
  // Commerce & Restauration
  'restaurant': ['traiteur', 'vin', 'boulangerie', 'fleuriste', 'mariage', 'événement', 'bar'],
  'boulangerie': ['restaurant', 'traiteur', 'épicerie', 'café', 'chocolat', 'pâtisserie'],
  'café': ['boulangerie', 'restaurant', 'bar', 'glace', 'librairie', 'cadeau'],
  
  // Automobile
  'garage': ['carrosserie', 'lavage', 'assurance', 'dépannage', 'station', 'pneu'],
  'carrosserie': ['garage', 'assurance', 'concessionnaire', 'lavage', 'peinture'],
  'concessionnaire': ['garage', 'assurance', 'banque', 'lavage', 'accessoire'],
  
  // Événementiel
  'mariage': ['photographe', 'traiteur', 'fleuriste', 'beauté', 'salle', 'décoration'],
  'photographe': ['mariage', 'événement', 'imprimerie', 'cadre', 'studio', 'vidéo'],
  'traiteur': ['mariage', 'événement', 'restaurant', 'fleuriste', 'salle', 'location'],
  'fleuriste': ['mariage', 'événement', 'funéraire', 'cadeau', 'jardin'],
  
  // Services à domicile
  'nettoyage': ['syndic', 'immobilier', 'moquette', 'vitre', 'déménagement'],
  'pelouse': ['paysagiste', 'arbre', 'jardin', 'syndic'],
  'paysagiste': ['architecte', 'pelouse', 'arbre', 'syndic', 'jardin'],
  
  // Animaux
  'vétérinaire': ['toilettage', 'animalerie', 'animal', 'garde', 'éleveur'],
  'toilettage': ['vétérinaire', 'animalerie', 'dressage', 'garde'],
  'animalerie': ['vétérinaire', 'toilettage', 'dressage', 'nourriture', 'aquarium'],
};

export const GeniusDialog = ({ 
  open, 
  onOpenChange, 
  category,
  onSelectCategories 
}: GeniusDialogProps) => {
  const [categories, setCategories] = useState<GBPCategory[]>([]);
  const [suggestions, setSuggestions] = useState<GBPCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<GBPCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    // Load categories with French translations
    Promise.all([
      fetch('/gcid_raw.txt').then(res => res.text()),
      fetch('/categories_fr.json').then(res => res.json())
    ])
      .then(([rawText, translations]) => {
        const categoriesArray = JSON.parse(rawText);
        const converted = categoriesArray.map((category: string) => {
          const id = `gcid:${category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
          const translation = translations[id];
          return {
            id,
            displayName: category,
            displayNameFr: translation?.fr || category
          };
        });
        setCategories(converted);
        console.log(`Genius: chargé ${converted.length} catégories GBP avec traductions FR`);
      })
      .catch(err => console.error('Erreur chargement catégories:', err));
  }, []);

  useEffect(() => {
    if (open && category && categories.length > 0 && selectedCategories.length === 0) {
      generateSuggestions();
    }
  }, [open, category, categories]);

  const generateSuggestions = () => {
    if (!category) return;
    
    setLoading(true);
    
    // Recherche des mots-clés dans le nom français de la catégorie
    const categoryLowerFr = (category.displayNameFr || category.displayName).toLowerCase();
    const categoryLowerEn = category.displayName.toLowerCase();
    let keywords: string[] = [];
    
    // Recherche dans le mapping avec matching partiel
    for (const [key, values] of Object.entries(REFERRAL_MAPPING)) {
      if (categoryLowerFr.includes(key) || categoryLowerEn.includes(key) || 
          key.includes(categoryLowerFr.split(' ')[0]) || key.includes(categoryLowerEn.split(' ')[0])) {
        keywords = values;
        break;
      }
    }
    
    // Si aucun mapping trouvé, suggestions génériques pertinentes
    if (keywords.length === 0) {
      keywords = ['marketing', 'publicité', 'assurance', 'conseil', 'juridique', 'financier'];
    }
    
    // Recherche des catégories correspondantes dans la base GBP complète
    const foundSuggestions: GBPCategory[] = [];
    
    for (const keyword of keywords) {
      if (foundSuggestions.length >= 5) break;
      
      // Recherche avec matching partiel pour trouver des catégories pertinentes
      const matches = categories.filter(cat => {
        const catLowerFr = (cat.displayNameFr || '').toLowerCase();
        const catLowerEn = cat.displayName.toLowerCase();
        return (
          (catLowerFr.includes(keyword) || catLowerEn.includes(keyword)) &&
          cat.id !== category.id &&
          !foundSuggestions.some(s => s.id === cat.id)
        );
      });
      
      // Prendre plusieurs résultats par mot-clé si nécessaire
      const toAdd = Math.min(matches.length, Math.max(1, Math.floor((5 - foundSuggestions.length) / (keywords.length - keywords.indexOf(keyword)))));
      foundSuggestions.push(...matches.slice(0, toAdd));
    }
    
    console.log(`Genius: ${foundSuggestions.length} suggestions trouvées pour "${category.displayNameFr || category.displayName}"`);
    const finalSuggestions = foundSuggestions.slice(0, 5);
    setSuggestions(finalSuggestions);
    setSelectedCategories(finalSuggestions);
    setLoading(false);
  };

  const handleRegenerate = () => {
    setSelectedCategories([]);
    setSuggestions([]);
    generateSuggestions();
  };

  const handleManualSelection = (cat: GBPCategory | null) => {
    if (!cat) return;
    
    if (selectedCategories.some(c => c.id === cat.id)) {
      setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleValidate = () => {
    onSelectCategories(selectedCategories);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Genius - Rapporteurs d'affaires
          </DialogTitle>
          <DialogDescription>
            Suggestions de catégories complémentaires pour {category?.displayNameFr || category?.displayName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer
              </Button>
              <Button
                variant="outline"
                onClick={() => setManualMode(!manualMode)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                {manualMode ? 'Mode automatique' : 'Choisir manuellement'}
              </Button>
            </div>

            {/* Manual selection mode */}
            {manualMode && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-3">
                  Sélectionnez jusqu'à 5 catégories complémentaires
                </p>
                <CategoryAutocomplete
                  value={null}
                  onChange={handleManualSelection}
                  disabled={false}
                />
              </div>
            )}

            {/* Selected categories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Catégories sélectionnées ({selectedCategories.length}/5)
                </p>
              </div>
              
              {selectedCategories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  Aucune catégorie sélectionnée
                </p>
              ) : (
                <div className="grid gap-2">
                  {selectedCategories.map((cat) => (
                    <Card key={cat.id} className="p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{cat.displayNameFr || cat.displayName}</p>
                          {cat.displayNameFr && cat.displayNameFr !== cat.displayName && (
                            <p className="text-xs text-muted-foreground">{cat.displayName}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCategories(selectedCategories.filter(c => c.id !== cat.id))}
                        >
                          Retirer
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Validate button */}
            <Button
              onClick={handleValidate}
              disabled={selectedCategories.length === 0}
              className="w-full"
            >
              Valider la sélection ({selectedCategories.length})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
