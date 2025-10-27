import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius, includedType } = await req.json();

    console.log("Nearby search params:", { latitude, longitude, radius, includedType });

    // Build included types array - only valid Google Places API types
    const includedTypes = includedType && includedType !== 'all'
      ? [includedType]
      : [
          // Services juridiques et professionnels
          'accounting', 'lawyer', 'consultant',
          // Immobilier et assurance
          'real_estate_agency', 'insurance_agency', 'travel_agency', 'tour_agency',
          // Artisans
          'electrician', 'plumber', 'painter', 'roofing_contractor', 'locksmith',
          // Automobile
          'car_repair', 'car_dealer', 'car_rental', 'car_wash', 'auto_parts_store',
          // Santé
          'dentist', 'dental_clinic', 'doctor', 'physiotherapist', 'chiropractor', 'medical_lab',
          // Bien-être et beauté
          'hair_salon', 'hair_care', 'barber_shop', 'beauty_salon', 'beautician',
          'nail_salon', 'spa', 'massage', 'sauna',
          // Commerce
          'clothing_store', 'shoe_store', 'jewelry_store', 'furniture_store',
          'electronics_store', 'hardware_store', 'bicycle_store', 'sporting_goods_store',
          'book_store', 'gift_shop', 'pet_store', 'florist',
          // Services
          'veterinary_care', 'moving_company', 'storage', 'funeral_home', 'laundry',
          'tailor', 'courier_service', 'catering_service',
          // Sport et fitness
          'gym', 'fitness_center', 'yoga_studio', 'sports_club', 'bowling_alley',
          // Hébergement
          'hotel', 'bed_and_breakfast', 'guest_house', 'campground', 'rv_park',
        ];

    console.log('Included types for search:', includedType ? `[${includedType}]` : 'default list');

    // Call new Places API (New) Nearby Search
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY!,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.types,places.googleMapsUri",
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
        rankPreference: "DISTANCE",
      }),
    });

    const data = await response.json();
    console.log("Nearby search response:", data);

    if (!response.ok) {
      console.error("Google API error:", data);
      // Return empty results instead of throwing to prevent breaking the search
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform and include all available data to minimize additional API calls
    const results = (data.places || []).map((place: any) => ({
      place_id: place.id?.replace("places/", "") || "",
      name: place.displayName?.text || "",
      formatted_address: place.formattedAddress || "",
      formatted_phone_number: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
      website: place.websiteUri || "",
      url: place.googleMapsUri || "", // Use native Google URL only
      types: place.types || [],
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      },
    }));

    console.log(`Found ${results.length} places in this search`);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in google-nearby-search function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage, results: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
