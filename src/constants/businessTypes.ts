// Mapping des catégories Google My Business vers les types Google Places API
export interface BusinessType {
  id: string;
  label: string;
  googlePlaceType: string;
}

export const BUSINESS_TYPES: BusinessType[] = [
  // Services juridiques et professionnels
  { id: 'accounting', label: 'Comptable', googlePlaceType: 'accounting' },
  { id: 'lawyer', label: 'Avocat', googlePlaceType: 'lawyer' },
  { id: 'consultant', label: 'Consultant', googlePlaceType: 'consultant' },
  
  // Immobilier et assurance
  { id: 'real_estate_agency', label: 'Agence immobilière', googlePlaceType: 'real_estate_agency' },
  { id: 'insurance_agency', label: 'Agence d\'assurance', googlePlaceType: 'insurance_agency' },
  
  // Voyages
  { id: 'travel_agency', label: 'Agence de voyage', googlePlaceType: 'travel_agency' },
  { id: 'tour_agency', label: 'Agence de tours', googlePlaceType: 'tour_agency' },
  
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
  { id: 'auto_parts_store', label: 'Magasin de pièces auto', googlePlaceType: 'auto_parts_store' },
  
  // Santé
  { id: 'dentist', label: 'Dentiste', googlePlaceType: 'dentist' },
  { id: 'dental_clinic', label: 'Clinique dentaire', googlePlaceType: 'dental_clinic' },
  { id: 'doctor', label: 'Médecin', googlePlaceType: 'doctor' },
  { id: 'physiotherapist', label: 'Kinésithérapeute', googlePlaceType: 'physiotherapist' },
  { id: 'chiropractor', label: 'Chiropracteur', googlePlaceType: 'chiropractor' },
  { id: 'medical_lab', label: 'Laboratoire médical', googlePlaceType: 'medical_lab' },
  
  // Bien-être et beauté
  { id: 'hair_salon', label: 'Salon de coiffure', googlePlaceType: 'hair_salon' },
  { id: 'hair_care', label: 'Coiffeur', googlePlaceType: 'hair_care' },
  { id: 'barber_shop', label: 'Barbier', googlePlaceType: 'barber_shop' },
  { id: 'beauty_salon', label: 'Institut de beauté', googlePlaceType: 'beauty_salon' },
  { id: 'beautician', label: 'Esthéticien(ne)', googlePlaceType: 'beautician' },
  { id: 'nail_salon', label: 'Salon de manucure', googlePlaceType: 'nail_salon' },
  { id: 'spa', label: 'Spa', googlePlaceType: 'spa' },
  { id: 'massage', label: 'Salon de massage', googlePlaceType: 'massage' },
  { id: 'sauna', label: 'Sauna', googlePlaceType: 'sauna' },
  { id: 'tanning_studio', label: 'Institut de bronzage', googlePlaceType: 'tanning_studio' },
  { id: 'skin_care_clinic', label: 'Clinique de soins de la peau', googlePlaceType: 'skin_care_clinic' },
  { id: 'makeup_artist', label: 'Maquilleur/Maquilleuse', googlePlaceType: 'makeup_artist' },
  { id: 'body_art_service', label: 'Tatoueur / Piercing', googlePlaceType: 'body_art_service' },
  
  // Commerce de détail - Mode
  { id: 'clothing_store', label: 'Magasin de vêtements', googlePlaceType: 'clothing_store' },
  { id: 'shoe_store', label: 'Magasin de chaussures', googlePlaceType: 'shoe_store' },
  { id: 'jewelry_store', label: 'Bijouterie', googlePlaceType: 'jewelry_store' },
  
  // Commerce de détail - Maison
  { id: 'furniture_store', label: 'Magasin de meubles', googlePlaceType: 'furniture_store' },
  { id: 'home_goods_store', label: 'Magasin d\'articles pour la maison', googlePlaceType: 'home_goods_store' },
  { id: 'home_improvement_store', label: 'Magasin de bricolage', googlePlaceType: 'home_improvement_store' },
  { id: 'hardware_store', label: 'Quincaillerie', googlePlaceType: 'hardware_store' },
  { id: 'electronics_store', label: 'Magasin d\'électronique', googlePlaceType: 'electronics_store' },
  { id: 'lighting_store', label: 'Magasin d\'éclairage', googlePlaceType: 'lighting_store' },
  
  // Commerce de détail - Loisirs
  { id: 'bicycle_store', label: 'Magasin de vélos', googlePlaceType: 'bicycle_store' },
  { id: 'sporting_goods_store', label: 'Magasin d\'articles de sport', googlePlaceType: 'sporting_goods_store' },
  { id: 'book_store', label: 'Librairie', googlePlaceType: 'book_store' },
  { id: 'gift_shop', label: 'Boutique de cadeaux', googlePlaceType: 'gift_shop' },
  { id: 'toy_store', label: 'Magasin de jouets', googlePlaceType: 'toy_store' },
  
  // Commerce de détail - Animaux et nature
  { id: 'pet_store', label: 'Animalerie', googlePlaceType: 'pet_store' },
  { id: 'florist', label: 'Fleuriste', googlePlaceType: 'florist' },
  { id: 'garden_center', label: 'Jardinerie', googlePlaceType: 'garden_center' },
  
  // Commerce de détail - Alimentaire
  { id: 'liquor_store', label: 'Caviste', googlePlaceType: 'liquor_store' },
  { id: 'butcher_shop', label: 'Boucherie', googlePlaceType: 'butcher_shop' },
  
  // Services professionnels spécialisés
  { id: 'veterinary_care', label: 'Vétérinaire', googlePlaceType: 'veterinary_care' },
  { id: 'moving_company', label: 'Entreprise de déménagement', googlePlaceType: 'moving_company' },
  { id: 'storage', label: 'Garde-meuble', googlePlaceType: 'storage' },
  { id: 'funeral_home', label: 'Entreprise de pompes funèbres', googlePlaceType: 'funeral_home' },
  { id: 'laundry', label: 'Pressing / Blanchisserie', googlePlaceType: 'laundry' },
  { id: 'tailor', label: 'Tailleur / Couturier', googlePlaceType: 'tailor' },
  { id: 'courier_service', label: 'Service de coursier', googlePlaceType: 'courier_service' },
  { id: 'catering_service', label: 'Service de traiteur', googlePlaceType: 'catering_service' },
  { id: 'telecommunications_service_provider', label: 'Fournisseur de télécommunications', googlePlaceType: 'telecommunications_service_provider' },
  { id: 'child_care_agency', label: 'Garderie / Crèche', googlePlaceType: 'child_care_agency' },
  
  // Éducation
  { id: 'driving_school', label: 'Auto-école', googlePlaceType: 'driving_school' },
  { id: 'preschool', label: 'École maternelle privée', googlePlaceType: 'preschool' },
  { id: 'primary_school', label: 'École primaire privée', googlePlaceType: 'primary_school' },
  { id: 'secondary_school', label: 'Collège / Lycée privé', googlePlaceType: 'secondary_school' },
  { id: 'tutoring', label: 'Cours particuliers', googlePlaceType: 'tutoring' },
  
  // Sports et fitness
  { id: 'gym', label: 'Salle de sport', googlePlaceType: 'gym' },
  { id: 'fitness_center', label: 'Centre de fitness', googlePlaceType: 'fitness_center' },
  { id: 'yoga_studio', label: 'Studio de yoga', googlePlaceType: 'yoga_studio' },
  { id: 'sports_club', label: 'Club de sport', googlePlaceType: 'sports_club' },
  { id: 'sports_coaching', label: 'Coach sportif', googlePlaceType: 'sports_coaching' },
  { id: 'martial_arts_dojo', label: 'Dojo d\'arts martiaux', googlePlaceType: 'martial_arts_dojo' },
  { id: 'dance_studio', label: 'École de danse', googlePlaceType: 'dance_studio' },
  { id: 'golf_course', label: 'Terrain de golf', googlePlaceType: 'golf_course' },
  { id: 'ice_skating_rink', label: 'Patinoire', googlePlaceType: 'ice_skating_rink' },
  { id: 'bowling_alley', label: 'Bowling', googlePlaceType: 'bowling_alley' },
  
  // Hébergement
  { id: 'hotel', label: 'Hôtel', googlePlaceType: 'hotel' },
  { id: 'bed_and_breakfast', label: 'Chambre d\'hôtes', googlePlaceType: 'bed_and_breakfast' },
  { id: 'guest_house', label: 'Maison d\'hôtes', googlePlaceType: 'guest_house' },
  { id: 'hostel', label: 'Auberge de jeunesse', googlePlaceType: 'hostel' },
  { id: 'campground', label: 'Terrain de camping', googlePlaceType: 'campground' },
  { id: 'rv_park', label: 'Camping avec caravane', googlePlaceType: 'rv_park' },
  { id: 'resort_hotel', label: 'Hôtel resort', googlePlaceType: 'resort_hotel' },
  
  // Loisirs et divertissement
  { id: 'movie_theater', label: 'Cinéma', googlePlaceType: 'movie_theater' },
  { id: 'casino', label: 'Casino', googlePlaceType: 'casino' },
  { id: 'amusement_park', label: 'Parc d\'attractions', googlePlaceType: 'amusement_park' },
  { id: 'amusement_center', label: 'Centre de loisirs', googlePlaceType: 'amusement_center' },
  { id: 'aquarium', label: 'Aquarium', googlePlaceType: 'aquarium' },
  { id: 'zoo', label: 'Zoo', googlePlaceType: 'zoo' },
  { id: 'night_club', label: 'Boîte de nuit', googlePlaceType: 'night_club' },
  { id: 'karaoke', label: 'Karaoké', googlePlaceType: 'karaoke' },
  { id: 'video_arcade', label: 'Salle d\'arcade', googlePlaceType: 'video_arcade' },
  { id: 'event_venue', label: 'Lieu événementiel', googlePlaceType: 'event_venue' },
  { id: 'banquet_hall', label: 'Salle de réception', googlePlaceType: 'banquet_hall' },
  { id: 'wedding_venue', label: 'Lieu de mariage', googlePlaceType: 'wedding_venue' },
  { id: 'museum', label: 'Musée', googlePlaceType: 'museum' },
  { id: 'art_gallery', label: 'Galerie d\'art', googlePlaceType: 'art_gallery' },
  { id: 'performing_arts_theater', label: 'Théâtre', googlePlaceType: 'performing_arts_theater' },
  
  // Services ésotériques
  { id: 'astrologer', label: 'Astrologue', googlePlaceType: 'astrologer' },
  { id: 'psychic', label: 'Voyant(e)', googlePlaceType: 'psychic' },
];

export const ALL_TYPES_OPTION = {
  id: 'all',
  label: 'Tout type d\'activités',
  googlePlaceType: 'all'
};
