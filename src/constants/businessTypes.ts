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
  { id: 'notary', label: 'Notaire', googlePlaceType: 'notary_public' },
  { id: 'architect', label: 'Architecte', googlePlaceType: 'architect' },
  { id: 'real_estate_agency', label: 'Agence immobilière', googlePlaceType: 'real_estate_agency' },
  { id: 'insurance_agency', label: 'Agence d\'assurance', googlePlaceType: 'insurance_agency' },
  { id: 'travel_agency', label: 'Agence de voyage', googlePlaceType: 'travel_agency' },
  { id: 'advertising_agency', label: 'Agence de publicité', googlePlaceType: 'store' },
  { id: 'architect_interior', label: 'Architecte d\'intérieur', googlePlaceType: 'store' },
  { id: 'surveyor', label: 'Géomètre expert', googlePlaceType: 'store' },
  { id: 'bailiff', label: 'Huissier', googlePlaceType: 'lawyer' },
  { id: 'accountant_expert', label: 'Expert-comptable', googlePlaceType: 'accounting' },
  
  // Artisans du bâtiment
  { id: 'plumber', label: 'Plombier', googlePlaceType: 'plumber' },
  { id: 'electrician', label: 'Électricien', googlePlaceType: 'electrician' },
  { id: 'painter', label: 'Peintre', googlePlaceType: 'painter' },
  { id: 'roofing_contractor', label: 'Couvreur', googlePlaceType: 'roofing_contractor' },
  { id: 'general_contractor', label: 'Entrepreneur général', googlePlaceType: 'general_contractor' },
  { id: 'carpenter', label: 'Menuisier / Charpentier', googlePlaceType: 'carpenter' },
  { id: 'locksmith', label: 'Serrurier', googlePlaceType: 'locksmith' },
  { id: 'glazier', label: 'Vitrier', googlePlaceType: 'store' },
  { id: 'mason', label: 'Maçon', googlePlaceType: 'general_contractor' },
  { id: 'tiler', label: 'Carreleur', googlePlaceType: 'general_contractor' },
  { id: 'landscaper', label: 'Entrepreneur paysagiste', googlePlaceType: 'store' },
  { id: 'heating_contractor', label: 'Chauffagiste', googlePlaceType: 'plumber' },
  { id: 'chimney_sweep', label: 'Société de ramonage', googlePlaceType: 'store' },
  
  // Automobile
  { id: 'car_repair', label: 'Garage de réparation automobile', googlePlaceType: 'car_repair' },
  { id: 'car_dealer', label: 'Concessionnaire auto', googlePlaceType: 'car_dealer' },
  { id: 'car_rental', label: 'Agence de location de voitures', googlePlaceType: 'car_rental' },
  { id: 'auto_body_shop', label: 'Carrosserie et peinture automobile', googlePlaceType: 'car_repair' },
  { id: 'tire_shop', label: 'Magasin de pneus', googlePlaceType: 'car_repair' },
  { id: 'motorcycle_dealer', label: 'Concessionnaire et distributeur de motos', googlePlaceType: 'car_dealer' },
  { id: 'motorcycle_repair', label: 'Garage de réparation pour motos', googlePlaceType: 'car_repair' },
  { id: 'scooter_rental', label: 'Service de location de scooter', googlePlaceType: 'car_rental' },
  
  // Salons et bien-être
  { id: 'hair_care', label: 'Salon de coiffure', googlePlaceType: 'hair_care' },
  { id: 'beauty_salon', label: 'Institut de beauté', googlePlaceType: 'beauty_salon' },
  { id: 'spa', label: 'Spa', googlePlaceType: 'spa' },
  { id: 'barber', label: 'Barbier', googlePlaceType: 'hair_care' },
  { id: 'nail_salon', label: 'Salon de manucure', googlePlaceType: 'beauty_salon' },
  { id: 'massage', label: 'Institut de massages', googlePlaceType: 'spa' },
  { id: 'tattoo_shop', label: 'Studio de tatouage', googlePlaceType: 'store' },
  { id: 'piercing_studio', label: 'Studio de piercing', googlePlaceType: 'store' },
  { id: 'tanning_salon', label: 'Institut de bronzage', googlePlaceType: 'beauty_salon' },
  { id: 'hammam', label: 'Hammam', googlePlaceType: 'spa' },
  { id: 'sauna', label: 'Sauna', googlePlaceType: 'spa' },
  
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
  { id: 'antique_store', label: 'Magasin d\'antiquités', googlePlaceType: 'store' },
  { id: 'pet_store', label: 'Animalerie', googlePlaceType: 'pet_store' },
  { id: 'toy_store', label: 'Magasin de jeux et jouets', googlePlaceType: 'store' },
  { id: 'music_store', label: 'Magasin d\'instruments de musique', googlePlaceType: 'store' },
  { id: 'sporting_goods', label: 'Magasin d\'articles de sports', googlePlaceType: 'store' },
  { id: 'home_goods_store', label: 'Magasin de meubles et d\'accessoires pour la maison', googlePlaceType: 'home_goods_store' },
  { id: 'liquor_store', label: 'Caviste', googlePlaceType: 'liquor_store' },
  
  // Services professionnels spécialisés
  { id: 'veterinary_care', label: 'Vétérinaire', googlePlaceType: 'veterinary_care' },
  { id: 'moving_company', label: 'Entreprise de déménagement', googlePlaceType: 'moving_company' },
  { id: 'storage', label: 'Garde-meuble', googlePlaceType: 'storage' },
  { id: 'funeral_home', label: 'Entreprise de pompes funèbres', googlePlaceType: 'funeral_home' },
  { id: 'photographer', label: 'Photographe', googlePlaceType: 'store' },
  
  // Éducation commerciale
  { id: 'driving_school', label: 'Auto-école', googlePlaceType: 'driving_school' },
  { id: 'language_school', label: 'École de langues', googlePlaceType: 'school' },
  { id: 'music_school', label: 'École de musique', googlePlaceType: 'school' },
  { id: 'dance_school', label: 'École de danse', googlePlaceType: 'school' },
  { id: 'art_school', label: 'École d\'arts', googlePlaceType: 'school' },
  { id: 'cooking_school', label: 'Cours de cuisine', googlePlaceType: 'school' },
  
  // Sports et loisirs commerciaux
  { id: 'gym', label: 'Salle de sport', googlePlaceType: 'gym' },
  { id: 'golf_course', label: 'Terrain de golf', googlePlaceType: 'golf_course' },
  { id: 'bowling_alley', label: 'Bowling', googlePlaceType: 'bowling_alley' },
  { id: 'yoga_studio', label: 'Centre de yoga', googlePlaceType: 'gym' },
  { id: 'martial_arts_dojo', label: 'Club d\'arts martiaux', googlePlaceType: 'gym' },
  { id: 'climbing_wall', label: 'Mur d\'escalade', googlePlaceType: 'gym' },
  { id: 'equestrian_center', label: 'Centre équestre', googlePlaceType: 'point_of_interest' },
  { id: 'karting_track', label: 'Circuit de karting', googlePlaceType: 'amusement_park' },
  { id: 'paintball', label: 'Terrain de paintball', googlePlaceType: 'amusement_park' },
  { id: 'laser_tag', label: 'Terrain de laser game', googlePlaceType: 'amusement_park' },
  { id: 'trampoline_park', label: 'Parc d\'accrobranche', googlePlaceType: 'amusement_park' },
  
  // Logement commercial
  { id: 'lodging', label: 'Hôtel', googlePlaceType: 'lodging' },
  { id: 'bed_breakfast', label: 'Chambre d\'hôtes', googlePlaceType: 'lodging' },
  { id: 'hostel', label: 'Auberge de jeunesse', googlePlaceType: 'lodging' },
  { id: 'campground', label: 'Terrain de camping', googlePlaceType: 'campground' },
  { id: 'rv_park', label: 'Camping avec emplacement pour caravane', googlePlaceType: 'rv_park' },
  
  // Loisirs et culture commerciaux
  { id: 'movie_theater', label: 'Salle de cinéma', googlePlaceType: 'movie_theater' },
  { id: 'casino', label: 'Casino', googlePlaceType: 'casino' },
  { id: 'amusement_park', label: 'Parc d\'attractions', googlePlaceType: 'amusement_park' },
  { id: 'aquarium', label: 'Aquarium', googlePlaceType: 'aquarium' },
  { id: 'zoo', label: 'Zoo', googlePlaceType: 'zoo' },
  { id: 'theater', label: 'Théâtre', googlePlaceType: 'point_of_interest' },
  { id: 'opera_house', label: 'Opéra', googlePlaceType: 'point_of_interest' },
  { id: 'concert_hall', label: 'Salle de concert', googlePlaceType: 'night_club' },
  { id: 'circus', label: 'Cirque', googlePlaceType: 'point_of_interest' },
];

export const ALL_TYPES_OPTION = {
  id: 'all',
  label: 'Tout type d\'activités',
  googlePlaceType: 'all'
};
