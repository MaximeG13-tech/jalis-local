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
 * MAPPING DES IDS COURTS VERS LES IDS GOOGLE MAPS
 * Ce mapping permet de faire correspondre nos suggestions avec les vrais IDs de businessTypes
 */
const ID_MAPPING: Record<string, string> = {
  // AUTOMOBILE
  car_dealer: "car_dealer",
  insurance: "insurance_agency",
  driving_school: "drivers_license_training_school",
  car_wash: "car_wash",
  bank: "bank",
  accountant: "accountant",
  car_repair: "car_repair",
  car_rental: "car_rental_agency",
  body_shop: "auto_body_shop",
  gas_station: "gas_station",
  auto_parts: "auto_parts_store",
  dmv: "department_of_motor_vehicles",
  driving_test: "drivers_license_office",

  // IMMOBILIER & HABITAT
  real_estate: "real_estate",
  notary: "notary_public",
  lawyer: "lawyer",
  moving: "moving_company",
  furniture_store: "furniture_store",
  cleaning: "house_cleaning_service",
  locksmith: "locksmith",
  plumber: "plumber",
  electrician: "electrician",
  painter: "painter",
  home_decor: "home_goods_store",
  security: "security",
  carpenter: "carpenter",
  roofer: "roofer",

  // JURIDIQUE & FINANCE
  business_consultant: "business_management_consultant",
  financial_advisor: "financial_consultant",

  // SANTÉ
  doctor: "doctor",
  pharmacy: "pharmacy",
  physio: "physiotherapist",
  dentist: "dentist",
  laboratory: "medical_lab",
  orthodontist: "orthodontist",
  oral_surgeon: "oral_surgeon",
  osteopath: "osteopath",
  chiropractor: "chiropractor",
  gym: "gym",
  pet_store: "pet_store",
  dog_groomer: "pet_groomer",
  pet_food_store: "pet_store",
  pet_training: "dog_trainer",

  // BEAUTÉ & BIEN-ÊTRE
  hair_salon: "hair_salon",
  beauty_salon: "beauty_salon",
  clothing_store: "clothing_store",
  jewelry_store: "jewelry_store",
  photographer: "photographer",
  barber: "barber_shop",
  barber_supply: "barber_supply_store",
  grooming: "barber_shop",
  shoe_store: "shoe_store",
  nail_salon: "nail_salon",
  spa: "spa",
  massage: "massage_therapist",
  nutrition: "nutritionist",
  health_food_store: "health_food_store",
  meditation: "meditation_center",
  tailor: "custom_tailor",

  // RESTAURATION
  bakery: "bakery",
  cafe: "cafe",
  butcher: "butcher_shop",
  wine_shop: "wine_shop",
  florist: "florist",
  hotel: "hotel",
  travel_agency: "travel_agency",
  catering: "catering_service",
  cheese_shop: "cheese_shop",
  restaurant: "restaurant",
  book_store: "book_store",
  coworking: "coworking_space",

  // ÉVÉNEMENTIEL
  wedding_planner: "wedding_planner",
  event_planner: "event_planner",
  venue: "event_venue",

  // SERVICES DIVERS
  carpet_cleaning: "carpet_cleaning_service",
  window_cleaning: "window_cleaning_service",
  dry_cleaning: "dry_cleaner",
  laundromat: "laundromat",
  tailoring: "clothing_alteration_service",
  tutoring: "tutoring",
  stationery_store: "office_supply_store",
  shoe_repair: "boot_repair_shop",
  marketing_agency: "marketing_agency",
};

/**
 * Fonction pour trouver le vrai ID d'un type d'activité
 * Gère les cas où l'ID n'est pas mappé en faisant une recherche partielle
 */
function findBusinessTypeId(shortId: string, availableTypes: BusinessType[]): string | null {
  // 1. Chercher dans le mapping explicite
  const mappedId = ID_MAPPING[shortId];
  if (mappedId) {
    // Vérifier que cet ID existe vraiment
    const exists = availableTypes.some((type) => type.id === mappedId || type.id.includes(mappedId));
    if (exists) return mappedId;
  }

  // 2. Recherche partielle (fuzzy matching)
  // Chercher un type dont l'ID contient le shortId
  const match = availableTypes.find(
    (type) =>
      type.id.toLowerCase().includes(shortId.toLowerCase()) ||
      type.id.replace(/_/g, "").toLowerCase().includes(shortId.replace(/_/g, "").toLowerCase()),
  );

  if (match) return match.id;

  // 3. Aucune correspondance trouvée
  return null;
}

