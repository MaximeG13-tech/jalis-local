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
  const cityName = cityMatch ? cityMatch[1].trim() : address;

  // Use postal code from the address (not from a different location)
  const deptCode = postalCode.substring(0, 2);
  const deptPhrase = DEPARTMENT_MAP[deptCode] || DEPARTMENT_MAP[postalCode.substring(0, 3)] || "";

  const formattedCity = `${cityName} (${postalCode}) ${deptPhrase}`.trim();
  
  // Appliquer les corrections de contractions
  return correctPrepositionContractions(formattedCity);
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
      const prompt = `Tu es un expert en rédaction de fiches locales SEO courtes pour ${companyName}, qui présente des entreprises locales sur son site web.

CONTEXTE IMPORTANT :

Le texte sera publié sur le site de ${companyName}.

${companyName} présente une entreprise locale, sans en faire la promotion commerciale.

Le ton est informatif et neutre, à la 3ᵉ personne : "ils", "leur entreprise", "contactez-les".

JAMAIS de "nous", "notre", "je" ou "contactez-nous".

🎯 Objectif

Produire une fiche locale courte, claire et utile, qui :

Informe l'internaute sur l'activité, la localisation et les coordonnées.

Donne une impression de proximité et de sérieux.

Est simple, lisible et naturelle (pas journalistique).

Est optimisée pour le SEO local (activité + ville + département).

ENTREPRISE À PRÉSENTER

Nom : ${business.nom}

Adresse : ${business.adresse}

Téléphone : ${business.telephone}

Site web : ${business.site_web}

RÈGLES DE RÉDACTION

activity → phrase longue traîne (10 à 15 mots) se terminant par "à".

Toujours commencer par le nom du métier ou de l'activité principale.

Terminer par "à" (sans ville), la ville sera ajoutée ensuite.

Exemples :

"Magasin de tissus d'ameublement et de couture proposant un large choix à"

"Entreprise de plomberie réalisant l'installation et la réparation de canalisations à"

extract → résumé court (40 à 60 mots) orienté information locale.

Décris ce que propose l'entreprise, où elle se trouve et pour qui.

Évite les phrases creuses ("une expertise avérée", "un savoir-faire reconnu").

Exemple :

Situé à Aix-en-Provence, ${business.nom} propose un large choix de tissus pour l'habillement et l'ameublement. Les clients y trouvent des articles de qualité à prix doux, avec des nouveautés ajoutées régulièrement.

description → fiche locale complète (100 à 130 mots max).

Paragraphe 1 (≈50 mots) : présente simplement l'activité, les produits ou services, et la localisation.

Paragraphe 2 (≈25 mots) : mention ${companyName} avec une des formules ci-dessous :

"${companyName} met en avant ${business.nom} pour la qualité de ses services."

"${companyName} vous recommande ${business.nom} pour son professionnalisme."

"${companyName} présente ${business.nom}, une entreprise locale de confiance."

Paragraphe 3 (≈30 mots) : adresse + téléphone + CTA local.

Exemple : "Retrouvez ${business.nom} au ${business.adresse}. Contactez-les au ${business.telephone} pour plus d'informations ou pour vos besoins en [activité]."

⚙️ RÈGLE LINGUISTIQUE IMPORTANTE

Corrige toujours la préposition devant la ville selon les règles du français :

"à Le" → "au"

"à Les" → "aux"

"à La" → "à la"

"à L'" → "à l'"

(Ne jamais écrire "à Le [ville]").

INTERDICTIONS

🚫 Pas de "partenariat", "collaboration", "association", "site web"
🚫 Pas de phrases creuses ou commerciales ("expertise reconnue", "approche personnalisée")
🚫 Pas d'adresse mail ni d'URL
🚫 Pas d'énumérations à rallonge

Réponds uniquement avec un objet JSON valide contenant les trois champs suivants :
{ "activity": "...", "extract": "...", "description": "..." }
Aucun texte avant ou après la réponse.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPEN_AI}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "Tu es un expert en rédaction de contenus pour annuaires professionnels. Tu rédiges uniquement en français avec une grammaire irréprochable et aucune faute d'orthographe. Tu réponds toujours avec du JSON valide uniquement, sans texte supplémentaire.",
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
