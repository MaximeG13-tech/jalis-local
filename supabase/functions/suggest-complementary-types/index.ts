import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  companyName: string;
  address: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting suggest-complementary-types function');
    
    const { companyName, address }: RequestBody = await req.json();
    console.log('Request data:', { companyName, address });

    if (!companyName || !address) {
      throw new Error('Company name and address are required');
    }

    // Initialize Supabase client for Lovable AI
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const allTypes = [
      'accounting', 'lawyer', 'consultant',
      'real_estate_agency', 'insurance_agency', 'travel_agency', 'tour_agency',
      'plumber', 'electrician', 'painter', 'roofing_contractor', 'locksmith',
      'car_repair', 'car_dealer', 'car_rental', 'car_wash', 'auto_parts_store',
      'dentist', 'dental_clinic', 'doctor', 'physiotherapist', 'chiropractor', 'medical_lab',
      'hair_salon', 'hair_care', 'barber_shop', 'beauty_salon', 'beautician', 'nail_salon',
      'spa', 'massage', 'sauna', 'tanning_studio', 'skin_care_clinic', 'makeup_artist', 'body_art_service',
      'clothing_store', 'shoe_store', 'jewelry_store',
      'furniture_store', 'home_goods_store', 'home_improvement_store', 'hardware_store',
      'electronics_store', 'lighting_store',
      'bicycle_store', 'sporting_goods_store', 'book_store', 'gift_shop', 'toy_store',
      'pet_store', 'florist', 'garden_center',
      'liquor_store', 'butcher_shop',
      'veterinary_care', 'moving_company', 'storage', 'funeral_home', 'laundry', 'tailor',
      'courier_service', 'catering_service', 'telecommunications_service_provider', 'child_care_agency',
      'driving_school', 'preschool', 'primary_school', 'secondary_school', 'tutoring',
      'gym', 'fitness_center', 'yoga_studio', 'sports_club', 'sports_coaching',
      'martial_arts_dojo', 'dance_studio', 'golf_course', 'ice_skating_rink', 'bowling_alley',
      'hotel', 'bed_and_breakfast', 'guest_house', 'hostel', 'campground', 'rv_park', 'resort_hotel',
      'movie_theater', 'casino', 'amusement_park', 'amusement_center', 'aquarium', 'zoo',
      'night_club', 'karaoke', 'video_arcade', 'event_venue', 'banquet_hall', 'wedding_venue',
      'museum', 'art_gallery', 'performing_arts_theater',
      'astrologer', 'psychic',
      'restaurant', 'cafe', 'bakery', 'bar'
    ];

    const prompt = `Tu es un expert en réseaux d'affaires et en partenariats commerciaux.

Analyse cette entreprise :
- Nom: ${companyName}
- Adresse: ${address}

Ta mission : identifier exactement 5 types d'activités complémentaires (NON CONCURRENTES) qui pourraient être d'excellents apporteurs d'affaires pour cette entreprise.

RÈGLES STRICTES :
1. JAMAIS suggérer des concurrents directs
2. Privilégier les activités qui ont naturellement des clients qui pourraient avoir besoin des services de l'entreprise analysée
3. Penser en termes de "parcours client" - quels professionnels rencontrent des clients qui auraient ensuite besoin de cette entreprise ?
4. Choisir UNIQUEMENT parmi cette liste de types valides : ${allTypes.join(', ')}

EXEMPLES DE BONNES SUGGESTIONS :
- Pour un notaire : real_estate_agency (les agences ont des clients qui ont besoin de notaires)
- Pour un plombier : real_estate_agency, hardware_store, home_improvement_store
- Pour un vétérinaire : pet_store (apporteur d'affaires évident)
- Pour un coiffeur : beauty_salon, clothing_store, jewelry_store
- Pour un restaurant : hotel, travel_agency, event_venue

Réponds UNIQUEMENT avec un tableau JSON de 5 types d'activités sous ce format exact :
["type1", "type2", "type3", "type4", "type5"]

Ne fournis AUCUNE explication, UNIQUEMENT le tableau JSON.`;

    console.log('Calling Lovable AI with prompt');

    const { data, error } = await supabase.functions.invoke('lovable-ai', {
      body: {
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }
    });

    if (error) {
      console.error('Lovable AI error:', error);
      throw error;
    }

    console.log('Lovable AI response:', data);

    // Parse the AI response
    let suggestedTypes: string[] = [];
    try {
      const content = data.choices[0].message.content;
      // Extract JSON array from the response (handle potential markdown code blocks)
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        suggestedTypes = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to empty array if parsing fails
      suggestedTypes = [];
    }

    // Validate that suggested types are in the allowed list
    const validTypes = suggestedTypes.filter(type => allTypes.includes(type));
    
    console.log('Valid suggested types:', validTypes);

    return new Response(
      JSON.stringify({ suggestedTypes: validTypes.slice(0, 5) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in suggest-complementary-types:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        suggestedTypes: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
