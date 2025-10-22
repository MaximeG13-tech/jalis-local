// Mapping des catégories Google My Business vers des mots-clés de recherche
export interface BusinessType {
  id: string;
  label: string;
  googleSearchKeyword: string;
}

export const BUSINESS_TYPES: BusinessType[] = [
  // Santé et bien-être
  { id: 'physio', label: 'Kinésithérapeute', googleSearchKeyword: 'Kinésithérapeute' },
  { id: 'orthoptist', label: 'Orthoptiste', googleSearchKeyword: 'Orthoptiste' },
  { id: 'osteopath', label: 'Ostéopathe', googleSearchKeyword: 'Ostéopathe' },
  { id: 'sophrologist', label: 'Sophrologue', googleSearchKeyword: 'Sophrologue' },
  { id: 'chiropractor', label: 'Chiropracteur', googleSearchKeyword: 'Chiropracteur' },
  { id: 'podiatrist', label: 'Pédicure-Podologue', googleSearchKeyword: 'Pédicure-Podologue' },
  { id: 'speech_therapist', label: 'Orthophoniste', googleSearchKeyword: 'Orthophoniste' },
  { id: 'psychologist', label: 'Psychologue', googleSearchKeyword: 'Psychologue' },
  { id: 'naturopath', label: 'Naturopathe', googleSearchKeyword: 'Naturopathe' },
  { id: 'acupuncturist', label: 'Acupuncteur', googleSearchKeyword: 'Acupuncteur' },
  { id: 'dietitian', label: 'Diététicien', googleSearchKeyword: 'Diététicien' },
  { id: 'pharmacy', label: 'Pharmacie', googleSearchKeyword: 'Pharmacie' },
  { id: 'dentist', label: 'Dentiste', googleSearchKeyword: 'Dentiste' },
  { id: 'doctor', label: 'Médecin généraliste', googleSearchKeyword: 'Médecin généraliste' },
  { id: 'veterinarian', label: 'Vétérinaire', googleSearchKeyword: 'Vétérinaire' },
  { id: 'gym', label: 'Salle de sport', googleSearchKeyword: 'Salle de sport' },
  { id: 'yoga', label: 'Studio de yoga', googleSearchKeyword: 'Studio de yoga' },
  { id: 'spa', label: 'Spa', googleSearchKeyword: 'Spa' },
  { id: 'beauty_salon', label: 'Salon de beauté', googleSearchKeyword: 'Institut de beauté' },
  { id: 'hair_salon', label: 'Salon de coiffure', googleSearchKeyword: 'Salon de coiffure' },
  { id: 'massage', label: 'Salon de massage', googleSearchKeyword: 'Salon de massage' },
  
  // Restauration et alimentation
  { id: 'restaurant', label: 'Restaurant', googleSearchKeyword: 'Restaurant' },
  { id: 'cafe', label: 'Café', googleSearchKeyword: 'Café' },
  { id: 'bakery', label: 'Boulangerie', googleSearchKeyword: 'Boulangerie' },
  { id: 'pastry', label: 'Pâtisserie', googleSearchKeyword: 'Pâtisserie' },
  { id: 'butcher', label: 'Boucherie', googleSearchKeyword: 'Boucherie' },
  { id: 'cheese_shop', label: 'Fromagerie', googleSearchKeyword: 'Fromagerie' },
  { id: 'wine_shop', label: 'Caviste', googleSearchKeyword: 'Caviste' },
  { id: 'grocery', label: 'Épicerie fine', googleSearchKeyword: 'Épicerie fine' },
  { id: 'caterer', label: 'Traiteur', googleSearchKeyword: 'Traiteur' },
  { id: 'pizzeria', label: 'Pizzeria', googleSearchKeyword: 'Pizzeria' },
  { id: 'fast_food', label: 'Fast-food', googleSearchKeyword: 'Fast-food' },
  { id: 'ice_cream', label: 'Glacier', googleSearchKeyword: 'Glacier' },
  { id: 'tea_room', label: 'Salon de thé', googleSearchKeyword: 'Salon de thé' },
  
  // Commerce de détail
  { id: 'clothing_store', label: 'Magasin de vêtements', googleSearchKeyword: 'Boutique de vêtements' },
  { id: 'shoe_store', label: 'Magasin de chaussures', googleSearchKeyword: 'Magasin de chaussures' },
  { id: 'jewelry_store', label: 'Bijouterie', googleSearchKeyword: 'Bijouterie' },
  { id: 'florist', label: 'Fleuriste', googleSearchKeyword: 'Fleuriste' },
  { id: 'book_store', label: 'Librairie', googleSearchKeyword: 'Librairie' },
  { id: 'toy_store', label: 'Magasin de jouets', googleSearchKeyword: 'Magasin de jouets' },
  { id: 'electronics_store', label: 'Magasin d\'électronique', googleSearchKeyword: 'Magasin d\'électronique' },
  { id: 'furniture_store', label: 'Magasin de meubles', googleSearchKeyword: 'Magasin de meubles' },
  { id: 'home_decor', label: 'Décoration d\'intérieur', googleSearchKeyword: 'Magasin de décoration' },
  { id: 'pet_store', label: 'Animalerie', googleSearchKeyword: 'Animalerie' },
  { id: 'sports_store', label: 'Magasin de sport', googleSearchKeyword: 'Magasin de sport' },
  { id: 'bike_shop', label: 'Magasin de vélos', googleSearchKeyword: 'Magasin de vélos' },
  
  // Services professionnels
  { id: 'accountant', label: 'Expert-comptable', googleSearchKeyword: 'Expert-comptable' },
  { id: 'lawyer', label: 'Avocat', googleSearchKeyword: 'Cabinet d\'avocat' },
  { id: 'notary', label: 'Notaire', googleSearchKeyword: 'Office notarial' },
  { id: 'insurance', label: 'Assurance', googleSearchKeyword: 'Agence d\'assurance' },
  { id: 'real_estate', label: 'Agence immobilière', googleSearchKeyword: 'Agence immobilière' },
  { id: 'architect', label: 'Architecte', googleSearchKeyword: 'Cabinet d\'architecture' },
  { id: 'graphic_designer', label: 'Graphiste', googleSearchKeyword: 'Graphiste' },
  { id: 'photographer', label: 'Photographe', googleSearchKeyword: 'Photographe' },
  { id: 'translator', label: 'Traducteur', googleSearchKeyword: 'Traducteur' },
  
  // Services à la personne
  { id: 'dry_cleaning', label: 'Pressing', googleSearchKeyword: 'Pressing' },
  { id: 'laundry', label: 'Laverie', googleSearchKeyword: 'Laverie' },
  { id: 'locksmith', label: 'Serrurier', googleSearchKeyword: 'Serrurier' },
  { id: 'plumber', label: 'Plombier', googleSearchKeyword: 'Plombier' },
  { id: 'electrician', label: 'Électricien', googleSearchKeyword: 'Électricien' },
  { id: 'painter', label: 'Peintre en bâtiment', googleSearchKeyword: 'Peintre en bâtiment' },
  { id: 'carpenter', label: 'Menuisier', googleSearchKeyword: 'Menuisier' },
  { id: 'roofer', label: 'Couvreur', googleSearchKeyword: 'Couvreur' },
  { id: 'gardener', label: 'Jardinier paysagiste', googleSearchKeyword: 'Paysagiste' },
  { id: 'cleaning', label: 'Entreprise de nettoyage', googleSearchKeyword: 'Entreprise de nettoyage' },
  { id: 'moving', label: 'Déménageur', googleSearchKeyword: 'Déménageur' },
  
  // Automobile
  { id: 'car_repair', label: 'Garage automobile', googleSearchKeyword: 'Garage automobile' },
  { id: 'car_wash', label: 'Station de lavage', googleSearchKeyword: 'Station de lavage auto' },
  { id: 'car_dealer', label: 'Concessionnaire automobile', googleSearchKeyword: 'Concessionnaire automobile' },
  { id: 'car_rental', label: 'Location de voitures', googleSearchKeyword: 'Location de voitures' },
  { id: 'tire_shop', label: 'Centre de pneus', googleSearchKeyword: 'Centre de pneus' },
  
  // Éducation et formation
  { id: 'school', label: 'École privée', googleSearchKeyword: 'École privée' },
  { id: 'music_school', label: 'École de musique', googleSearchKeyword: 'École de musique' },
  { id: 'dance_school', label: 'École de danse', googleSearchKeyword: 'École de danse' },
  { id: 'language_school', label: 'École de langues', googleSearchKeyword: 'École de langues' },
  { id: 'driving_school', label: 'Auto-école', googleSearchKeyword: 'Auto-école' },
  { id: 'tutoring', label: 'Soutien scolaire', googleSearchKeyword: 'Soutien scolaire' },
  
  // Loisirs et culture
  { id: 'art_gallery', label: 'Galerie d\'art', googleSearchKeyword: 'Galerie d\'art' },
  { id: 'museum', label: 'Musée', googleSearchKeyword: 'Musée' },
  { id: 'theater', label: 'Théâtre', googleSearchKeyword: 'Théâtre' },
  { id: 'cinema', label: 'Cinéma', googleSearchKeyword: 'Cinéma' },
  { id: 'bowling', label: 'Bowling', googleSearchKeyword: 'Bowling' },
  { id: 'escape_game', label: 'Escape game', googleSearchKeyword: 'Escape game' },
  { id: 'tattoo', label: 'Salon de tatouage', googleSearchKeyword: 'Salon de tatouage' },
  
  // Hôtellerie et tourisme
  { id: 'hotel', label: 'Hôtel', googleSearchKeyword: 'Hôtel' },
  { id: 'guesthouse', label: 'Chambre d\'hôtes', googleSearchKeyword: 'Chambre d\'hôtes' },
  { id: 'travel_agency', label: 'Agence de voyage', googleSearchKeyword: 'Agence de voyage' },
  { id: 'tourist_info', label: 'Office de tourisme', googleSearchKeyword: 'Office de tourisme' },
];

export const ALL_TYPES_OPTION: BusinessType = {
  id: 'all',
  label: 'Tout type d\'activités',
  googleSearchKeyword: 'entreprise'
};
