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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Create Supabase client to call other edge functions
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Step 2: Search businesses using existing edge functions for each category
    console.log('Step 2: Searching businesses via edge functions...');
    const businesses: any[] = [];
    const seenBusinesses = new Set<string>();
    const businessesPerCategory = Math.ceil(maxResults / Math.min(categories.length, 5));

    // First, get coordinates from placeId
    const { data: placeData, error: placeError } = await supabase.functions.invoke('google-place-details', {
      body: { placeId }
    });

    if (placeError || !placeData?.result?.geometry?.location) {
      throw new Error('Failed to get location coordinates');
    }

    const { lat, lng } = placeData.result.geometry.location;
    console.log('Search center coordinates:', { lat, lng });

    // Progressive radius search: start small, expand if needed
    const radiusSteps = [5000, 10000, 20000, 50000]; // 5km, 10km, 20km, 50km

    // Search for businesses in each category with progressive radius
    for (const category of categories.slice(0, 5)) { // Limit to 5 categories
      if (businesses.length >= maxResults) break;

      console.log(`Searching for category: ${category}`);
      
      // Try each radius until we find enough businesses
      for (const radius of radiusSteps) {
        if (businesses.length >= maxResults) break;

        console.log(`Trying radius: ${radius}m`);
        
        // Use the google-nearby-search edge function with current radius
        const { data: nearbyData, error: nearbyError } = await supabase.functions.invoke('google-nearby-search', {
          body: { 
            latitude: lat,
            longitude: lng,
            radius: radius
          }
        });

        if (nearbyError) {
          console.error(`Error searching at radius ${radius}:`, nearbyError);
          continue;
        }

        if (nearbyData?.results && nearbyData.results.length > 0) {
          console.log(`Found ${nearbyData.results.length} places at ${radius}m radius`);
          
          // Filter results by category keyword
          const relevantResults = nearbyData.results.filter((result: any) => {
            const searchText = `${result.name} ${result.types?.join(' ')}`.toLowerCase();
            const keywords = category.toLowerCase().split(' ');
            return keywords.some((keyword: string) => searchText.includes(keyword));
          });

          console.log(`${relevantResults.length} relevant results for category "${category}"`);

          for (const result of relevantResults.slice(0, businessesPerCategory)) {
            if (businesses.length >= maxResults) break;

            // Skip if we've already added this business
            const businessKey = `${result.name}-${result.formatted_address}`;
            if (seenBusinesses.has(businessKey)) continue;
            
            businesses.push({
              nom: result.name || '',
              adresse: result.formatted_address || '',
              telephone: result.formatted_phone_number || '',
              site_web: result.website || '',
              lien_maps: result.url || `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
            });

            seenBusinesses.add(businessKey);
          }

          // If we found enough businesses for this category, move to next category
          if (relevantResults.length >= businessesPerCategory) {
            break; // Break radius loop, move to next category
          }
        }

        // Small delay between radius attempts
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Small delay between categories
      await new Promise(resolve => setTimeout(resolve, 300));
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
