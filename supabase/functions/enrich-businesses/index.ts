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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businesses, companyName } = await req.json();
    const OPEN_AI = Deno.env.get("OPEN_AI");

    if (!OPEN_AI) {
      throw new Error("OPEN_AI is not configured");
    }

    const enrichedBusinesses = [];

    for (const business of businesses) {
      // Générer un numéro aléatoire pour varier les styles de rédaction
      const styleVariant = Math.floor(Math.random() * 5) + 1;
      
      // Extraire la ville de l'adresse pour un contexte géographique précis
      const cityMatch = business.adresse.match(/\d{5}\s+([^,]+)/);
      
      const prompt = `Tu dois générer un JSON avec exactement 3 champs. Lis TOUTES les instructions avant de répondre.

═══════════════════════════════════════════════════════════════════════════════

DONNÉES DE L'ENTREPRISE :
- Nom : ${business.nom}
- Adresse : ${business.adresse}
- Ville : ${cityName}
- Téléphone : ${business.telephone}
${business.site_web !== 'Non disponible' ? `- Site : ${business.site_web}` : ''}

CONTEXTE : ${companyName} recommande cette entreprise à ses clients.

═══════════════════════════════════════════════════════════════════════════════

CHAMP 1 : "activity"

INSTRUCTION : Écris une phrase de 10-15 mots décrivant le métier.
RÈGLE ABSOLUE : Cette phrase DOIT se terminer par le mot "à" (sans rien après).

EXEMPLES CORRECTS :
✓ "Notaire accompagnant vos projets immobiliers et successions à"
✓ "Kinésithérapeute spécialisé en rééducation sportive et bien-être à"
✓ "Plombier professionnel pour dépannages et installations à"

EXEMPLES INCORRECTS :
✗ "Notaire expérimenté à Marseille" → Le mot "Marseille" est interdit
✗ "Kinésithérapeute à Lyon" → Le mot "Lyon" est interdit

LE DERNIER MOT DOIT ÊTRE "à" (pas de ville après).

═══════════════════════════════════════════════════════════════════════════════

CHAMP 2 : "extract"

INSTRUCTION : Écris 40-60 mots présentant l'entreprise.
RÈGLE ABSOLUE : Tu DOIS utiliser "${companyName} recommande" OU "recommandé par ${companyName}".

MOTS INTERDITS : partenaire, partenariat, collaboration

EXEMPLES CORRECTS :
✓ "À ${cityName}, ${companyName} recommande ${business.nom} pour son expertise..."
✓ "Recommandé par ${companyName}, ${business.nom} se distingue par..."

EXEMPLES INCORRECTS :
✗ "${business.nom}, partenaire de ${companyName}..." → Le mot "partenaire" est interdit

═══════════════════════════════════════════════════════════════════════════════

CHAMP 3 : "description"

INSTRUCTION : Écris un texte de 110-130 mots en 3 parties.
RÈGLE ABSOLUE : Tu DOIS mentionner "${companyName} recommande" OU "recommandé par ${companyName}".

MOTS INTERDITS : partenaire, partenariat, collaboration, réseau

STRUCTURE :
1. Accroche (35-45 mots) mentionnant "${companyName}"
2. Services (35-45 mots)
3. Coordonnées (30-40 mots)

EXEMPLE CORRECT pour le paragraphe 1 :
"Quand on habite à ${cityName}, recommandé par ${companyName}, ${business.nom} se distingue par..."

EXEMPLE INCORRECT :
"Partenaire de confiance de ${companyName}..." → Le mot "partenaire" est interdit

═══════════════════════════════════════════════════════════════════════════════

AVANT DE RÉPONDRE, VÉRIFIE :
1. Le champ "activity" se termine par "à" ? (sans ville)
2. Tu as utilisé "recommande" ou "recommandé par" (pas "partenaire") ?
3. Ton JSON est valide ?

RÉPONDS UNIQUEMENT AVEC CE JSON (sans texte avant ou après) :
{
  "activity": "Description du métier se terminant par à",
  "extract": "40-60 mots avec recommande ou recommandé par",
  "description": "Texte de 110-130 mots avec recommandé par"
}`;

          messages: [
            {
              role: "system",
              content:
                "Tu es un expert en rédaction de contenus pour annuaires professionnels. Tu rédiges uniquement en français avec une grammaire irréprochable et aucune faute d'orthographe. Tu réponds toujours avec du JSON valide uniquement, sans texte supplémentaire. RÈGLES CRITIQUES : (1) Le champ 'activity' doit TOUJOURS se terminer par le mot 'à' seul, SANS mention de ville après. (2) Tu utilises UNIQUEMENT le vocabulaire de RECOMMANDATION (recommande, conseille, suggère) et JAMAIS les mots 'partenaire', 'partenariat', 'collaboration' ou 'réseau'.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API error:", response.status, errorText);
        throw new Error(`AI API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("OpenAI response:", JSON.stringify(data, null, 2));

      // Vérifier que la réponse contient les données attendues
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("Invalid OpenAI response structure:", JSON.stringify(data));
        throw new Error("OpenAI response missing expected data structure");
      }

      const content = data.choices[0].message.content;

      // Vérifier que le contenu n'est pas vide
      if (!content || content.trim() === "") {
        console.error("Empty content from OpenAI");
        throw new Error("OpenAI returned empty content");
      }

      // Parse the JSON response
      let aiData;
      try {
        // Remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        console.log("Cleaned content for parsing:", cleanContent);
        aiData = JSON.parse(cleanContent);
        
        // Vérifier que les champs requis sont présents
        if (!aiData.activity || !aiData.extract || !aiData.description) {
          console.error("Missing required fields in AI response:", aiData);
          throw new Error("AI response missing required fields (activity, extract, or description)");
        }
      } catch (e) {
        console.error("Failed to parse AI response:", content);
        console.error("Parse error:", e);
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
      await new Promise((resolve) => setTimeout(resolve, 100));
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