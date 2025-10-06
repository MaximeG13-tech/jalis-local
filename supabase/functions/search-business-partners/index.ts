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

    // Search for businesses in each category
    for (const category of categories.slice(0, 5)) { // Limit to 5 categories to avoid too many API calls
      if (businesses.length >= maxResults) break;

      console.log(`Searching for category: ${category}`);
      
      // Use the google-nearby-search edge function
      const { data: nearbyData, error: nearbyError } = await supabase.functions.invoke('google-nearby-search', {
        body: { 
          placeId,
          keyword: category,
          maxResults: businessesPerCategory
        }
      });

      if (nearbyError) {
        console.error(`Error searching for ${category}:`, nearbyError);
        continue;
      }

      if (nearbyData?.results) {
        for (const placeId of nearbyData.results.slice(0, businessesPerCategory)) {
          if (businesses.length >= maxResults) break;

          // Get detailed information using google-place-details edge function
          const { data: detailsData, error: detailsError } = await supabase.functions.invoke('google-place-details', {
            body: { placeId }
          });

          if (detailsError || !detailsData?.result) {
            console.error(`Error getting details for ${placeId}:`, detailsError);
            continue;
          }

          const result = detailsData.result;
          
          // Skip if we've already added this business
          const businessKey = `${result.name}-${result.formatted_address}`;
          if (seenBusinesses.has(businessKey)) continue;
          
          businesses.push({
            nom: result.name || '',
            adresse: result.formatted_address || '',
            telephone: result.formatted_phone_number || '',
            site_web: result.website || '',
            lien_maps: result.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
          });

          seenBusinesses.add(businessKey);

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
