import { Business, GooglePlace } from '@/types/business';
import { supabase } from '@/integrations/supabase/client';
import { BusinessType, BUSINESS_TYPES } from '@/constants/businessTypes';

export class GooglePlacesService {
  static async getLocationFromPlaceId(placeId: string): Promise<{ lat: number; lng: number } | null> {
    console.log('Getting location from place ID:', placeId);
    
    const details = await this.getPlaceDetails(placeId);
    if (details && details.geometry?.location) {
      return {
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng
      };
    }
    return null;
  }

  static async textSearch(
    textQuery: string,
    location: { lat: number; lng: number },
    radius: number,
    maxResults: number = 20
  ): Promise<{ results: GooglePlace[] }> {
    console.log('Calling google-text-search with:', { textQuery, location, radius, maxResults });
    
    const { data, error } = await supabase.functions.invoke('google-text-search', {
      body: { 
        textQuery,
        latitude: location.lat, 
        longitude: location.lng, 
        radius,
        maxResults
      }
    });

    if (error) {
      console.error('Error calling google-text-search:', error);
      throw error;
    }

    console.log('google-text-search returned:', data?.results?.length || 0, 'results');
    return data;
  }

  static async getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
    console.log('Getting place details for:', placeId);
    
    const { data, error } = await supabase.functions.invoke('google-place-details', {
      body: { placeId: `places/${placeId}` }
    });

    if (error) {
      console.error('Error calling google-place-details:', error);
      throw error;
    }

