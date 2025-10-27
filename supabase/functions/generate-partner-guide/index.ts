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

  return `${cityName} (${postalCode}) ${deptPhrase}`.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, activityDescription, address, maxResults } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting partner guide generation for:", companyName, activityDescription);

    // Étape 1: Génération des catégories d'entreprises locales
    const categoriesPrompt = `Tu es un expert en commerces et services locaux.

Entreprise : ${companyName}
Activité de l'entreprise : ${activityDescription}
Localisation : ${address}

Mission : Génère une liste de 8 à 12 catégories d'entreprises locales variées à présenter sur le site de ${companyName}.

OBJECTIF SIMPLE : Présenter des commerces et services locaux dans la région, SANS notion de partenariat ou d'affaires.

RÈGLES STRICTES :
- NE JAMAIS proposer d'entreprises qui font la MÊME activité que ${companyName}
- NE JAMAIS proposer d'entreprises qui offrent des services identiques ou similaires
- Exclure TOUS les métiers qui pourraient être perçus comme concurrents
- Privilégier la DIVERSITÉ des catégories (commerces, services, artisans, professions libérales, etc.)

Exemples pour une agence web comme Jalis :
✅ Comptables, experts-comptables
✅ Avocats
✅ Agents immobiliers
✅ Photographes
✅ Restaurants
✅ Coiffeurs
✅ Garagistes
✅ Plombiers
✅ Électriciens
❌ Autres agences web (concurrent direct)
❌ Graphistes (concurrent partiel)
❌ Consultants SEO (concurrent partiel)

Réponds UNIQUEMENT avec un tableau JSON de catégories (chaînes de caractères courtes et précises).
Format attendu : ["catégorie 1", "catégorie 2", ...]`;

    const categoriesResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en analyse commerciale. Tu réponds toujours avec du JSON valide uniquement.",
          },
          { role: "user", content: categoriesPrompt },
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
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      
      // Handle both array and object responses
      if (Array.isArray(parsed)) {
        categories = parsed;
      } else if (typeof parsed === 'object') {
        // If it's an object, try to find the array inside
        const firstKey = Object.keys(parsed)[0];
        if (Array.isArray(parsed[firstKey])) {
          categories = parsed[firstKey];
        } else {
          throw new Error("No array found in categories response");
        }
      } else {
        throw new Error("Categories response is not an array or object");
      }
    } catch (e) {
      console.error("Failed to parse categories:", categoriesData.choices[0].message.content);
      throw new Error("Invalid JSON from categories generation");
    }

    console.log("Generated categories:", categories);

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
5. IMPÉRATIF : Sélectionner UNIQUEMENT des TPE, PME ou artisans locaux
6. AUCUNE grande chaîne nationale ou franchise
7. AUCUN concurrent de ${companyName}, même indirect

Réponds avec un tableau JSON d'objets avec ces champs exacts :
{
  "nom": "Nom de l'entreprise",
  "adresse": "Adresse complète avec code postal",
  "telephone": "Numéro ou 'Non renseigné'",
  "site_web": "URL ou 'Non renseigné'",
  "activite_reelle": "Description courte de l'activité réelle trouvée"
}`;

      const searchResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Tu es un assistant de recherche web. Tu effectues des recherches en temps réel et réponds avec du JSON valide uniquement. Tu ne dois jamais inventer d'informations.",
            },
            { role: "user", content: searchPrompt },
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
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        businesses = JSON.parse(cleanContent);
      } catch (e) {
        console.error(`Failed to parse businesses for ${category}:`, searchData.choices[0].message.content);
        continue;
      }

      // Étape 3: Enrichissement de chaque entreprise trouvée
      for (const business of businesses) {
        if (enrichedBusinesses.length >= maxResults) break;

      const enrichPrompt = `Tu dois générer un JSON avec exactement 3 champs. Lis TOUTES les instructions avant de répondre.

═══════════════════════════════════════════════════════════════════════════════

DONNÉES DE L'ENTREPRISE :
- Nom : ${business.nom}
- Catégorie : ${category}
- Activité : ${business.activite_reelle}
- Adresse : ${business.adresse}
- Téléphone : ${business.telephone}

CONTEXTE : ${companyName} recommande cette entreprise locale à ses clients.
INTERDIT : Ne JAMAIS mentionner le site web ou l'URL de l'entreprise dans le texte.

═══════════════════════════════════════════════════════════════════════════════

CHAMP 1 : "activity"

INSTRUCTION : Écris une phrase SEO de 10-15 mots décrivant le métier.
RÈGLE ABSOLUE : Cette phrase DOIT se terminer par le mot "à" SEUL (sans ville après).

EXEMPLES CORRECTS :
✓ "Notaire accompagnant vos projets immobiliers et successions à"
✓ "Kinésithérapeute spécialisé en rééducation sportive à"
✓ "Plombier professionnel assurant dépannages et installations à"

