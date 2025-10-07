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
    const { latitude, longitude, radius, includedType } = await req.json();

    console.log('Nearby search params:', { latitude, longitude, radius, includedType });

    // Build included types array - TPE/PME uniquement (pas de professions libérales ni restaurants)
    const includedTypes = includedType ? [includedType] : [
          // Artisans et services
          'plumber',
          'electrician',
          'painter',
          'roofing_contractor',
          'general_contractor',
          
          // Salons et beauté
          'hair_care',
          'beauty_salon',
          'spa',
          
          // Magasins indépendants
          'clothing_store',
          'shoe_store',
          'jewelry_store',
          'florist',
          'book_store',
          'home_goods_store',
          'store',
          'bakery',
          
          // Commerce et services
          'pet_store',
          'electronics_store',
          'furniture_store',
          'hardware_store',
          'bicycle_store',
          
          // Automobile
          'car_repair',
          'car_dealer',
          'car_wash',
          
          // Agences
          'real_estate_agency',
          'insurance_agency',
          'travel_agency',
          
          // Hébergement
          'lodging',
          
          // Sport et bien-être
          'gym',
          
          // Vétérinaires
          'veterinary_care',
          
          // Loisirs et culture
          'tourist_attraction',
          'movie_theater',
          'art_gallery',
          'museum',
    ];

    // Call new Places API (New) Nearby Search
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY!,
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
        includedTypes: includedTypes,
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

    console.log(`Found ${results.length} places in this search`);

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
