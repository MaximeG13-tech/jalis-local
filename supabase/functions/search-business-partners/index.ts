import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activityDescription, address, placeId, maxResults } = await req.json();

    console.log('Searching business partners with params:', { activityDescription, address, maxResults });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    if (!GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY not configured');

    // Step 1: Generate partner categories using AI
    console.log('Step 1: Generating partner categories...');
    const categoryPrompt = `Tu es un expert en développement commercial B2B. Analyse cette activité et cette localisation pour identifier 8 à 12 catégories d'entreprises qui pourraient être d'excellents rapporteurs d'affaires (partenaires commerciaux).

Activité du client : ${activityDescription}
Localisation : ${address}

CRITÈRES IMPORTANTS :
- Les entreprises doivent être complémentaires (PAS des concurrents directs)
- Elles doivent servir la même clientèle cible
- Ce doivent être des TPE/PME locales (PAS de grandes chaînes nationales)
- Éviter les administrations, collectivités, institutions publiques

Retourne uniquement un tableau JSON de catégories sous ce format :
["Catégorie 1", "Catégorie 2", ...]

Exemple pour un vendeur de camping-cars :
["Garages spécialisés en mécanique de camping-cars", "Aires de services pour camping-cars", "Accessoiristes camping-car", "Agents immobiliers spécialisés résidences secondaires", "Loueurs de matériel de loisirs"]`;

    const categoryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: categoryPrompt }],
      }),
    });

    const categoryData = await categoryResponse.json();
    const categoriesText = categoryData.choices[0].message.content;
    const categories = JSON.parse(categoriesText.replace(/```json\n?|\n?```/g, ''));
    console.log('Generated categories:', categories);

    // Step 2: Search businesses using Google Places API for each category
    console.log('Step 2: Searching businesses via Google Places...');
    const businesses: any[] = [];
    const seenBusinesses = new Set<string>();

    // Get place details to extract coordinates
    const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`;
    const placeDetailsResponse = await fetch(placeDetailsUrl);
    const placeDetails = await placeDetailsResponse.json();
    
    if (placeDetails.status !== 'OK') {
      throw new Error(`Failed to get place details: ${placeDetails.status}`);
    }

    const location = placeDetails.result.geometry.location;
    const lat = location.lat;
    const lng = location.lng;

    // Search for businesses in each category
    for (const category of categories) {
      if (businesses.length >= maxResults) break;

      console.log(`Searching for category: ${category}`);
      
      const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=${encodeURIComponent(category)}&key=${GOOGLE_PLACES_API_KEY}`;
      const nearbyResponse = await fetch(nearbySearchUrl);
      const nearbyData = await nearbyResponse.json();

      if (nearbyData.status === 'OK' && nearbyData.results) {
        for (const place of nearbyData.results) {
          if (businesses.length >= maxResults) break;

          // Skip if we've already added this business
          const businessKey = `${place.name}-${place.vicinity}`;
          if (seenBusinesses.has(businessKey)) continue;

          // Get detailed information
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,url&key=${GOOGLE_PLACES_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const details = await detailsResponse.json();

          if (details.status === 'OK' && details.result) {
            const result = details.result;
            
            businesses.push({
              nom: result.name || '',
              adresse: result.formatted_address || '',
              telephone: result.formatted_phone_number || '',
              site_web: result.website || '',
              lien_maps: result.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            });

            seenBusinesses.add(businessKey);
          }

          // Small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    console.log(`Found ${businesses.length} businesses`);

    return new Response(JSON.stringify({ businesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-business-partners:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
