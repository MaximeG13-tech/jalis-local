// Mapping des catégories Google My Business vers les types Google Places API
export interface BusinessType {
  id: string;
  label: string;
  googlePlaceType: string;
}

export const BUSINESS_TYPES: BusinessType[] = [
  // Services professionnels
  { id: 'accounting', label: 'Comptable', googlePlaceType: 'accounting' },
  { id: 'lawyer', label: 'Avocat', googlePlaceType: 'lawyer' },
  { id: 'notary', label: 'Notaire', googlePlaceType: 'lawyer' }, // notary n'existe pas, on utilise lawyer
  { id: 'real_estate_agency', label: 'Agence immobilière', googlePlaceType: 'real_estate_agency' },
  { id: 'insurance_agency', label: 'Agence d\'assurance', googlePlaceType: 'insurance_agency' },
  { id: 'travel_agency', label: 'Agence de voyage', googlePlaceType: 'travel_agency' },
  
  // Artisans du bâtiment
  { id: 'plumber', label: 'Plombier', googlePlaceType: 'plumber' },
  { id: 'electrician', label: 'Électricien', googlePlaceType: 'electrician' },
  { id: 'painter', label: 'Peintre', googlePlaceType: 'painter' },
  { id: 'roofing_contractor', label: 'Couvreur', googlePlaceType: 'roofing_contractor' },
  { id: 'locksmith', label: 'Serrurier', googlePlaceType: 'locksmith' },
  
  // Automobile
  { id: 'car_repair', label: 'Garage de réparation automobile', googlePlaceType: 'car_repair' },
  { id: 'car_dealer', label: 'Concessionnaire auto', googlePlaceType: 'car_dealer' },
  { id: 'car_rental', label: 'Agence de location de voitures', googlePlaceType: 'car_rental' },
  { id: 'car_wash', label: 'Station de lavage automobile', googlePlaceType: 'car_wash' },
  
  // Salons et bien-être
  { id: 'hair_care', label: 'Salon de coiffure', googlePlaceType: 'hair_care' },
  { id: 'beauty_salon', label: 'Institut de beauté', googlePlaceType: 'beauty_salon' },
  { id: 'spa', label: 'Spa', googlePlaceType: 'spa' },
  
  // Commerce de détail
  { id: 'clothing_store', label: 'Magasin de vêtements', googlePlaceType: 'clothing_store' },
  { id: 'shoe_store', label: 'Magasin de chaussures', googlePlaceType: 'shoe_store' },
  { id: 'jewelry_store', label: 'Bijouterie', googlePlaceType: 'jewelry_store' },
  { id: 'furniture_store', label: 'Magasin de meubles', googlePlaceType: 'furniture_store' },
  { id: 'electronics_store', label: 'Magasin d\'électronique', googlePlaceType: 'electronics_store' },
  { id: 'hardware_store', label: 'Quincaillerie', googlePlaceType: 'hardware_store' },
  { id: 'bicycle_store', label: 'Magasin de vélos', googlePlaceType: 'bicycle_store' },
  { id: 'florist', label: 'Fleuriste', googlePlaceType: 'florist' },
  { id: 'book_store', label: 'Librairie', googlePlaceType: 'book_store' },
  { id: 'pet_store', label: 'Animalerie', googlePlaceType: 'pet_store' },
  { id: 'home_goods_store', label: 'Magasin de meubles et accessoires', googlePlaceType: 'home_goods_store' },
  { id: 'liquor_store', label: 'Caviste', googlePlaceType: 'liquor_store' },
  
  // Services professionnels spécialisés
  { id: 'veterinary_care', label: 'Vétérinaire', googlePlaceType: 'veterinary_care' },
  { id: 'moving_company', label: 'Entreprise de déménagement', googlePlaceType: 'moving_company' },
  { id: 'storage', label: 'Garde-meuble', googlePlaceType: 'storage' },
  { id: 'funeral_home', label: 'Entreprise de pompes funèbres', googlePlaceType: 'funeral_home' },
  { id: 'laundry', label: 'Pressing / Blanchisserie', googlePlaceType: 'laundry' },
  
  // Santé
  { id: 'dentist', label: 'Dentiste', googlePlaceType: 'dentist' },
  { id: 'doctor', label: 'Médecin', googlePlaceType: 'doctor' },
  { id: 'physiotherapist', label: 'Kinésithérapeute', googlePlaceType: 'physiotherapist' },
  
  // Éducation commerciale
  { id: 'driving_school', label: 'Auto-école', googlePlaceType: 'store' }, // driving_school n'existe pas
  { id: 'school', label: 'École privée', googlePlaceType: 'school' },
  
  // Sports et loisirs commerciaux
  { id: 'gym', label: 'Salle de sport', googlePlaceType: 'gym' },
  { id: 'bowling_alley', label: 'Bowling', googlePlaceType: 'bowling_alley' },
  
  // Logement commercial
  { id: 'lodging', label: 'Hôtel', googlePlaceType: 'lodging' },
  { id: 'campground', label: 'Terrain de camping', googlePlaceType: 'campground' },
  { id: 'rv_park', label: 'Camping avec caravane', googlePlaceType: 'rv_park' },
  
  // Loisirs et culture commerciaux
  { id: 'movie_theater', label: 'Salle de cinéma', googlePlaceType: 'movie_theater' },
  { id: 'casino', label: 'Casino', googlePlaceType: 'casino' },
  { id: 'amusement_park', label: 'Parc d\'attractions', googlePlaceType: 'amusement_park' },
  { id: 'aquarium', label: 'Aquarium', googlePlaceType: 'aquarium' },
  { id: 'zoo', label: 'Zoo', googlePlaceType: 'zoo' },
  { id: 'night_club', label: 'Boîte de nuit', googlePlaceType: 'night_club' },
];

export const ALL_TYPES_OPTION = {
  id: 'all',
  label: 'Tout type d\'activités',
  googlePlaceType: 'all'
};
