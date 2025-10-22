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

  private static getActivityType(types: string[]): string {
    if (types.length === 0) return 'Autre';
    
    // Map common types to French labels
    const typeMap: Record<string, string> = {
      'restaurant': 'Restaurant',
      'cafe': 'Café',
      'bakery': 'Boulangerie',
      'store': 'Magasin',
      'health': 'Santé',
      'beauty_salon': 'Salon de beauté',
      'gym': 'Salle de sport',
    };

    return typeMap[types[0]] || types[0];
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
            
            // Skip if we already have this place
            if (allBusinesses.some(b => b.lien_maps === place.url)) {
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
            
            // Determine activity type from selected types or use the first type
            const activityType = selectedTypes.length > 0 && selectedTypes[0].id !== 'all'
              ? selectedTypes[0].label
              : this.getActivityType(details.types || []);
            
            const business: Business = {
              nom: details.name,
              type_activite: activityType,
              adresse: details.formatted_address || '',
              telephone: details.formatted_phone_number || 'Non disponible',
              site_web: details.website || 'Non disponible',
              lien_maps: details.url || ''
            };
            
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
    return allBusinesses.slice(0, maxResults);
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
