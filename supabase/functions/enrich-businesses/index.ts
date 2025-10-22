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
      const prompt = `Tu es un expert en rédaction de fiches locales engageantes pour ${companyName}, qui présente des entreprises locales sur son site web.

CONTEXTE :
- Le texte sera publié sur le site de ${companyName}
- Ton DIRECT et CONVERSATIONNEL avec tutoiement ou vouvoiement selon le contexte
- Interpelle le lecteur avec des questions ou formulations engageantes
- Mention naturelle de ${companyName} comme repère géographique ou référence locale

ENTREPRISE À PRÉSENTER :
Nom : ${business.nom}
Adresse : ${business.adresse}
Téléphone : ${business.telephone}
Site web : ${business.site_web}

📝 FORMAT DE RÉDACTION

1. **activity** (10-15 mots)

IMPORTANT - Analyse d'abord la ville dans l'adresse pour adapter la préposition finale :
- Si la ville commence par "Le " (ex: Le Pradet) → termine par "au"
- Si la ville commence par "La " (ex: La Ciotat) → termine par "à la"
- Si la ville commence par "Les " (ex: Les Pennes-Mirabeau) → termine par "aux"
- Si la ville commence par "L'" (ex: L'Isle-sur-la-Sorgue) → termine par "à l'"
- Sinon (ex: Marseille, Aix-en-Provence) → termine par "à"

Exemples corrects :
- "Magasin de tissus d'ameublement et de couture proposant un large choix au" (pour Le Pradet)
- "Entreprise de plomberie réalisant l'installation et la réparation de canalisations à" (pour Marseille)
- "Concessionnaire automobile spécialisé dans les véhicules sans permis aux" (pour Les Pennes-Mirabeau)
- "Salon de coiffure proposant des prestations sur mesure à la" (pour La Ciotat)

Règles :
✓ Commence par le nom du métier ou de l'activité principale
✓ Utilise des mots-clés SEO (métier + spécialité)
✓ Pas de nom d'entreprise
✓ Pas de pronom personnel
✓ Phrase descriptive et naturelle

2. **extract** (40-60 mots)
Résumé informatif et engageant. Décris l'offre, la localisation, ce qui différencie l'entreprise.
Évite le jargon commercial creux.
Utilise la bonne préposition contractée selon la ville (au/à la/aux/à l').

3. **description** (110-130 mots) - STYLE DIRECT ET ENGAGEANT

📍 PARAGRAPHE 1 (35-45 mots) : Accroche + Mention ${companyName}

Commence par UNE QUESTION DIRECTE ou une INTERPELLATION qui capte l'attention :
- "Vous êtes à la recherche de [service/produit] ? Ne cherchez pas plus loin..."
- "Besoin d'un [métier] de confiance ? Rendez-vous chez..."
- "Vous cherchez [produit/service] ? ${business.nom} est là pour vous..."

Intègre NATURELLEMENT ${companyName} comme REPÈRE LOCAL :
- "...tout proche de ${companyName}"
- "...à deux pas de ${companyName}"
- "...près de ${companyName}"
- "...dans le même secteur que ${companyName}"

Utilise la bonne préposition contractée pour la ville (au/à la/aux/à l').

Exemple de structure :
"Vous êtes à la recherche de tissus de qualité pour la confection maison de vêtement ou d'ameublement ? Ne cherchez pas plus loin et rendez-vous chez ${business.nom} au Pradet tout proche de ${companyName}."

🎯 PARAGRAPHE 2 (35-45 mots) : Détails concrets de l'offre

Décris CE QUE PROPOSE CONCRÈTEMENT ${business.nom} :
- Produits/services spécifiques
- Points forts réels (nouveautés régulières, prix attractifs, gamme large, etc.)
- Éléments qui donnent envie

Utilise un ton VIVANT et PRÉCIS. Mentionne des détails CONCRETS.
Utilise la bonne préposition contractée pour la ville.

Exemple :
"Vous y retrouverez de jolis tissus de qualité. ${business.nom} situé au Pradet vous propose de nouvelles collections régulièrement. Mais aussi une multitude de pelotes à tricoter et le tout à prix tout doux !"

📞 PARAGRAPHE 3 (35-45 mots) : Coordonnées + CTA

Formule UN APPEL CLAIR avec les coordonnées complètes :
- Commence par un CTA adapté à l'activité
- Donne l'adresse complète de manière fluide
- Termine par le téléphone avec un CTA complémentaire

Exemples de structure :
"Pour vous rendre chez ${business.nom} au Pradet, rendez-vous à l'adresse suivante : ${business.adresse}. N'hésitez pas à contacter votre [métier] au ${business.telephone}."

OU :

"Rendez-vous chez ${business.nom}, ${business.adresse}. Vous pouvez également les contacter au ${business.telephone} pour [action adaptée : prendre rendez-vous / obtenir un devis / commander]."

⚙️ RÈGLES LINGUISTIQUES OBLIGATOIRES

Dans les champs extract et description, applique systématiquement les contractions :
- "à Le" → "au"
- "à Les" → "aux"
- "à La" → "à la"
- "à L'" → "à l'"

Exemples :
✅ "situé au Pradet" (pas "situé à Le Pradet")
✅ "aux Pennes-Mirabeau" (pas "à Les Pennes-Mirabeau")
✅ "à la Ciotat" (pas "à La Ciotat")

🚫 INTERDICTIONS ABSOLUES

❌ "partenariat", "collaboration", "partenaire", "s'associer"
❌ Phrases creuses : "expertise reconnue", "savoir-faire avéré", "approche personnalisée"
❌ Mention du site web ou URL
❌ Ton institutionnel ou trop formel
❌ Énumérations plates

✅ CE QUI EST ATTENDU

✓ Ton direct et engageant (questions, interpellations)
✓ Mention naturelle de ${companyName} comme repère géographique
✓ Détails concrets sur les produits/services
✓ CTAs clairs et naturels
✓ Fluidité et lisibilité
✓ Prépositions contractées correctes partout (au/à la/aux/à l')

Réponds UNIQUEMENT avec un objet JSON valide :
{ "activity": "...", "extract": "...", "description": "..." }
Aucun texte avant ou après.`;

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
