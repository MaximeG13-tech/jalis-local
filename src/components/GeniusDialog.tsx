import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BusinessType, BUSINESS_TYPES } from '@/constants/businessTypes';
import { Loader2 } from 'lucide-react';

interface GeniusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuggest: (types: BusinessType[]) => void;
}

// Mapping des activités vers des suggestions complémentaires NON CONCURRENTES
// Principe: suggérer des activités dont les clients auraient besoin de l'activité principale
const COMPLEMENTARY_SUGGESTIONS: Record<string, string[]> = {
  // === AUTOMOBILE ===
  'concessionnaire': ['insurance', 'driving_school', 'car_wash', 'accountant'],
  'voiture': ['insurance', 'driving_school', 'car_wash', 'accountant'],
  'auto': ['insurance', 'driving_school', 'car_wash', 'accountant'],
  'garage': ['car_dealer', 'car_rental', 'insurance', 'driving_school'],
  'réparation': ['car_dealer', 'car_rental', 'insurance', 'driving_school'],
  'mécanique': ['car_dealer', 'car_rental', 'insurance', 'driving_school'],
  'carrosserie': ['insurance', 'car_rental', 'lawyer', 'car_dealer'],
  'lavage': ['car_dealer', 'car_rental', 'car_repair'],
  'auto-école': ['car_dealer', 'car_rental', 'insurance', 'car_repair'],
  'auto école': ['car_dealer', 'car_rental', 'insurance', 'car_repair'],
  
  // === SERVICES JURIDIQUES ===
  'notaire': ['real_estate', 'moving', 'insurance'],
  'avocat': ['real_estate', 'accountant', 'insurance'],
  'comptable': ['lawyer', 'insurance'],
  'expert comptable': ['lawyer', 'insurance'],
  
  // === IMMOBILIER ===
  'agence immobilière': ['lawyer', 'moving', 'insurance', 'furniture_store'],
  'immobilier': ['lawyer', 'moving', 'insurance', 'furniture_store'],
  'déménagement': ['real_estate', 'furniture_store', 'cleaning'],
  
  // === SANTÉ ===
  'dentiste': ['doctor', 'pharmacy'],
  'dentaire': ['doctor', 'pharmacy'],
  'médecin': ['pharmacy', 'physio'],
  'docteur': ['pharmacy', 'physio'],
  'kiné': ['doctor', 'gym', 'pharmacy'],
  'kinésithérapeute': ['doctor', 'gym', 'pharmacy'],
  'physiothérapeute': ['doctor', 'gym', 'pharmacy'],
  'pharmacie': ['doctor', 'dentist'],
  'vétérinaire': ['pet_store'],
  'veto': ['pet_store'],
  
  // === BEAUTÉ & BIEN-ÊTRE ===
  'coiffeur': ['beauty_salon', 'clothing_store', 'jewelry_store'],
  'salon de coiffure': ['beauty_salon', 'clothing_store', 'jewelry_store'],
  'esthéticienne': ['hair_salon', 'spa', 'gym'],
  'esthétique': ['hair_salon', 'spa', 'gym'],
  'beauté': ['hair_salon', 'spa', 'gym'],
  'barbier': ['clothing_store', 'shoe_store', 'jewelry_store'],
  'spa': ['hair_salon', 'beauty_salon', 'massage', 'hotel'],
  'salle de sport': ['physio', 'massage'],
  'gym': ['physio', 'massage'],
  'fitness': ['physio', 'massage'],
  
  // === COMMERCE ALIMENTAIRE ===
  'boulangerie': ['cafe', 'butcher', 'wine_shop', 'florist'],
  'boulanger': ['cafe', 'butcher', 'wine_shop', 'florist'],
  'restaurant': ['hotel', 'travel_agency'],
  'café': ['bakery', 'book_store'],
  'traiteur': ['florist', 'photographer'],
  'catering': ['florist', 'photographer'],
  
  // === CONSTRUCTION & RÉNOVATION ===
  'plombier': ['electrician', 'painter', 'locksmith'],
  'plomberie': ['electrician', 'painter', 'locksmith'],
  'électricien': ['plumber', 'painter', 'locksmith'],
  'électrique': ['plumber', 'painter', 'locksmith'],
  'peintre': ['plumber', 'electrician'],
  'peinture': ['plumber', 'electrician'],
  'couvreur': ['plumber', 'electrician'],
  'toiture': ['plumber', 'electrician'],
  
  // === SERVICES DIVERS ===
  'pressing': ['dry_cleaning', 'clothing_store'],
  'nettoyage': ['cleaning'],
  'fleuriste': ['florist', 'photographer'],
  'fleur': ['florist', 'photographer'],
  
  // === ÉDUCATION ===
  'cours particuliers': ['book_store', 'tutoring'],
  'soutien scolaire': ['book_store', 'tutoring'],
  
  // === HÉBERGEMENT & TOURISME ===
  'hôtel': ['restaurant', 'travel_agency', 'car_rental'],
  'hotel': ['restaurant', 'travel_agency', 'car_rental'],
  'agence de voyage': ['hotel', 'car_rental', 'insurance'],
  'voyage': ['hotel', 'car_rental', 'insurance'],
  
  // === ANIMAUX ===
  'animalerie': ['veterinarian'],
  'pet store': ['veterinarian'],
};

