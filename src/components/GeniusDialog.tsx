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
 * SYSTÈME INTELLIGENT DE SUGGESTIONS V2.1
 *
 * Logique VRAIMENT intelligente :
 * 1. Écosystèmes métiers réels (ex: santé, automobile, immobilier)
 * 2. Apporteurs d'affaires naturels avec score de pertinence
 * 3. Raisons explicites de chaque suggestion
 * 4. Mapping IDs courts → IDs Google (gcid:xxx)
 *
 * Exemple : Orthophoniste → Pédiatre (10/10), Psychologue (9/10), Neurologue (8/10)
 * PAS : Comptable, Avocat, Assurance (aucun lien)
 */

/**
 * MAPPING DES IDS COURTS VERS IDS GOOGLE MAPS
 * Résout le problème : suggestionIds = ["insurance"] vs type.id = "gcid:insurance_agency"
 */
const ID_MAPPING: Record<string, string> = {
  // === SANTÉ ===
  pharmacy: "gcid:pharmacy",
  laboratory: "gcid:medical_lab",
  radiology: "gcid:radiologist",
  physio: "gcid:physiotherapist",
  medical_equipment: "gcid:medical_supply_store",
  doctor: "gcid:doctor",
  orthodontist: "gcid:orthodontist",
  dental_lab: "gcid:dental_lab",
  oral_surgeon: "gcid:oral_surgeon",
  hygienist: "gcid:dental_hygienist",
  sports_medicine: "gcid:sports_medicine_physician",
  gym: "gcid:gym",
  massage: "gcid:massage_therapist",
  orthopedic: "gcid:orthopedic_surgeon",
  pediatrician: "gcid:pediatrician",
  psychologist: "gcid:psychologist",
  neurologist: "gcid:neurologist",
  audiologist: "gcid:audiologist",
  special_education: "gcid:special_education_school",
  coach: "gcid:life_coach",
  meditation_center: "gcid:meditation_center",
  psychiatrist: "gcid:psychiatrist",
  social_worker: "gcid:social_worker",
  speech_therapist: "gcid:speech_pathologist",
  dermatologist: "gcid:dermatologist",
  nutritionist: "gcid:nutritionist",

  // === VÉTÉRINAIRE ===
  pet_store: "gcid:pet_store",
  pet_groomer: "gcid:pet_groomer",
  pet_training: "gcid:dog_trainer",
  pet_boarding: "gcid:pet_boarding_service",
  pet_food: "gcid:pet_supply_store",
  veterinarian: "gcid:veterinarian",
  pet_photographer: "gcid:photographer", // Note: pas de pet_photographer spécifique, utilise photographer général

  // === AUTOMOBILE ===
  insurance: "gcid:insurance_agency",
  bank: "gcid:bank",
  car_wash: "gcid:car_wash",
  driving_school: "gcid:motorcycle_driving_school", // Note: pas d'auto-école générique, moto-école est le plus proche
  car_accessories: "gcid:car_accessories_store",
  car_dealer: "gcid:car_dealer",
  towing: "gcid:towing_service",
  auto_parts: "gcid:auto_parts_store",
  car_rental: "gcid:car_rental_agency",
  lawyer: "gcid:lawyer",
  expert: "gcid:auto_insurance_agency",
  dmv: "gcid:drivers_license_office",
  driving_simulator: "gcid:motorcycle_driving_school", // Note: utilise moto-école comme alternative

  // === IMMOBILIER & HABITAT ===
  real_estate: "gcid:real_estate_agency",
  notary: "gcid:notary_public",
  moving: "gcid:moving_company",
  home_inspector: "gcid:home_inspector",
  storage: "gcid:self_storage_facility",
  cleaning: "gcid:house_cleaning_service",
  furniture_store: "gcid:furniture_store",
  locksmith: "gcid:locksmith",
  electrician: "gcid:electrician",
  plumber: "gcid:plumber",
  painter: "gcid:painter",
  hardware_store: "gcid:hardware_store",
  architect: "gcid:architect",

  // === BEAUTÉ & BIEN-ÊTRE ===
  hair_salon: "gcid:hair_salon",
  beauty_salon: "gcid:beauty_salon",
  nail_salon: "gcid:nail_salon",
  clothing_store: "gcid:clothing_store",
  photographer: "gcid:photographer",
  jewelry_store: "gcid:jewelry_store",
  supplement_store: "gcid:vitamin_and_supplements_store",
  sports_store: "gcid:sporting_goods_store",

  // === RESTAURATION ===
  restaurant: "gcid:restaurant",
  hotel: "gcid:hotel",
  wine_shop: "gcid:wine_store",
  catering: "gcid:catering_service",
  food_delivery: "gcid:meal_delivery",
  grocery_store: "gcid:grocery_store",
  cafe: "gcid:cafe",
  florist: "gcid:florist",
  butcher: "gcid:butcher_shop",

  // === ÉVÉNEMENTIEL ===
  event_planner: "gcid:event_planner",
  venue: "gcid:banquet_hall",
  party_rental: "gcid:party_equipment_rental_service",
  wedding_planner: "gcid:wedding_planner",
  bridal_shop: "gcid:bridal_shop",
  makeup_artist: "gcid:permanent_make_up_clinic", // Note: maquillage permanent, pas de makeup artist général
  printing_service: "gcid:print_shop",

  // === JURIDIQUE & FINANCE ===
  accountant: "gcid:accountant",
  mediator: "gcid:mediation_service",
  business_consultant: "gcid:business_management_consultant",
  payroll_service: "gcid:bookkeeping_service", // Note: service de comptabilité (inclut paie)

  // === RETAIL ===
  shoe_store: "gcid:boot_store", // Note: boot_store = magasin de chaussures
  tailor: "gcid:tailor",
  personal_stylist: "gcid:image_consultant",
  watch_repair: "gcid:watch_repair_service",
  engraver: "gcid:engraver",

  // === TOURISME ===
  travel_agency: "gcid:tour_agency",
  spa: "gcid:spa",
  tour_guide: "gcid:tour_operator",
  currency_exchange: "gcid:currency_exchange_service",
  luggage_store: "gcid:luggage_store",

  // === ÉDUCATION ===
  book_store: "gcid:book_store",
  library: "gcid:library",
  stationery: "gcid:paper_store", // Note: paper_store = papeterie

  // === AUTRES ===
  marketing_agency: "gcid:marketing_agency",

  // === CONSTRUCTION & ARTISANAT ===
  carpenter: "gcid:carpenter",
  roofer: "gcid:roofing_contractor",
  mason: "gcid:masonry_contractor",
  hvac: "gcid:heating_contractor",
  contractor: "gcid:general_contractor",
  window_installer: "gcid:window_installation_service",
  flooring: "gcid:flooring_store",
  tile_contractor: "gcid:tile_contractor",
  drywall: "gcid:dry_wall_contractor",
  insulation: "gcid:insulation_contractor",

  // === FORMATION & ÉDUCATION ===
  music_school: "gcid:music_school",
  language_school: "gcid:language_school",
  art_school: "gcid:art_school",
  dance_school: "gcid:dance_school",
  computer_training: "gcid:computer_training_school",
  tutoring_service: "gcid:tutoring_service",

  // === SERVICES INFORMATIQUES ===
  computer_repair: "gcid:computer_repair_service",
  software_company: "gcid:software_company",
  web_designer: "gcid:website_designer",
  it_support: "gcid:computer_support_and_services",
  electronics_store: "gcid:electronics_store",

  // === JARDIN & PAYSAGISME ===
  landscaper: "gcid:landscaper",
  garden_center: "gcid:garden_center",
  tree_service: "gcid:tree_service",
  lawn_care: "gcid:lawn_care_service",
  irrigation: "gcid:landscape_lighting_designer",

  // === SERVICES À DOMICILE ===
  handyman: "gcid:handyman",
  pest_control: "gcid:pest_control_service",
  window_cleaning: "gcid:window_cleaning_service",
  gutter_cleaning: "gcid:gutter_cleaning_service",
  chimney_sweep: "gcid:chimney_sweep",
  pool_maintenance: "gcid:swimming_pool_repair_service",

  // === SANTÉ SPÉCIALISÉE ===
  ophthalmologist: "gcid:ophthalmologist",
  optician: "gcid:optician",
  chiropractor: "gcid:chiropractor",
  acupuncturist: "gcid:acupuncturist",
  osteopath: "gcid:osteopath",
  podiatrist: "gcid:podiatrist",
  midwife: "gcid:midwife",
  hearing_aid: "gcid:hearing_aid_store",

  // === SERVICES FINANCIERS ===
  financial_planner: "gcid:financial_planner",
  tax_consultant: "gcid:tax_consultant",
  investment_service: "gcid:investment_service",
  mortgage_broker: "gcid:mortgage_broker",
  credit_union: "gcid:credit_union",

  // === LOGISTIQUE & TRANSPORT ===
  courier: "gcid:courier_service",
  shipping: "gcid:shipping_service",
  freight: "gcid:freight_forwarding_service",
  taxi: "gcid:taxi_service",
  bus_company: "gcid:bus_company",

  // === MÉDIAS & COMMUNICATION ===
  advertising_agency: "gcid:advertising_agency",
  graphic_designer: "gcid:graphic_designer",
  video_production: "gcid:video_production_service",
  public_relations: "gcid:public_relations_firm",
  copywriter: "gcid:publisher",

  // === ARTISANAT & ARTS ===
  art_gallery: "gcid:art_gallery",
  frame_shop: "gcid:picture_frame_shop",
  craft_store: "gcid:craft_store",
  pottery_studio: "gcid:pottery_classes",
  music_store: "gcid:musical_instrument_store",

  // === SERVICES ANIMALIERS ÉTENDUS ===
  animal_hospital: "gcid:animal_hospital",
  pet_adoption: "gcid:animal_shelter",
  equestrian: "gcid:horse_riding_school",
  farm_supplies: "gcid:agricultural_service",

  // === BÉBÉ & PUÉRICULTURE ===
  baby_store: "gcid:baby_store",

  // === NAUTISME ===
  boat_dealer: "gcid:boat_dealer",
  boat_repair: "gcid:boat_repair_shop",
  fishing_store: "gcid:fishing_store",

  // === DIVERS ===
  wood_supplier: "gcid:lumber_store",
  outdoor_store: "gcid:outdoor_sports_store",

  // === COMMERCE ALIMENTAIRE ===
  bakery_shop: "gcid:bakery",
  cheese_shop: "gcid:cheese_shop",
  organic_shop: "gcid:organic_food_store",
  fish_market: "gcid:seafood_market",
  candy_store: "gcid:candy_store",

  // === SERVICES AUTOMOBILES ÉTENDUS ===
  tire_shop: "gcid:tire_shop",
  oil_change: "gcid:oil_change_service",
  auto_glass: "gcid:auto_glass_shop",
  car_detailing: "gcid:car_detailing_service",
  motorcycle_dealer: "gcid:motorcycle_dealer",
  rv_dealer: "gcid:rv_dealer",

  // === SERVICES FUNÉRAIRES ===
  funeral_home: "gcid:funeral_home",
  cremation_service: "gcid:cremation_service",
  cemetery: "gcid:cemetery",
  monument_maker: "gcid:monument_maker",

  // === IMMOBILIER ÉTENDU ===
  property_management: "gcid:property_management_company",
  appraiser: "gcid:real_estate_appraiser",
  title_company: "gcid:title_company",

  // === TOURISME ÉTENDU ===
  campground: "gcid:campground",
  rv_park: "gcid:rv_park",
  boat_rental: "gcid:boat_rental_service",
  ski_resort: "gcid:ski_resort",
  amusement_park: "gcid:amusement_park",

  // === SERVICES INDUSTRIELS ===
  welding: "gcid:welder",
  industrial_equipment: "gcid:industrial_equipment_supplier",
  manufacturing: "gcid:manufacturer",
  warehouse: "gcid:warehouse",
};

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
    keywords: ["kiné", "kinésithérapeute", "ostéopathe", "chiropracteur", "physiothérapeute", "ostéo", "physio"],
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

  // === ÉCOSYSTÈME CONSTRUCTION RÉSIDENTIELLE ===
  home_construction: {
    keywords: ["charpentier", "carpenter", "menuisier", "charpente", "construction bois"],
    activities: [
      { id: "electrician", score: 9, reason: "Installation électrique après charpente" },
      { id: "plumber", score: 9, reason: "Plomberie intégrée aux travaux" },
      { id: "roofer", score: 10, reason: "Couverture après charpente" },
      { id: "insulation", score: 8, reason: "Isolation des combles et murs" },
      { id: "hardware_store", score: 7, reason: "Matériaux de construction" },
    ],
  },

  roofing: {
    keywords: ["couvreur", "roofer", "toiture", "couverture", "zingueur"],
    activities: [
      { id: "carpenter", score: 9, reason: "Charpente avant couverture" },
      { id: "gutter_cleaning", score: 8, reason: "Entretien gouttières" },
      { id: "insulation", score: 8, reason: "Isolation sous toiture" },
      { id: "mason", score: 7, reason: "Travaux de maçonnerie associés" },
      { id: "hardware_store", score: 7, reason: "Matériaux toiture" },
    ],
  },

  masonry: {
    keywords: ["maçon", "mason", "maçonnerie", "béton", "parpaing"],
    activities: [
      { id: "electrician", score: 9, reason: "Installations électriques dans maçonnerie" },
      { id: "plumber", score: 9, reason: "Passages de plomberie" },
      { id: "painter", score: 8, reason: "Finitions après maçonnerie" },
      { id: "tile_contractor", score: 8, reason: "Carrelage sur supports maçonnés" },
      { id: "hardware_store", score: 7, reason: "Ciment, parpaings, outils" },
    ],
  },

  hvac_services: {
    keywords: ["chauffagiste", "hvac", "climatisation", "pompe chaleur", "plombier chauffagiste"],
    activities: [
      { id: "electrician", score: 10, reason: "Raccordements électriques obligatoires" },
      { id: "plumber", score: 9, reason: "Circuit hydraulique chauffage" },
      { id: "insulation", score: 8, reason: "Isolation pour efficacité énergétique" },
      { id: "contractor", score: 7, reason: "Coordination travaux énergétiques" },
      { id: "hardware_store", score: 6, reason: "Fournitures chauffage" },
    ],
  },

  general_contracting: {
    keywords: ["entrepreneur général", "general contractor", "rénovation complète", "maître d'oeuvre"],
    activities: [
      { id: "architect", score: 9, reason: "Plans et conception" },
      { id: "electrician", score: 8, reason: "Sous-traitance électricité" },
      { id: "plumber", score: 8, reason: "Sous-traitance plomberie" },
      { id: "carpenter", score: 8, reason: "Travaux menuiserie" },
      { id: "painter", score: 7, reason: "Finitions peinture" },
    ],
  },

  flooring_services: {
    keywords: ["parquet", "flooring", "revêtement sol", "carreleur", "pose sol"],
    activities: [
      { id: "tile_contractor", score: 9, reason: "Carrelage complémentaire" },
      { id: "painter", score: 8, reason: "Peinture après pose sol" },
      { id: "carpenter", score: 7, reason: "Découpes et finitions bois" },
      { id: "hardware_store", score: 8, reason: "Matériaux revêtement" },
      { id: "cleaning", score: 7, reason: "Nettoyage après travaux" },
    ],
  },

  // === ÉCOSYSTÈME CONSEIL B2B ===
  business_consulting: {
    keywords: ["consultant", "business consultant", "conseil entreprise", "stratégie", "management"],
    activities: [
      { id: "accountant", score: 10, reason: "Comptabilité et gestion financière" },
      { id: "lawyer", score: 9, reason: "Conseil juridique d'entreprise" },
      { id: "marketing_agency", score: 8, reason: "Stratégie marketing" },
      { id: "web_designer", score: 7, reason: "Présence digitale" },
      { id: "financial_planner", score: 7, reason: "Planification financière" },
    ],
  },

  marketing_services: {
    keywords: ["marketing", "agence marketing", "communication", "publicité", "marketing agency"],
    activities: [
      { id: "web_designer", score: 10, reason: "Sites web pour campagnes" },
      { id: "graphic_designer", score: 9, reason: "Supports visuels" },
      { id: "photographer", score: 8, reason: "Photos produits et corporate" },
      { id: "video_production", score: 8, reason: "Contenus vidéo marketing" },
      { id: "printing_service", score: 7, reason: "Supports print" },
    ],
  },

  // === ÉCOSYSTÈME LIBRAIRIE & PAPETERIE ===
  retail_books: {
    keywords: ["librairie", "bookstore", "book store", "livres"],
    activities: [
      { id: "stationery", score: 9, reason: "Fournitures scolaires et bureau" },
      { id: "cafe", score: 8, reason: "Café-librairie concept" },
      { id: "library", score: 7, reason: "Complémentarité lecture" },
      { id: "tutoring_service", score: 6, reason: "Soutien scolaire avec livres" },
      { id: "art_school", score: 6, reason: "Livres d'art et éducation" },
    ],
  },

  stationery_store: {
    keywords: ["papeterie", "stationery", "fournitures bureau", "fournitures scolaires"],
    activities: [
      { id: "book_store", score: 9, reason: "Manuels scolaires" },
      { id: "printing_service", score: 8, reason: "Impression documents" },
      { id: "tutoring_service", score: 7, reason: "Fournitures pour cours" },
      { id: "art_school", score: 7, reason: "Matériel artistique" },
      { id: "craft_store", score: 6, reason: "Loisirs créatifs" },
    ],
  },

  // === ÉCOSYSTÈME SANTÉ SPÉCIALISÉE ===
  health_ophthalmology: {
    keywords: ["ophtalmologiste", "ophthalmologist", "opticien", "optique", "lunettes", "vision"],
    activities: [
      { id: "optician", score: 10, reason: "Prescriptions de lunettes" },
      { id: "optician", score: 9, reason: "Lentilles de contact" },
      { id: "doctor", score: 7, reason: "Suivi médical général" },
      { id: "pharmacy", score: 6, reason: "Collyres et médicaments" },
      { id: "hearing_aid", score: 5, reason: "Autres appareillages médicaux" },
    ],
  },

  health_chiropractic: {
    keywords: ["chiropracteur", "chiropractor", "chiropraxie", "manipulation vertébrale"],
    activities: [
      { id: "physio", score: 9, reason: "Rééducation complémentaire" },
      { id: "massage", score: 8, reason: "Détente musculaire" },
      { id: "acupuncturist", score: 7, reason: "Médecine alternative" },
      { id: "osteopath", score: 9, reason: "Approches similaires" },
      { id: "sports_medicine", score: 7, reason: "Blessures sportives" },
    ],
  },

  health_podiatry: {
    keywords: ["podologue", "podiatrist", "pédicure", "soins pieds"],
    activities: [
      { id: "orthopedic", score: 8, reason: "Problèmes orthopédiques" },
      { id: "shoe_store", score: 9, reason: "Chaussures orthopédiques" },
      { id: "doctor", score: 7, reason: "Diabète et problèmes vasculaires" },
      { id: "pharmacy", score: 6, reason: "Produits de soins" },
      { id: "sports_store", score: 6, reason: "Chaussures de sport adaptées" },
    ],
  },

  health_maternity: {
    keywords: ["sage-femme", "midwife", "maternité", "accouchement", "grossesse"],
    activities: [
      { id: "pediatrician", score: 10, reason: "Suivi du nouveau-né" },
      { id: "doctor", score: 9, reason: "Suivi médical grossesse" },
      { id: "pharmacy", score: 8, reason: "Produits maternité et bébé" },
      { id: "photographer", score: 7, reason: "Photos grossesse et nouveau-né" },
      { id: "baby_store", score: 8, reason: "Équipement bébé" },
    ],
  },

  // === ÉCOSYSTÈME FORMATION PROFESSIONNELLE ===
  professional_training: {
    keywords: ["formation professionnelle", "centre formation", "training center", "formateur"],
    activities: [
      { id: "computer_training", score: 8, reason: "Formations informatiques" },
      { id: "business_consultant", score: 7, reason: "Conseil et formation" },
      { id: "book_store", score: 6, reason: "Manuels de formation" },
      { id: "stationery", score: 6, reason: "Fournitures formation" },
      { id: "hotel", score: 7, reason: "Hébergement stagiaires" },
    ],
  },

  language_education: {
    keywords: ["école langue", "language school", "cours anglais", "cours langue"],
    activities: [
      { id: "book_store", score: 8, reason: "Livres et méthodes langues" },
      { id: "tutoring_service", score: 7, reason: "Soutien scolaire langues" },
      { id: "travel_agency", score: 7, reason: "Séjours linguistiques" },
      { id: "stationery", score: 6, reason: "Cahiers et fournitures" },
      { id: "cafe", score: 6, reason: "Espaces conversation" },
    ],
  },

  music_education: {
    keywords: ["école musique", "music school", "conservatoire", "cours musique"],
    activities: [
      { id: "music_store", score: 10, reason: "Instruments de musique" },
      { id: "book_store", score: 7, reason: "Partitions et méthodes" },
      { id: "event_planner", score: 6, reason: "Récitals et concerts" },
      { id: "photographer", score: 5, reason: "Photos spectacles" },
      { id: "venue", score: 6, reason: "Salles de spectacle" },
    ],
  },

  art_education: {
    keywords: ["école art", "art school", "cours dessin", "atelier peinture", "beaux-arts"],
    activities: [
      { id: "art_gallery", score: 9, reason: "Exposition travaux élèves" },
      { id: "craft_store", score: 10, reason: "Matériel artistique" },
      { id: "frame_shop", score: 8, reason: "Encadrement œuvres" },
      { id: "book_store", score: 7, reason: "Livres d'art" },
      { id: "photographer", score: 6, reason: "Documentation œuvres" },
    ],
  },

  // === ÉCOSYSTÈME SERVICES INFORMATIQUES ===
  it_services: {
    keywords: ["informatique", "it support", "dépannage informatique", "technicien", "ordinateur"],
    activities: [
      { id: "computer_repair", score: 10, reason: "Réparations matérielles" },
      { id: "software_company", score: 8, reason: "Solutions logicielles" },
      { id: "web_designer", score: 7, reason: "Sites web professionnels" },
      { id: "electronics_store", score: 8, reason: "Équipements informatiques" },
      { id: "computer_training", score: 7, reason: "Formation utilisateurs" },
    ],
  },

  web_design: {
    keywords: ["web designer", "site web", "website", "développeur web", "agence web"],
    activities: [
      { id: "graphic_designer", score: 9, reason: "Design graphique" },
      { id: "photographer", score: 8, reason: "Photos pour sites" },
      { id: "marketing_agency", score: 9, reason: "Référencement et marketing" },
      { id: "copywriter", score: 7, reason: "Rédaction contenu" },
      { id: "video_production", score: 7, reason: "Vidéos pour sites" },
    ],
  },

  // === ÉCOSYSTÈME JARDIN & PAYSAGISME ===
  garden_landscape: {
    keywords: ["paysagiste", "landscaper", "jardinier", "aménagement extérieur", "espaces verts"],
    activities: [
      { id: "garden_center", score: 10, reason: "Plants et matériaux" },
      { id: "tree_service", score: 9, reason: "Élagage et abattage" },
      { id: "lawn_care", score: 8, reason: "Entretien pelouse" },
      { id: "irrigation", score: 8, reason: "Systèmes d'arrosage" },
      { id: "mason", score: 7, reason: "Terrasses et murets" },
    ],
  },

  tree_services: {
    keywords: ["élagueur", "tree service", "abattage", "élagage", "arboriste"],
    activities: [
      { id: "landscaper", score: 9, reason: "Aménagement après élagage" },
      { id: "garden_center", score: 7, reason: "Nouvelles plantations" },
      { id: "wood_supplier", score: 7, reason: "Valorisation du bois" },
      { id: "insurance", score: 6, reason: "Arbres dangereux" },
      { id: "contractor", score: 6, reason: "Travaux connexes" },
    ],
  },

  // === ÉCOSYSTÈME SERVICES À DOMICILE ===
  home_services: {
    keywords: ["homme toutes mains", "handyman", "bricoleur", "réparations", "dépannage"],
    activities: [
      { id: "hardware_store", score: 9, reason: "Outils et matériaux" },
      { id: "locksmith", score: 7, reason: "Serrurerie" },
      { id: "electrician", score: 7, reason: "Électricité complexe" },
      { id: "plumber", score: 7, reason: "Plomberie complexe" },
      { id: "painter", score: 6, reason: "Peinture" },
    ],
  },

  pest_control: {
    keywords: ["désinsectisation", "pest control", "nuisibles", "dératisation", "termites"],
    activities: [
      { id: "cleaning", score: 8, reason: "Nettoyage après traitement" },
      { id: "contractor", score: 7, reason: "Réparations dégâts" },
      { id: "home_inspector", score: 7, reason: "Inspection préventive" },
      { id: "hardware_store", score: 6, reason: "Produits préventifs" },
      { id: "insurance", score: 6, reason: "Dégâts nuisibles" },
    ],
  },

  pool_services: {
    keywords: ["piscine", "pool", "pisciniste", "entretien piscine"],
    activities: [
      { id: "landscaper", score: 8, reason: "Aménagement autour piscine" },
      { id: "electrician", score: 7, reason: "Installation pompes" },
      { id: "hardware_store", score: 8, reason: "Produits entretien" },
      { id: "contractor", score: 7, reason: "Construction piscine" },
      { id: "mason", score: 7, reason: "Plages et margelles" },
    ],
  },

  // === ÉCOSYSTÈME SERVICES FINANCIERS ===
  financial_services: {
    keywords: ["conseiller financier", "financial planner", "gestion patrimoine", "investissement"],
    activities: [
      { id: "accountant", score: 9, reason: "Fiscalité et déclarations" },
      { id: "lawyer", score: 8, reason: "Succession et contrats" },
      { id: "bank", score: 9, reason: "Produits bancaires" },
      { id: "insurance", score: 9, reason: "Assurances vie et prévoyance" },
      { id: "notary", score: 7, reason: "Actes patrimoniaux" },
    ],
  },

  tax_services: {
    keywords: ["fiscaliste", "tax consultant", "impôts", "déclaration fiscale"],
    activities: [
      { id: "accountant", score: 10, reason: "Comptabilité d'entreprise" },
      { id: "lawyer", score: 8, reason: "Droit fiscal" },
      { id: "financial_planner", score: 7, reason: "Optimisation fiscale" },
      { id: "business_consultant", score: 6, reason: "Conseil entreprise" },
      { id: "notary", score: 6, reason: "Fiscalité immobilière" },
    ],
  },

  // === ÉCOSYSTÈME LOGISTIQUE ===
  logistics_transport: {
    keywords: ["transport", "logistique", "livraison", "coursier", "courier"],
    activities: [
      { id: "warehouse", score: 9, reason: "Stockage marchandises" },
      { id: "shipping", score: 8, reason: "Expédition nationale/internationale" },
      { id: "freight", score: 8, reason: "Transport de fret" },
      { id: "moving", score: 7, reason: "Déménagement" },
      { id: "storage", score: 7, reason: "Entreposage" },
    ],
  },

  // === ÉCOSYSTÈME MÉDIAS & COMMUNICATION ===
  media_communication: {
    keywords: ["agence communication", "relations publiques", "public relations", "attaché presse"],
    activities: [
      { id: "advertising_agency", score: 9, reason: "Campagnes publicitaires" },
      { id: "marketing_agency", score: 9, reason: "Stratégie marketing" },
      { id: "graphic_designer", score: 8, reason: "Supports visuels" },
      { id: "web_designer", score: 8, reason: "Présence digitale" },
      { id: "photographer", score: 7, reason: "Photos corporate" },
    ],
  },

  video_production: {
    keywords: ["production vidéo", "video production", "réalisateur", "montage vidéo"],
    activities: [
      { id: "photographer", score: 8, reason: "Photo et vidéo complémentaires" },
      { id: "marketing_agency", score: 9, reason: "Contenus marketing" },
      { id: "event_planner", score: 7, reason: "Captation événements" },
      { id: "graphic_designer", score: 7, reason: "Motion design" },
      { id: "web_designer", score: 7, reason: "Intégration vidéos web" },
    ],
  },

  // === ÉCOSYSTÈME ARTISANAT & ARTS ===
  arts_crafts: {
    keywords: ["galerie art", "art gallery", "artiste", "peintre", "sculpteur"],
    activities: [
      { id: "frame_shop", score: 10, reason: "Encadrement œuvres" },
      { id: "art_school", score: 8, reason: "Cours et ateliers" },
      { id: "photographer", score: 7, reason: "Documentation œuvres" },
      { id: "insurance", score: 7, reason: "Assurance œuvres" },
      { id: "event_planner", score: 6, reason: "Vernissages" },
    ],
  },

  pottery_ceramics: {
    keywords: ["poterie", "pottery", "céramique", "atelier céramique"],
    activities: [
      { id: "art_school", score: 8, reason: "Cours de poterie" },
      { id: "craft_store", score: 9, reason: "Matériaux céramique" },
      { id: "art_gallery", score: 7, reason: "Exposition créations" },
      { id: "hardware_store", score: 6, reason: "Outils et fournitures" },
      { id: "florist", score: 5, reason: "Vases et contenants" },
    ],
  },

  // === ÉCOSYSTÈME COMMERCE ALIMENTAIRE ===
  retail_food_specialty: {
    keywords: ["fromagerie", "cheese shop", "épicerie fine", "delicatessen"],
    activities: [
      { id: "wine_shop", score: 10, reason: "Accords mets et vins" },
      { id: "bakery_shop", score: 8, reason: "Pain frais" },
      { id: "butcher", score: 8, reason: "Charcuterie" },
      { id: "restaurant", score: 7, reason: "Recommandations" },
      { id: "catering", score: 7, reason: "Plateaux fromages événements" },
    ],
  },

  organic_food: {
    keywords: ["bio", "organic", "épicerie bio", "magasin bio", "produits bio"],
    activities: [
      { id: "nutritionist", score: 9, reason: "Conseils diététiques" },
      { id: "pharmacy", score: 7, reason: "Compléments naturels" },
      { id: "gym", score: 7, reason: "Alimentation sportifs" },
      { id: "restaurant", score: 6, reason: "Restaurants bio" },
      { id: "supplement_store", score: 8, reason: "Compléments bio" },
    ],
  },

  // === ÉCOSYSTÈME AUTOMOBILE ÉTENDU ===
  auto_specialized: {
    keywords: ["pneumatique", "tire shop", "pneus", "vidange", "oil change"],
    activities: [
      { id: "car_wash", score: 8, reason: "Nettoyage après entretien" },
      { id: "auto_parts", score: 9, reason: "Pièces et accessoires" },
      { id: "oil_change", score: 9, reason: "Vidange régulière" },
      { id: "car_dealer", score: 7, reason: "Pneus véhicules neufs" },
      { id: "insurance", score: 6, reason: "Garantie pneus" },
    ],
  },

  car_detailing: {
    keywords: ["detailing", "esthétique auto", "nettoyage voiture", "car detailing"],
    activities: [
      { id: "car_wash", score: 9, reason: "Lavage complémentaire" },
      { id: "auto_glass", score: 7, reason: "Vitres impeccables" },
      { id: "car_accessories", score: 8, reason: "Accessoires intérieur" },
      { id: "car_dealer", score: 7, reason: "Préparation véhicules occasion" },
      { id: "car_rental", score: 6, reason: "Entretien flotte" },
    ],
  },

  // === ÉCOSYSTÈME SERVICES FUNÉRAIRES ===
  funeral_services: {
    keywords: ["pompes funèbres", "funeral home", "funérailles", "enterrement"],
    activities: [
      { id: "florist", score: 10, reason: "Fleurs funéraires" },
      { id: "cemetery", score: 10, reason: "Inhumation" },
      { id: "cremation_service", score: 9, reason: "Crémation" },
      { id: "monument_maker", score: 8, reason: "Pierres tombales" },
      { id: "notary", score: 7, reason: "Succession" },
    ],
  },

  // === ÉCOSYSTÈME TOURISME ÉTENDU ===
  tourism_specialized: {
    keywords: ["camping", "campground", "caravaning", "rv park", "glamping"],
    activities: [
      { id: "rv_dealer", score: 8, reason: "Vente camping-cars" },
      { id: "outdoor_store", score: 8, reason: "Équipement camping" },
      { id: "tour_guide", score: 7, reason: "Excursions" },
      { id: "restaurant", score: 7, reason: "Restauration campeurs" },
      { id: "grocery_store", score: 7, reason: "Courses campeurs" },
    ],
  },

  boat_services: {
    keywords: ["bateau", "boat", "nautisme", "marina", "voilier"],
    activities: [
      { id: "boat_rental", score: 9, reason: "Location bateaux" },
      { id: "boat_dealer", score: 8, reason: "Vente bateaux" },
      { id: "boat_repair", score: 8, reason: "Entretien bateaux" },
      { id: "insurance", score: 8, reason: "Assurance bateau" },
      { id: "fishing_store", score: 7, reason: "Équipement pêche" },
    ],
  },

  // === ÉCOSYSTÈME SERVICES INDUSTRIELS ===
  industrial_services: {
    keywords: ["industrie", "industrial", "usine", "fabrication", "manufacturing"],
    activities: [
      { id: "welding", score: 9, reason: "Soudure industrielle" },
      { id: "industrial_equipment", score: 10, reason: "Équipements industriels" },
      { id: "electrician", score: 8, reason: "Électricité industrielle" },
      { id: "logistics_transport", score: 8, reason: "Transport marchandises" },
      { id: "warehouse", score: 8, reason: "Stockage production" },
    ],
  },
};

