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

    // Build included types array - TPE/PME uniquement (pas de professions libérales ni restaurants)
    const includedTypes = includedType
      ? [includedType]
      : [
          // Artisans et services
          "electrician",
          "plumber",
          "general_contractor",
          "mason",
          "carpenter",
          "roofer",
          "painter",
          "landscaper",
          "isolation_specialist",
          "locksmith",
          "glazier",
          "air_conditioning_specialist",
          "veranda_installer",
          "security_specialist",

          // Santé & paramédical
          "doctor",
          "dentist",
          "orthodontist",
          "physiotherapist",
          "osteopath",
          "nurse",
          "psychologist",
          "nutritionist",
          "veterinary_care",

          // Professions juridiques et conseil
          "lawyer",
          "notary",
          "accountant",
          "financial_advisor",
          "insurance_agent",
          "management_consultant",

          // Immobilier et habitat
          "real_estate_agency",
          "property_manager",
          "property_developer",
          "architect",
          "interior_designer",

          // Services à la personne
          "hair_care",
          "beauty_salon",
          "spa",
          "photographer",
          "home_cleaning_service",

          // Éducation & formation
          "training_center",
          "private_school",
          "tutoring_service",
          "independent_trainer",

          // Automobile
          "car_repair",
          "car_body_shop",
          "car_dealer",
          "driving_school",

          // Restauration haut de gamme
          "restaurant",
          "caterer",

          // Sport et bien-être
          "gym",
          "personal_trainer",
        ];

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
      throw new Error(data.error?.message || "Failed to fetch nearby places");
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
