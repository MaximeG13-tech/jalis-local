import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textQuery, latitude, longitude, radius = 5000, maxResults = 20, includedType } = await req.json();

    console.log('Text Search request:', { textQuery, latitude, longitude, radius, maxResults, includedType });

    if (!textQuery || !latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'textQuery, latitude, and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const requestBody: any = {
      textQuery,
      locationBias: {
        circle: {
          center: {
            latitude,
            longitude
          },
          radius
        }
      },
      maxResultCount: maxResults,
      rankPreference: "DISTANCE",
      languageCode: "fr"
    };

    // Add includedTypes filter if provided
    if (includedType && includedType !== 'all') {
      requestBody.includedTypes = [includedType];
      console.log('Filtering by type:', includedType);
    }

    console.log('Calling Google Text Search API with body:', JSON.stringify(requestBody));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY || '',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.primaryTypeDisplayName,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Google API request failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Google API response:', JSON.stringify(data));

    // Transform the response to match the expected format
    const results = (data.places || []).map((place: any) => ({
      place_id: place.id,
      name: place.displayName?.text || '',
      formatted_address: place.formattedAddress || '',
      formatted_phone_number: place.internationalPhoneNumber || '',
      website: place.websiteUri || '',
      url: place.googleMapsUri || '',
      types: place.types || [],
      primary_type: place.primaryType || '',
      primary_type_display_name: place.primaryTypeDisplayName?.text || '',
      geometry: place.location ? {
        location: {
          lat: place.location.latitude,
          lng: place.location.longitude
        }
      } : undefined
    }));

    console.log(`Returning ${results.length} results`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-text-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
