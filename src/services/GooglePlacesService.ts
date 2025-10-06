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
    let radius = 300; // Démarrer avec un rayon très petit pour avoir beaucoup d'appels variés
    let attempts = 0;
    const maxAttempts = 50; // BEAUCOUP plus de tentatives
    let consecutiveEmptyResults = 0;

    // List of large chains and multinationals to exclude (réduit drastiquement)
    const excludedNames = [
      'mcdonalds', 'mcdonald', 'burger king', 'kfc', 'quick', 'subway',
      'starbucks', 'carrefour', 'auchan', 'leclerc', 'intermarché',
      'monoprix', 'franprix', 'aldi', 'lidl',
      'décathlon', 'leroy merlin', 'castorama',
      'fnac', 'darty',
      'ikea', 'but', 'conforama',
      'orange', 'bouygues', 'free', 'sfr',
      'la poste',
      'total', 'esso', 'shell', 'bp',
    ];

    while (businesses.length < maxResults && attempts < maxAttempts && consecutiveEmptyResults < 8) {
      attempts++;
      console.log(`🔍 Attempt ${attempts}: radius=${radius}m, found=${businesses.length}/${maxResults}`);
      
      // Faire plusieurs appels avec le même rayon si nécessaire
      const searchResult = await this.nearbySearch(location, radius);
      const places = searchResult.results;
      
      console.log(`📍 API returned ${places.length} places (before filtering)`);
      
      let newBusinessesInThisAttempt = 0;

      for (const place of places) {
        if (businesses.length >= maxResults) break;

        // Skip duplicates
        if (seenPlaceIds.has(place.place_id)) {
          continue;
        }
        seenPlaceIds.add(place.place_id);

        // Filter out ONLY the biggest chains (liste minimale)
        const nameLower = place.name.toLowerCase();
        const isMajorChain = excludedNames.some(excluded => nameLower.includes(excluded));
        
        if (isMajorChain) {
          console.log(`⛔ Filtered major chain: ${place.name}`);
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
          await new Promise(resolve => setTimeout(resolve, 50)); // Réduit à 50ms
        }

        // PLUS SOUPLE : Accepter si on a AU MOINS un moyen de contact
        // Priorité : téléphone > site web, mais accepter les deux
        if (phoneNumber || website) {
          console.log(`✅ Accepting: ${place.name} (phone: ${phoneNumber ? 'yes' : 'no'}, website: ${website ? 'yes' : 'no'})`);
          
          // Create a simple Google Maps link that works in new tabs
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
          
          businesses.push({
            nom: place.name,
            adresse: place.formatted_address || '',
            telephone: phoneNumber || 'Non disponible',
            site_web: website || 'Non disponible',
            lien_maps: mapsLink,
          });

          newBusinessesInThisAttempt++;

          if (onProgress) {
            onProgress(businesses.length, maxResults);
          }
        } else {
          console.log(`❌ Rejected (no contact): ${place.name}`);
        }
      }

      // Si on n'a trouvé aucune nouvelle entreprise, incrémenter le compteur
      if (newBusinessesInThisAttempt === 0) {
        consecutiveEmptyResults++;
        console.log(`⚠️ No new businesses in attempt ${attempts}, empty streak: ${consecutiveEmptyResults}`);
      } else {
        consecutiveEmptyResults = 0; // Réinitialiser si on a trouvé quelque chose
        console.log(`✅ Added ${newBusinessesInThisAttempt} new businesses (total: ${businesses.length}/${maxResults})`);
      }

      // Si on a encore besoin de plus d'entreprises
      if (businesses.length < maxResults && attempts < maxAttempts) {
        // Stratégie adaptative : augmenter progressivement le rayon
        if (places.length >= 15 && newBusinessesInThisAttempt > 0) {
          // Beaucoup de résultats et on a trouvé des nouveaux -> augmenter doucement
          radius = Math.min(radius * 1.4, 50000);
        } else if (newBusinessesInThisAttempt === 0) {
          // Aucun nouveau -> sauter plus loin
          radius = Math.min(radius * 3, 50000);
        } else {
          // Peu de résultats -> augmenter moyennement
          radius = Math.min(radius * 2, 50000);
        }
        console.log(`➡️ Next radius: ${radius}m`);
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    console.log(`🎯 Search completed: ${businesses.length}/${maxResults} businesses found after ${attempts} attempts`);

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
