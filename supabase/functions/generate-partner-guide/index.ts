import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEPARTMENT_MAP: Record<string, string> = {
  "01": "dans l'Ain", "02": "dans l'Aisne", "03": "dans l'Allier",
  "04": "dans les Alpes-de-Haute-Provence", "05": "dans les Hautes-Alpes",
  "06": "dans les Alpes-Maritimes", "07": "dans l'Ardèche", "08": "dans les Ardennes",
  "09": "dans l'Ariège", "10": "dans l'Aube", "11": "dans l'Aude", "12": "dans l'Aveyron",
  "13": "dans les Bouches-du-Rhône", "14": "dans le Calvados", "15": "dans le Cantal",
  "16": "dans la Charente", "17": "dans la Charente-Maritime", "18": "dans le Cher",
  "19": "en Corrèze", "2A": "dans la Corse-du-Sud", "2B": "en Haute-Corse",
  "21": "dans la Côte-d'Or", "22": "dans les Côtes-d'Armor", "23": "dans la Creuse",
  "24": "en Dordogne", "25": "dans le Doubs", "26": "dans la Drôme", "27": "dans l'Eure",
  "28": "dans l'Eure-et-Loir", "29": "dans le Finistère", "30": "dans le Gard",
  "31": "dans la Haute-Garonne", "32": "dans le Gers", "33": "dans la Gironde",
  "34": "dans l'Hérault", "35": "dans l'Ille-et-Vilaine", "36": "dans l'Indre",
  "37": "dans l'Indre-et-Loire", "38": "dans l'Isère", "39": "dans le Jura",
  "40": "dans les Landes", "41": "dans le Loir-et-Cher", "42": "dans la Loire",
  "43": "dans la Haute-Loire", "44": "dans la Loire-Atlantique", "45": "dans le Loiret",
  "46": "dans le Lot", "47": "dans le Lot-et-Garonne", "48": "dans la Lozère",
  "49": "dans le Maine-et-Loire", "50": "dans la Manche", "51": "dans la Marne",
  "52": "dans la Haute-Marne", "53": "dans la Mayenne", "54": "dans la Meurthe-et-Moselle",
  "55": "dans la Meuse", "56": "dans le Morbihan", "57": "dans la Moselle",
  "58": "dans la Nièvre", "59": "dans le Nord", "60": "dans l'Oise", "61": "dans l'Orne",
  "62": "dans le Pas-de-Calais", "63": "dans le Puy-de-Dôme", "64": "dans les Pyrénées-Atlantiques",
  "65": "dans les Hautes-Pyrénées", "66": "dans les Pyrénées-Orientales",
  "67": "dans le Bas-Rhin", "68": "dans le Haut-Rhin", "69": "dans le Rhône",
  "70": "dans la Haute-Saône", "71": "dans la Saône-et-Loire", "72": "dans la Sarthe",
  "73": "en Savoie", "74": "en Haute-Savoie", "75": "dans Paris",
  "76": "dans la Seine-Maritime", "77": "dans la Seine-et-Marne", "78": "dans les Yvelines",
  "79": "dans les Deux-Sèvres", "80": "dans la Somme", "81": "dans le Tarn",
  "82": "dans le Tarn-et-Garonne", "83": "dans le Var", "84": "dans le Vaucluse",
  "85": "dans la Vendée", "86": "dans la Vienne", "87": "dans la Haute-Vienne",
  "88": "dans les Vosges", "89": "dans l'Yonne", "90": "dans le Territoire de Belfort",
  "91": "dans l'Essonne", "92": "dans les Hauts-de-Seine", "93": "dans la Seine-Saint-Denis",
  "94": "dans le Val-de-Marne", "95": "dans le Val-d'Oise",
  "971": "en Guadeloupe", "972": "en Martinique", "973": "en Guyane",
  "974": "à La Réunion", "976": "à Mayotte",
};

