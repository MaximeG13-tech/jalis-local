import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPEN_AI');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Liste complète des 158 types Google Places (ID - Label)
const BUSINESS_TYPES_LIST = `
- accounting - Comptable
- amusement_center - Centre de loisirs
- amusement_park - Parc d'attractions
- animal_shelter - Refuge pour animaux
- aquarium - Aquarium
- athletic_field - Terrain de sport
- atm - Distributeur automatique
- bakery - Boulangerie
- bank - Banque
- banquet_hall - Salle de banquet
- bar - Bar
- barbecue_restaurant - Restaurant barbecue
- beauty_salon - Salon de beauté
- bed_and_breakfast - Chambre d'hôtes
- bicycle_store - Magasin de vélos
- boat_dealer - Concessionnaire de bateaux
- boat_rental - Location de bateaux
- book_store - Librairie
- bowling_alley - Bowling
- brazilian_restaurant - Restaurant brésilien
- breakfast_restaurant - Restaurant petit-déjeuner
- brunch_restaurant - Restaurant brunch
- cafe - Café
- campground - Camping
- car_dealer - Concessionnaire automobile
- car_rental - Location de voitures
- car_repair - Garage automobile
- car_wash - Lave-auto
- casino - Casino
- cell_phone_store - Boutique de téléphones
- cemetery - Cimetière
- child_care_agency - Agence de garde d'enfants
- chinese_restaurant - Restaurant chinois
- clothing_store - Magasin de vêtements
- coffee_shop - Café
- community_college - Collège communautaire
- convention_center - Centre de congrès
- convenience_store - Épicerie
- country_club - Country club
- day_care - Crèche
- dentist - Dentiste
- department_store - Grand magasin
- discount_store - Magasin discount
- doctor - Médecin
- drugstore - Pharmacie
- dry_cleaning - Pressing
- electric_vehicle_charging_station - Borne de recharge électrique
- electrician - Électricien
- electronics_store - Magasin d'électronique
- elementary_school - École primaire
- event_venue - Salle d'événements
- extended_stay_hotel - Hôtel longue durée
- farm - Ferme
- fast_food_restaurant - Fast-food
- fitness_center - Centre de fitness
- florist - Fleuriste
- french_restaurant - Restaurant français
- funeral_home - Pompes funèbres
- furniture_store - Magasin de meubles
- gas_station - Station-service
- golf_course - Terrain de golf
- greek_restaurant - Restaurant grec
- grocery_store - Épicerie
- guest_house - Maison d'hôtes
- gym - Salle de sport
- hair_care - Coiffeur
- hair_salon - Salon de coiffure
- hamburger_restaurant - Restaurant hamburgers
- hardware_store - Quincaillerie
- health_spa - Spa santé
- high_school - Lycée
- hiking_area - Zone de randonnée
- home_goods_store - Magasin d'articles pour la maison
- home_improvement_store - Magasin de bricolage
- hospital - Hôpital
- hostel - Auberge de jeunesse
- hotel - Hôtel
- ice_cream_shop - Glacier
- indian_restaurant - Restaurant indien
- indonesian_restaurant - Restaurant indonésien
- insurance_agency - Agence d'assurance
- italian_restaurant - Restaurant italien
- japanese_restaurant - Restaurant japonais
- jewelry_store - Bijouterie
- korean_restaurant - Restaurant coréen
- laundry - Blanchisserie
- lawyer - Avocat
- library - Bibliothèque
- liquor_store - Magasin de spiritueux
- locksmith - Serrurier
- lodging - Hébergement
- meal_delivery - Livraison de repas
- meal_takeaway - Plats à emporter
- mediterranean_restaurant - Restaurant méditerranéen
- mexican_restaurant - Restaurant mexicain
- middle_eastern_restaurant - Restaurant du Moyen-Orient
- middle_school - Collège
- motel - Motel
- motorcycle_dealer - Concessionnaire de motos
- motorcycle_repair_shop - Garage moto
- movie_rental - Location de films
- movie_theater - Cinéma
- moving_company - Déménageur
- nail_salon - Salon de manucure
- national_park - Parc national
- night_club - Boîte de nuit
- painter - Peintre
- park - Parc
- parking - Parking
- pet_store - Animalerie
- pharmacy - Pharmacie
- physiotherapist - Kinésithérapeute
- pizza_restaurant - Pizzeria
- plumber - Plombier
- preschool - École maternelle
- primary_school - École primaire
- private_guest_room - Chambre privée
- real_estate_agency - Agence immobilière
- resort_hotel - Hôtel resort
- restaurant - Restaurant
- roofing_contractor - Couvreur
- rv_park - Parc pour camping-cars
- sandwich_shop - Sandwicherie
- seafood_restaurant - Restaurant de fruits de mer
- secondary_school - Collège
- shoe_store - Magasin de chaussures
- shopping_mall - Centre commercial
- spa - Spa
- spanish_restaurant - Restaurant espagnol
- sporting_goods_store - Magasin d'articles de sport
- sports_club - Club de sport
- sports_complex - Complexe sportif
- stadium - Stade
- steak_house - Steakhouse
- storage - Garde-meuble
- store - Magasin
- supermarket - Supermarché
- sushi_restaurant - Restaurant sushi
- swimming_pool - Piscine
- tailor - Tailleur
- tax_consultant - Consultant fiscal
- taxi_stand - Station de taxi
- thai_restaurant - Restaurant thaïlandais
- tourist_attraction - Attraction touristique
- travel_agency - Agence de voyage
- truck_dealer - Concessionnaire de camions
- truck_repair_shop - Garage poids lourds
- turkish_restaurant - Restaurant turc
- university - Université
- used_car_dealer - Concessionnaire voitures d'occasion
- vegan_restaurant - Restaurant vegan
- vegetarian_restaurant - Restaurant végétarien
- veterinary_care - Vétérinaire
- vietnamese_restaurant - Restaurant vietnamien
- visitor_center - Centre d'accueil
- wedding_venue - Lieu de mariage
- wholesaler - Grossiste
- zoo - Zoo
`;

