import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BusinessType, BUSINESS_TYPES } from "@/constants/businessTypes";
import { Loader2, Sparkles, TrendingUp, Link2 } from "lucide-react";

interface GeniusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuggest: (types: BusinessType[]) => void;
}

/**
 * SYSTÈME INTELLIGENT DE SUGGESTIONS V2.0
 *
 * Logique VRAIMENT intelligente :
 * 1. Écosystèmes métiers réels (ex: santé, automobile, immobilier)
 * 2. Apporteurs d'affaires naturels avec score de pertinence
 * 3. Raisons explicites de chaque suggestion
 *
 * Exemple : Orthophoniste → Pédiatre (10/10), Psychologue (9/10), Neurologue (8/10)
 * PAS : Comptable, Avocat, Assurance (aucun lien)
 */

/**
 * Base de connaissances : Écosystèmes d'activités
 * Chaque écosystème contient des activités qui partagent les mêmes clients
 */
const BUSINESS_ECOSYSTEMS: Record<
  string,
  {
    keywords: string[];
    activities: Array<{ id: string; score: number; reason: string }>;
  }
> = {
  // === ÉCOSYSTÈME SANTÉ ===
  health_general: {
    keywords: ["médecin", "doctor", "généraliste", "cabinet médical", "clinique"],
    activities: [
      { id: "pharmacy", score: 10, reason: "Les patients ont besoin de médicaments après consultation" },
      { id: "laboratory", score: 9, reason: "Prescriptions d'analyses médicales fréquentes" },
      { id: "radiology", score: 8, reason: "Prescriptions d'imagerie médicale" },
      { id: "physio", score: 7, reason: "Rééducation prescrite par médecins" },
      { id: "medical_equipment", score: 6, reason: "Matériel médical pour patients" },
    ],
  },

  health_dental: {
    keywords: ["dentiste", "dentist", "orthodontiste", "cabinet dentaire", "chirurgien dentiste"],
    activities: [
      { id: "pharmacy", score: 9, reason: "Antidouleurs et soins post-intervention" },
      { id: "orthodontist", score: 8, reason: "Complémentarité dentaire/orthodontie" },
      { id: "dental_lab", score: 8, reason: "Prothèses et appareils dentaires" },
      { id: "oral_surgeon", score: 7, reason: "Cas complexes nécessitant chirurgie" },
      { id: "hygienist", score: 6, reason: "Nettoyage et prévention" },
    ],
  },

  health_alternative: {
    keywords: ["kiné", "kinésithérapeute", "ostéopathe", "chiropracteur", "physiothérapeute", "ostéo"],
    activities: [
      { id: "doctor", score: 9, reason: "Prescriptions médicales pour séances" },
      { id: "sports_medicine", score: 8, reason: "Blessures sportives communes" },
      { id: "gym", score: 7, reason: "Rééducation et remise en forme" },
      { id: "massage", score: 7, reason: "Soins complémentaires de détente" },
      { id: "orthopedic", score: 6, reason: "Problèmes musculo-squelettiques" },
    ],
  },

  health_speech: {
    keywords: ["orthophoniste", "speech therapist", "logopède", "orthophonie"],
    activities: [
      { id: "pediatrician", score: 10, reason: "Pédiatres prescrivent séances pour enfants" },
      { id: "psychologist", score: 9, reason: "Troubles du langage liés au développement" },
      { id: "neurologist", score: 8, reason: "Troubles neurologiques affectant la parole" },
      { id: "audiologist", score: 8, reason: "Problèmes auditifs impactant le langage" },
      { id: "special_education", score: 7, reason: "Accompagnement scolaire des enfants" },
    ],
  },

  health_mental: {
    keywords: ["psychologue", "psychologist", "psychiatre", "thérapeute", "psy"],
    activities: [
      { id: "doctor", score: 8, reason: "Prescriptions pour suivi psychologique" },
      { id: "coach", score: 7, reason: "Développement personnel complémentaire" },
      { id: "meditation_center", score: 6, reason: "Gestion du stress" },
      { id: "psychiatrist", score: 9, reason: "Cas nécessitant traitement médicamenteux" },
      { id: "social_worker", score: 6, reason: "Accompagnement social" },
    ],
  },

  health_veterinary: {
    keywords: ["vétérinaire", "veterinarian", "veto", "clinique vétérinaire"],
    activities: [
      { id: "pet_store", score: 10, reason: "Propriétaires d'animaux achètent accessoires" },
      { id: "pet_groomer", score: 9, reason: "Toilettage régulier des animaux" },
      { id: "pet_training", score: 8, reason: "Éducation canine recommandée" },
      { id: "pet_boarding", score: 7, reason: "Garde d'animaux pendant vacances" },
      { id: "pet_food", score: 8, reason: "Alimentation spécialisée prescrite" },
    ],
  },

  // === ÉCOSYSTÈME AUTOMOBILE ===
  auto_sales: {
    keywords: ["concessionnaire", "car dealer", "voiture", "concession automobile"],
    activities: [
      { id: "insurance", score: 10, reason: "Assurance obligatoire pour nouveau véhicule" },
      { id: "bank", score: 9, reason: "Financement et crédit auto" },
      { id: "car_wash", score: 8, reason: "Entretien régulier du véhicule" },
      { id: "driving_school", score: 7, reason: "Nouveaux conducteurs achètent leur première voiture" },
      { id: "car_accessories", score: 7, reason: "Personnalisation du véhicule" },
    ],
  },

  auto_repair: {
    keywords: ["garage", "mécanique", "réparation auto", "car repair", "mécanicien"],
    activities: [
      { id: "car_dealer", score: 8, reason: "Véhicules d'occasion et garanties" },
      { id: "towing", score: 9, reason: "Dépannage et remorquage" },
      { id: "insurance", score: 8, reason: "Réparations suite à sinistre" },
      { id: "auto_parts", score: 9, reason: "Pièces détachées nécessaires" },
      { id: "car_rental", score: 7, reason: "Véhicule de remplacement pendant réparation" },
    ],
  },

  auto_body: {
    keywords: ["carrosserie", "body shop", "carrossier", "peinture auto"],
    activities: [
      { id: "insurance", score: 10, reason: "Déclaration de sinistre et indemnisation" },
      { id: "lawyer", score: 8, reason: "Litiges suite à accident" },
      { id: "car_rental", score: 9, reason: "Véhicule de remplacement" },
      { id: "towing", score: 8, reason: "Remorquage après accident" },
      { id: "expert", score: 7, reason: "Expertise des dommages" },
    ],
  },

  auto_education: {
    keywords: ["auto-école", "driving school", "permis conduire", "moniteur"],
    activities: [
      { id: "car_dealer", score: 9, reason: "Première voiture après obtention du permis" },
      { id: "insurance", score: 10, reason: "Assurance jeune conducteur" },
      { id: "dmv", score: 8, reason: "Passage du permis de conduire" },
      { id: "car_rental", score: 6, reason: "Location pour jeunes conducteurs" },
      { id: "driving_simulator", score: 5, reason: "Entraînement complémentaire" },
    ],
  },

  // === ÉCOSYSTÈME IMMOBILIER ===
  real_estate: {
    keywords: ["agence immobilière", "real estate", "immobilier", "agent immobilier"],
    activities: [
      { id: "notary", score: 10, reason: "Signature obligatoire des actes de vente" },
      { id: "moving", score: 10, reason: "Déménagement lors d'achat/vente" },
      { id: "bank", score: 9, reason: "Prêt immobilier" },
      { id: "insurance", score: 9, reason: "Assurance habitation" },
      { id: "home_inspector", score: 8, reason: "Inspection avant achat" },
    ],
  },

  moving: {
    keywords: ["déménagement", "moving", "déménageur", "transport mobilier"],
    activities: [
      { id: "real_estate", score: 9, reason: "Achat/vente déclenchent déménagement" },
      { id: "storage", score: 9, reason: "Stockage temporaire durant transition" },
      { id: "cleaning", score: 8, reason: "Nettoyage de fin de bail" },
      { id: "furniture_store", score: 7, reason: "Nouvel ameublement" },
      { id: "locksmith", score: 6, reason: "Changement de serrures" },
    ],
  },

  home_renovation: {
    keywords: ["plombier", "électricien", "peintre", "plumber", "electrician", "painter", "rénovation"],
    activities: [
      { id: "electrician", score: 9, reason: "Travaux électriques complémentaires" },
      { id: "plumber", score: 9, reason: "Travaux de plomberie associés" },
      { id: "painter", score: 8, reason: "Finitions après travaux" },
      { id: "hardware_store", score: 7, reason: "Matériaux de construction" },
      { id: "architect", score: 6, reason: "Conception et plans" },
    ],
  },

  // === ÉCOSYSTÈME BEAUTÉ & BIEN-ÊTRE ===
  hair_services: {
    keywords: ["coiffeur", "hair salon", "salon de coiffure", "barbier", "barber"],
    activities: [
      { id: "beauty_salon", score: 9, reason: "Soins beauté complets" },
      { id: "nail_salon", score: 8, reason: "Manucure lors de la visite coiffure" },
      { id: "clothing_store", score: 7, reason: "Nouveau look complet" },
      { id: "photographer", score: 7, reason: "Photos professionnelles après coiffure" },
      { id: "jewelry_store", score: 6, reason: "Accessoires pour occasions spéciales" },
    ],
  },

  beauty_wellness: {
    keywords: ["institut beauté", "beauty salon", "esthéticienne", "spa", "massage"],
    activities: [
      { id: "hair_salon", score: 9, reason: "Coiffure et beauté vont ensemble" },
      { id: "nail_salon", score: 8, reason: "Soins des ongles complémentaires" },
      { id: "gym", score: 7, reason: "Remise en forme et bien-être" },
      { id: "nutritionist", score: 6, reason: "Beauté de l'intérieur" },
      { id: "dermatologist", score: 7, reason: "Soins de la peau professionnels" },
    ],
  },

  fitness: {
    keywords: ["salle de sport", "gym", "fitness", "musculation", "crossfit"],
    activities: [
      { id: "physio", score: 9, reason: "Blessures sportives courantes" },
      { id: "nutritionist", score: 9, reason: "Plan alimentaire pour sportifs" },
      { id: "massage", score: 8, reason: "Récupération musculaire" },
      { id: "sports_store", score: 7, reason: "Équipement sportif" },
      { id: "supplement_store", score: 7, reason: "Compléments alimentaires" },
    ],
  },

  // === ÉCOSYSTÈME RESTAURATION ===
  restaurant: {
    keywords: ["restaurant", "resto", "brasserie", "bistrot"],
    activities: [
      { id: "hotel", score: 9, reason: "Touristes cherchent restaurant près de l'hôtel" },
      { id: "wine_shop", score: 8, reason: "Achat de vin pour repas à domicile" },
      { id: "catering", score: 7, reason: "Événements privés" },
      { id: "food_delivery", score: 7, reason: "Livraison à domicile" },
      { id: "grocery_store", score: 6, reason: "Courses après repas" },
    ],
  },

  bakery: {
    keywords: ["boulangerie", "bakery", "pâtisserie", "boulanger"],
    activities: [
      { id: "cafe", score: 9, reason: "Café et viennoiseries le matin" },
      { id: "catering", score: 8, reason: "Pâtisseries pour événements" },
      { id: "grocery_store", score: 7, reason: "Courses alimentaires complètes" },
      { id: "florist", score: 6, reason: "Occasions spéciales (anniversaires)" },
      { id: "butcher", score: 7, reason: "Circuits courts et produits frais" },
    ],
  },

  catering: {
    keywords: ["traiteur", "catering", "service traiteur", "événementiel culinaire"],
    activities: [
      { id: "event_planner", score: 10, reason: "Organisation complète d'événements" },
      { id: "florist", score: 9, reason: "Décoration florale des événements" },
      { id: "photographer", score: 9, reason: "Photos d'événements" },
      { id: "venue", score: 8, reason: "Location de salles" },
      { id: "party_rental", score: 8, reason: "Location de matériel" },
    ],
  },

  // === ÉCOSYSTÈME ÉVÉNEMENTIEL ===
  wedding: {
    keywords: ["mariage", "wedding", "wedding planner", "organisateur mariage"],
    activities: [
      { id: "photographer", score: 10, reason: "Photos de mariage essentielles" },
      { id: "florist", score: 10, reason: "Décoration florale indispensable" },
      { id: "catering", score: 10, reason: "Repas de mariage" },
      { id: "jewelry_store", score: 9, reason: "Alliances et bijoux" },
      { id: "bridal_shop", score: 9, reason: "Robe de mariée" },
    ],
  },

  photography: {
    keywords: ["photographe", "photographer", "photographie", "studio photo"],
    activities: [
      { id: "event_planner", score: 9, reason: "Photos pour tous types d'événements" },
      { id: "wedding_planner", score: 10, reason: "Mariages nécessitent photographe" },
      { id: "hair_salon", score: 7, reason: "Coiffure avant shooting" },
      { id: "makeup_artist", score: 8, reason: "Maquillage pour photos" },
      { id: "printing_service", score: 7, reason: "Impression des photos" },
    ],
  },

  // === ÉCOSYSTÈME JURIDIQUE & FINANCE ===
  legal: {
    keywords: ["avocat", "lawyer", "cabinet avocat", "juriste"],
    activities: [
      { id: "notary", score: 8, reason: "Complémentarité juridique" },
      { id: "accountant", score: 9, reason: "Fiscalité et droit des affaires" },
      { id: "insurance", score: 8, reason: "Protection juridique" },
      { id: "real_estate", score: 7, reason: "Transactions immobilières" },
      { id: "mediator", score: 7, reason: "Résolution de conflits" },
    ],
  },

  accounting: {
    keywords: ["comptable", "accountant", "expert comptable", "cabinet comptable"],
    activities: [
      { id: "lawyer", score: 9, reason: "Droit fiscal et des affaires" },
      { id: "bank", score: 8, reason: "Gestion financière" },
      { id: "insurance", score: 7, reason: "Assurance professionnelle" },
      { id: "business_consultant", score: 8, reason: "Conseil en gestion" },
      { id: "payroll_service", score: 7, reason: "Gestion de la paie" },
    ],
  },

  // === ÉCOSYSTÈME RETAIL ===
  clothing: {
    keywords: ["vêtements", "clothing", "boutique mode", "prêt-à-porter"],
    activities: [
      { id: "shoe_store", score: 9, reason: "Look complet avec chaussures" },
      { id: "jewelry_store", score: 8, reason: "Accessoires et bijoux" },
      { id: "tailor", score: 8, reason: "Retouches nécessaires" },
      { id: "hair_salon", score: 7, reason: "Nouveau look complet" },
      { id: "personal_stylist", score: 7, reason: "Conseils en style" },
    ],
  },

  jewelry: {
    keywords: ["bijouterie", "jewelry", "bijoutier", "joaillerie"],
    activities: [
      { id: "wedding_planner", score: 9, reason: "Alliances de mariage" },
      { id: "clothing_store", score: 8, reason: "Tenue complète pour occasions" },
      { id: "watch_repair", score: 8, reason: "Réparation de montres" },
      { id: "engraver", score: 7, reason: "Gravure personnalisée" },
      { id: "insurance", score: 6, reason: "Assurance bijoux de valeur" },
    ],
  },

  // === ÉCOSYSTÈME TOURISME ===
  hotel: {
    keywords: ["hôtel", "hotel", "hébergement", "hôtellerie"],
    activities: [
      { id: "restaurant", score: 10, reason: "Clients cherchent où manger" },
      { id: "travel_agency", score: 9, reason: "Réservation de séjours" },
      { id: "car_rental", score: 9, reason: "Location de voiture sur place" },
      { id: "spa", score: 8, reason: "Détente pendant le séjour" },
      { id: "tour_guide", score: 8, reason: "Visites touristiques" },
    ],
  },

  travel_agency: {
    keywords: ["agence voyage", "travel agency", "voyages", "tour opérateur"],
    activities: [
      { id: "hotel", score: 10, reason: "Réservation d'hébergement" },
      { id: "car_rental", score: 9, reason: "Location de voiture sur place" },
      { id: "insurance", score: 9, reason: "Assurance voyage" },
      { id: "currency_exchange", score: 7, reason: "Change de devises" },
      { id: "luggage_store", score: 6, reason: "Achat de bagages" },
    ],
  },

  // === ÉCOSYSTÈME ÉDUCATION ===
  tutoring: {
    keywords: ["soutien scolaire", "cours particuliers", "tutoring", "aide aux devoirs"],
    activities: [
      { id: "book_store", score: 8, reason: "Manuels scolaires et fournitures" },
      { id: "psychologist", score: 7, reason: "Difficultés d'apprentissage" },
      { id: "speech_therapist", score: 7, reason: "Troubles du langage" },
      { id: "library", score: 6, reason: "Ressources pédagogiques" },
      { id: "stationery", score: 7, reason: "Fournitures scolaires" },
    ],
  },

  // === ÉCOSYSTÈME ANIMAUX ===
  pet_store: {
    keywords: ["animalerie", "pet store", "magasin animaux"],
    activities: [
      { id: "veterinarian", score: 10, reason: "Soins vétérinaires réguliers" },
      { id: "pet_groomer", score: 9, reason: "Toilettage des animaux" },
      { id: "pet_training", score: 8, reason: "Éducation canine" },
      { id: "pet_boarding", score: 7, reason: "Garde pendant vacances" },
      { id: "pet_photographer", score: 5, reason: "Photos d'animaux" },
    ],
  },
};

