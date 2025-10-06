import { Business, GooglePlace } from '@/types/business';
import { GOOGLE_PLACES_API_KEY } from '@/config/api.config';

export class GooglePlacesService {
  private static readonly API_KEY = GOOGLE_PLACES_API_KEY;
  private static baseUrl = 'https://maps.googleapis.com/maps/api/place';

  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${this.API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  static async nearbySearch(
    location: { lat: number; lng: number },
    radius: number,
    pageToken?: string
  ): Promise<{ results: GooglePlace[]; next_page_token?: string }> {
    let url = `${this.baseUrl}/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&key=${this.API_KEY}`;
    
    if (pageToken) {
      url = `${this.baseUrl}/nearbysearch/json?pagetoken=${pageToken}&key=${this.API_KEY}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        return {
          results: data.results || [],
          next_page_token: data.next_page_token,
        };
      }
      throw new Error(`API Error: ${data.status}`);
    } catch (error) {
      console.error('Nearby search error:', error);
      throw error;
    }
  }

  static async getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,url&key=${this.API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        return data.result;
      }
      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  static async searchBusinesses(
    address: string,
    maxResults: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<Business[]> {
    // Geocode address
    const location = await this.geocodeAddress(address);
    if (!location) {
      throw new Error('Unable to geocode address');
    }

    const businesses: Business[] = [];
    let radius = 1000; // Start with 1km
    let attempts = 0;
    const maxAttempts = 5;

    while (businesses.length < maxResults && attempts < maxAttempts) {
      attempts++;
      
      // Nearby search
      const searchResult = await this.nearbySearch(location, radius);
      const places = searchResult.results;

      // Process each place
      for (const place of places) {
        if (businesses.length >= maxResults) break;

        // Get detailed info
        const details = await this.getPlaceDetails(place.place_id);
        
        if (details) {
          // Filter: must have phone AND website
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

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // If we need more results, expand radius
      if (businesses.length < maxResults && searchResult.next_page_token) {
        // Wait for next_page_token to become valid (required by Google)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const nextPageResult = await this.nearbySearch(location, radius, searchResult.next_page_token);
        const nextPlaces = nextPageResult.results;

        for (const place of nextPlaces) {
          if (businesses.length >= maxResults) break;

          const details = await this.getPlaceDetails(place.place_id);
          
          if (details && details.formatted_phone_number && details.website) {
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

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Increase radius for next attempt
      if (businesses.length < maxResults) {
        radius = Math.min(radius * 1.5, 5000); // Max 5km
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
