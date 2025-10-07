import { Business, GooglePlace } from '@/types/business';
import { supabase } from '@/integrations/supabase/client';

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
    placeId: string,
    maxResults: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<Business[]> {
    // Get location from place ID
    const location = await this.getLocationFromPlaceId(placeId);
    if (!location) {
      throw new Error('Impossible d\'obtenir les coordonnées de l\'adresse');
    }

    const businesses: Business[] = [];
    const seenPlaceIds = new Set<string>(); // Track place IDs to avoid duplicates
    const businessCountByType = new Map<string, number>(); // Track count per type for diversity
    const MAX_PER_TYPE = 3; // Maximum businesses per type for diversity
    
    // TPE/PME uniquement - artisans et commerces avec personnel (>5 salariés)
    const priorityTypes = [
      // Artisans du bâtiment
      'plumber', 'electrician', 'painter', 'roofing_contractor',
      
      // Salons et bien-être (avec personnel)
      'hair_care', 'beauty_salon', 'spa',
      
      // Magasins spécialisés (avec personnel de vente)
      'clothing_store', 'shoe_store', 'florist', 'jewelry_store', 'book_store',
      'pet_store', 'electronics_store', 'furniture_store', 'hardware_store', 'bicycle_store',
      
      // Services professionnels
      'gym',
      'real_estate_agency', 'insurance_agency', 'travel_agency',
      
      // Automobile (garages avec mécaniciens)
      'car_repair', 'car_dealer',
      
      // Hébergement (hôtels avec personnel)
      'lodging',
      
      // Vétérinaires
      'veterinary_care',
      
      // Loisirs et culture (avec personnel)
      'tourist_attraction', 'movie_theater', 'art_gallery', 'museum',
    ];

    // List of large chains and multinationals to exclude
    const excludedNames = [
      'mcdonalds', 'burger king', 'kfc', 'starbucks', 'subway', 'dominos',
      'carrefour', 'auchan', 'leclerc', 'intermarché', 'lidl', 'aldi',
      'décathlon', 'fnac', 'ikea', 'leroy merlin', 'castorama',
      'casino', 'monoprix', 'franprix', 'carrefour city', 'carrefour express',
    ];
    
    // Exclusions pour installations automatiques et structures non démarchables
    const excludedKeywords = [
      'photomaton', 'photo booth', 'distributeur', 'atm', 'relais colis',
      'point relais', 'consigne', 'automate', 'borne', 'parking',
      'station-service', 'péage', 'laverie automatique',
      // Exclusion restauration et alimentation de proximité
      'boulangerie', 'patisserie', 'pâtisserie', 'pizzeria', 'pizza', 'kebab',
      'sandwich', 'snack', 'restaur', 'brasserie', 'bistro', 'café', 'bar',
      // Exclusion stations de lavage
      'wash', 'lavage', 'car wash', 'station de lavage', 'pressing',
      // Exclusion épiceries et petits commerces alimentaires
      'épicerie', 'supérette', 'alimentaire', 'primeur', 'boucher', 'poissonnier',
      'fromagerie', 'charcuterie', 'traiteur'
    ];
    
    // Types Google Places à exclure (installations automatiques, pas de personnel)
    const excludedTypes = [
      'atm', 'parking', 'gas_station', 'transit_station', 
      'subway_station', 'train_station', 'bus_station'
    ];

    // NOUVELLE APPROCHE : alterner les rayons et mélanger les types pour diversifier géographiquement
    let typeIndex = 0;
    const radiusLevels = [15000, 25000, 40000, 50000]; // Commence à 15km pour couvrir large dès le début
    let currentRadiusIndex = 0;
    
    // Mélanger les types pour éviter la concentration par activité
    const shuffledTypes = [...priorityTypes].sort(() => Math.random() - 0.5);
    
    while (businesses.length < maxResults && typeIndex < shuffledTypes.length * 5) {
      const currentType = shuffledTypes[typeIndex % shuffledTypes.length];
      const cycle = Math.floor(typeIndex / shuffledTypes.length);
      
      // Re-mélanger les types à chaque nouveau cycle pour encore plus de variété
      if (typeIndex > 0 && typeIndex % shuffledTypes.length === 0) {
        shuffledTypes.sort(() => Math.random() - 0.5);
      }
      
      // Augmenter le rayon tous les 2 cycles pour diversifier la zone géographique
      if (typeIndex > 0 && typeIndex % (shuffledTypes.length * 2) === 0) {
        currentRadiusIndex = Math.min(currentRadiusIndex + 1, radiusLevels.length - 1);
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
      
      console.log(`🔍 Search ${typeIndex + 1}: type="${currentType}" (${currentCount}/${MAX_PER_TYPE}), radius=${radius}m (level ${currentRadiusIndex + 1}/4), found=${businesses.length}/${maxResults}`);
      
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
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
          
          businesses.push({
            nom: place.name,
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