function extractPostalCode(address: string): string | null {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

function formatCity(address: string): string {
  const postalCode = extractPostalCode(address);
  if (!postalCode) return address;
  
  const cityMatch = address.match(/\d{5}\s+([^,]+)/);
  const cityName = cityMatch ? cityMatch[1].trim() : address;
  
  const deptCode = postalCode.substring(0, 2);
  const deptPhrase = DEPARTMENT_MAP[deptCode] || DEPARTMENT_MAP[postalCode.substring(0, 3)] || "";
  
  return `${cityName} (${postalCode}) ${deptPhrase}`.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activityDescription, address, maxResults } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting partner guide generation for:', activityDescription);

    // Étape 1: Génération des catégories de rapporteurs d'affaires
    const categoriesPrompt = `Tu es un expert en développement commercial et partenariats.

Activité de l'entreprise : ${activityDescription}
Localisation : ${address}

Mission : Génère une liste de 8 à 12 catégories d'entreprises qui seraient des RAPPORTEURS D'AFFAIRES pertinents (PAS des concurrents).

Un rapporteur d'affaires est une entreprise qui :
- Peut recommander ou orienter des clients vers l'entreprise décrite
- Offre des services complémentaires (pas identiques)
- Cible une clientèle similaire
- Pourrait bénéficier d'un partenariat gagnant-gagnant

Exemples pour une entreprise vendant des camping-cars :
✅ Garages spécialisés en mécanique de camping-cars
✅ Aires de services pour camping-cars
✅ Magasins d'accessoires pour camping-cars
✅ Agents d'assurance véhicules de loisirs
❌ Autres concessionnaires de camping-cars (concurrent direct)

Réponds UNIQUEMENT avec un tableau JSON de catégories (chaînes de caractères courtes et précises).
Format attendu : ["catégorie 1", "catégorie 2", ...]`;

    const categoriesResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
         body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Tu es un expert en analyse commerciale. Tu réponds toujours avec du JSON valide uniquement.' },
            { role: 'user', content: categoriesPrompt }
          ],
        }),
    });

    if (!categoriesResponse.ok) {
      throw new Error(`Categories generation failed: ${categoriesResponse.status}`);
    }

    const categoriesData = await categoriesResponse.json();
    let categories: string[];
    
    try {
      const content = categoriesData.choices[0].message.content;
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      categories = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse categories:', categoriesData.choices[0].message.content);
      throw new Error('Invalid JSON from categories generation');
    }

    console.log('Generated categories:', categories);

    // Étape 2 & 3: Recherche et enrichissement pour chaque catégorie
    const enrichedBusinesses = [];
    const businessesPerCategory = Math.ceil(maxResults / categories.length);
    
    for (const category of categories) {
      if (enrichedBusinesses.length >= maxResults) break;

      console.log(`Searching for category: ${category}`);

      const searchPrompt = `Recherche web en temps réel pour : ${category} près de ${address}

CONSIGNES STRICTES :
1. Trouve ${businessesPerCategory} entreprises réelles qui correspondent exactement à la catégorie "${category}"
2. Zone géographique : dans un rayon de 50km autour de ${address}
3. Pour CHAQUE entreprise, tu DOIS vérifier et fournir :
   - Le nom exact et complet de l'entreprise
   - L'adresse postale complète avec code postal
   - Le numéro de téléphone (si disponible, sinon "Non renseigné")
   - Le site web (si disponible, sinon "Non renseigné")
   - Une brève description de l'activité réelle de l'entreprise basée sur tes recherches

4. NE PAS inventer d'informations - tout doit être vérifié via la recherche web
5. Ne pas inclure de grandes chaînes nationales ou franchises
6. Privilégier les TPE/PME locales

Réponds avec un tableau JSON d'objets avec ces champs exacts :
{
  "nom": "Nom de l'entreprise",
  "adresse": "Adresse complète avec code postal",
  "telephone": "Numéro ou 'Non renseigné'",
  "site_web": "URL ou 'Non renseigné'",
  "lien_maps": "URL Google Maps si trouvé, sinon ''",
  "activite_reelle": "Description courte de l'activité réelle trouvée"
}`;

      const searchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'Tu es un assistant de recherche web. Tu effectues des recherches en temps réel et réponds avec du JSON valide uniquement. Tu ne dois jamais inventer d\'informations.'
              },
              { role: 'user', content: searchPrompt }
            ],
          }),
      });

      if (!searchResponse.ok) {
        console.error(`Search failed for category ${category}`);
        continue;
      }

      const searchData = await searchResponse.json();
      let businesses;
      
      try {
        const content = searchData.choices[0].message.content;
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        businesses = JSON.parse(cleanContent);
      } catch (e) {
        console.error(`Failed to parse businesses for ${category}:`, searchData.choices[0].message.content);
        continue;
      }

      // Étape 3: Enrichissement de chaque entreprise trouvée
      for (const business of businesses) {
        if (enrichedBusinesses.length >= maxResults) break;

        const enrichPrompt = `Tu es un expert en rédaction de contenus pour annuaires professionnels locaux. 

Entreprise à traiter :
- Nom : ${business.nom}
- Adresse : ${business.adresse}
- Téléphone : ${business.telephone}
- Site web : ${business.site_web}
- Activité réelle : ${business.activite_reelle}

Instructions strictes :

1. **activity** : Une phrase descriptive et unique de plus de 17 mots qui reformule la catégorie "${category}" de manière engageante pour un annuaire. Utilise des tournures de phrases variées et professionnelles, par exemple en commençant par "Entreprise spécialisée dans...", "Acteur reconnu pour...", "Expert en...", "Professionnel dédié à...", "Spécialiste reconnu pour...". La phrase doit être grammaticalement correcte et pertinente pour l'entreprise.

2. **extract** : Un résumé court et percutant de 30 à 50 mots maximum de l'activité réelle de l'entreprise. Base-toi sur les informations disponibles pour créer un contenu cohérent avec la vraie activité de l'entreprise.

3. **description** : Une description détaillée de 100 à 150 mots en HTML avec des balises <p> pour structurer le texte en paragraphes. Le texte doit être justifié et optimisé pour le référencement local. Termine par un call to action engageant qui rappelle le numéro de téléphone (${business.telephone}) si disponible et mentionne l'adresse si c'est un établissement physique qui reçoit du public. Varie les formulations du call to action selon l'activité (exemples : "Contactez-nous au...", "Prenez rendez-vous dès maintenant au...", "N'hésitez pas à nous appeler au...", "Pour plus d'informations, appelez-nous au...").

Réponds UNIQUEMENT avec un objet JSON valide contenant les 3 champs : activity, extract, description. Pas de texte avant ou après.`;

        const enrichResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'Tu es un expert en rédaction de contenus pour annuaires professionnels. Tu réponds toujours avec du JSON valide uniquement, sans texte supplémentaire.'
              },
              { role: 'user', content: enrichPrompt }
            ],
          }),
        });

        if (!enrichResponse.ok) {
          console.error('Enrichment failed for business:', business.nom);
          continue;
        }

        const enrichData = await enrichResponse.json();
        let aiData;
        
        try {
          const content = enrichData.choices[0].message.content;
          const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
          aiData = JSON.parse(cleanContent);
        } catch (e) {
          console.error('Failed to parse enrichment data:', enrichData.choices[0].message.content);
          continue;
        }

        enrichedBusinesses.push({
          name: business.nom,
          activity: aiData.activity,
          city: formatCity(business.adresse),
          extract: aiData.extract,
          description: aiData.description,
        });

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Generated ${enrichedBusinesses.length} partner businesses`);

    return new Response(JSON.stringify({ enrichedBusinesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-partner-guide function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