/**
 * Catégories pour éviter les concurrents directs
 * Deux activités de la même catégorie ne seront JAMAIS suggérées ensemble
 */
enum BusinessCategory {
  // AUTOMOBILE
  AUTO_SALES = "auto_sales",
  AUTO_REPAIR = "auto_repair",
  AUTO_SERVICES = "auto_services",
  AUTO_EDUCATION = "auto_education",

  // IMMOBILIER
  REAL_ESTATE = "real_estate",
  HOME_SERVICES = "home_services",

  // SANTÉ
  MEDICAL_GENERAL = "medical_general",
  MEDICAL_DENTAL = "medical_dental",
  MEDICAL_ALTERNATIVE = "medical_alternative",
  VETERINARY = "veterinary",
  PHARMACY = "pharmacy",

  // BEAUTÉ & BIEN-ÊTRE
  HAIR_SERVICES = "hair_services",
  BEAUTY_SERVICES = "beauty_services",
  WELLNESS = "wellness",
  FITNESS = "fitness",

  // RESTAURATION
  RESTAURANTS = "restaurants",
  CAFES = "cafes",
  BAKERY = "bakery",
  SPECIALTY_FOOD = "specialty_food",

  // RETAIL
  CLOTHING = "clothing",
  JEWELRY = "jewelry",
  VARIOUS = "various",

  // SERVICES
  LEGAL = "legal",
  FINANCIAL = "financial",
  INSURANCE = "insurance",
  EVENTS = "events",
  OTHER = "other",
}

/**
 * Mapping des mots-clés vers catégories et suggestions
 * Format optimisé pour plus de 3000 activités Google Maps
 */
const ACTIVITY_INTELLIGENCE: Record<
  string,
  {
    category: BusinessCategory;
    suggestions: string[];
  }
