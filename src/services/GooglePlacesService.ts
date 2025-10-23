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

  // Corrige le type d'activité basé sur le nom du business pour les professions mal catégorisées par Google
  private static correctActivityType(businessName: string, _originalType: string): string {
    const nameLower = businessName.toLowerCase();
    
    // Mapping des professions mal catégorisées par Google
    const corrections: Record<string, { keywords: string[], correctType: string }> = {
      'notaire': {
        keywords: ['notaire', 'notarial'],
        correctType: 'Notaire'
      },
      'avocat': {
        keywords: ['avocat', 'cabinet d\'avocat', 'conseil juridique'],
        correctType: 'Avocat'
      },
      'huissier': {
        keywords: ['huissier', 'huissier de justice'],
        correctType: 'Huissier de justice'
      },
      'expert-comptable': {
        keywords: ['expert-comptable', 'expert comptable', 'cabinet comptable', 'comptabilité'],
        correctType: 'Expert-comptable'
      }
    };

    // Parcourir les corrections possibles
    for (const config of Object.values(corrections)) {
      if (config.keywords.some(keyword => nameLower.includes(keyword))) {
        console.log(`✅ Correction détectée: "${businessName}" → ${config.correctType}`);
        return config.correctType;
      }
    }

    return '';
  }

  private static getActivityType(
    place: GooglePlace,
    selectedTypes: BusinessType[]
  ): string {
    // Correction basée sur le nom pour les professions mal catégorisées
    const correctType = this.correctActivityType(place.name, '');
    if (correctType !== '') {
      return correctType;
    }

    // PRIORITÉ 1 : Utiliser primaryTypeDisplayName de Google (le plus précis)
    if (place.primary_type_display_name) {
      return place.primary_type_display_name;
    }

    // PRIORITÉ 2 : Utiliser le type sélectionné par l'utilisateur
    if (selectedTypes.length > 0 && selectedTypes[0].id !== 'all') {
      return selectedTypes[0].label;
    }

    // PRIORITÉ 3 : Fallback sur l'ancien système
    if (place.types && place.types.length > 0) {
      const typeMap: Record<string, string> = {
        'restaurant': 'Restaurant',
        'cafe': 'Café',
        'bakery': 'Boulangerie',
        'store': 'Magasin',
        'health': 'Santé',
        'beauty_salon': 'Salon de beauté',
        'gym': 'Salle de sport',
      };
      return typeMap[place.types[0]] || place.types[0];
    }

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
