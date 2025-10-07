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
    
    // TPE/PME uniquement - exclusion des professions libérales et restaurants
    const priorityTypes = [
      'bakery',
      'hair_care', 'beauty_salon', 'spa',
      'clothing_store', 'shoe_store', 'florist', 'jewelry_store', 'book_store',
      'plumber', 'electrician', 'painter', 'roofing_contractor', 'general_contractor',
      'gym',
      'real_estate_agency', 'insurance_agency', 'travel_agency',
      'store', 'lodging', 'car_repair', 'car_dealer', 'car_wash',
      'pet_store', 'electronics_store', 'furniture_store', 'hardware_store', 'bicycle_store',
      'veterinary_care', 'tourist_attraction', 'movie_theater', 'art_gallery', 'museum',
    ];

    // List of large chains and multinationals to exclude
    const excludedNames = [
      'mcdonalds', 'burger king', 'kfc', 'starbucks', 'subway', 'dominos',
      'carrefour', 'auchan', 'leclerc', 'intermarché', 'lidl', 'aldi',
      'décathlon', 'fnac', 'ikea', 'leroy merlin', 'castorama',
      'casino', 'monoprix', 'franprix', 'carrefour city', 'carrefour express',
    ];

    // NOUVELLE APPROCHE : alterner les rayons et mélanger les types pour diversifier géographiquement
    let typeIndex = 0;
    const radiusLevels = [10000, 20000, 35000, 50000]; // Commence à 10km pour couvrir toute la ville, pas juste le quartier
    let currentRadiusIndex = 0;
    
    // Mélanger les types pour éviter la concentration par activité
    const shuffledTypes = [...priorityTypes].sort(() => Math.random() - 0.5);
    
    while (businesses.length < maxResults && typeIndex < shuffledTypes.length * 5) {
      const currentType = shuffledTypes[typeIndex % shuffledTypes.length];
      const cycle = Math.floor(typeIndex / shuffledTypes.length);
      
      // Augmenter le rayon tous les 2 cycles pour diversifier la zone géographique
      if (typeIndex > 0 && typeIndex % (shuffledTypes.length * 2) === 0) {
        currentRadiusIndex = Math.min(currentRadiusIndex + 1, radiusLevels.length - 1);
      }
      
      const radius = radiusLevels[currentRadiusIndex];
      
      console.log(`🔍 Search ${typeIndex + 1}: type="${currentType}", radius=${radius}m (level ${currentRadiusIndex + 1}/4), found=${businesses.length}/${maxResults}`);
      
      // Chercher spécifiquement ce type d'entreprise
      const searchResult = await this.nearbySearch(location, radius, currentType);
      const places = searchResult.results;
      
      console.log(`📍 Found ${places.length} places of type "${currentType}"`);
      
      let newBusinessesInThisSearch = 0;

      for (const place of places) {
        if (businesses.length >= maxResults) break;

        // Skip duplicates
        if (seenPlaceIds.has(place.place_id)) {
          continue;
        }
        seenPlaceIds.add(place.place_id);

        // Filter out ONLY the very biggest chains
        const nameLower = place.name.toLowerCase();
        const isMajorChain = excludedNames.some(excluded => nameLower.includes(excluded));
        
        if (isMajorChain) {
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
          console.log(`✅ ${businesses.length}/${maxResults}: ${place.name}`);

          if (onProgress) {
            onProgress(businesses.length, maxResults);
          }
        }
      }
      
      if (newBusinessesInThisSearch > 0) {
        console.log(`✅ Added ${newBusinessesInThisSearch} businesses from type "${currentType}"`);
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
