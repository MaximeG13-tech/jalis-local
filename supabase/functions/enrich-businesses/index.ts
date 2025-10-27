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
      const cityName = cityMatch ? cityMatch[1].trim() : '';
      
      const prompt = `Tu es un rédacteur web talentueux qui écrit des contenus naturels et engageants.

🎯 MISSION : ${companyName} présente et recommande ${business.nom}
Tu rédiges comme si c'était ${companyName} qui parlait de ${business.nom} à ses clients.

CONTEXTE IMPORTANT :
- ${companyName} est une ENTREPRISE (pas un lieu géographique)
- ${business.nom} est situé à ${cityName}
- Utilise le NOM DE LA VILLE (${cityName}) pour les références géographiques
- IL S'AGIT D'UNE RECOMMANDATION, PAS D'UN PARTENARIAT COMMERCIAL

ENTREPRISE : ${business.nom}
Adresse : ${business.adresse}
Contact : ${business.telephone}
${business.site_web !== 'Non disponible' ? `Site : ${business.site_web}` : ''}

STYLE DE RÉDACTION N°${styleVariant} - VARIE TON APPROCHE

${styleVariant === 1 ? `
STYLE 1 - DIRECT ET DYNAMIQUE
- Commence par une question percutante ou une affirmation forte
- Utilise des phrases courtes et rythmées
- Ton enjoué et moderne
- Exemple : "Un problème de [service] ? Pas de panique ! Chez ${business.nom}..."
` : ''}

${styleVariant === 2 ? `
STYLE 2 - STORYTELLING LOCAL
- Raconte une mini-histoire ou situation
- Ancre dans le quotidien local
- Ton chaleureux et proche
- Exemple : "Dans le quartier, tout le monde connaît ${business.nom}. Et pour cause..."
` : ''}

${styleVariant === 3 ? `
STYLE 3 - PRAGMATIQUE ET INFORMATIF
- Va droit au but
- Liste des avantages concrets
- Ton professionnel mais accessible
- Exemple : "${business.nom} vous propose trois choses essentielles : [1], [2], [3]."
` : ''}

${styleVariant === 4 ? `
STYLE 4 - CONVERSATIONNEL ET COMPLICE
- Tutoiement possible
- Ton de conseil entre amis
- Exemples concrets du quotidien
- Exemple : "Tu cherches un [métier] pas loin de ${companyName} ? On a ce qu'il te faut..."
` : ''}

${styleVariant === 5 ? `
STYLE 5 - DESCRIPTIF ET ÉVOCATEUR
- Peint un tableau de l'ambiance/service
- Utilise des détails sensoriels
- Ton poétique mais terre-à-terre
- Exemple : "Dès que vous poussez la porte de ${business.nom}, vous sentez..."
` : ''}

📝 FORMAT JSON ATTENDU

1. **activity** (10-15 mots MAX)

🚨 RÈGLE ABSOLUE POUR LE CHAMP ACTIVITY 🚨
LE CHAMP "activity" DOIT SE TERMINER PAR LE MOT "à" SEUL, SANS AUCUNE VILLE APRÈS !

❌ INTERDIT : "Kinésithérapeute spécialisé en rééducation sportive à Marseille"
❌ INTERDIT : "Kinésithérapeute spécialisé en rééducation sportive à ${cityName}"
✅ CORRECT : "Kinésithérapeute spécialisé en rééducation sportive à"

INSTRUCTIONS :
- Commence par le métier suivi de sa spécialité
- Termine TOUJOURS par la préposition "à" SEULE (dernier mot = "à")
- Ne JAMAIS, JAMAIS inclure le nom d'une ville après le "à"
- SANS le nom de l'entreprise
- La ville sera ajoutée automatiquement dans un autre champ

EXEMPLES VALIDES :
- "Plombier professionnel pour tous travaux de plomberie et dépannage d'urgence à"
- "Expert-comptable accompagnant la gestion comptable et fiscale de votre entreprise à"
- "Électricien qualifié réalisant l'installation et la mise aux normes électriques à"

2. **extract** (40-60 mots)

🚨 RÈGLE ABSOLUE POUR LE CHAMP EXTRACT 🚨
UTILISE UNIQUEMENT DES VERBES DE RECOMMANDATION, JAMAIS DE PARTENARIAT !

❌ MOTS INTERDITS : partenaire, partenariat, collaboration, collabore, réseau, affaires
❌ INTERDIT : "partenaire de JB Store"
✅ CORRECT : "recommandé par ${companyName}"
✅ CORRECT : "${companyName} recommande"
✅ CORRECT : "${companyName} vous conseille"

Mini-pitch unique qui donne envie. Varie les angles :
- L'expertise particulière
- L'ambiance du lieu
- Les avantages clients
- L'histoire locale
- Les spécialités

VERBES DE RECOMMANDATION À UTILISER :
- "recommande", "recommandé par"
- "conseille", "conseillé par"
- "suggère", "suggéré par"
- "met en avant", "mis en avant par"

3. **description** (110-130 mots en 3 paragraphes) - ${companyName} présente ${business.nom}

⚠️ STRUCTURE OBLIGATOIRE EN 3 PARAGRAPHES :

PARAGRAPHE 1 (35-45 mots) - ACCROCHE VARIÉE

🚨 RÈGLE ABSOLUE : VOCABULAIRE DE RECOMMANDATION UNIQUEMENT 🚨
❌ MOTS INTERDITS DANS TOUT LE TEXTE : partenaire, partenariat, collaboration, réseau, affaires
❌ INTERDIT : "partenaire de confiance", "partenaire de JB Store"
✅ CORRECT : "recommandé par ${companyName}"

Selon le style choisi, commence différemment :
- Question : "Besoin de..." / "Vous cherchez..." / "Un souci avec..."
- Affirmation : "Chez ${business.nom}..." / "Depuis X ans..." / "Dans le quartier..."
- Situation : "Quand on habite à ${cityName}..." / "Dans la région de ${cityName}..."

Intègre ${companyName} avec UNIQUEMENT ces formulations :
✅ "recommandé par ${companyName}"
✅ "conseillé par ${companyName}"
✅ "${companyName} recommande"
✅ "${companyName} vous conseille"

PARAGRAPHE 2 (35-45 mots) - CONTENU CONCRET ET VARIÉ
Décris VRAIMENT ce que propose ${business.nom}. Varie les approches :
- Liste des services/produits phares
- Points forts uniques
- Ce qui fait la différence
- Exemples concrets d'intervention
IMPORTANT : Reste FACTUEL et CONCRET, évite les formules creuses

PARAGRAPHE 3 (30-40 mots) - COORDONNÉES
Varie la formulation :
- "Retrouvez ${business.nom} au..."
- "Pour les joindre, c'est simple : ..."
- "${business.nom} vous accueille au..."
- "Rendez-vous chez eux : ..."
Donne l'adresse ET le téléphone de façon fluide.

🚨 RÈGLES CRITIQUES

VARIATION OBLIGATOIRE :
✓ Chaque texte doit être UNIQUE dans son approche
✓ Varie les verbes, les structures, les accroches
✓ Évite ABSOLUMENT les répétitions entre entreprises
✓ Humanise : écris comme tu parlerais à un ami

INTERDICTIONS :
❌ "solutions adaptées à vos besoins"
❌ "tout près de ${companyName}" (varie !)
❌ "Vous cherchez un X de confiance" (trop vu)
❌ "accompagnement personnalisé"
❌ "expertise reconnue"
❌ Structures répétitives
❌ Vocabulaire de partenariat commercial ("partenaire", "collaboration", "réseau")

PRÉPOSITIONS :
✓ Dans le champ "activity", termine TOUJOURS par "à" (sans la ville)
✓ La ville sera ajoutée automatiquement après

🚨🚨🚨 VÉRIFICATION FINALE AVANT DE RÉPONDRE 🚨🚨🚨

AVANT D'ENVOYER TA RÉPONSE JSON, VÉRIFIE :

1. Le champ "activity" se termine-t-il par le mot "à" SANS ville après ?
   ❌ Si tu vois "à Marseille" ou "à Paris" → CORRIGE !
   ✅ Doit finir par "à" seul

2. Le champ "extract" contient-il le mot "partenaire" ?
   ❌ Si oui → REMPLACE par "recommandé par" ou "conseillé par"
   ✅ Utilise uniquement des verbes de recommandation

3. Le champ "description" contient-il "partenaire" ou "partenariat" ?
   ❌ Si oui → REMPLACE par "recommandé par" ou "${companyName} recommande"
   ✅ Utilise uniquement des verbes de recommandation

Réponds UNIQUEMENT en JSON :
{ "activity": "...", "extract": "...", "description": "..." }`;

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