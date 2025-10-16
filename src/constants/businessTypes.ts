// Mapping des catégories Google My Business vers les types Google Places API
export interface BusinessType {
  id: string;
  label: string;
  googlePlaceType: string;
}

export const BUSINESS_TYPES: BusinessType[] = [
  // Artisans du bâtiment
  { id: 'plumber', label: 'Plombier', googlePlaceType: 'plumber' },
  { id: 'electrician', label: 'Électricien', googlePlaceType: 'electrician' },
  { id: 'painter', label: 'Peintre', googlePlaceType: 'painter' },
  { id: 'roofing_contractor', label: 'Couvreur', googlePlaceType: 'roofing_contractor' },
  { id: 'general_contractor', label: 'Entrepreneur général', googlePlaceType: 'general_contractor' },
  { id: 'carpenter', label: 'Menuisier / Charpentier', googlePlaceType: 'carpenter' },
  { id: 'locksmith', label: 'Serrurier', googlePlaceType: 'locksmith' },
  { id: 'glazier', label: 'Vitrier', googlePlaceType: 'glazier' },
  
  // Services professionnels
  { id: 'real_estate_agency', label: 'Agence immobilière', googlePlaceType: 'real_estate_agency' },
  { id: 'insurance_agency', label: 'Agence d\'assurance', googlePlaceType: 'insurance_agency' },
  { id: 'travel_agency', label: 'Agence de voyage', googlePlaceType: 'travel_agency' },
  { id: 'accounting', label: 'Cabinet comptable', googlePlaceType: 'accounting' },
  { id: 'lawyer', label: 'Avocat', googlePlaceType: 'lawyer' },
  { id: 'notary', label: 'Notaire', googlePlaceType: 'notary_public' },
  { id: 'architect', label: 'Architecte', googlePlaceType: 'architect' },
  
  // Automobile
  { id: 'car_repair', label: 'Garage / Réparation auto', googlePlaceType: 'car_repair' },
  { id: 'car_dealer', label: 'Concessionnaire auto', googlePlaceType: 'car_dealer' },
  { id: 'car_wash', label: 'Lavage auto', googlePlaceType: 'car_wash' },
  
  // Salons et bien-être
  { id: 'hair_care', label: 'Salon de coiffure', googlePlaceType: 'hair_care' },
  { id: 'beauty_salon', label: 'Salon de beauté', googlePlaceType: 'beauty_salon' },
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
  
  // Santé
  { id: 'dentist', label: 'Dentiste', googlePlaceType: 'dentist' },
  { id: 'doctor', label: 'Médecin', googlePlaceType: 'doctor' },
  { id: 'physiotherapist', label: 'Kinésithérapeute', googlePlaceType: 'physiotherapist' },
  { id: 'veterinary_care', label: 'Vétérinaire', googlePlaceType: 'veterinary_care' },
  
  // Restauration
  { id: 'restaurant', label: 'Restaurant', googlePlaceType: 'restaurant' },
  { id: 'cafe', label: 'Café', googlePlaceType: 'cafe' },
  { id: 'bakery', label: 'Boulangerie', googlePlaceType: 'bakery' },
  
  // Services
  { id: 'laundry', label: 'Pressing / Blanchisserie', googlePlaceType: 'laundry' },
  { id: 'moving_company', label: 'Déménageur', googlePlaceType: 'moving_company' },
  { id: 'storage', label: 'Garde-meuble', googlePlaceType: 'storage' },
  { id: 'pet_store', label: 'Animalerie', googlePlaceType: 'pet_store' },
  { id: 'gym', label: 'Salle de sport', googlePlaceType: 'gym' },
  { id: 'lodging', label: 'Hébergement', googlePlaceType: 'lodging' },
];

export const ALL_TYPES_OPTION = {
  id: 'all',
  label: 'Tout type d\'activités',
  googlePlaceType: 'all'
};