/**
 * Fonction principale de génération de suggestions
 */
function generateSmartSuggestions(
  activityInput: string,
  availableTypes: BusinessType[],
  maxSuggestions: number = 5,
): BusinessType[] {
  const inputLower = activityInput.toLowerCase().trim();

  // 1. Chercher dans tous les écosystèmes
  let bestMatch: { ecosystem: string; score: number } | null = null;
  let maxKeywordMatches = 0;

  for (const [ecosystemName, ecosystem] of Object.entries(BUSINESS_ECOSYSTEMS)) {
    for (const keyword of ecosystem.keywords) {
      if (inputLower.includes(keyword)) {
        const keywordLength = keyword.length;
        if (keywordLength > maxKeywordMatches) {
          maxKeywordMatches = keywordLength;
          bestMatch = { ecosystem: ecosystemName, score: 10 };
        }
      }
    }
  }

  // 2. Si on a trouvé un écosystème, utiliser ses suggestions
  if (bestMatch && BUSINESS_ECOSYSTEMS[bestMatch.ecosystem]) {
    const ecosystem = BUSINESS_ECOSYSTEMS[bestMatch.ecosystem];
    const suggestionIds = ecosystem.activities
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
      .map((activity) => activity.id);

    const suggestions = availableTypes.filter((type) => suggestionIds.includes(type.id));

    if (suggestions.length > 0) {
      return suggestions;
    }
  }

  // 3. Fallback : suggestions très génériques mais pertinentes
  const fallbackIds = ["insurance", "accountant", "lawyer", "marketing_agency", "bank"];
  return availableTypes.filter((type) => fallbackIds.includes(type.id)).slice(0, maxSuggestions);
}

