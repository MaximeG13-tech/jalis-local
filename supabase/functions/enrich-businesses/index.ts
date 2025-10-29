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

// Fetch real business information from Tavily API with multi-level fallback strategy
async function fetchTavilyInfo(businessName: string, city: string, website: string | null) {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not configured");
  }
  
  // Prepare domain filters for prioritization
  const reliableDomains = [
    "google.com/maps",
    "pagesjaunes.fr",
    "societe.com",
    "linkedin.com",
    "verif.com"
  ];
  
  // Add business website to reliable domains if available
  if (website && website !== 'Non disponible') {
    const cleanWebsite = website.replace('https://', '').replace('http://', '').replace('www.', '');
    reliableDomains.unshift(cleanWebsite);
  }
  
  // LEVEL 1: Broad search without site: restriction
  const primaryQuery = `"${businessName}" ${city} services activités contact`;
  console.log('Tavily Level 1 - Primary search:', primaryQuery);
  
  let response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: primaryQuery,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: true,
      max_results: 8,
      include_domains: reliableDomains
    })
  });
  
  if (!response.ok) {
    console.error('Tavily API error:', response.status);
    return { answer: null, results: [] };
  }
  
  let data = await response.json();
  let resultsCount = data.results?.length || 0;
  console.log(`Tavily Level 1 results: ${resultsCount} sources found`);
  
  // LEVEL 2: If we have some results and a website, enrich with website-specific search
  if (resultsCount > 0 && website && website !== 'Non disponible') {
    const cleanWebsite = website.replace('https://', '').replace('http://', '');
    const websiteQuery = `"${businessName}" site:${cleanWebsite}`;
    console.log('Tavily Level 2 - Website enrichment:', websiteQuery);
    
    const websiteResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: websiteQuery,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: true,
        max_results: 3
      })
    });
    
    if (websiteResponse.ok) {
      const websiteData = await websiteResponse.json();
      const websiteResults = websiteData.results || [];
      console.log(`Tavily Level 2 results: ${websiteResults.length} additional sources from website`);
      
      // Merge results (avoid duplicates by URL)
      const existingUrls = new Set(data.results.map((r: any) => r.url));
      const newResults = websiteResults.filter((r: any) => !existingUrls.has(r.url));
      data.results = [...data.results, ...newResults];
      resultsCount = data.results.length;
    }
  }
  
  // LEVEL 3: If still no results, try reviews/avis fallback
  if (resultsCount === 0) {
    const reviewsQuery = `"${businessName}" ${city} avis clients google reviews`;
    console.log('Tavily Level 3 - Reviews fallback:', reviewsQuery);
    
    response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: reviewsQuery,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: true,
        max_results: 8,
        include_domains: ["google.com/maps", "tripadvisor.fr", "trustpilot.fr"]
      })
    });
    
    if (response.ok) {
      data = await response.json();
      resultsCount = data.results?.length || 0;
      console.log(`Tavily Level 3 results: ${resultsCount} sources found from reviews`);
    }
  }
  
  console.log(`Final Tavily results: ${resultsCount} total sources found`);
  
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
      
      // Simplified prompts to avoid truncation
      let prompt;
      
      if (realInfo.confiance === "low") {
        // Ultra-simplified prompt for low-confidence cases
        prompt = `Génère un JSON avec 3 champs pour ${business.nom} à ${cityName}.

DONNÉES :
- Téléphone : ${business.telephone}
- Adresse : ${business.adresse}
- ${companyName} recommande cette entreprise

FORMAT JSON REQUIS :
{
  "activity": "Description courte (10-15 mots) se terminant par 'à'",
  "extract": "40-60 mots avec 'recommandé par ${companyName}' et article défini",
  "description": "90-110 mots en 3 paragraphes + coordonnées (paragraphe 1: ~35 mots, paragraphe 2: ~45 mots, paragraphe 3: ~20 mots)"
}

RÈGLES :
1. activity se termine par "à" (sans ville)
2. extract commence par article défini (l', le, la)
3. description STRUCTURE STRICTE :
   - Paragraphe 1 (35% = ~35 mots) : présentation générale et qualités principales
   - Paragraphe 2 (45% = ~45 mots) : services et spécificités, mentionne "recommandé par ${companyName}"
   - Paragraphe 3 (20% = ~20 mots) : coordonnées uniquement (téléphone et adresse)
4. Reste GÉNÉRAL (peu d'infos disponibles)
5. Pas de site web dans description

EXEMPLE activity: "Entreprise proposant des services professionnels de qualité à"
EXEMPLE extract: "À ${cityName}, ${companyName} recommande l'établissement ${business.nom} pour son professionnalisme."

RÉPONDS EN JSON UNIQUEMENT (sans markdown).`;
      } else {
        // Simplified prompt with verified data
        const servicesText = realInfo.services_principaux.length > 0
          ? realInfo.services_principaux.slice(0, 3).join(', ')
          : 'services professionnels';
        
        prompt = `Génère un JSON avec 3 champs pour ${business.nom} à ${cityName}.

DONNÉES VÉRIFIÉES (UTILISE AU MAXIMUM) :
- Activité : ${realInfo.activite_verifiee || 'entreprise locale'}
- Services : ${servicesText}
${realInfo.specialites ? `- Spécialité : ${realInfo.specialites}` : ''}
${realInfo.historique ? `- Historique : ${realInfo.historique}` : ''}
- Téléphone : ${business.telephone}
- Adresse : ${business.adresse}
- ${companyName} recommande cette entreprise

SOURCES TAVILY (UTILISE AU MAXIMUM) :
${tavilyData.answer ? `Résumé: ${tavilyData.answer}` : ''}
${tavilyData.results.slice(0, 3).map((r: any) => `- ${r.title}: ${r.content.substring(0, 150)}...`).join('\n')}

FORMAT JSON REQUIS :
{
  "activity": "Description (10-15 mots) se terminant par 'à'",
  "extract": "40-60 mots avec 'recommandé par ${companyName}' et article défini",
  "description": "90-110 mots en 3 paragraphes (paragraphe 1: ~35 mots, paragraphe 2: ~45 mots, paragraphe 3: ~20 mots)"
}

RÈGLES STRICTES :
1. activity se termine par "à" (pas de ville)
2. extract utilise article défini (l', le, la) + mentionne ${companyName}
3. description STRUCTURE OBLIGATOIRE :
   - Paragraphe 1 (35% = ~35 mots) : UTILISE les données Tavily pour présenter l'entreprise et son activité réelle
   - Paragraphe 2 (45% = ~45 mots) : UTILISE les services vérifiés, spécialités et historique Tavily, mentionne "recommandé par ${companyName}"
   - Paragraphe 3 (20% = ~20 mots) : coordonnées uniquement (téléphone et adresse complète)
4. MAXIMUM D'INFORMATIONS RÉELLES de Tavily dans paragraphes 1 et 2
5. Pas de site web, seulement téléphone et adresse

EXEMPLE activity: "${realInfo.activite_verifiee} spécialisé(e) dans les services de qualité à"
EXEMPLE extract début: "${randomIntro} ${business.nom} pour son expertise en ${realInfo.activite_verifiee}..."

RÉPONDS EN JSON UNIQUEMENT (sans markdown).`;
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: "system",
              content: "Tu es un rédacteur professionnel. Réponds UNIQUEMENT avec du JSON valide, sans markdown. Format : {\"activity\": \"texte terminant par à\", \"extract\": \"40-60 mots\", \"description\": \"110-130 mots\"}. Règles : (1) activity se termine par 'à' seul (2) utilise article défini (l', le, la) (3) n'invente RIEN."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.5,
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
        console.error(`Empty response for ${business.nom}`);
        throw new Error("AI returned empty content");
      }

      let aiData;
      try {
        let cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        
        // Remove any text before first {
        const firstBrace = cleanContent.indexOf('{');
        if (firstBrace > 0) {
          cleanContent = cleanContent.substring(firstBrace);
        }
        
        // Validate JSON is complete before parsing
        if (!cleanContent.includes('"activity"') || 
            !cleanContent.includes('"extract"') || 
            !cleanContent.includes('"description"')) {
          console.error("Incomplete JSON detected:", cleanContent.slice(0, 200));
          
          // FALLBACK: Generate minimal generic content
          console.log(`Using fallback for ${business.nom}`);
          aiData = {
            activity: "Entreprise proposant des services professionnels de qualité à",
            extract: `À ${cityName}, ${companyName} recommande l'établissement ${business.nom} pour son sérieux et son professionnalisme.`,
            description: `À ${cityName}, l'entreprise ${business.nom}, recommandée par ${companyName}, se distingue par son engagement envers la qualité de service. Située ${business.adresse}, l'entreprise est facilement accessible. Pour tout renseignement, contactez-les au ${business.telephone}.`
          };
        } else {
          // Check if JSON ends properly
          if (!cleanContent.endsWith('}')) {
            // Try to fix truncated JSON by adding closing brace
            cleanContent += '"}';
            console.log("Fixed truncated JSON by adding closing braces");
          }
          
          aiData = JSON.parse(cleanContent);
          
          if (!aiData.activity || !aiData.extract || !aiData.description) {
            throw new Error("Missing fields after parsing");
          }
          
          // Validate field lengths
          if (aiData.extract.length < 20 || aiData.description.length < 50) {
            throw new Error("Fields too short (likely incomplete)");
          }
        }
        
      } catch (e) {
        console.error("Parse failed, using fallback. Error:", e);
        console.error("Content was:", content.slice(0, 300));
        
        // FALLBACK: Generate minimal generic content
        aiData = {
          activity: "Entreprise proposant des services professionnels de qualité à",
          extract: `À ${cityName}, ${companyName} recommande l'établissement ${business.nom} pour son sérieux et son professionnalisme.`,
          description: `À ${cityName}, l'entreprise ${business.nom}, recommandée par ${companyName}, se distingue par son engagement envers la qualité de service. Située ${business.adresse}, l'entreprise est facilement accessible. Pour tout renseignement, contactez-les au ${business.telephone}.`
        };
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
