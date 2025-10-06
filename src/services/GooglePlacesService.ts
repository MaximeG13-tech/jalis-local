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
    
    // NOUVELLE STRATÉGIE : chercher par TYPE spécifique pour obtenir des résultats variés
    const priorityTypes = [
      'restaurant', 'cafe', 'bar', 'bakery',
      'hair_care', 'beauty_salon', 'spa',
      'clothing_store', 'shoe_store', 'florist', 'jewelry_store', 'book_store',
      'plumber', 'electrician', 'painter', 'roofing_contractor',
      'gym', 'physiotherapist', 'doctor', 'dentist',
      'real_estate_agency', 'insurance_agency', 'accounting', 'lawyer',
      'store', 'meal_takeaway', 'lodging', 'car_repair',
    ];

    // List of large chains and multinationals to exclude (TRÈS réduite)
    const excludedNames = [
      'mcdonalds', 'burger king', 'kfc', 'starbucks',
      'carrefour', 'auchan', 'leclerc',
      'décathlon', 'fnac', 'ikea',
    ];

    // NOUVELLE APPROCHE : chercher par type spécifique pour diversifier les résultats
    let typeIndex = 0;
    let radius = 1000;
    
    while (businesses.length < maxResults && typeIndex < priorityTypes.length * 3) {
      const currentType = priorityTypes[typeIndex % priorityTypes.length];
      const attempt = Math.floor(typeIndex / priorityTypes.length) + 1;
      
      // Augmenter le rayon à chaque cycle complet des types
      if (typeIndex > 0 && typeIndex % priorityTypes.length === 0) {
        radius = Math.min(radius * 2, 50000);
      }
      
      console.log(`🔍 Search ${typeIndex + 1}: type="${currentType}", radius=${radius}m, found=${businesses.length}/${maxResults}`);
      
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