async function extractPlaceIdFromUrl(url: string): Promise<string> {
  try {
    // Si lien court goo.gl ou maps.app.goo.gl, suivre la redirection
    if (url.includes('goo.gl')) {
      console.log('Following redirect for short URL:', url);
      const response = await fetch(url, { redirect: 'follow' });
      url = response.url;
      console.log('Redirected to:', url);
    }
    
    // Chercher place_id dans l'URL (plusieurs formats possibles)
    // Format 1: /place/NAME/data=...
    // Format 2: query_place_id=PLACE_ID
    const placeIdMatch = url.match(/place\/([^\/\?]+)/);
    if (placeIdMatch) {
      const placeId = decodeURIComponent(placeIdMatch[1]);
      console.log('Extracted place_id:', placeId);
      return placeId;
    }
    
    throw new Error("Impossible d'extraire l'ID du lieu depuis l'URL");
  } catch (error) {
    console.error('Error extracting place_id:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gmbLink } = await req.json();
    console.log('Processing GMB link:', gmbLink);

    if (!gmbLink) {
      throw new Error('Le lien Google My Business est requis');
    }

    // Étape 1: Extraire le place_id
    const placeId = await extractPlaceIdFromUrl(gmbLink);
    console.log('Place ID extracted:', placeId);

    // Étape 2: Appeler google-place-details pour obtenir les détails
    console.log('Calling google-place-details function...');
    const detailsResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/google-place-details`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ placeId }),
      }
    );

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Google Place Details error:', errorText);
      throw new Error(`Erreur lors de la récupération des détails: ${detailsResponse.status}`);
    }

    const placeDetails = await detailsResponse.json();
    console.log('Place details received:', placeDetails);

    const detectedActivity = placeDetails.result?.displayName?.text || 'Activité inconnue';
    const primaryType = placeDetails.result?.primaryType || '';
    
    console.log('Detected activity:', detectedActivity);
    console.log('Primary type:', primaryType);

    // Étape 3: Appeler GPT-4o pour obtenir les suggestions
    console.log('Calling GPT-4o for suggestions...');
    
    const prompt = `Tu es un expert en développement d'affaires locales.

Activité analysée : "${detectedActivity}"
Type Google détecté : "${primaryType}"

⚠️ RÈGLE CRITIQUE : Ne suggère JAMAIS "${primaryType}" car ce serait un CONCURRENT, pas un partenaire.

Voici les 158 types d'activités disponibles (format: id - label) :
${BUSINESS_TYPES_LIST}

Mission :
Sélectionne 3-5 types d'activités qui seraient les meilleurs APPORTEURS D'AFFAIRES pour cette activité.
Ce sont des activités dont les clients auraient naturellement besoin des services de l'activité analysée.

Réponds UNIQUEMENT avec un JSON dans ce format exact :
{
  "suggestions": ["type_id_1", "type_id_2", "type_id_3"]
}

Exemple pour "Orthophoniste" (primary_type = "speech_pathologist") :
{
  "suggestions": ["doctor", "physiotherapist", "hospital", "pharmacy"]
}

Règles absolues :
- Maximum 5 suggestions
- Ne suggère JAMAIS le type détecté ("${primaryType}")
- Ne suggère JAMAIS des concurrents directs
- Privilégie les synergies métier réelles (clients partagés)`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`Erreur GPT-4o: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('GPT-4o response:', openAIData);

    const gptContent = openAIData.choices[0].message.content;
    console.log('GPT-4o content:', gptContent);
    
    // Parser le JSON de la réponse GPT
    const suggestions = JSON.parse(gptContent);
    
    // Filtre de sécurité : Exclure le type détecté
    const filteredSuggestions = suggestions.suggestions.filter(
      (typeId: string) => typeId !== primaryType
    );

    console.log('Filtered suggestions:', filteredSuggestions);

    // Limiter à 5 suggestions max
    const finalSuggestions = filteredSuggestions.slice(0, 5);

    const result = {
      detected_activity: detectedActivity,
      primary_type: primaryType,
      suggestions: finalSuggestions
    };

    console.log('Returning result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-business-activity:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
