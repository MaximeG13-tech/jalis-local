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
    radius: number
  ): Promise<{ results: GooglePlace[] }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-nearby-search', {
        body: {
          latitude: location.lat,
          longitude: location.lng,
          radius
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
    let radius = 1000;
    let attempts = 0;
    const maxAttempts = 10; // Augmenté pour chercher plus loin

    // List of large chains and multinationals to exclude
    const excludedNames = [
      'mcdonalds', 'mcdonald', 'burger king', 'kfc', 'quick', 'subway',
      'starbucks', 'carrefour', 'auchan', 'leclerc', 'intermarché', 'casino',
      'monoprix', 'franprix', 'aldi', 'lidl', 'super u', 'hyper u',
      'décathlon', 'leroy merlin', 'bricorama', 'castorama', 'brico dépôt',
      'fnac', 'darty', 'boulanger', 'cultura', 'micromania',
      'picard', 'sephora', 'kiabi', 'zara', 'h&m', 'c&a', 'primark',
      'ikea', 'but', 'conforama', 'maisons du monde',
      'orange', 'bouygues', 'free', 'sfr', 'red', 'sosh',
      'la poste', 'relay', 'point relais',
      'crédit agricole', 'société générale', 'bnp', 'caisse d\'épargne', 'banque populaire', 'crédit mutuel', 'lcl',
      'carrefour market', 'carrefour express', 'carrefour city', 'carrefour contact',
      'e.leclerc', 'leclerc drive', 'simply market',
      'système u', 'marché u', 'utile',
      'cora', 'match', 'géant', 'continent',
      'total', 'esso', 'shell', 'bp', 'elf', 'agip',
      'paul', 'la mie câline', 'brioche dorée', 'maison kayser',
      'jeff de bruges', 'leonidas', 'la cure gourmande',
      'go sport', 'intersport', 'sport 2000', 'decathlon',
      'norauto', 'feu vert', 'midas', 'speedy', 'euromaster',
      'mairie', 'préfecture', 'sous-préfecture', 'pôle emploi', 'caf',
      'cpam', 'sécurité sociale', 'hôpital', 'clinique',
    ];

    while (businesses.length < maxResults && attempts < maxAttempts) {
      attempts++;
      
      const searchResult = await this.nearbySearch(location, radius);
      const places = searchResult.results;

      for (const place of places) {
        if (businesses.length >= maxResults) break;

        // Skip duplicates
        if (seenPlaceIds.has(place.place_id)) {
          console.log(`Skipping duplicate: ${place.name}`);
          continue;
        }
        seenPlaceIds.add(place.place_id);

        // Filter out large chains
        const nameLower = place.name.toLowerCase();
        if (excludedNames.some(excluded => nameLower.includes(excluded))) {
          continue;
        }

        // Use data from nearby search if available (optimized to reduce API calls)
        let phoneNumber = place.formatted_phone_number;
        let website = place.website;

        // Only fetch details if phone or website is missing
        if (!phoneNumber || !website) {
          const details = await this.getPlaceDetails(place.place_id);
          if (details) {
            phoneNumber = phoneNumber || details.formatted_phone_number;
            website = website || details.website;
          }
          // Small delay only when we make an additional API call
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Only add if phone is available (website is optional)
        if (phoneNumber) {
          // Create a simple Google Maps link that works in new tabs
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
          
          businesses.push({
            nom: place.name,
            adresse: place.formatted_address || '',
            telephone: phoneNumber,
            site_web: website,
            lien_maps: mapsLink,
          });

          if (onProgress) {
            onProgress(businesses.length, maxResults);
          }
        }
      }

      if (businesses.length < maxResults) {
        radius = Math.min(radius * 1.5, 10000); // Rayon max augmenté à 10km
      }
    }

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
