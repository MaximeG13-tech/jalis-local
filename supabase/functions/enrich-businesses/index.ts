import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEPARTMENT_MAP: Record<string, string> = {
  "01": "dans l'Ain",
  "02": "dans l'Aisne",
  "03": "dans l'Allier",
  "04": "dans les Alpes-de-Haute-Provence",
  "05": "dans les Hautes-Alpes",
  "06": "dans les Alpes-Maritimes",
  "07": "dans l'Ardèche",
  "08": "dans les Ardennes",
  "09": "dans l'Ariège",
  "10": "dans l'Aube",
  "11": "dans l'Aude",
  "12": "dans l'Aveyron",
  "13": "dans les Bouches-du-Rhône",
  "14": "dans le Calvados",
  "15": "dans le Cantal",
  "16": "dans la Charente",
  "17": "dans la Charente-Maritime",
  "18": "dans le Cher",
  "19": "en Corrèze",
  "2A": "dans la Corse-du-Sud",
  "2B": "en Haute-Corse",
  "21": "dans la Côte-d'Or",
  "22": "dans les Côtes-d'Armor",
  "23": "dans la Creuse",
  "24": "en Dordogne",
  "25": "dans le Doubs",
  "26": "dans la Drôme",
  "27": "dans l'Eure",
  "28": "dans l'Eure-et-Loir",
  "29": "dans le Finistère",
  "30": "dans le Gard",
  "31": "dans la Haute-Garonne",
  "32": "dans le Gers",
  "33": "dans la Gironde",
  "34": "dans l'Hérault",
  "35": "dans l'Ille-et-Vilaine",
  "36": "dans l'Indre",
  "37": "dans l'Indre-et-Loire",
  "38": "dans l'Isère",
  "39": "dans le Jura",
  "40": "dans les Landes",
  "41": "dans le Loir-et-Cher",
  "42": "dans la Loire",
  "43": "dans la Haute-Loire",
  "44": "dans la Loire-Atlantique",
  "45": "dans le Loiret",
  "46": "dans le Lot",
  "47": "dans le Lot-et-Garonne",
  "48": "dans la Lozère",
  "49": "dans le Maine-et-Loire",
  "50": "dans la Manche",
  "51": "dans la Marne",
  "52": "dans la Haute-Marne",
  "53": "dans la Mayenne",
  "54": "dans la Meurthe-et-Moselle",
  "55": "dans la Meuse",
  "56": "dans le Morbihan",
  "57": "dans la Moselle",
  "58": "dans la Nièvre",
  "59": "dans le Nord",
  "60": "dans l'Oise",
  "61": "dans l'Orne",
  "62": "dans le Pas-de-Calais",
  "63": "dans le Puy-de-Dôme",
  "64": "dans les Pyrénées-Atlantiques",
  "65": "dans les Hautes-Pyrénées",
  "66": "dans les Pyrénées-Orientales",
  "67": "dans le Bas-Rhin",
  "68": "dans le Haut-Rhin",
  "69": "dans le Rhône",
  "70": "dans la Haute-Saône",
  "71": "dans la Saône-et-Loire",
  "72": "dans la Sarthe",
  "73": "en Savoie",
  "74": "en Haute-Savoie",
  "75": "dans Paris",
  "76": "dans la Seine-Maritime",
  "77": "dans la Seine-et-Marne",
  "78": "dans les Yvelines",
  "79": "dans les Deux-Sèvres",
  "80": "dans la Somme",
  "81": "dans le Tarn",
  "82": "dans le Tarn-et-Garonne",
  "83": "dans le Var",
  "84": "dans le Vaucluse",
  "85": "dans la Vendée",
  "86": "dans la Vienne",
  "87": "dans la Haute-Vienne",
  "88": "dans les Vosges",
  "89": "dans l'Yonne",
  "90": "dans le Territoire de Belfort",
  "91": "dans l'Essonne",
  "92": "dans les Hauts-de-Seine",
  "93": "dans la Seine-Saint-Denis",
  "94": "dans le Val-de-Marne",
  "95": "dans le Val-d'Oise",
  "971": "en Guadeloupe",
  "972": "en Martinique",
  "973": "en Guyane",
  "974": "à La Réunion",
  "976": "à Mayotte",
};

