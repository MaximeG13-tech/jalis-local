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
      const prompt = `Tu es un expert en rédaction SEO pour ${companyName}, qui présente des entreprises locales sur son site web.

CONTEXTE CRITIQUE - LIS ATTENTIVEMENT :
- Le texte sera publié sur le site de ${companyName}
- C'est ${companyName} qui présente une entreprise locale (PAS un partenaire)
- Le ton est à la 3ème personne : "contactez-les", "leur entreprise", etc.
- JAMAIS "nous", "notre", "contactez-nous" car ce n'est PAS l'entreprise qui parle d'elle-même

Entreprise locale à présenter :
- Nom : ${business.nom}
- Adresse : ${business.adresse}
- Téléphone : ${business.telephone}
- Site web : ${business.site_web}

⚠️ IMPÉRATIF : ANALYSE D'ABORD L'ACTIVITÉ RÉELLE DE ${business.nom}
Avant de rédiger, identifie précisément :
- Quel est le SECTEUR d'activité exact ? (tissus, plomberie, coaching, restaurant, etc.)
- Quels sont les SERVICES CONCRETS offerts ?
- Qui sont les CLIENTS CIBLES ? (particuliers, professionnels, entreprises)
- Quels PROBLÈMES cette entreprise résout-elle ?

Adapte TOUT le contenu en fonction de ces éléments. Chaque description doit être UNIQUE et PERTINENTE.

Instructions strictes pour un SEO optimal :

1. **activity** : TITRE LONGUE TRAÎNE SEO de 10 à 15 mots obligatoirement, SANS PRONOM PERSONNEL.

EXEMPLES de formats à suivre STRICTEMENT :
- "Paysagiste spécialisé dans la création et l'aménagement de jardins et d'espaces verts avec des solutions sur-mesure à"
- "Plombier professionnel assurant l'installation, la réparation et l'entretien de vos systèmes de plomberie à"
- "Expert-comptable accompagnant la gestion comptable, fiscale et administrative de votre entreprise à"
- "Électricien qualifié réalisant tous vos travaux d'installation et de mise aux normes électriques à"

RÈGLES IMPÉRATIVES :
- Commence par le NOM DU MÉTIER ou "Professionnel(s) de..." suivi d'un PARTICIPE PRÉSENT (proposant, assurant, spécialisé dans, offrant, réalisant, etc.)
- JAMAIS de pronoms personnels (ils, elle, nous) - forme nominale uniquement
- Mentionne EXPLICITEMENT la profession/le métier de l'entreprise
- Intègre des qualificatifs pertinents (professionnel, qualifié, spécialisé, expérimenté, artisan)
- La phrase DOIT se terminer par "à" (sans la ville). Elle sera suivie par le champ city.
- Compte exactement entre 10 et 15 mots (vérifie bien)

2. **extract** : Résumé percutant de 40 à 60 mots enrichi de mots-clés SEO relatifs à l'activité. Doit donner envie de contacter l'entreprise en mettant en avant ses points forts, son expertise et sa valeur ajoutée. Utilise des termes recherchés par les clients potentiels.

3. **description** : Description de 100 à 150 MOTS en TEXTE BRUT (pas de HTML, pas de balises).

🚫 MOTS ET CONCEPTS TOTALEMENT INTERDITS 🚫
❌ partenariat / partenaire
❌ collaborer / collaboration
❌ s'associer / associer
❌ apporteur d'affaires / rapporteur
❌ relation commerciale / accord commercial
❌ JAMAIS mentionner le site web (${business.site_web}) dans la description

STRUCTURE OBLIGATOIRE (100-150 mots total) :

📝 PARAGRAPHE 1 (40-60 mots) - INTELLIGENCE CONTEXTUELLE REQUISE
Présente l'activité de ${business.nom} de manière ULTRA-SPÉCIFIQUE :
- Identifie le secteur exact (tissus, plomberie, coaching, etc.)
- Mentionne les services/produits CONCRETS adaptés à ce secteur
- Utilise le vocabulaire TECHNIQUE du métier
- Mets en avant ce qui DIFFÉRENCIE cette entreprise
- Parle des BESOINS CLIENTS que l'entreprise résout

EXEMPLES CONTEXTUELS :
• Pour un magasin de tissus : parle de tissus d'ameublement, confection maison, collections, créations textiles
• Pour un plombier : parle d'installation sanitaire, dépannage, mise aux normes, travaux de rénovation
• Pour un restaurant : parle de cuisine, spécialités, cadre, expérience gastronomique

🎯 PARAGRAPHE 2 (20-30 mots) - LIEN NATUREL AVEC ${companyName}
Crée UNE PHRASE FLUIDE qui explique POURQUOI ${companyName} présente ${business.nom}.
La formulation doit être LOGIQUE et NATURELLE selon le contexte :

Si c'est une entreprise de service/artisan :
"${companyName} met en avant ${business.nom} pour leur expertise reconnue et leur qualité de service."

Si c'est un commerce/magasin :
"${companyName} vous fait découvrir ${business.nom}, une adresse de confiance pour vos achats."

Si c'est une activité créative/artistique :
"${companyName} valorise le savoir-faire de ${business.nom} et leur engagement local."

⚠️ ADAPTE cette phrase au CONTEXTE RÉEL de l'entreprise. Ne force pas une formulation générique.

📍 PARAGRAPHE 3 (30-40 mots) - Coordonnées + Call-to-Action
- Présente les coordonnées de ${business.nom} : adresse complète et téléphone
- Formule un appel à l'action naturel adapté à l'activité (se rendre en magasin, appeler pour un devis, prendre rendez-vous, etc.)
- Ton à la 3ème personne : "Rendez-vous chez ${business.nom}", "Contactez-les au..."

🚫 PARAGRAPHE 3 - INTERDICTIONS ABSOLUES :
- NE JAMAIS mentionner le site web ou l'URL
- N'utiliser QUE : nom, adresse, téléphone
- Formulation naturelle en phrases
- Adapte le CTA au type d'activité (se rendre en magasin, prendre rendez-vous, demander un devis, etc.)

CONSIGNES DE TON GÉNÉRALES :
- Parle TOUJOURS à la 3ème personne de l'entreprise
- Utilise "leur", "ils", "cette entreprise", "${business.nom}"
- CTA adapté au contexte : "Rendez-vous chez ${business.nom} au..." ou "Contactez-les au ${business.telephone}"
- JAMAIS "contactez-nous" ou "rendez-vous sur leur site"

🎯 RÉSUMÉ FINAL : SOIS INTELLIGENT ET CONTEXTUEL
- Chaque description doit être UNIQUE et adaptée à l'activité RÉELLE de l'entreprise
- Utilise le VOCABULAIRE MÉTIER approprié
- Crée un lien NATUREL avec ${companyName}
- Rédige comme si tu connaissais vraiment le secteur d'activité

Réponds UNIQUEMENT avec un objet JSON valide contenant les 3 champs : activity, extract, description. Pas de texte avant ou après.`;

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
