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
  { id: 'car_rental', label: 'Agence de location de voitures', googlePlaceType: 'car_rental' },
  
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
  { id: 'convenience_store', label: 'Supérette', googlePlaceType: 'convenience_store' },
  { id: 'supermarket', label: 'Supermarché et hypermarché', googlePlaceType: 'supermarket' },
  { id: 'department_store', label: 'Grand magasin', googlePlaceType: 'department_store' },
  
  // Santé
  { id: 'dentist', label: 'Dentiste', googlePlaceType: 'dentist' },
  { id: 'doctor', label: 'Médecin', googlePlaceType: 'doctor' },
  { id: 'hospital', label: 'Hôpital', googlePlaceType: 'hospital' },
  { id: 'pharmacy', label: 'Pharmacie', googlePlaceType: 'pharmacy' },
  { id: 'physiotherapist', label: 'Kinésithérapeute', googlePlaceType: 'physiotherapist' },
  { id: 'veterinary_care', label: 'Vétérinaire', googlePlaceType: 'veterinary_care' },
  
  // Restauration
  { id: 'restaurant', label: 'Restaurant', googlePlaceType: 'restaurant' },
  { id: 'cafe', label: 'Café', googlePlaceType: 'cafe' },
  { id: 'bakery', label: 'Boulangerie', googlePlaceType: 'bakery' },
  { id: 'bar', label: 'Bar', googlePlaceType: 'bar' },
  { id: 'meal_takeaway', label: 'Restauration rapide', googlePlaceType: 'meal_takeaway' },
  
  // Services
  { id: 'laundry', label: 'Pressing / Blanchisserie', googlePlaceType: 'laundry' },
  { id: 'moving_company', label: 'Déménageur', googlePlaceType: 'moving_company' },
  { id: 'storage', label: 'Garde-meuble', googlePlaceType: 'storage' },
  { id: 'pet_store', label: 'Animalerie', googlePlaceType: 'pet_store' },
  { id: 'gym', label: 'Salle de sport', googlePlaceType: 'gym' },
  { id: 'lodging', label: 'Hébergement', googlePlaceType: 'lodging' },
  { id: 'bank', label: 'Banque', googlePlaceType: 'bank' },
  { id: 'atm', label: 'Distributeur automatique de billets', googlePlaceType: 'atm' },
  { id: 'post_office', label: 'Bureau de poste', googlePlaceType: 'post_office' },
  { id: 'police', label: 'Commissariat de police', googlePlaceType: 'police' },
  { id: 'fire_station', label: 'Caserne de sapeurs-pompiers', googlePlaceType: 'fire_station' },
  { id: 'church', label: 'Église', googlePlaceType: 'church' },
  { id: 'mosque', label: 'Mosquée', googlePlaceType: 'mosque' },
  { id: 'synagogue', label: 'Synagogue', googlePlaceType: 'synagogue' },
  { id: 'city_hall', label: 'Hôtel de Ville', googlePlaceType: 'city_hall' },
  { id: 'courthouse', label: 'Tribunal', googlePlaceType: 'courthouse' },
  { id: 'library', label: 'Bibliothèque municipale', googlePlaceType: 'library' },
  { id: 'school', label: 'École', googlePlaceType: 'school' },
  { id: 'university', label: 'Université', googlePlaceType: 'university' },
  { id: 'stadium', label: 'Stade', googlePlaceType: 'stadium' },
  { id: 'museum', label: 'Musée', googlePlaceType: 'museum' },
  { id: 'art_gallery', label: 'Galerie d\'art', googlePlaceType: 'art_gallery' },
  { id: 'movie_theater', label: 'Salle de cinéma', googlePlaceType: 'movie_theater' },
  { id: 'night_club', label: 'Boîte de nuit', googlePlaceType: 'night_club' },
  { id: 'casino', label: 'Casino', googlePlaceType: 'casino' },
  { id: 'bowling_alley', label: 'Bowling', googlePlaceType: 'bowling_alley' },
  { id: 'amusement_park', label: 'Parc d\'attractions', googlePlaceType: 'amusement_park' },
  { id: 'aquarium', label: 'Aquarium', googlePlaceType: 'aquarium' },
  { id: 'zoo', label: 'Zoo', googlePlaceType: 'zoo' },
  { id: 'park', label: 'Parc', googlePlaceType: 'park' },
  { id: 'campground', label: 'Terrain de camping', googlePlaceType: 'campground' },
  { id: 'rv_park', label: 'Camping avec emplacement pour caravane et camping-car', googlePlaceType: 'rv_park' },
  { id: 'taxi_stand', label: 'Borne de Taxi', googlePlaceType: 'taxi_stand' },
  { id: 'transit_station', label: 'Gare SNCF', googlePlaceType: 'transit_station' },
  { id: 'subway_station', label: 'Station de métro', googlePlaceType: 'subway_station' },
  { id: 'train_station', label: 'Gare ferroviaire', googlePlaceType: 'train_station' },
  { id: 'bus_station', label: 'Gare routière', googlePlaceType: 'bus_station' },
  { id: 'airport', label: 'Aéroport', googlePlaceType: 'airport' },
  { id: 'parking', label: 'Parking', googlePlaceType: 'parking' },
  { id: 'gas_station', label: 'Station service', googlePlaceType: 'gas_station' },
  { id: 'car_wash', label: 'Station de lavage automobile', googlePlaceType: 'car_wash' },
  
  // Loisirs et Culture
  { id: 'tourist_attraction', label: 'Site touristique', googlePlaceType: 'tourist_attraction' },
  { id: 'casino', label: 'Casino', googlePlaceType: 'casino' },
  { id: 'shopping_mall', label: 'Centre commercial', googlePlaceType: 'shopping_mall' },
  { id: 'cemetery', label: 'Cimetière', googlePlaceType: 'cemetery' },
  
  // Spécialités Restaurants
  { id: 'chinese_restaurant', label: 'Restaurant chinois', googlePlaceType: 'chinese_restaurant' },
  { id: 'japanese_restaurant', label: 'Restaurant japonais', googlePlaceType: 'japanese_restaurant' },
  { id: 'italian_restaurant', label: 'Restaurant italien', googlePlaceType: 'italian_restaurant' },
  { id: 'french_restaurant', label: 'Restaurant français', googlePlaceType: 'french_restaurant' },
  { id: 'mexican_restaurant', label: 'Restaurant mexicain', googlePlaceType: 'mexican_restaurant' },
  { id: 'indian_restaurant', label: 'Restaurant indien', googlePlaceType: 'indian_restaurant' },
  { id: 'thai_restaurant', label: 'Restaurant thaïlandais', googlePlaceType: 'thai_restaurant' },
  { id: 'vietnamese_restaurant', label: 'Restaurant vietnamien', googlePlaceType: 'vietnamese_restaurant' },
  { id: 'korean_restaurant', label: 'Restaurant coréen', googlePlaceType: 'korean_restaurant' },
  { id: 'spanish_restaurant', label: 'Restaurant espagnol', googlePlaceType: 'spanish_restaurant' },
  
  // Santé spécialisée
  { id: 'cardiologist', label: 'Cardiologue', googlePlaceType: 'doctor' },
  { id: 'dermatologist', label: 'Dermatologue', googlePlaceType: 'doctor' },
  { id: 'ophthalmologist', label: 'Ophtalmologiste', googlePlaceType: 'doctor' },
  { id: 'pediatrician', label: 'Pédiatre', googlePlaceType: 'doctor' },
  { id: 'psychiatrist', label: 'Psychiatre', googlePlaceType: 'doctor' },
  { id: 'psychologist', label: 'Psychologue', googlePlaceType: 'psychologist' },
  { id: 'nutritionist', label: 'Nutritionniste', googlePlaceType: 'doctor' },
  { id: 'osteopath', label: 'Ostéopathe', googlePlaceType: 'physiotherapist' },
  { id: 'chiropractor', label: 'Chiropracteur', googlePlaceType: 'physiotherapist' },
  
  // Commerce alimentaire
  { id: 'butcher_shop', label: 'Boucherie', googlePlaceType: 'store' },
  { id: 'cheese_shop', label: 'Fromagerie-crèmerie', googlePlaceType: 'store' },
  { id: 'fish_market', label: 'Poissonnerie', googlePlaceType: 'store' },
  { id: 'fruit_vegetable', label: 'Maraîcher', googlePlaceType: 'store' },
  { id: 'pastry_shop', label: 'Pâtisserie', googlePlaceType: 'bakery' },
  { id: 'ice_cream_shop', label: 'Glacier', googlePlaceType: 'store' },
  
  // Sports et loisirs
  { id: 'golf_course', label: 'Terrain de golf', googlePlaceType: 'golf_course' },
  { id: 'tennis_court', label: 'Court de tennis', googlePlaceType: 'stadium' },
  { id: 'swimming_pool', label: 'Piscine municipale', googlePlaceType: 'gym' },
  { id: 'yoga_studio', label: 'Centre de yoga', googlePlaceType: 'gym' },
  { id: 'martial_arts', label: 'Club d\'arts martiaux', googlePlaceType: 'gym' },
  { id: 'dance_school', label: 'École de danse', googlePlaceType: 'school' },
  { id: 'music_school', label: 'École de musique', googlePlaceType: 'school' },
  
  // Services spécialisés
  { id: 'tattoo_shop', label: 'Studio de tatouage', googlePlaceType: 'store' },
  { id: 'barber_shop', label: 'Barbier', googlePlaceType: 'hair_care' },
  { id: 'nail_salon', label: 'Salon de manucure', googlePlaceType: 'beauty_salon' },
  { id: 'massage_spa', label: 'Institut de massages', googlePlaceType: 'spa' },
  { id: 'tanning_salon', label: 'Institut de bronzage', googlePlaceType: 'beauty_salon' },
  
  // Éducation
  { id: 'primary_school', label: 'École primaire', googlePlaceType: 'primary_school' },
  { id: 'secondary_school', label: 'Collège', googlePlaceType: 'secondary_school' },
  { id: 'high_school', label: 'Lycée', googlePlaceType: 'secondary_school' },
  { id: 'driving_school', label: 'Auto-école', googlePlaceType: 'driving_school' },
  { id: 'language_school', label: 'École de langues', googlePlaceType: 'school' },
  
  // Logement
  { id: 'hotel', label: 'Hôtel', googlePlaceType: 'lodging' },
  { id: 'bed_breakfast', label: 'Chambre d\'hôtes', googlePlaceType: 'lodging' },
  { id: 'hostel', label: 'Auberge de jeunesse', googlePlaceType: 'lodging' },
  { id: 'inn', label: 'Auberge', googlePlaceType: 'lodging' },
  
  // Autres services
  { id: 'funeral_home', label: 'Entreprise de pompes funèbres', googlePlaceType: 'funeral_home' },
  { id: 'veterinary_pharmacy', label: 'Pharmacie vétérinaire', googlePlaceType: 'veterinary_care' },
  { id: 'embassy', label: 'Ambassade', googlePlaceType: 'embassy' },
  { id: 'town_square', label: 'Place', googlePlaceType: 'point_of_interest' },
  { id: 'lighthouse', label: 'Phare', googlePlaceType: 'point_of_interest' },
  { id: 'tourist_info', label: 'Office de tourisme', googlePlaceType: 'travel_agency' },
  { id: 'convention_center', label: 'Palais des congrès', googlePlaceType: 'convention_center' },
];

export const ALL_TYPES_OPTION = {
  id: 'all',
  label: 'Tout type d\'activités',
  googlePlaceType: 'all'
};