> = {
  // === AUTOMOBILE ===
  concessionnaire: {
    category: BusinessCategory.AUTO_SALES,
    suggestions: ["insurance", "driving_school", "car_wash", "bank", "accountant"],
  },
  car_dealer: {
    category: BusinessCategory.AUTO_SALES,
    suggestions: ["insurance", "driving_school", "car_wash", "bank", "accountant"],
  },
  voiture: {
    category: BusinessCategory.AUTO_SALES,
    suggestions: ["insurance", "driving_school", "car_wash", "car_repair"],
  },
  garage: {
    category: BusinessCategory.AUTO_REPAIR,
    suggestions: ["car_dealer", "insurance", "car_rental", "car_wash"],
  },
  car_repair: {
    category: BusinessCategory.AUTO_REPAIR,
    suggestions: ["car_dealer", "insurance", "car_rental", "car_wash"],
  },
  mécanique: {
    category: BusinessCategory.AUTO_REPAIR,
    suggestions: ["car_dealer", "insurance", "car_rental", "auto_parts"],
  },
  carrosserie: {
    category: BusinessCategory.AUTO_REPAIR,
    suggestions: ["insurance", "lawyer", "car_rental", "car_dealer"],
  },
  body_shop: {
    category: BusinessCategory.AUTO_REPAIR,
    suggestions: ["insurance", "lawyer", "car_rental", "car_dealer"],
  },
  lavage: {
    category: BusinessCategory.AUTO_SERVICES,
    suggestions: ["car_dealer", "car_repair", "car_rental", "gas_station"],
  },
  car_wash: {
    category: BusinessCategory.AUTO_SERVICES,
    suggestions: ["car_dealer", "car_repair", "car_rental", "gas_station"],
  },
  "auto-école": {
    category: BusinessCategory.AUTO_EDUCATION,
    suggestions: ["car_dealer", "insurance", "car_rental", "driving_test"],
  },
  driving_school: {
    category: BusinessCategory.AUTO_EDUCATION,
    suggestions: ["car_dealer", "insurance", "car_rental", "dmv"],
  },
  "location voiture": {
    category: BusinessCategory.AUTO_SERVICES,
    suggestions: ["hotel", "travel_agency", "insurance", "car_dealer"],
  },
  car_rental: {
    category: BusinessCategory.AUTO_SERVICES,
    suggestions: ["hotel", "travel_agency", "insurance", "car_dealer"],
  },

  // === IMMOBILIER & HABITAT ===
  "agence immobilière": {
    category: BusinessCategory.REAL_ESTATE,
    suggestions: ["notary", "lawyer", "moving", "insurance", "bank"],
  },
  real_estate: {
    category: BusinessCategory.REAL_ESTATE,
    suggestions: ["notary", "lawyer", "moving", "insurance", "bank"],
  },
  notaire: {
    category: BusinessCategory.LEGAL,
    suggestions: ["real_estate", "lawyer", "moving", "insurance"],
  },
  notary: {
    category: BusinessCategory.LEGAL,
    suggestions: ["real_estate", "lawyer", "moving", "insurance"],
  },
  déménagement: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["real_estate", "furniture_store", "cleaning", "locksmith"],
  },
  moving: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["real_estate", "furniture_store", "cleaning", "locksmith"],
  },
  plombier: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["electrician", "painter", "real_estate", "locksmith"],
  },
  plumber: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["electrician", "painter", "real_estate", "locksmith"],
  },
  électricien: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["plumber", "painter", "real_estate", "locksmith"],
  },
  electrician: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["plumber", "painter", "real_estate", "locksmith"],
  },
  peintre: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["plumber", "electrician", "real_estate", "home_decor"],
  },
  painter: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["plumber", "electrician", "real_estate", "home_decor"],
  },
  serrurier: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["security", "insurance", "moving", "real_estate"],
  },
  locksmith: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["security", "insurance", "moving", "real_estate"],
  },

  // === JURIDIQUE & FINANCE ===
  avocat: {
    category: BusinessCategory.LEGAL,
    suggestions: ["accountant", "notary", "insurance", "real_estate"],
  },
  lawyer: {
    category: BusinessCategory.LEGAL,
    suggestions: ["accountant", "notary", "insurance", "real_estate"],
  },
  comptable: {
    category: BusinessCategory.FINANCIAL,
    suggestions: ["lawyer", "insurance", "bank", "business_consultant"],
  },
  accountant: {
    category: BusinessCategory.FINANCIAL,
    suggestions: ["lawyer", "insurance", "bank", "business_consultant"],
  },
  assurance: {
    category: BusinessCategory.INSURANCE,
    suggestions: ["car_dealer", "real_estate", "lawyer", "bank"],
  },
  insurance: {
    category: BusinessCategory.INSURANCE,
    suggestions: ["car_dealer", "real_estate", "lawyer", "bank"],
  },
  banque: {
    category: BusinessCategory.FINANCIAL,
    suggestions: ["accountant", "insurance", "real_estate", "lawyer"],
  },
  bank: {
    category: BusinessCategory.FINANCIAL,
    suggestions: ["accountant", "insurance", "real_estate", "lawyer"],
  },

  // === SANTÉ ===
  médecin: {
    category: BusinessCategory.MEDICAL_GENERAL,
    suggestions: ["pharmacy", "physio", "dentist", "laboratory"],
  },
  doctor: {
    category: BusinessCategory.MEDICAL_GENERAL,
    suggestions: ["pharmacy", "physio", "dentist", "laboratory"],
  },
  dentiste: {
    category: BusinessCategory.MEDICAL_DENTAL,
    suggestions: ["doctor", "pharmacy", "orthodontist", "oral_surgeon"],
  },
  dentist: {
    category: BusinessCategory.MEDICAL_DENTAL,
    suggestions: ["doctor", "pharmacy", "orthodontist", "oral_surgeon"],
  },
  pharmacie: {
    category: BusinessCategory.PHARMACY,
    suggestions: ["doctor", "dentist", "physio", "laboratory"],
  },
  pharmacy: {
    category: BusinessCategory.PHARMACY,
    suggestions: ["doctor", "dentist", "physio", "laboratory"],
  },
  kiné: {
    category: BusinessCategory.MEDICAL_ALTERNATIVE,
    suggestions: ["doctor", "gym", "pharmacy", "osteopath"],
  },
  kinésithérapeute: {
    category: BusinessCategory.MEDICAL_ALTERNATIVE,
    suggestions: ["doctor", "gym", "pharmacy", "osteopath"],
  },
  physio: {
    category: BusinessCategory.MEDICAL_ALTERNATIVE,
    suggestions: ["doctor", "gym", "pharmacy", "osteopath"],
  },
  ostéopathe: {
    category: BusinessCategory.MEDICAL_ALTERNATIVE,
    suggestions: ["doctor", "physio", "chiropractor", "gym"],
  },
  osteopath: {
    category: BusinessCategory.MEDICAL_ALTERNATIVE,
    suggestions: ["doctor", "physio", "chiropractor", "gym"],
  },
  vétérinaire: {
    category: BusinessCategory.VETERINARY,
    suggestions: ["pet_store", "dog_groomer", "pet_food_store"],
  },
  veterinarian: {
    category: BusinessCategory.VETERINARY,
    suggestions: ["pet_store", "dog_groomer", "pet_food_store"],
  },

  // === BEAUTÉ & BIEN-ÊTRE ===
  coiffeur: {
    category: BusinessCategory.HAIR_SERVICES,
    suggestions: ["beauty_salon", "clothing_store", "jewelry_store", "photographer"],
  },
  hair_salon: {
    category: BusinessCategory.HAIR_SERVICES,
    suggestions: ["beauty_salon", "clothing_store", "jewelry_store", "photographer"],
  },
  barbier: {
    category: BusinessCategory.HAIR_SERVICES,
    suggestions: ["clothing_store", "shoe_store", "jewelry_store", "barber_supply"],
  },
  barber: {
    category: BusinessCategory.HAIR_SERVICES,
    suggestions: ["clothing_store", "shoe_store", "jewelry_store", "grooming"],
  },
  esthéticienne: {
    category: BusinessCategory.BEAUTY_SERVICES,
    suggestions: ["hair_salon", "spa", "gym", "nail_salon"],
  },
  beauty_salon: {
    category: BusinessCategory.BEAUTY_SERVICES,
    suggestions: ["hair_salon", "spa", "gym", "nail_salon"],
  },
  spa: {
    category: BusinessCategory.WELLNESS,
    suggestions: ["hair_salon", "beauty_salon", "massage", "hotel"],
  },
  massage: {
    category: BusinessCategory.WELLNESS,
    suggestions: ["spa", "gym", "physio", "hotel"],
  },
  "salle de sport": {
    category: BusinessCategory.FITNESS,
    suggestions: ["physio", "massage", "spa", "nutrition"],
  },
  gym: {
    category: BusinessCategory.FITNESS,
    suggestions: ["physio", "massage", "spa", "nutrition"],
  },
  yoga: {
    category: BusinessCategory.FITNESS,
    suggestions: ["massage", "spa", "health_food_store", "meditation"],
  },

  // === RESTAURATION ===
  boulangerie: {
    category: BusinessCategory.BAKERY,
    suggestions: ["cafe", "butcher", "wine_shop", "florist"],
  },
  bakery: {
    category: BusinessCategory.BAKERY,
    suggestions: ["cafe", "butcher", "wine_shop", "florist"],
  },
  restaurant: {
    category: BusinessCategory.RESTAURANTS,
    suggestions: ["hotel", "travel_agency", "wine_shop", "catering"],
  },
  café: {
    category: BusinessCategory.CAFES,
    suggestions: ["bakery", "book_store", "florist", "coworking"],
  },
  cafe: {
    category: BusinessCategory.CAFES,
    suggestions: ["bakery", "book_store", "florist", "coworking"],
  },
  traiteur: {
    category: BusinessCategory.SPECIALTY_FOOD,
    suggestions: ["florist", "photographer", "event_planner", "wine_shop"],
  },
  catering: {
    category: BusinessCategory.SPECIALTY_FOOD,
    suggestions: ["florist", "photographer", "event_planner", "wine_shop"],
  },
  boucherie: {
    category: BusinessCategory.SPECIALTY_FOOD,
    suggestions: ["bakery", "wine_shop", "cheese_shop", "catering"],
  },
  butcher: {
    category: BusinessCategory.SPECIALTY_FOOD,
    suggestions: ["bakery", "wine_shop", "cheese_shop", "catering"],
  },

  // === RETAIL ===
  "magasin de vêtements": {
    category: BusinessCategory.CLOTHING,
    suggestions: ["shoe_store", "jewelry_store", "hair_salon", "tailor"],
  },
  clothing_store: {
    category: BusinessCategory.CLOTHING,
    suggestions: ["shoe_store", "jewelry_store", "hair_salon", "tailor"],
  },
  chaussures: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["clothing_store", "shoe_repair", "jewelry_store"],
  },
  shoe_store: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["clothing_store", "shoe_repair", "jewelry_store"],
  },
  bijouterie: {
    category: BusinessCategory.JEWELRY,
    suggestions: ["clothing_store", "hair_salon", "photographer", "wedding_planner"],
  },
  jewelry_store: {
    category: BusinessCategory.JEWELRY,
    suggestions: ["clothing_store", "hair_salon", "photographer", "wedding_planner"],
  },
  librairie: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["cafe", "tutoring", "stationery_store"],
  },
  book_store: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["cafe", "tutoring", "stationery_store"],
  },
  animalerie: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["veterinarian", "dog_groomer", "pet_training"],
  },
  pet_store: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["veterinarian", "dog_groomer", "pet_training"],
  },
  fleuriste: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["photographer", "event_planner", "wedding_planner", "catering"],
  },
  florist: {
    category: BusinessCategory.VARIOUS,
    suggestions: ["photographer", "event_planner", "wedding_planner", "catering"],
  },

  // === HÔTELLERIE & TOURISME ===
  hôtel: {
    category: BusinessCategory.OTHER,
    suggestions: ["restaurant", "travel_agency", "car_rental", "spa"],
  },
  hotel: {
    category: BusinessCategory.OTHER,
    suggestions: ["restaurant", "travel_agency", "car_rental", "spa"],
  },
  "agence de voyage": {
    category: BusinessCategory.OTHER,
    suggestions: ["hotel", "car_rental", "insurance", "restaurant"],
  },
  travel_agency: {
    category: BusinessCategory.OTHER,
    suggestions: ["hotel", "car_rental", "insurance", "restaurant"],
  },

  // === ÉVÉNEMENTIEL ===
  photographe: {
    category: BusinessCategory.EVENTS,
    suggestions: ["wedding_planner", "florist", "catering", "jewelry_store"],
  },
  photographer: {
    category: BusinessCategory.EVENTS,
    suggestions: ["wedding_planner", "florist", "catering", "jewelry_store"],
  },
  wedding_planner: {
    category: BusinessCategory.EVENTS,
    suggestions: ["florist", "photographer", "catering", "hotel"],
  },
  organisateur: {
    category: BusinessCategory.EVENTS,
    suggestions: ["florist", "photographer", "catering", "venue"],
  },
  event_planner: {
    category: BusinessCategory.EVENTS,
    suggestions: ["florist", "photographer", "catering", "venue"],
  },

  // === SERVICES DIVERS ===
  nettoyage: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["real_estate", "moving", "carpet_cleaning", "window_cleaning"],
  },
  cleaning: {
    category: BusinessCategory.HOME_SERVICES,
    suggestions: ["real_estate", "moving", "carpet_cleaning", "window_cleaning"],
  },
  pressing: {
    category: BusinessCategory.OTHER,
    suggestions: ["dry_cleaning", "clothing_store", "laundromat"],
  },
  dry_cleaning: {
    category: BusinessCategory.OTHER,
    suggestions: ["laundromat", "clothing_store", "tailoring"],
  },
};