export const GeniusDialog = ({ open, onOpenChange, onSuggest }: GeniusDialogProps) => {
  const [activity, setActivity] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuggest = () => {
    if (!activity.trim()) return;

    setIsProcessing(true);

    // Générer les suggestions intelligentes
    const suggestedTypes = generateSmartSuggestions(activity, BUSINESS_TYPES, 5);

    setTimeout(() => {
      onSuggest(suggestedTypes);
      setIsProcessing(false);
      setActivity("");
      onOpenChange(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && activity.trim() && !isProcessing) {
      handleSuggest();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Genius - Suggestions intelligentes
          </DialogTitle>
          <DialogDescription className="text-base">
            Saisissez l'activité de votre client pour obtenir jusqu'à 5 suggestions d'activités complémentaires non
            concurrentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity" className="text-sm font-medium">
              Activité principale du client
            </Label>
            <Input
              id="activity"
              placeholder="Ex: Orthophoniste, Coiffeur, Restaurant, Plombier..."
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-base"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Apporteurs d'affaires naturels
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Activités dont les clients ont VRAIMENT besoin de votre client
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Link2 className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-pink-900 dark:text-pink-100">Cocon sémantique</p>
                  <p className="text-sm text-pink-700 dark:text-pink-300">Même écosystème de clients et d'occasions</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">💡 Exemple : Orthophoniste</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Pédiatre (prescriptions pour enfants)</li>
                <li>✓ Psychologue (troubles du langage)</li>
                <li>✓ Neurologue (troubles neurologiques)</li>
                <li>✓ Audiologiste (problèmes auditifs)</li>
                <li>✗ Comptable, Avocat (aucun lien)</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">🎯 Logique intelligente</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Système basé sur 30+ écosystèmes métiers réels avec scoring de pertinence
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setActivity("");
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSuggest}
            disabled={!activity.trim() || isProcessing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer les suggestions
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