/**
 * Fonction principale de génération de suggestions
 * CORRIGÉ : Utilise ID_MAPPING pour convertir les IDs courts en IDs Google
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
      // 🔧 CORRECTION : Vérifier dans les deux sens (input contient keyword OU keyword contient input)
      // Cela permet de matcher "coiffeur" avec "hair" ou "plombier" avec "plumber"
      if (inputLower.includes(keyword) || keyword.includes(inputLower)) {
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

    // 🔧 CORRECTION : Convertir les IDs courts en IDs Google via le mapping
    const shortIds = ecosystem.activities
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
      .map((activity) => activity.id);

    const suggestionIds = shortIds.map((id) => ID_MAPPING[id] || id);

    const suggestions = availableTypes.filter((type) => suggestionIds.includes(type.id));

    if (suggestions.length > 0) {
      return suggestions;
    }
  }

  // 3. Fallback : suggestions très génériques mais pertinentes
  // 🔧 CORRECTION : Appliquer le mapping aussi au fallback
  const fallbackIds = ["insurance", "accountant", "lawyer", "marketing_agency", "bank"].map(
    (id) => ID_MAPPING[id] || id,
  );

  const fallbackSuggestions = availableTypes.filter((type) => fallbackIds.includes(type.id)).slice(0, maxSuggestions);

  return fallbackSuggestions;
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
            Genius - Trouvez vos partenaires naturels
          </DialogTitle>
          <DialogDescription className="text-base">
            Entrez votre activité pour découvrir 5 types d'entreprises qui recommandent naturellement vos services à leurs clients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity" className="text-sm font-medium">
              Votre activité
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
                    Pourquoi c'est puissant ?
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Ces entreprises ont déjà la confiance de vos futurs clients
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Link2 className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-pink-900 dark:text-pink-100">Comment ça marche ?</p>
                  <p className="text-sm text-pink-700 dark:text-pink-300">On identifie qui partage votre clientèle sans vous concurrencer</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">💡 Exemple concret</p>
              <p className="text-sm text-muted-foreground mb-2">Vous êtes <strong>Orthophoniste</strong> ? Vous serez recommandé par :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Pédiatres → prescrivent vos services aux enfants</li>
                <li>✓ Psychologues → orientent vers vous pour troubles du langage</li>
                <li>✓ Neurologues → recommandent en cas de troubles neurologiques</li>
                <li>✓ Audiologistes → partenaires naturels pour problèmes auditifs</li>
                <li className="text-destructive">✗ Évité : Comptables, Avocats (aucun lien avec vos clients)</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">🎯 Technologie intelligente</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Algorithme basé sur 40+ écosystèmes métiers analysés pour maximiser la pertinence de chaque suggestion
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
