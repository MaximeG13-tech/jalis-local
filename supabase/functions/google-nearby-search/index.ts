import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius } = await req.json();

    console.log('Nearby search params:', { latitude, longitude, radius });

    // Call new Places API (New) Nearby Search with optimized fields and filters
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY!,
        // Request all needed fields in one call to minimize API costs
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.types,places.googleMapsUri',
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: {
              latitude,
              longitude,
            },
            radius: radius || 1000,
          },
        },
        // Include only business establishments - prioritized types
        includedTypes: [
          // Priorité 1: Restaurants, bars, cafés
          'restaurant',
          'cafe',
          'bar',
          
          // Priorité 2: Boulangeries, pâtisseries, traiteurs
          'bakery',
          'meal_takeaway',
          'meal_delivery',
          
          // Priorité 3: Salons de coiffure, beauté, barbiers
          'hair_care',
          'beauty_salon',
          'barber',
          
          // Priorité 4: Magasins indépendants
          'clothing_store',
          'shoe_store',
          'jewelry_store',
          'florist',
          'book_store',
          'home_goods_store',
          'store',
          
          // Priorité 5: Artisans du bâtiment
          'plumber',
          'electrician',
          'general_contractor',
          'painter',
          'roofing_contractor',
          
          // Priorité 6: Paysagistes, jardiniers
          'landscaper',
          
          // Priorité 7: Professionnels de santé
          'physiotherapist',
          'doctor',
          'dentist',
          'optician',
          
          // Priorité 8: Sport et bien-être
          'gym',
          'spa',
          
          // Priorité 9: Vétérinaires
          'veterinary_care',
          
          // Priorité 10: Immobilier et services financiers
          'real_estate_agency',
          'insurance_agency',
          
          // Priorité 11: Hébergement
          'lodging',
          
          // Priorité 12: Loisirs
          'tourist_attraction',
          'night_club',
          'movie_theater',
          
          // Priorité 13: Agences de voyage
          'travel_agency',
          
          // Autres commerces
          'pet_store',
          'electronics_store',
          'furniture_store',
          'hardware_store',
          'car_repair',
          'car_dealer',
          'car_wash',
          'bicycle_store',
          'accounting',
          'lawyer',
          'pharmacy',
          'art_gallery',
          'museum',
        ],
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
      }),
    });

    const data = await response.json();
    console.log('Nearby search response:', data);

    if (!response.ok) {
      console.error('Google API error:', data);
      throw new Error(data.error?.message || 'Failed to fetch nearby places');
    }

    // Transform and include all available data to minimize additional API calls
    const results = (data.places || []).map((place: any) => ({
      place_id: place.id?.replace('places/', '') || '',
      name: place.displayName?.text || '',
      formatted_address: place.formattedAddress || '',
      formatted_phone_number: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
      website: place.websiteUri || '',
      url: place.googleMapsUri || '',
      types: place.types || [],
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      },
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-nearby-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