export const GeniusDialog = ({ open, onOpenChange, onSuggest }: GeniusDialogProps) => {
  const [activity, setActivity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuggest = () => {
    if (!activity.trim()) return;

    setIsProcessing(true);

    // Rechercher des mots-clés dans l'activité saisie
    const activityLower = activity.toLowerCase();
    let suggestedTypeIds: string[] = [];

    // Chercher dans nos mappings
    for (const [keyword, suggestions] of Object.entries(COMPLEMENTARY_SUGGESTIONS)) {
      if (activityLower.includes(keyword)) {
        suggestedTypeIds = suggestions;
        break;
      }
    }

    // Si aucune correspondance, suggestions par défaut basées sur des mots-clés génériques
    if (suggestedTypeIds.length === 0) {
      if (activityLower.includes('voiture') || activityLower.includes('auto')) {
        suggestedTypeIds = ['insurance', 'car_wash', 'car_repair'];
      } else if (activityLower.includes('maison') || activityLower.includes('habitat')) {
        suggestedTypeIds = ['furniture_store', 'home_decor', 'electrician', 'plumber'];
      } else if (activityLower.includes('beauté') || activityLower.includes('bien-être')) {
        suggestedTypeIds = ['hair_salon', 'beauty_salon', 'spa', 'massage'];
      } else {
        // Suggestions très génériques
        suggestedTypeIds = ['insurance', 'accountant', 'lawyer', 'real_estate'];
      }
    }

    // Convertir les IDs en objets BusinessType
    const suggestedTypes = BUSINESS_TYPES.filter(type => 
      suggestedTypeIds.includes(type.id)
    ).slice(0, 5);

    setTimeout(() => {
      onSuggest(suggestedTypes);
      setIsProcessing(false);
      setActivity('');
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">✨ Genius - Suggestions intelligentes</DialogTitle>
          <DialogDescription>
            Saisissez l'activité de votre client telle qu'elle apparaît sur Google My Business pour obtenir des suggestions d'activités complémentaires.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity" className="text-sm font-medium">
              Activité du client (exemple: "Concessionnaire automobile")
            </Label>
            <Input
              id="activity"
              placeholder="Ex: Concessionnaire automobile, Coiffeur, Restaurant..."
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && activity.trim()) {
                  handleSuggest();
                }
              }}
              className="w-full"
              autoFocus
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">💡 Astuce</p>
            <p className="text-sm text-muted-foreground">
              Le système va suggérer jusqu'à 5 types d'activités complémentaires (non concurrentes) qui pourraient être d'excellents apporteurs d'affaires.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setActivity('');
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSuggest}
            disabled={!activity.trim() || isProcessing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              'Générer les suggestions'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