    return data?.result || null;
  }

  private static filterPlaces(
    places: GooglePlace[], 
    companyName: string,
    excludedPlaceIds: Set<string> = new Set(),
    selectedTypes?: BusinessType[]
  ): GooglePlace[] {
    const excludedNames = [
      'mcdonalds', 'burger king', 'kfc', 'starbucks', 'subway', 'dominos',
      'carrefour', 'auchan', 'leclerc', 'intermarché', 'lidl', 'aldi',
      'décathlon', 'fnac', 'ikea', 'leroy merlin', 'castorama',
    ];
    
    const excludedKeywords = [
      'photomaton', 'distributeur', 'atm', 'relais', 'consigne', 'automate', 
      'borne', 'parking', 'station-service', 'péage', 'laverie automatique',
    ];

    // Mapping pour les mots-clés de métier à vérifier dans le nom
    const jobKeywords: Record<string, string[]> = {
      'Kinésithérapeute': ['kiné', 'kinési', 'masseur', 'ostéo', 'rééducation'],
      'Orthoptiste': ['orthoptiste', 'orthoptie', 'vision', 'rééducation visuelle'],
      'Ostéopathe': ['ostéo', 'ostéopathie'],
      'Sophrologue': ['sophro', 'sophrologie'],
      'Dentiste': ['dentiste', 'dentaire', 'orthodon', 'chirurgien dentiste'],
      'Médecin généraliste': ['médecin', 'docteur', 'cabinet médical', 'généraliste'],
      'Avocat': ['avocat', 'cabinet d\'avocat', 'conseil juridique'],
      'Salon de coiffure': ['coiffeur', 'coiffure', 'salon'],
      'Électricien': ['électricien', 'électricité', 'électrique'],
      'Plombier': ['plombier', 'plomberie', 'sanitaire', 'chauffage'],
    };

    // Mots-clés d'exclusion pour détecter les mauvaises catégorisations
    const excludeKeywords: Record<string, string[]> = {
      'Kinésithérapeute': ['plombier', 'plomberie', 'chauffage', 'sanitaire', 'électrici', 'boulang'],
      'Orthoptiste': ['plombier', 'plomberie', 'boulang', 'restaurant'],
      'Ostéopathe': ['plombier', 'plomberie', 'boulang', 'restaurant'],
      'Sophrologue': ['plombier', 'plomberie', 'boulang', 'restaurant'],
      'Dentiste': ['plombier', 'plomberie', 'boulang'],
      'Médecin généraliste': ['plombier', 'plomberie', 'boulang'],
    };

    return places.filter(place => {
      // Exclure le business de l'utilisateur
      if (place.name.toLowerCase().includes(companyName.toLowerCase())) {
        return false;
      }

      // Exclure les places déjà trouvées
      if (excludedPlaceIds.has(place.place_id)) {
        return false;
      }

      const nameLower = place.name.toLowerCase();

      // Exclure les grandes chaînes
      if (excludedNames.some(excluded => nameLower.includes(excluded))) {
        return false;
      }

      // Exclure les installations automatiques
      if (excludedKeywords.some(keyword => nameLower.includes(keyword))) {
        return false;
      }

      // Si on a des types sélectionnés, vérifier la pertinence par rapport au nom
      if (selectedTypes && selectedTypes.length > 0) {
        const keyword = selectedTypes[0].googleSearchKeyword;
        
        // Vérifier les mots-clés d'exclusion pour ce type
        if (excludeKeywords[keyword]) {
          const hasExcludeKeyword = excludeKeywords[keyword].some(kw => 
            nameLower.includes(kw.toLowerCase())
          );
          if (hasExcludeKeyword) {
            console.log(`⏭️ Skipping ${place.name}: wrong categorization detected`);
            return false;
          }
        }
      }

      return true;
    });
  }

  // Mapping exhaustif des primaryType Google vers les noms français officiels
  private static readonly GOOGLE_TYPE_TO_FRENCH: Record<string, string> = {
    // Professions juridiques et comptables
    'notary_public': 'Notaire',
    'lawyer': 'Avocat',
    'law_firm': 'Cabinet d\'avocat',
    'accounting': 'Expert-comptable',
    'accountant': 'Expert-comptable',
    'tax_consultant': 'Conseiller fiscal',
    
    // Professions de santé
    'physiotherapist': 'Kinésiologue',
    'physical_therapist': 'Kinésithérapeute',
    'massage_therapist': 'Masseur',
    'spa': 'Spa',
    'osteopath': 'Ostéopathe',
    'chiropractor': 'Chiropracteur',
    'acupuncturist': 'Acupuncteur',
    'doctor': 'Médecin',
    'dentist': 'Dentiste',
    'orthodontist': 'Orthodontiste',
    'dental_clinic': 'Cabinet dentaire',
    'optometrist': 'Opticien',
    'ophthalmologist': 'Ophtalmologiste',
    'psychologist': 'Psychologue',
    'psychiatrist': 'Psychiatre',
    'nutritionist': 'Nutritionniste',
    'dietitian': 'Diététicien',
    'speech_therapist': 'Orthophoniste',
    'occupational_therapist': 'Ergothérapeute',
    'podiatrist': 'Podologue',
    'pharmacy': 'Pharmacie',
    'hospital': 'Hôpital',
    'medical_clinic': 'Clinique médicale',
    'veterinarian': 'Vétérinaire',
    
    // Beauté et bien-être
    'hair_salon': 'Salon de coiffure',
    'barber_shop': 'Salon de coiffure',
    'beauty_salon': 'Institut de beauté',
    'nail_salon': 'Salon d\'onglerie',
    'hair_care': 'Coiffeur',
    'day_spa': 'Spa',
    'tanning_salon': 'Salon de bronzage',
    'cosmetics_store': 'Magasin de cosmétiques',
    
    // Fitness et sport
    'gym': 'Salle de sport',
    'fitness_center': 'Centre de fitness',
    'yoga_studio': 'Studio de yoga',
    'pilates_studio': 'Studio de Pilates',
    'sports_club': 'Club de sport',
    'swimming_pool': 'Piscine',
    'personal_trainer': 'Coach sportif',
    
    // Restauration
    'restaurant': 'Restaurant',
    'cafe': 'Café',
    'bar': 'Bar',
    'bakery': 'Boulangerie',
    'pastry_shop': 'Pâtisserie',
    'pizza_restaurant': 'Pizzeria',
    'fast_food_restaurant': 'Fast-food',
    'french_restaurant': 'Restaurant français',
    'italian_restaurant': 'Restaurant italien',
    'chinese_restaurant': 'Restaurant chinois',
    'japanese_restaurant': 'Restaurant japonais',
    'seafood_restaurant': 'Restaurant de fruits de mer',
    'steakhouse': 'Grill',
    'vegetarian_restaurant': 'Restaurant végétarien',
    'ice_cream_shop': 'Glacier',
    'sandwich_shop': 'Sandwicherie',
    'coffee_shop': 'Café',
    'tea_house': 'Salon de thé',
    'wine_bar': 'Bar à vin',
    'brewery': 'Brasserie',
    
    // Commerce de détail
    'store': 'Magasin',
    'clothing_store': 'Magasin de vêtements',
    'shoe_store': 'Magasin de chaussures',
    'jewelry_store': 'Bijouterie',
    'electronics_store': 'Magasin d\'électronique',
    'book_store': 'Librairie',
    'florist': 'Fleuriste',
    'gift_shop': 'Boutique de cadeaux',
    'toy_store': 'Magasin de jouets',
    'pet_store': 'Animalerie',
    'furniture_store': 'Magasin de meubles',
    'home_goods_store': 'Magasin de décoration',
    'hardware_store': 'Quincaillerie',
    'convenience_store': 'Supérette',
    'supermarket': 'Supermarché',
    'grocery_store': 'Épicerie',
    'liquor_store': 'Caviste',
    'department_store': 'Grand magasin',
    'shopping_mall': 'Centre commercial',
    
    // Services automobiles
    'car_repair': 'Garage automobile',
    'auto_repair_shop': 'Garage',
    'car_dealer': 'Concessionnaire automobile',
    'car_wash': 'Station de lavage',
    'gas_station': 'Station-service',
    'parking': 'Parking',
    'car_rental': 'Location de voiture',
    
    // Services professionnels
    'real_estate_agency': 'Agence immobilière',
    'insurance_agency': 'Agence d\'assurance',
    'bank': 'Banque',
    'atm': 'Distributeur automatique',
    'post_office': 'Bureau de poste',
    'travel_agency': 'Agence de voyage',
    'moving_company': 'Déménageur',
    'cleaning_service': 'Service de nettoyage',
    'locksmith': 'Serrurier',
    'plumber': 'Plombier',
    'electrician': 'Électricien',
    'painter': 'Peintre en bâtiment',
    'carpenter': 'Menuisier',
    'roofing_contractor': 'Couvreur',
    'hvac_contractor': 'Chauffagiste',
    'landscaper': 'Paysagiste',
    'architect': 'Architecte',
    'interior_designer': 'Architecte d\'intérieur',
    'graphic_designer': 'Designer graphique',
    'photographer': 'Photographe',
    'event_planner': 'Organisateur d\'événements',
    'wedding_planner': 'Wedding planner',
    'catering': 'Traiteur',
    'printing_service': 'Imprimerie',
    'tailor': 'Couturier',
    'laundry': 'Pressing',
    'dry_cleaner': 'Pressing',
    
    // Éducation
    'school': 'École',
    'primary_school': 'École primaire',
    'secondary_school': 'Collège',
    'high_school': 'Lycée',
    'university': 'Université',
    'driving_school': 'Auto-école',
    'language_school': 'École de langues',
    'music_school': 'École de musique',
    'dance_school': 'École de danse',
    'art_school': 'École d\'art',
    'tutoring_service': 'Cours particuliers',
    
    // Loisirs et culture
    'museum': 'Musée',
    'art_gallery': 'Galerie d\'art',
    'movie_theater': 'Cinéma',
    'theater': 'Théâtre',
    'concert_hall': 'Salle de concert',
    'night_club': 'Boîte de nuit',
    'library': 'Bibliothèque',
    'park': 'Parc',
    'zoo': 'Zoo',
    'aquarium': 'Aquarium',
    'amusement_park': 'Parc d\'attractions',
    'bowling_alley': 'Bowling',
    'casino': 'Casino',
    
    // Hébergement
    'hotel': 'Hôtel',
    'motel': 'Motel',
    'hostel': 'Auberge de jeunesse',
    'bed_and_breakfast': 'Chambre d\'hôtes',
    'resort': 'Resort',
    'campground': 'Camping',
    
    // Services religieux
    'church': 'Église',
    'mosque': 'Mosquée',
    'synagogue': 'Synagogue',
    'temple': 'Temple',
    'place_of_worship': 'Lieu de culte',
  };

  private static getPrimaryTypeLabel(primaryType: string): string | null {
    return this.GOOGLE_TYPE_TO_FRENCH[primaryType] || null;
  }

  private static getActivityType(
    place: GooglePlace,
    selectedTypes: BusinessType[]
  ): string {
    // PRIORITÉ 1 : Utiliser le mapping primaryType vers français (le plus fiable)
    if (place.primary_type) {
      const mappedType = this.getPrimaryTypeLabel(place.primary_type);
      if (mappedType) {
        console.log(`📍 Mapped ${place.primary_type} → ${mappedType} for ${place.name}`);
        return mappedType;
      }
    }

    // PRIORITÉ 2 : Utiliser primaryTypeDisplayName de Google si disponible
    if (place.primary_type_display_name) {
      return place.primary_type_display_name;
    }

    // PRIORITÉ 3 : Utiliser le type sélectionné par l'utilisateur
    if (selectedTypes.length > 0 && selectedTypes[0].id !== 'all') {
      return selectedTypes[0].label;
    }

    // PRIORITÉ 4 : Fallback
    return 'Autre';
  }

  /**
   * Valide la catégorie d'un établissement en comparant :
   * - Le primaryType de Google avec les types sélectionnés
   * - Les mots-clés dans le primaryTypeDisplayName
   */
  private static validateBusinessCategory(
    place: GooglePlace,
    selectedTypes: BusinessType[]
  ): 'verified' | 'probable' | 'unverified' {
    // Si pas de types sélectionnés ou "Tous", on accepte tout
    if (selectedTypes.length === 0 || selectedTypes.some(t => t.id === 'all')) {
      return place.primary_type_display_name ? 'verified' : 'probable';
    }

    const primaryType = place.primary_type?.toLowerCase() || '';
    const primaryDisplayName = place.primary_type_display_name?.toLowerCase() || '';
    const businessName = place.name.toLowerCase();

    // Mapping des IDs vers les mots-clés de validation
    const validationKeywords: Record<string, { included: string[]; excluded: string[] }> = {
      'physiotherapist': {
        included: ['kinésithérapeute', 'kiné', 'masseur-kinésithérapeute', 'physiothérapeute'],
        excluded: ['massage', 'spa', 'bien-être', 'relaxation']
      },
      'massage': {
        included: ['massage', 'masseur', 'spa', 'relaxation', 'bien-être'],
        excluded: ['kiné', 'kinésithérapeute', 'ostéo', 'ongle', 'manucure']
      },
      'beauty_salon': {
        included: ['beauté', 'esthétique', 'institut', 'spa'],
        excluded: ['coiffure', 'barbier']
      },
      'hair_salon': {
        included: ['coiffeur', 'coiffure', 'barbier', 'salon'],
        excluded: ['ongle', 'esthétique']
      },
      'nail_salon': {
        included: ['ongle', 'manucure', 'pédicure', 'nail'],
        excluded: ['coiffure', 'massage']
      },
    };

    // Trouver le type sélectionné le plus pertinent
    for (const selectedType of selectedTypes) {
      const typeId = selectedType.id;
      const keywords = validationKeywords[typeId];

      if (!keywords) continue;

      // Vérifier les mots-clés d'exclusion dans primaryDisplayName
      const hasExcludedKeyword = keywords.excluded.some(kw => 
        primaryDisplayName.includes(kw) || businessName.includes(kw)
      );

      if (hasExcludedKeyword) {
        return 'unverified';
      }

      // Vérifier les mots-clés inclus dans primaryDisplayName
      const hasIncludedKeyword = keywords.included.some(kw => 
        primaryDisplayName.includes(kw) || businessName.includes(kw)
      );

      if (hasIncludedKeyword) {
        return 'verified';
      }
    }

    // Si on arrive ici, c'est probablement valide mais pas certifié
    return 'probable';
  }

  static async searchBusinesses(
    companyName: string,
    placeId: string,
    maxResults: number,
    selectedTypes: BusinessType[],
    onProgress?: (current: number, total: number) => void,
    excludedPlaceIds?: Set<string>
  ): Promise<Business[]> {
    console.log('Starting business search for:', companyName, 'at place:', placeId);
    console.log('Selected types:', selectedTypes.map(t => t.label).join(', '));
    
    // Get the location from the place ID
    const location = await this.getLocationFromPlaceId(placeId);
    if (!location) {
      throw new Error('Impossible de récupérer les coordonnées de l\'adresse');
    }

    console.log('Location found:', location);

    // Get address from place details to construct better search queries
    const placeDetails = await this.getPlaceDetails(placeId);
    const address = placeDetails?.formatted_address || '';
    const cityMatch = address.match(/\d{5}\s+([^,]+)/);
    const city = cityMatch ? cityMatch[1].trim() : '';

    let allBusinesses: Business[] = [];
    const seenPlaceIds = new Set<string>();
    const seenBusinessKeys = new Set<string>(); // Pour détecter doublons par nom + adresse
    let currentRadius = 5000; // Start with 5km
    const maxRadius = 20000; // Max 20km
    const radiusIncrement = 5000; // Increase by 5km each time
    
    // Build search queries based on selected types
    const searchQueries = selectedTypes.length === 0 || 
                         selectedTypes.some(t => t.id === 'all')
      ? [`entreprise ${city || address}`]
      : selectedTypes.map(t => `${t.googleSearchKeyword} ${city || address}`);

    console.log('Search queries:', searchQueries);

    // Try increasing radius until we have enough results
    while (allBusinesses.length < maxResults && currentRadius <= maxRadius) {
      console.log(`Searching with radius: ${currentRadius}m`);
      
      for (const query of searchQueries) {
        if (allBusinesses.length >= maxResults) break;
        
        console.log(`Text search query: "${query}"`);
        
        try {
          const searchResults = await this.textSearch(
            query,
            location, 
            currentRadius,
            Math.min(20, maxResults - allBusinesses.length + 10) // Request a few extra for filtering
          );
          const places = searchResults.results || [];
          
          console.log(`Found ${places.length} places for query "${query}"`);
          
          // Filter places
          const filteredPlaces = this.filterPlaces(
            places, 
            companyName, 
            excludedPlaceIds || new Set(),
            selectedTypes.length > 0 ? selectedTypes : undefined
          );
          
          console.log(`After filtering: ${filteredPlaces.length} places`);
          
          // Get details for each place
          for (const place of filteredPlaces) {
            if (allBusinesses.length >= maxResults) break;
            
            // Skip if we already have this place_id
            if (seenPlaceIds.has(place.place_id)) {
              console.log(`⏭️ Skipping duplicate place_id: ${place.place_id}`);
              continue;
            }
            
            const details = await this.getPlaceDetails(place.place_id);
            if (!details) continue;
            
            // Final filter on detailed info
            const finalFiltered = this.filterPlaces(
              [details], 
              companyName, 
              excludedPlaceIds || new Set(),
              selectedTypes.length > 0 ? selectedTypes : undefined
            );
            
            if (finalFiltered.length === 0) continue;
            
            // Valider la catégorie avant d'ajouter
            const confidenceLevel = this.validateBusinessCategory(details, selectedTypes);
            
            // Optionnel : rejeter les "unverified" si on veut une qualité maximale
            // if (confidenceLevel === 'unverified') {
            //   console.log(`⏭️ Skipping unverified business: ${details.name}`);
            //   continue;
            // }
            
            // Déterminer le type d'activité à afficher (utilise primaryTypeDisplayName en priorité)
            const activityType = this.getActivityType(details, selectedTypes);
            
            const business: Business = {
              nom: details.name,
              type_activite: activityType,
              adresse: details.formatted_address || '',
              telephone: details.formatted_phone_number || 'Non disponible',
              site_web: details.website || 'Non disponible',
              lien_maps: details.url || '',
              category_id: details.primary_type,
              primary_type_display_name: details.primary_type_display_name,
              confidence_level: confidenceLevel
            };
            
            // Créer une clé unique basée sur nom + adresse pour détecter les doublons
            const businessKey = `${business.nom.toLowerCase().trim()}|${business.adresse.toLowerCase().trim()}`;
            
            if (seenBusinessKeys.has(businessKey)) {
              console.log(`⏭️ Skipping duplicate business: ${business.nom} at ${business.adresse}`);
              continue;
            }
            
            // Ajouter à nos sets de déduplication
            seenPlaceIds.add(place.place_id);
            seenBusinessKeys.add(businessKey);
            
            allBusinesses.push(business);
            
            if (onProgress) {
              onProgress(allBusinesses.length, maxResults);
            }
            
            console.log(`✅ Added: ${business.nom} (${activityType})`);
          }
        } catch (error) {
          console.error(`Error searching for query "${query}":`, error);
        }
      }
      
      // If we don't have enough results, increase radius
      if (allBusinesses.length < maxResults) {
        currentRadius += radiusIncrement;
        console.log(`Not enough results, increasing radius to ${currentRadius}m`);
      }
    }

    console.log(`Search completed: ${allBusinesses.length}/${maxResults} businesses found`);
    
    // Déduplication finale par sécurité
    const uniqueBusinesses = allBusinesses.filter((business, index, self) => {
      const businessKey = `${business.nom.toLowerCase().trim()}|${business.adresse.toLowerCase().trim()}`;
      return index === self.findIndex(b => 
        `${b.nom.toLowerCase().trim()}|${b.adresse.toLowerCase().trim()}` === businessKey
      );
    });
    
    if (uniqueBusinesses.length < allBusinesses.length) {
      console.log(`⚠️ Removed ${allBusinesses.length - uniqueBusinesses.length} duplicates in final deduplication`);
    }
    
    return uniqueBusinesses.slice(0, maxResults);
  }

  static exportToJson(businesses: Business[]): string {
    return JSON.stringify({ entreprises: businesses }, null, 2);
  }

  static downloadJson(businesses: Business[], filename: string = 'entreprises.json'): void {
    const json = this.exportToJson(businesses);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