function extractPostalCode(address: string): string | null {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

function correctPrepositionContractions(text: string): string {
  // Règles de contraction obligatoires en français
  return text
    .replace(/\bà Le\b/g, "au")
    .replace(/\bà Les\b/g, "aux")
    .replace(/\bà La\b/g, "à la")
    .replace(/\bà L'/g, "à l'");
}

function formatCity(address: string): string {
  // Extract postal code from the address
  const postalCode = extractPostalCode(address);
  if (!postalCode) return address;

  // Extract city name (after postal code)
  const cityMatch = address.match(/\d{5}\s+([^,]+)/);
  let cityName = cityMatch ? cityMatch[1].trim() : address;

  // Remove the article from the beginning of the city name
  // because the preposition will be in the activity field
  cityName = cityName
    .replace(/^Le\s+/i, '')
    .replace(/^La\s+/i, '')
    .replace(/^Les\s+/i, '')
    .replace(/^L'/i, '');

  // Use postal code from the address (not from a different location)
  const deptCode = postalCode.substring(0, 2);
  const deptPhrase = DEPARTMENT_MAP[deptCode] || DEPARTMENT_MAP[postalCode.substring(0, 3)] || "";

  return `${cityName} (${postalCode}) ${deptPhrase}`.trim();
}

// Fetch real business information from Tavily API
async function fetchTavilyInfo(businessName: string, city: string, website: string | null) {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not configured");
  }
  
  const query = website && website !== 'Non disponible'
    ? `${businessName} ${city} services activités site:${website}`
    : `${businessName} ${city} services activités avis`;
  
  console.log('Tavily search query:', query);
  
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: true,
      max_results: 5
    })
  });
  
  if (!response.ok) {
    console.error('Tavily API error:', response.status);
    return { answer: null, results: [] };
  }
  
  const data = await response.json();
  console.log('Tavily results:', data.results?.length || 0, 'sources found');
  
  return {
    answer: data.answer || null,
    results: data.results || []
  };
}