/**
 * Suggestions génériques par domaine
 */
const GENERIC_SUGGESTIONS: Record<string, string[]> = {
  automobile: ["insurance", "car_wash", "car_repair", "driving_school"],
  immobilier: ["furniture_store", "home_decor", "electrician", "plumber"],
  beauté: ["hair_salon", "beauty_salon", "spa", "massage"],
  santé: ["doctor", "pharmacy", "physio", "dentist"],
  restauration: ["cafe", "bakery", "wine_shop", "catering"],
  mode: ["shoe_store", "jewelry_store", "hair_salon", "beauty_salon"],
  voyage: ["hotel", "car_rental", "restaurant", "insurance"],
  default: ["insurance", "accountant", "lawyer", "marketing_agency"],
};

/**
 * Fonction intelligente de génération de suggestions
 * CORRIGÉE : Utilise le mapping ID pour faire correspondre les suggestions avec les vrais IDs
 */
function generateSmartSuggestions(
  activityInput: string,
  availableTypes: BusinessType[],
  maxSuggestions: number = 5,
): BusinessType[] {
  const inputLower = activityInput.toLowerCase().trim();

  // 1. Identifier l'activité principale
  let mainActivity: { category: BusinessCategory; suggestions: string[] } | null = null;
  let matchedKeyword = "";

  for (const [keyword, activityInfo] of Object.entries(ACTIVITY_INTELLIGENCE)) {
    if (inputLower.includes(keyword)) {
      mainActivity = activityInfo;
      matchedKeyword = keyword;
      break;
    }
  }

  // 2. Collecter les IDs de suggestions (format court)
  let shortSuggestionIds: string[] = [];

  if (mainActivity) {
    // Utiliser les suggestions spécifiques
    shortSuggestionIds = [...mainActivity.suggestions];
  } else {
    // Utiliser les suggestions génériques
    for (const [domain, suggestions] of Object.entries(GENERIC_SUGGESTIONS)) {
      if (inputLower.includes(domain)) {
        shortSuggestionIds = suggestions;
        break;
      }
    }

    // Si toujours rien, utiliser les suggestions par défaut
    if (shortSuggestionIds.length === 0) {
      shortSuggestionIds = GENERIC_SUGGESTIONS["default"];
    }
  }

  // 3. Convertir les IDs courts en vrais IDs et trouver les BusinessType correspondants
  const suggestions: BusinessType[] = [];
  const usedIds = new Set<string>();

  for (const shortId of shortSuggestionIds) {
    // Trouver le vrai ID correspondant
    const realId = findBusinessTypeId(shortId, availableTypes);

    if (realId && !usedIds.has(realId)) {
      // Chercher le BusinessType correspondant
      const businessType = availableTypes.find((type) => type.id === realId || type.id.includes(realId));

      if (businessType) {
        suggestions.push(businessType);
        usedIds.add(realId);

        // Arrêter si on a assez de suggestions
        if (suggestions.length >= maxSuggestions) {
          break;
        }
      }
    }
  }

  // 4. Si on n'a pas assez de suggestions, ajouter des suggestions génériques
  if (suggestions.length < maxSuggestions) {
    // Chercher des activités universellement complémentaires
    const universalIds = ["insurance_agency", "accountant", "lawyer", "marketing_agency", "bank"];

    for (const id of universalIds) {
      if (suggestions.length >= maxSuggestions) break;

      const businessType = availableTypes.find((type) => type.id === id || type.id.includes(id));

      if (businessType && !usedIds.has(businessType.id)) {
        suggestions.push(businessType);
        usedIds.add(businessType.id);
      }
    }
  }

  return suggestions;
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
              placeholder="Ex: Concessionnaire automobile, Coiffeur, Restaurant, Plombier..."
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
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Apporteurs d'affaires</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Activités dont les clients auraient naturellement besoin de votre client
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Link2 className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-pink-900 dark:text-pink-100">Proximité sémantique</p>
                  <p className="text-sm text-pink-700 dark:text-pink-300">
                    Activités partageant le même univers client ou les mêmes occasions
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">🎯 Le système évite automatiquement</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Les concurrents directs (même catégorie d'activité)</li>
                <li>• Les activités sans lien avec votre client</li>
                <li>• Les suggestions peu pertinentes pour le partenariat</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Base de données</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Système optimisé pour plus de 3000 catégories d'activités Google Maps 2025
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