EXEMPLES INCORRECTS :
✗ "Notaire expérimenté à Marseille" → INTERDIT (ville mentionnée)
✗ "Kinésithérapeute à Lyon" → INTERDIT (ville mentionnée)

LE DERNIER MOT DOIT ÊTRE "à" sans rien après.

═══════════════════════════════════════════════════════════════════════════════

CHAMP 2 : "extract"

INSTRUCTION : Écris 40-60 mots présentant l'entreprise.
RÈGLE ABSOLUE : Tu DOIS utiliser "${companyName} recommande" OU "recommandé par ${companyName}".

MOTS STRICTEMENT INTERDITS : partenaire, partenariat, collaboration, réseau

EXEMPLES CORRECTS :
✓ "${companyName} recommande ${business.nom} pour son expertise et son professionnalisme..."
✓ "Recommandé par ${companyName}, ${business.nom} se distingue..."

EXEMPLES INCORRECTS :
✗ "${business.nom}, partenaire de ${companyName}" → Le mot "partenaire" est INTERDIT

═══════════════════════════════════════════════════════════════════════════════

CHAMP 3 : "description"

INSTRUCTION : Écris un texte HTML de 100-150 mots avec des balises <p>.
RÈGLE ABSOLUE : Tu DOIS mentionner "recommandé par ${companyName}" OU "${companyName} recommande".

MOTS STRICTEMENT INTERDITS : partenaire, partenariat, collaboration, réseau
INTERDIT : Ne JAMAIS mentionner l'URL du site web (ex: "wellmob.fr", "example.com")

STRUCTURE EN 3 PARAGRAPHES :

<p>Paragraphe 1 (40-60 mots) : Présentation avec "recommandé par ${companyName}"</p>
<p>Paragraphe 2 (20-30 mots) : Services concrets proposés</p>
<p>Paragraphe 3 (30-40 mots) : Coordonnées (adresse + téléphone, SANS URL)</p>

EXEMPLE CORRECT pour paragraphe 1 :
<p>À proximité, recommandé par ${companyName}, ${business.nom} accompagne ses clients...</p>

EXEMPLE INCORRECT :
<p>Partenaire de ${companyName}...</p> → Le mot "partenaire" est INTERDIT

═══════════════════════════════════════════════════════════════════════════════

AVANT DE RÉPONDRE, VÉRIFIE :
1. Le champ "activity" se termine par "à" sans ville ?
2. Tu as écrit "recommande" ou "recommandé par" (JAMAIS "partenaire") ?
3. Tu n'as PAS mentionné d'URL dans la description ?
4. Ton JSON est valide ?

RÉPONDS UNIQUEMENT AVEC CE JSON (sans texte avant ou après) :
{
  "activity": "Description métier 10-15 mots se terminant par à",
  "extract": "40-60 mots avec recommande/recommandé par",
  "description": "<p>Paragraphe 1</p><p>Paragraphe 2</p><p>Paragraphe 3</p>"
}`;


1. Le champ "activity" se termine-t-il par le mot "à" SANS ville après ?
   ❌ Si tu vois "à Marseille" ou toute autre ville → CORRIGE !
   ✅ Doit finir par "à" seul (dernier mot)

2. Le champ "extract" contient-il le mot "partenaire" ?
   ❌ Si oui → REMPLACE par "recommandé par" ou "conseillé par"
   ✅ Utilise uniquement des verbes de recommandation

3. Le champ "description" contient-il "partenaire" ou "partenariat" ?
   ❌ Si oui → REMPLACE par "recommandé par" ou "${companyName} recommande"
   ✅ Utilise uniquement des verbes de recommandation

Réponds UNIQUEMENT avec un objet JSON valide contenant les 3 champs : activity, extract, description. Pas de texte avant ou après.`;

        const enrichResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "Tu es un expert en rédaction de contenus pour annuaires professionnels. Tu réponds toujours avec du JSON valide uniquement, sans texte supplémentaire. RÈGLES CRITIQUES : (1) Le champ 'activity' doit TOUJOURS se terminer par le mot 'à' seul, SANS mention de ville après. (2) Tu utilises UNIQUEMENT le vocabulaire de RECOMMANDATION (recommande, conseille, suggère) et JAMAIS les mots 'partenaire', 'partenariat', 'collaboration' ou 'réseau'.",
              },
              { role: "user", content: enrichPrompt },
            ],
          }),
        });

        if (!enrichResponse.ok) {
          console.error("Enrichment failed for business:", business.nom);
          continue;
        }

        const enrichData = await enrichResponse.json();
        let aiData;

        try {
          const content = enrichData.choices[0].message.content;
          const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
          aiData = JSON.parse(cleanContent);
        } catch (e) {
          console.error("Failed to parse enrichment data:", enrichData.choices[0].message.content);
          continue;
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
    }

    console.log(`Generated ${enrichedBusinesses.length} partner businesses`);

    return new Response(JSON.stringify({ enrichedBusinesses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-partner-guide function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});