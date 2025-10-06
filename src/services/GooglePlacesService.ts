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
    let radius = 1000;
    let attempts = 0;
    const maxAttempts = 5;

    while (businesses.length < maxResults && attempts < maxAttempts) {
      attempts++;
      
      const searchResult = await this.nearbySearch(location, radius);
      const places = searchResult.results;

      for (const place of places) {
        if (businesses.length >= maxResults) break;

        const details = await this.getPlaceDetails(place.place_id);
        
        if (details) {
          if (details.formatted_phone_number && details.website) {
            businesses.push({
              nom: details.name,
              adresse: details.formatted_address || '',
              telephone: details.formatted_phone_number,
              site_web: details.website,
              lien_maps: details.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            });

            if (onProgress) {
              onProgress(businesses.length, maxResults);
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (businesses.length < maxResults) {
        radius = Math.min(radius * 1.5, 5000);
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
