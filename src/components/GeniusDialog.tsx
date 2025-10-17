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

// Mapping des activités vers des suggestions complémentaires
const COMPLEMENTARY_SUGGESTIONS: Record<string, string[]> = {
  // Automobile
  'concessionnaire': ['insurance_agency', 'car_wash', 'auto_parts_store', 'car_repair', 'real_estate_agency'],
  'garage': ['car_wash', 'auto_parts_store', 'insurance_agency', 'car_dealer', 'gas_station'],
  'carrosserie': ['car_repair', 'car_wash', 'auto_parts_store', 'insurance_agency', 'painter'],
  
  // Services juridiques
  'notaire': ['real_estate_agency', 'insurance_agency', 'lawyer', 'accounting', 'moving_company'],
  'avocat': ['accounting', 'insurance_agency', 'real_estate_agency', 'consultant', 'court_house'],
  'comptable': ['lawyer', 'insurance_agency', 'consultant', 'real_estate_agency', 'bank'],
  
  // Immobilier
  'agence immobilière': ['moving_company', 'lawyer', 'insurance_agency', 'furniture_store', 'home_improvement_store'],
  'immobilier': ['moving_company', 'lawyer', 'insurance_agency', 'furniture_store', 'home_improvement_store'],
  
  // Santé
  'dentiste': ['pharmacy', 'medical_lab', 'insurance_agency', 'doctor', 'beautician'],
  'médecin': ['pharmacy', 'medical_lab', 'insurance_agency', 'physiotherapist', 'dentist'],
  'kiné': ['gym', 'sports_club', 'pharmacy', 'doctor', 'massage'],
  
  // Beauté
  'coiffeur': ['beauty_salon', 'nail_salon', 'clothing_store', 'jewelry_store', 'makeup_artist'],
  'esthéticienne': ['hair_salon', 'nail_salon', 'spa', 'massage', 'gym'],
  'barbier': ['clothing_store', 'shoe_store', 'beauty_salon', 'tattoo', 'jewelry_store'],
  
  // Commerce
  'boulangerie': ['florist', 'gift_shop', 'cafe', 'restaurant', 'grocery_store'],
  'restaurant': ['hotel', 'travel_agency', 'wine_bar', 'event_venue', 'catering_service'],
  'café': ['bakery', 'book_store', 'gift_shop', 'florist', 'ice_cream_shop'],
  
  // Construction
  'plombier': ['electrician', 'hardware_store', 'home_improvement_store', 'real_estate_agency', 'painter'],
  'électricien': ['plumber', 'hardware_store', 'home_improvement_store', 'real_estate_agency', 'painter'],
  'peintre': ['plumber', 'electrician', 'hardware_store', 'home_improvement_store', 'real_estate_agency'],
  
  // Services
  'pressing': ['tailor', 'clothing_store', 'shoe_store', 'dry_cleaning', 'laundry'],
  'traiteur': ['event_venue', 'wedding_venue', 'florist', 'banquet_hall', 'restaurant'],
  
  // Animaux
  'vétérinaire': ['pet_store', 'grooming', 'kennel', 'pet_supply', 'animal_hospital'],
  'animalerie': ['veterinary_care', 'grooming', 'pet_training', 'pet_supply', 'kennel'],
  
  // Sport
  'salle de sport': ['physiotherapist', 'sports_club', 'yoga_studio', 'nutritionist', 'massage'],
  'coach sportif': ['gym', 'fitness_center', 'physiotherapist', 'nutritionist', 'sports_club'],
  
  // Éducation
  'auto-école': ['car_dealer', 'insurance_agency', 'driving_test_center', 'car_rental', 'optician'],
  'cours particuliers': ['book_store', 'library', 'tutoring_center', 'school', 'education_center'],
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
        suggestedTypeIds = ['insurance_agency', 'car_wash', 'auto_parts_store', 'car_repair', 'gas_station'];
      } else if (activityLower.includes('maison') || activityLower.includes('habitat')) {
        suggestedTypeIds = ['furniture_store', 'home_improvement_store', 'hardware_store', 'electrician', 'plumber'];
      } else if (activityLower.includes('beauté') || activityLower.includes('bien-être')) {
        suggestedTypeIds = ['hair_salon', 'beauty_salon', 'spa', 'massage', 'nail_salon'];
      } else {
        // Suggestions très génériques
        suggestedTypeIds = ['insurance_agency', 'accounting', 'lawyer', 'consultant', 'real_estate_agency'];
      }
    }

    // Convertir les IDs en objets BusinessType
    const suggestedTypes = BUSINESS_TYPES.filter(type => 
      suggestedTypeIds.includes(type.googlePlaceType)
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
