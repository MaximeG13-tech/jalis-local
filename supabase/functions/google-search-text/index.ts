import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textQuery, latitude, longitude, maxResultCount } = await req.json();

    console.log("Recherche Google Places (searchText):", {
      textQuery,
      latitude,
      longitude,
      maxResultCount,
    });

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY!,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.primaryType,places.types,places.location",
        },
        body: JSON.stringify({
          textQuery,
          languageCode: "fr",
          maxResultCount: maxResultCount || 10,
          locationBias: {
            circle: {
              center: {
                latitude,
                longitude,
              },
              radius: 10000, // 10km radius
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API Google Places:", response.status, errorText);
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Résultats trouvés: ${data.places?.length || 0}`);

    // Transform to match existing frontend format
    const transformedResults = (data.places || []).map((place: any) => ({
      place_id: place.id,
      name: place.displayName?.text || "N/A",
      formatted_address: place.formattedAddress || "N/A",
      international_phone_number: place.internationalPhoneNumber || "N/A",
      website: place.websiteUri || "N/A",
      url: place.googleMapsUri || "N/A",
      types: place.types || [],
      primaryType: place.primaryType || "",
      geometry: place.location
        ? {
            location: {
              lat: place.location.latitude,
              lng: place.location.longitude,
            },
          }
        : null,
    }));

    return new Response(JSON.stringify({ results: transformedResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur dans google-search-text:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
