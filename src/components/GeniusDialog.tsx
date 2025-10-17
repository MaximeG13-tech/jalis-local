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
  // Pour un concessionnaire → clients qui achètent des voitures ont besoin de...
  'concessionnaire': ['insurance_agency', 'driving_school', 'car_wash', 'banker', 'accounting'],
  'voiture': ['insurance_agency', 'driving_school', 'car_wash', 'banker', 'accounting'],
  'auto': ['insurance_agency', 'driving_school', 'car_wash', 'banker', 'accounting'],
  
  // Pour un garage → clients avec des voitures en panne viennent des...
  'garage': ['car_dealer', 'car_rental', 'insurance_agency', 'driving_school', 'taxi'],
  'réparation': ['car_dealer', 'car_rental', 'insurance_agency', 'driving_school', 'taxi'],
  'mécanique': ['car_dealer', 'car_rental', 'insurance_agency', 'driving_school', 'taxi'],
  
  // Pour une carrosserie → clients accidentés viennent des...
  'carrosserie': ['insurance_agency', 'car_rental', 'lawyer', 'car_dealer', 'tow_truck'],
  
  // Pour un lavage auto → clients viennent des...
  'lavage': ['car_dealer', 'car_rental', 'gas_station', 'car_repair', 'parking'],
  
  // Pour une auto-école → élèves qui réussissent ont besoin de...
  'auto-école': ['car_dealer', 'car_rental', 'insurance_agency', 'car_repair', 'gas_station'],
  'auto école': ['car_dealer', 'car_rental', 'insurance_agency', 'car_repair', 'gas_station'],
  
  // === SERVICES JURIDIQUES ===
  // Pour un notaire → clients sont dans des transactions immobilières, successions...
  'notaire': ['real_estate_agency', 'moving_company', 'bank', 'insurance_agency', 'storage'],
  
  // Pour un avocat → clients ont des litiges, divorces, créations entreprises...
  'avocat': ['real_estate_agency', 'accounting', 'insurance_agency', 'consultant', 'bank'],
  
  // Pour un comptable → clients sont des entreprises qui ont besoin de...
  'comptable': ['lawyer', 'bank', 'insurance_agency', 'consultant', 'real_estate_agency'],
  'expert comptable': ['lawyer', 'bank', 'insurance_agency', 'consultant', 'real_estate_agency'],
  
  // === IMMOBILIER ===
  // Pour une agence immobilière → clients qui achètent/vendent ont besoin de...
  'agence immobilière': ['lawyer', 'moving_company', 'insurance_agency', 'furniture_store', 'home_improvement_store'],
  'immobilier': ['lawyer', 'moving_company', 'insurance_agency', 'furniture_store', 'home_improvement_store'],
  
  // Pour un déménageur → clients viennent des...
  'déménagement': ['real_estate_agency', 'storage', 'furniture_store', 'home_improvement_store', 'cleaning_service'],
  
  // === SANTÉ ===
  // Pour un dentiste → patients viennent des...
  'dentiste': ['doctor', 'pharmacy', 'medical_lab', 'orthodontist', 'hospital'],
  'dentaire': ['doctor', 'pharmacy', 'medical_lab', 'orthodontist', 'hospital'],
  
  // Pour un médecin généraliste → patients ont besoin de...
  'médecin': ['pharmacy', 'medical_lab', 'specialist_doctor', 'hospital', 'physiotherapist'],
  'docteur': ['pharmacy', 'medical_lab', 'specialist_doctor', 'hospital', 'physiotherapist'],
  
  // Pour un kiné → patients viennent des...
  'kiné': ['doctor', 'sports_club', 'gym', 'orthopedist', 'pharmacy'],
  'kinésithérapeute': ['doctor', 'sports_club', 'gym', 'orthopedist', 'pharmacy'],
  'physiothérapeute': ['doctor', 'sports_club', 'gym', 'orthopedist', 'pharmacy'],
  
  // Pour une pharmacie → clients viennent des...
  'pharmacie': ['doctor', 'dentist', 'medical_lab', 'hospital', 'nursing_home'],
  
  // Pour un vétérinaire → clients sont propriétaires d'animaux qui vont aussi chez...
  'vétérinaire': ['pet_store', 'pet_grooming', 'animal_shelter', 'pet_training', 'pet_sitting'],
  'veto': ['pet_store', 'pet_grooming', 'animal_shelter', 'pet_training', 'pet_sitting'],
  
  // === BEAUTÉ & BIEN-ÊTRE ===
  // Pour un coiffeur → clients qui prennent soin d'eux vont aussi chez...
  'coiffeur': ['beauty_salon', 'clothing_store', 'jewelry_store', 'nail_salon', 'makeup_artist'],
  'salon de coiffure': ['beauty_salon', 'clothing_store', 'jewelry_store', 'nail_salon', 'makeup_artist'],
  
  // Pour une esthéticienne → clients qui prennent soin d'eux vont aussi chez...
  'esthéticienne': ['hair_salon', 'spa', 'nail_salon', 'gym', 'clothing_store'],
  'esthétique': ['hair_salon', 'spa', 'nail_salon', 'gym', 'clothing_store'],
  'beauté': ['hair_salon', 'spa', 'nail_salon', 'gym', 'clothing_store'],
  
  // Pour un barbier → clients (hommes) vont aussi chez...
  'barbier': ['clothing_store', 'shoe_store', 'jewelry_store', 'tattoo_shop', 'watch_store'],
  
  // Pour un spa → clients détente vont aussi chez...
  'spa': ['hair_salon', 'beauty_salon', 'massage', 'hotel', 'restaurant'],
  
  // Pour une salle de sport → clients fitness vont aussi chez...
  'salle de sport': ['physiotherapist', 'nutritionist', 'sports_store', 'health_food_store', 'massage'],
  'gym': ['physiotherapist', 'nutritionist', 'sports_store', 'health_food_store', 'massage'],
  'fitness': ['physiotherapist', 'nutritionist', 'sports_store', 'health_food_store', 'massage'],
  
  // === COMMERCE ALIMENTAIRE ===
  // Pour une boulangerie → clients matinaux vont aussi chez...
  'boulangerie': ['cafe', 'grocery_store', 'butcher_shop', 'wine_store', 'florist'],
  'boulanger': ['cafe', 'grocery_store', 'butcher_shop', 'wine_store', 'florist'],
  
  // Pour un restaurant → clients sont touristes, événements...
  'restaurant': ['hotel', 'travel_agency', 'event_venue', 'wine_bar', 'taxi'],
  
  // Pour un café → clients viennent aussi des...
  'café': ['bakery', 'coworking', 'book_store', 'tobacco_shop', 'newspaper_stand'],
  
  // Pour un traiteur → clients organisent événements et vont aussi chez...
  'traiteur': ['event_venue', 'wedding_venue', 'florist', 'photographer', 'party_rental'],
  'catering': ['event_venue', 'wedding_venue', 'florist', 'photographer', 'party_rental'],
  
  // === CONSTRUCTION & RÉNOVATION ===
  // Pour un plombier → clients en travaux ont aussi besoin de...
  'plombier': ['electrician', 'painter', 'hardware_store', 'home_improvement_store', 'tile_contractor'],
  'plomberie': ['electrician', 'painter', 'hardware_store', 'home_improvement_store', 'tile_contractor'],
  
  // Pour un électricien → clients en travaux ont aussi besoin de...
  'électricien': ['plumber', 'painter', 'hardware_store', 'home_improvement_store', 'lighting_store'],
  'électrique': ['plumber', 'painter', 'hardware_store', 'home_improvement_store', 'lighting_store'],
  
  // Pour un peintre → clients en travaux ont aussi besoin de...
  'peintre': ['plumber', 'electrician', 'hardware_store', 'home_improvement_store', 'flooring_contractor'],
  'peinture': ['plumber', 'electrician', 'hardware_store', 'home_improvement_store', 'flooring_contractor'],
  
  // Pour un couvreur → clients propriétaires ont aussi besoin de...
  'couvreur': ['plumber', 'electrician', 'gutter_contractor', 'insulation_contractor', 'chimney_sweep'],
  'toiture': ['plumber', 'electrician', 'gutter_contractor', 'insulation_contractor', 'chimney_sweep'],
  
  // === SERVICES DIVERS ===
  // Pour un pressing → clients qui prennent soin de leurs vêtements vont aussi chez...
  'pressing': ['tailor', 'shoe_repair', 'dry_cleaning', 'clothing_store', 'laundromat'],
  'nettoyage': ['tailor', 'shoe_repair', 'dry_cleaning', 'clothing_store', 'laundromat'],
  
  // Pour un fleuriste → clients célèbrent événements et vont aussi chez...
  'fleuriste': ['event_venue', 'gift_shop', 'bakery', 'photographer', 'party_store'],
  'fleur': ['event_venue', 'gift_shop', 'bakery', 'photographer', 'party_store'],
  
  // === ÉDUCATION ===
  // Pour des cours particuliers → élèves/parents vont aussi chez...
  'cours particuliers': ['book_store', 'school_supply_store', 'tutoring_center', 'music_school', 'sport_school'],
  'soutien scolaire': ['book_store', 'school_supply_store', 'tutoring_center', 'music_school', 'sport_school'],
  
  // === HÉBERGEMENT & TOURISME ===
  // Pour un hôtel → clients touristes vont aussi chez...
  'hôtel': ['restaurant', 'travel_agency', 'car_rental', 'tourist_attraction', 'taxi'],
  'hotel': ['restaurant', 'travel_agency', 'car_rental', 'tourist_attraction', 'taxi'],
  
  // Pour une agence de voyage → clients touristes ont besoin de...
  'agence de voyage': ['hotel', 'car_rental', 'insurance_agency', 'bank', 'luggage_store'],
  'voyage': ['hotel', 'car_rental', 'insurance_agency', 'bank', 'luggage_store'],
  
  // === ANIMAUX ===
  // Pour une animalerie → clients propriétaires d'animaux vont aussi chez...
  'animalerie': ['veterinary_care', 'pet_grooming', 'pet_training', 'pet_sitting', 'animal_shelter'],
  'pet store': ['veterinary_care', 'pet_grooming', 'pet_training', 'pet_sitting', 'animal_shelter'],
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
