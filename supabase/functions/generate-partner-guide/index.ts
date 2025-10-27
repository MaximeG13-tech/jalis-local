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

      const enrichPrompt = `🚫 INTERDICTIONS ABSOLUES 🚫
❌ Ne JAMAIS mentionner l'URL du site web de ${business.nom} dans la description
❌ Ne JAMAIS écrire le nom de domaine (ex: "wellmob.fr", "tvspro.com", etc.)
❌ Mots interdits : partenariat, partenaire, collaborer, collaboration, s'associer, apporteur d'affaires
❌ Cette entreprise est RECOMMANDÉE par ${companyName}, ce n'est PAS un partenariat commercial

---

PARAGRAPHE 2 - PHRASES D'ACCROCHE VARIÉES (choisis-en UNE au hasard) :

STYLE 1 - Présentation locale :
• "Situé à proximité, ${business.nom} accompagne les particuliers et professionnels dans leurs projets."
• "Acteur de proximité reconnu, ${business.nom} met son expertise au service de ses clients."
• "Établi localement, ${business.nom} offre un service personnalisé adapté à chaque besoin."

STYLE 2 - Valorisation expertise :
• "Forte d'une solide expérience, l'entreprise ${business.nom} se distingue par son savoir-faire."
• "Spécialiste reconnu dans son domaine, ${business.nom} garantit des prestations de qualité."
• "Grâce à son expertise avérée, ${business.nom} répond aux attentes les plus exigeantes."

STYLE 3 - Approche client :
• "À l'écoute de ses clients, ${business.nom} propose des solutions sur-mesure et durables."
• "Privilégiant une approche personnalisée, ${business.nom} s'adapte à chaque situation."
• "Soucieux de la satisfaction client, ${business.nom} assure un suivi rigoureux de chaque projet."

STYLE 4 - Ancrage territorial :
• "Implanté dans la région, ${business.nom} contribue au dynamisme économique local."
• "Entreprise locale de confiance, ${business.nom} s'engage auprès de sa communauté."
• "Fier de ses racines locales, ${business.nom} cultive la proximité avec sa clientèle."

⚠️ IMPÉRATIF : Choisis UNE phrase AU HASARD parmi ces 12 options pour VARIER le contenu.

---

Entreprise locale à présenter :
- Nom : ${business.nom}
- Catégorie : ${category}
- Activité : ${business.activite_reelle}
- ⛔ NE PAS mentionner leur URL
- ⛔ ${companyName} RECOMMANDE cette entreprise (pas de partenariat)

Instructions strictes pour un SEO optimal :

1. **activity** : TITRE LONGUE TRAÎNE SEO de 10 à 15 mots obligatoirement, SANS PRONOM PERSONNEL, se terminant par "à"

🚨 RÈGLE ABSOLUE POUR LE CHAMP ACTIVITY 🚨
LE CHAMP "activity" DOIT SE TERMINER PAR LE MOT "à" SEUL, SANS AUCUNE VILLE APRÈS !

❌ INTERDIT : "Kinésithérapeute spécialisé en rééducation sportive à Marseille"
❌ INTERDIT : Toute mention de ville après le "à"
✅ CORRECT : "Kinésithérapeute spécialisé en rééducation sportive à"
✅ CORRECT : "Plombier professionnel pour tous travaux de plomberie et dépannage à"

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
- NE JAMAIS inclure le nom de la ville

2. **extract** : Résumé percutant de 40 à 60 mots enrichi de mots-clés SEO relatifs à l'activité. 

🚨 RÈGLE ABSOLUE POUR LE CHAMP EXTRACT 🚨
VOCABULAIRE DE RECOMMANDATION UNIQUEMENT, JAMAIS DE PARTENARIAT !

❌ MOTS INTERDITS : partenaire, partenariat, collaboration, réseau, affaires
❌ INTERDIT : "partenaire de ${companyName}"
✅ CORRECT : "recommandé par ${companyName}"
✅ CORRECT : "${companyName} recommande"

RÈGLES POUR L'EXTRACT :
- Mentionne ${companyName} avec UNIQUEMENT des verbes de RECOMMANDATION :
  ✅ "recommande", "recommandé par"
  ✅ "conseille", "conseillé par"
  ✅ "suggère", "suggéré par"
  ✅ "met en avant", "mis en avant par"
- Doit donner envie de contacter l'entreprise en mettant en avant ses points forts

3. **description** : Description de 100 à 150 MOTS en HTML avec des balises <p>.

⚠️ STRUCTURE OBLIGATOIRE EN 3 PARAGRAPHES :

• Paragraphe 1 (40-60 mots) : Présentation détaillée de l'activité et des services
  
  🚨 RÈGLE ABSOLUE : VOCABULAIRE DE RECOMMANDATION UNIQUEMENT 🚨
  ❌ MOTS INTERDITS : partenaire, partenariat, collaboration, réseau, affaires
  ❌ INTERDIT : "partenaire de confiance de ${companyName}"
  ❌ INTERDIT : "partenaire de ${companyName}"
  
  Intègre ${companyName} avec UNIQUEMENT ces formulations :
  ✅ "recommandé par ${companyName}"
  ✅ "conseillé par ${companyName}"
  ✅ "${companyName} recommande"
  ✅ "${companyName} vous conseille"

• Paragraphe 2 (20-30 mots) : UNE des 12 phrases d'accroche listées ci-dessus (varie !)

• Paragraphe 3 (30-40 mots) : Coordonnées et appel à l'action

⛔ INTERDICTIONS dans la description :
- NE JAMAIS mentionner l'URL ou le nom de domaine du site web de ${business.nom}
- NE JAMAIS écrire "wellmob.fr", "tvspro.com" ou tout autre domaine
- NE JAMAIS utiliser le vocabulaire de partenariat commercial
- Si site web disponible : "Rendez-vous sur leur site web" ou "Consultez leur site pour plus d'informations"
- Si téléphone disponible : "Contactez-les au ${business.telephone}"

Format JSON attendu :
{
  "activity": "titre SEO 10-15 mots se terminant par 'à' SANS la ville",
  "extract": "résumé 40-60 mots avec RECOMMANDATION (pas partenariat)",
  "description": "<p>Paragraphe 1 avec RECOMMANDATION</p><p>Paragraphe 2 : phrase d'accroche</p><p>Paragraphe 3 avec coordonnées SANS URL</p>"
}

CONSIGNES DE TON :
- Parle TOUJOURS à la 3ème personne de l'entreprise
- Utilise "leur", "ils", "cette entreprise", "${business.nom}"
- ${companyName} RECOMMANDE cette entreprise (vocabulaire de recommandation uniquement)
- ⛔ JAMAIS d'URL dans le texte - remplace par "leur site web" ou "leur site"
- ⛔ JAMAIS de vocabulaire de partenariat commercial

🚨🚨🚨 VÉRIFICATION FINALE AVANT DE RÉPONDRE 🚨🚨🚨

AVANT D'ENVOYER TA RÉPONSE JSON, VÉRIFIE :

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