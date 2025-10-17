import { Business, GooglePlace } from '@/types/business';
import { supabase } from '@/integrations/supabase/client';
import { BusinessType, BUSINESS_TYPES } from '@/constants/businessTypes';

export class GooglePlacesService {
  static async getLocationFromPlaceId(placeId: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const details = await this.getPlaceDetails(placeId);
      if (details && details.geometry?.location) {
        return {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  static async nearbySearch(
    location: { lat: number; lng: number },
    radius: number,
    includedType?: string
  ): Promise<{ results: GooglePlace[] }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-nearby-search', {
        body: {
          latitude: location.lat,
          longitude: location.lng,
          radius,
          includedType
        }
      });

      if (error) throw error;

      return {
        results: data?.results || []
      };
    } catch (error) {
      console.error('Nearby search error:', error);
      throw error;
    }
  }

  static async getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
    try {
      const { data, error } = await supabase.functions.invoke('google-place-details', {
        body: { placeId: `places/${placeId}` }
      });

      if (error) throw error;

      return data?.result || null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  static async searchBusinesses(
    companyName: string,
    placeId: string,
    maxResults: number,
    selectedTypes: BusinessType[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Business[]> {
    // Get location from place ID
    const location = await this.getLocationFromPlaceId(placeId);
    if (!location) {
      throw new Error('Impossible d\'obtenir les coordonnées de l\'adresse');
    }

    // Récupérer les types de l'établissement de l'utilisateur pour les exclure
    let userBusinessTypes: string[] = [];
    try {
      const userBusinessDetails = await this.getPlaceDetails(placeId);
      if (userBusinessDetails && userBusinessDetails.types) {
        userBusinessTypes = userBusinessDetails.types;
        console.log(`🏢 Types de l'établissement de l'utilisateur: ${userBusinessTypes.join(', ')}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des types de l\'établissement:', error);
    }

    const businesses: Business[] = [];
    const seenPlaceIds = new Set<string>(); // Track place IDs to avoid duplicates
    const businessCountByType = new Map<string, number>(); // Track count per type for diversity
    
    // Déterminer les types à rechercher
    let priorityTypes: string[];
    let MAX_PER_TYPE: number;
    
    const isAllTypes = selectedTypes.some(t => t.id === 'all');
    
    if (isAllTypes || selectedTypes.length === 0) {
      // Tout type d'activités - utiliser la liste par défaut
      priorityTypes = [
        'accounting', 'lawyer', 'consultant',
        'real_estate_agency', 'insurance_agency', 'travel_agency',
        'plumber', 'electrician', 'painter', 'roofing_contractor', 'locksmith',
        'car_repair', 'car_dealer', 'auto_parts_store',
        'dentist', 'doctor', 'physiotherapist',
        'hair_salon', 'hair_care', 'barber_shop', 'beauty_salon', 'spa',
        'clothing_store', 'shoe_store', 'jewelry_store', 'furniture_store',
        'electronics_store', 'hardware_store', 'bicycle_store', 'sporting_goods_store',
        'florist', 'pet_store', 'veterinary_care',
        'gym', 'fitness_center',
      ];
      MAX_PER_TYPE = 3;
    } else {
      // Types spécifiques sélectionnés
      priorityTypes = selectedTypes.map(t => t.googlePlaceType);
      // Si plusieurs types, limiter par type, sinon tout vient du même type
      MAX_PER_TYPE = selectedTypes.length > 1 ? Math.ceil(maxResults / selectedTypes.length) : maxResults;
    }

    // List of large chains and multinationals to exclude
    const excludedNames = [
      'mcdonalds', 'burger king', 'kfc', 'starbucks', 'subway', 'dominos',
      'carrefour', 'auchan', 'leclerc', 'intermarché', 'lidl', 'aldi',
      'décathlon', 'fnac', 'ikea', 'leroy merlin', 'castorama',
      'casino', 'monoprix', 'franprix', 'carrefour city', 'carrefour express',
    ];
    
    // Exclusions STRICTES - tout ce qui n'est PAS artisan ou TPE/PME démarchable
    const excludedKeywords = [
      // Installations automatiques
      'photomaton', 'photo booth', 'distributeur', 'atm', 'relais colis',
      'point relais', 'consigne', 'automate', 'borne', 'parking',
      'station-service', 'péage', 'laverie automatique',
      // Restauration et alimentation
      'boulangerie', 'patisserie', 'pâtisserie', 'pizzeria', 'pizza', 'kebab',
      'sandwich', 'snack', 'restaur', 'brasserie', 'bistro', 'café', 'bar',
      'burger', 'tacos', 'sushi',
      // Stations de lavage
      'wash', 'lavage', 'car wash', 'station de lavage', 'pressing',
      // Commerces alimentaires de proximité
      'épicerie', 'supérette', 'alimentaire', 'primeur', 'boucher', 'poissonnier',
      'fromagerie', 'charcuterie', 'traiteur', 'marché',
      // Logements et résidences (PAS démarchables)
      'résidence', 'residence', 'étudiant', 'student', 'logement', 'appartement',
      'cité', 'foyer', 'dortoir', 'colocation', 'hlm', 'housing',
      // Établissements publics/administratifs
      'mairie', 'école', 'collège', 'lycée', 'université', 'poste', 'bibliothèque',
      'hôpital', 'clinique', 'centre médical', 'pharmacie',
      // Loisirs non TPE/PME
      'parc', 'jardin', 'square', 'stade', 'piscine', 'médiathèque'
    ];
    
    // Types Google Places à exclure (installations automatiques, logements, établissements publics, restauration)
    const excludedTypes = [
      'atm', 'parking', 'gas_station', 'transit_station', 
      'subway_station', 'train_station', 'bus_station',
      'lodging', 'hospital', 'pharmacy', 'school', 'university',
      'local_government_office', 'post_office', 'library',
      // Exclure toute la restauration et l'alimentaire
      'bakery', 'restaurant', 'cafe', 'bar', 'meal_delivery', 'meal_takeaway',
      'food', 'supermarket', 'grocery_store', 'convenience_store'
    ];

    // STRATÉGIE : élargir automatiquement si pas assez de résultats
    let typeIndex = 0;
    const radiusLevels = [30000, 40000, 50000]; // Limite max de l'API Google Places: 50km
    let currentRadiusIndex = 0;
    
    // Mélanger les types pour éviter la concentration par activité
    const shuffledTypes = [...priorityTypes].sort(() => Math.random() - 0.5);
    
    while (businesses.length < maxResults && typeIndex < shuffledTypes.length * 8) { // Augmenté à 8 cycles max
      const currentType = shuffledTypes[typeIndex % shuffledTypes.length];
      
      // Re-mélanger les types à chaque nouveau cycle pour encore plus de variété
      if (typeIndex > 0 && typeIndex % shuffledTypes.length === 0) {
        shuffledTypes.sort(() => Math.random() - 0.5);
      }
      
      // Augmenter le rayon plus rapidement si on trouve peu de résultats
      if (typeIndex > 0 && typeIndex % shuffledTypes.length === 0) {
        currentRadiusIndex = Math.min(currentRadiusIndex + 1, radiusLevels.length - 1);
        console.log(`🔄 Élargissement de la zone de recherche à ${radiusLevels[currentRadiusIndex]/1000}km`);
      }
      
      // Skip ce type si on a déjà atteint le maximum pour ce type
      const currentCount = businessCountByType.get(currentType) || 0;
      if (currentCount >= MAX_PER_TYPE) {
        typeIndex++;
        continue;
      }
      
      // Augmenter le rayon tous les 2 cycles pour diversifier la zone géographique
      if (typeIndex > 0 && typeIndex % (shuffledTypes.length * 2) === 0) {
        currentRadiusIndex = Math.min(currentRadiusIndex + 1, radiusLevels.length - 1);
      }
      
      const radius = radiusLevels[currentRadiusIndex];
      
      console.log(`🔍 Search ${typeIndex + 1}: type="${currentType}" (${currentCount}/${MAX_PER_TYPE}), radius=${radius}m (level ${currentRadiusIndex + 1}/3), found=${businesses.length}/${maxResults}`);
      
      // Chercher spécifiquement ce type d'entreprise
      const searchResult = await this.nearbySearch(location, radius, currentType);
      const places = searchResult.results;
      
      console.log(`📍 Found ${places.length} places of type "${currentType}"`);
      
      let newBusinessesInThisSearch = 0;
      let addedForThisType = 0;

      for (const place of places) {
        if (businesses.length >= maxResults) break;
        
        // Vérifier si on a atteint le max pour ce type
        const typeCount = businessCountByType.get(currentType) || 0;
        if (typeCount >= MAX_PER_TYPE) break;

        // Skip duplicates
        if (seenPlaceIds.has(place.place_id)) {
          continue;
        }
        seenPlaceIds.add(place.place_id);

        // Filter out grandes chaînes
        const nameLower = place.name.toLowerCase();
        const isMajorChain = excludedNames.some(excluded => nameLower.includes(excluded));
        
        if (isMajorChain) {
          continue;
        }
        
        // Filter out installations automatiques et structures sans personnel
        const hasExcludedKeyword = excludedKeywords.some(keyword => nameLower.includes(keyword));
        if (hasExcludedKeyword) {
          console.log(`⏭️ Skipping automated/unmanned: ${place.name}`);
          continue;
        }
        
        // Filter out types non démarchables
        const hasExcludedType = place.types?.some(type => excludedTypes.includes(type));
        if (hasExcludedType) {
          console.log(`⏭️ Skipping excluded type: ${place.name}`);
          continue;
        }
        
        // CRITICAL: Vérifier que le lieu contient bien le type recherché
        // Cela évite qu'une boulangerie qui aurait aussi d'autres types apparaisse dans les résultats
        if (!isAllTypes && place.types && !place.types.includes(currentType)) {
          console.log(`⏭️ Skipping ${place.name}: doesn't match searched type ${currentType} (has: ${place.types.join(', ')})`);
          continue;
        }
        
        // Exclure les concurrents directs (mêmes types que l'établissement de l'utilisateur)
        if (userBusinessTypes.length > 0 && place.types) {
          const hasCommonType = place.types.some(type => userBusinessTypes.includes(type));
          if (hasCommonType) {
            console.log(`🚫 Skipping competitor (same business type): ${place.name}`);
            continue;
          }
        }

        // Use data from nearby search if available
        let phoneNumber = place.formatted_phone_number;
        let website = place.website;

        // Fetch details if needed
        if (!phoneNumber || !website) {
          const details = await this.getPlaceDetails(place.place_id);
          if (details) {
            phoneNumber = phoneNumber || details.formatted_phone_number;
            website = website || details.website;
          }
          await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Accepter si on a AU MOINS un moyen de contact
        if (phoneNumber || website) {
          // Use native Google Maps URL from the API
          const mapsLink = place.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
          
          // Trouver le label en français du type d'activité
          const businessType = BUSINESS_TYPES.find(t => t.googlePlaceType === currentType);
          const typeLabel = businessType?.label || currentType;
          
          businesses.push({
            nom: place.name,
            type_activite: typeLabel,
            adresse: place.formatted_address || '',
            telephone: phoneNumber || 'Non disponible',
            site_web: website || 'Non disponible',
            lien_maps: mapsLink,
          });

          newBusinessesInThisSearch++;
          addedForThisType++;
          
          // Mettre à jour le compteur pour ce type
          businessCountByType.set(currentType, typeCount + 1);
          
          console.log(`✅ ${businesses.length}/${maxResults}: ${place.name} (${currentType})`);

          if (onProgress) {
            onProgress(businesses.length, maxResults);
          }
        }
      }
      
      if (newBusinessesInThisSearch > 0) {
        console.log(`✅ Added ${newBusinessesInThisSearch} businesses from type "${currentType}" (total for type: ${businessCountByType.get(currentType)}/${MAX_PER_TYPE})`);
      }
      
      typeIndex++;
      
      // Petit délai entre les recherches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎯 Search completed: ${businesses.length}/${maxResults} businesses found`);

    return businesses.slice(0, maxResults);
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