// Extract structured business info using Gemini 2.5 Pro
async function extractBusinessInfo(tavilyData: any, businessName: string, city: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }
  
  const sourcesText = tavilyData.results
    .map((r: any) => `- ${r.title}: ${r.content}`)
    .join('\n');
  
  const extractionPrompt = `Tu es un expert en analyse de données d'entreprises. 

DONNÉES BRUTES RÉCUPÉRÉES PAR RECHERCHE WEB :

Résumé Tavily : ${tavilyData.answer || 'Aucun résumé disponible'}

Sources Web :
${sourcesText || 'Aucune source trouvée'}

MISSION : Extrais les informations RÉELLES et VÉRIFIÉES sur ${businessName} à ${city}.

RÉPONDS AVEC CE JSON UNIQUEMENT (sans texte avant ou après) :
{
  "activite_verifiee": "description courte de l'activité réelle (ex: 'banque mutualiste spécialisée en crédit agricole')",
  "services_principaux": ["service 1", "service 2", "service 3", "service 4"],
  "specialites": "ce qui rend l'entreprise unique (ou null si non trouvé)",
  "historique": "bref historique si disponible (ex: 'Fondé en 1994') ou null",
  "confiance": "high/medium/low"
}

RÈGLES ABSOLUES :
- Si tu ne trouves PAS d'information, mets null (ne pas inventer)
- Les services doivent être CONCRETS (pas "divers services")
- L'historique doit être FACTUEL (date, événement précis)
- Si les sources sont contradictoires, mets "medium" ou "low" en confiance
- confiance "high" = beaucoup d'infos trouvées, "low" = peu d'infos`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en extraction de données structurées. Tu réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire. Tu ne dois JAMAIS inventer d\'informations non présentes dans les sources fournies.'
        },
        { role: 'user', content: extractionPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    console.error('Lovable AI extraction error:', response.status);
    return {
      activite_verifiee: null,
      services_principaux: [],
      specialites: null,
      historique: null,
      confiance: "low"
    };
  }

  const data = await response.json();
  const content = data.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse extraction JSON:', content);
    return {
      activite_verifiee: null,
      services_principaux: [],
      specialites: null,
      historique: null,
      confiance: "low"
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businesses, companyName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const enrichedBusinesses = [];

    // Style variations to avoid robotic tone
    const introVariations = [
      `À {{city}}, ${companyName} recommande`,
      `Recommandé par ${companyName}, `,
      `Parmi les adresses conseillées par ${companyName} figure`,
      `${companyName} recommande à {{city}}`
    ];

    for (const business of businesses) {
      console.log(`\n=== Processing: ${business.nom} ===`);
      
      // Extract city name
      const cityMatch = business.adresse.match(/\d{5}\s+([^,]+)/);
      const cityName = cityMatch ? cityMatch[1].trim() : business.adresse.split(',')[0].trim();
      
      // Step 1: Fetch real info from Tavily
      const tavilyData = await fetchTavilyInfo(
        business.nom,
        cityName,
        business.site_web
      );
      
      // Step 2: Extract structured info with Gemini Pro
      const realInfo = await extractBusinessInfo(
        tavilyData,
        business.nom,
        cityName
      );
      
      console.log('Extracted info confidence:', realInfo.confiance);
      
      // Step 3: Generate paragraphs with Gemini Pro using verified data
      const randomIntro = introVariations[Math.floor(Math.random() * introVariations.length)]
        .replace('{{city}}', cityName);
      
      let prompt;
      
      if (realInfo.confiance === "low") {
        // Simplified prompt for low-confidence cases
        prompt = `Tu dois générer un JSON avec exactement 3 champs pour une entreprise dont on a PEU d'informations.

DONNÉES DE L'ENTREPRISE :
- Nom : ${business.nom}
- Adresse : ${business.adresse}
- Ville : ${cityName}
- Téléphone : ${business.telephone}

CONTEXTE : ${companyName} recommande cette entreprise à ses clients.

RÈGLE CRITIQUE : Tu as PEU d'informations vérifiées, reste donc GÉNÉRAL et SOBRE. Ne détaille PAS.

═══════════════════════════════════════════════════════════════════════════════

CHAMP 1 : "activity"
Écris une phrase de 10-15 mots décrivant le métier de manière GÉNÉRIQUE.
RÈGLE ABSOLUE : Cette phrase DOIT se terminer par le mot "à" (sans rien après).

EXEMPLES :
✓ "Entreprise spécialisée dans les services professionnels à"
✓ "Établissement proposant des prestations de qualité à"

═══════════════════════════════════════════════════════════════════════════════

CHAMP 2 : "extract" (40-60 mots)
Reste GÉNÉRAL. Mentionne "${companyName} recommande" ou "recommandé par ${companyName}".
Utilise un article défini : "l'établissement", "l'entreprise", "la société".

EXEMPLE :
"À ${cityName}, ${companyName} recommande l'établissement ${business.nom} pour son professionnalisme. Cette entreprise se distingue par son engagement envers la satisfaction client."

═══════════════════════════════════════════════════════════════════════════════

CHAMP 3 : "description" (80-100 mots - PLUS COURT que d'habitude)
Reste SOBRE et GÉNÉRAL. Mentionne "recommandé par ${companyName}".
Structure : 2 paragraphes courts + coordonnées.

EXEMPLE :
"À ${cityName}, l'entreprise ${business.nom}, recommandée par ${companyName}, se distingue par son professionnalisme. Son équipe met un point d'honneur à offrir un service de qualité adapté aux besoins de chaque client.

Située ${business.adresse}, l'entreprise est facilement accessible. Pour tout renseignement, contactez-les au ${business.telephone}."

═══════════════════════════════════════════════════════════════════════════════

RÉPONDS UNIQUEMENT AVEC CE JSON :
{
  "activity": "Description générique se terminant par à",
  "extract": "40-60 mots GÉNÉRAUX avec article défini + recommandé par",
  "description": "80-100 mots SOBRES sans détails inventés"
}`;
      } else {
        // Full detailed prompt with verified data
        const servicesText = realInfo.services_principaux.length > 0
          ? realInfo.services_principaux.join(', ')
          : 'Non renseignés';
        
        prompt = `Tu dois générer un JSON avec exactement 3 champs basés sur des INFORMATIONS RÉELLES VÉRIFIÉES.

═══════════════════════════════════════════════════════════════════════════════

DONNÉES DE L'ENTREPRISE :
- Nom : ${business.nom}
- Adresse : ${business.adresse}
- Ville : ${cityName}
- Téléphone : ${business.telephone}

INFORMATIONS VÉRIFIÉES PAR RECHERCHE WEB (Tavily) :
- Activité vérifiée : ${realInfo.activite_verifiee || 'Non renseignée'}
- Services principaux : ${servicesText}
- Spécialités : ${realInfo.specialites || 'Non renseignées'}
- Historique : ${realInfo.historique || 'Non disponible'}
- Niveau de confiance : ${realInfo.confiance}

CONTEXTE : ${companyName} recommande cette entreprise à ses clients.

═══════════════════════════════════════════════════════════════════════════════

CHAMP 1 : "activity"

INSTRUCTION : Écris une phrase de 10-15 mots décrivant le métier.
RÈGLE ABSOLUE : Cette phrase DOIT se terminer par le mot "à" (sans rien après).

EXEMPLES :
✓ "Cabinet notarial accompagnant vos projets immobiliers et successions à"
✓ "Kinésithérapeute spécialisé en rééducation sportive et bien-être à"

═══════════════════════════════════════════════════════════════════════════════

CHAMP 2 : "extract" (40-60 mots)

RÈGLES :
- TOUJOURS utiliser un article défini : "l'étude", "le cabinet", "la société"
- Tu DOIS utiliser "${companyName} recommande" OU "recommandé par ${companyName}"
- Si historique disponible : "Depuis [année], ${companyName} recommande..."
- Si spécialités disponibles : Mentionne la spécialité RÉELLE : ${realInfo.specialites}
- IMPÉRATIF : N'invente AUCUN service non listé dans les services principaux

EXEMPLE avec données vérifiées :
${realInfo.historique ? `"${realInfo.historique}, ${companyName} recommande ${business.nom} à ${cityName} pour son expertise en ${realInfo.activite_verifiee}. Cette entreprise ${realInfo.specialites ? 'se distingue par ' + realInfo.specialites : 'accompagne ses clients avec professionnalisme'}."` : `"${randomIntro} ${business.nom} à ${cityName} pour son expertise en ${realInfo.activite_verifiee}. ${realInfo.specialites ? 'Cette entreprise se distingue par ' + realInfo.specialites : 'Un accompagnement professionnel adapté à vos besoins'}."`}

═══════════════════════════════════════════════════════════════════════════════

CHAMP 3 : "description" (110-130 mots en 3 paragraphes)

STRUCTURE OBLIGATOIRE AVEC DONNÉES VÉRIFIÉES :

**Paragraphe 1 (40-50 mots) : Présentation générale**
- Commence par : "${randomIntro}"
- Mentionne l'historique SI DISPONIBLE : ${realInfo.historique || 'non disponible'}
- Décris l'activité RÉELLE : ${realInfo.activite_verifiee || 'activité professionnelle'}
- Localisation : "situé(e) à ${cityName}"

EXEMPLE :
"${randomIntro} ${business.nom}, ${realInfo.historique ? realInfo.historique + '. ' : ''}spécialisé(e) en ${realInfo.activite_verifiee}. Situé(e) à ${cityName}, cette entreprise accompagne ses clients avec rigueur et proximité."

**Paragraphe 2 (35-45 mots) : Services RÉELS**
- Liste UNIQUEMENT les services de : ${servicesText}
- Mentionne la spécialité SI DISPONIBLE : ${realInfo.specialites || 'non disponible'}
- INTERDIT : Inventer des services non listés

EXEMPLE :
"Parmi les services proposés figurent ${servicesText}. ${realInfo.specialites ? 'L\'entreprise se distingue par ' + realInfo.specialites + ', reflétant son engagement qualité.' : 'Un service professionnel adapté à vos besoins.'}"

**Paragraphe 3 (25-35 mots) : Coordonnées**
- Adresse complète
- Téléphone uniquement (JAMAIS de site web)
- Phrase d'appel à l'action

EXEMPLE :
"Situé(e) ${business.adresse}, l'établissement est facilement accessible. Pour tout renseignement ou prise de rendez-vous, contactez-les au ${business.telephone}."

═══════════════════════════════════════════════════════════════════════════════

RÈGLES CRITIQUES :
1. Tu n'as utilisé QUE les services listés dans services_principaux ? ✓
2. Tu n'as PAS inventé d'historique si ${realInfo.historique} === null ? ✓
3. Le champ "activity" se termine par "à" ? ✓
4. Tu as utilisé un ARTICLE DÉFINI ? ✓
5. Tu n'as PAS mentionné le site web ? ✓

RÉPONDS UNIQUEMENT AVEC CE JSON :
{
  "activity": "Description du métier se terminant par à",
  "extract": "40-60 mots avec article défini + recommandé par + données vérifiées",
  "description": "110-130 mots basés sur informations RÉELLES de Tavily"
}`;
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            {
              role: "system",
              content: "Tu es un expert en rédaction de contenus pour annuaires professionnels. Tu rédiges uniquement en français avec une grammaire irréprochable. Tu réponds toujours avec du JSON valide uniquement, sans texte supplémentaire. RÈGLES CRITIQUES : (1) Le champ 'activity' doit TOUJOURS se terminer par le mot 'à' seul, SANS mention de ville après. (2) Tu utilises UNIQUEMENT le vocabulaire de RECOMMANDATION (recommande, conseille) et JAMAIS les mots 'partenaire', 'partenariat', 'collaboration'. (3) Tu utilises TOUJOURS un article défini devant les noms d'entreprises : 'l'étude', 'le cabinet', 'la société'. (4) INTERDIT ABSOLU : Ne JAMAIS mentionner le site web dans la description, seulement le téléphone et l'adresse. (5) Tu n'inventes JAMAIS d'informations non fournies dans les données vérifiées."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", response.status, errorText);
        throw new Error(`AI API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      if (!content || content.trim() === "") {
        throw new Error("AI returned empty content");
      }

      let aiData;
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        aiData = JSON.parse(cleanContent);
        
        if (!aiData.activity || !aiData.extract || !aiData.description) {
          throw new Error("AI response missing required fields");
        }
      } catch (e) {
        console.error("Failed to parse AI response:", content);
        throw new Error(`Invalid JSON from AI: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }

      enrichedBusinesses.push({
        name: `- ${business.nom}`,
        activity: aiData.activity,
        city: formatCity(business.adresse),
        extract: aiData.extract,
        description: aiData.description,
      });

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return new Response(JSON.stringify({ enrichedBusinesses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in enrich-businesses function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
