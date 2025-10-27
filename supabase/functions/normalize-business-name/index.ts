import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NormalizeRequest {
  business_name: string;
  website?: string | null;
  address: string;
  phone?: string | null;
}

interface NormalizeResponse {
  normalized_name: string;
  confidence_score: number;
  source: 'gmb_cleaned' | 'website_legal' | 'website_meta' | 'website_schema';
  should_exclude: boolean;
}

function cleanBusinessName(name: string): string {
  return name
    // 1. Retirer les emojis
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    
    // 2. Retirer les symboles courants
    .replace(/⭐|★|✨|🔥|💥|💫|❤️|💯|👍|✅|🎉|🎊/g, '')
    
    // 3. Retirer les mentions promotionnelles
    .replace(/\b(PROMO|NOUVEAU|OFFRE|SOLDES|REDUCTION|-%|GRATUIT)\b/gi, '')
    
    // 4. Retirer les suffixes de localisation " - Paris 15", " Paris", " 75015"
    .replace(/\s-\s[\w\s]+\d{2,5}$/i, '')
    .replace(/\s\d{5}$/i, '')
    
    // 5. Retirer les parenthèses et leur contenu
    .replace(/\([^)]*\)/g, '')
    
    // 6. Retirer les espaces multiples
    .replace(/\s{2,}/g, ' ')
    
    // 7. Trim
    .trim()
    
    // 8. Normaliser la casse (éviter TOUT MAJUSCULE)
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word.toUpperCase(); // Sigles (SA, SAS, etc.)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function isLegalForm(name: string): boolean {
  // Détecte si le nom ressemble à une forme juridique plutôt qu'à un nom commercial
  const legalPatterns = [
    /d'exercice\slibéral/i,
    /responsabilit[ée]\slimit[ée]e/i,
    /\bRCS\b/i,
    /\bSIREN\b/i,
    /\bSIRET\b/i,
    /société\sen\snom\scollectif/i,
    /société\scivile/i,
    /entreprise\sunipersonnelle/i,
    /capital\sde\s/i,
    /immatricul[ée]e/i,
    /registre\sdu\scommerce/i,
  ];
  
  return legalPatterns.some(pattern => pattern.test(name));
}

function shouldExclude(originalName: string, cleanedName: string): boolean {
  // 1. Nom nettoyé trop court
  if (cleanedName.length < 3) {
    console.log(`❌ EXCLUDE: Name too short: "${cleanedName}" (length: ${cleanedName.length})`);
    return true;
  }
  
  // 2. Nom contient encore trop de caractères suspects après nettoyage
  const suspiciousChars = cleanedName.match(/[^a-zA-ZÀ-ÿ0-9\s\-'&.,]/g);
  if (suspiciousChars && suspiciousChars.length > 3) {
    console.log(`❌ EXCLUDE: Too many suspicious chars: "${cleanedName}" (${suspiciousChars.length} suspicious chars)`);
    return true;
  }
  
  // 3. Nom uniquement des chiffres
  if (/^\d+$/.test(cleanedName)) {
    console.log(`❌ EXCLUDE: Name is only digits: "${cleanedName}"`);
    return true;
  }
  
  // 4. Le nom original était 70%+ du "bruit" (emojis, symboles)
  if (cleanedName.length < originalName.length * 0.3) {
    console.log(`❌ EXCLUDE: Original name was mostly noise: "${originalName}" → "${cleanedName}" (${Math.round(cleanedName.length / originalName.length * 100)}% remaining)`);
    return true;
  }
  
  // 5. Nom vide ou uniquement des espaces
  if (!cleanedName.trim()) {
    console.log(`❌ EXCLUDE: Name is empty after cleaning`);
    return true;
  }
  
  return false;
}

async function extractNameFromWebsite(websiteUrl: string): Promise<{
  name: string | null;
  source: 'legal' | 'meta' | 'schema' | null;
  confidence: number;
}> {
  try {
    console.log(`🌐 Attempting to extract name from website: ${websiteUrl}`);
    
    // 1. Essayer la page des mentions légales
    const legalUrls = [
      `${websiteUrl}/mentions-legales`,
      `${websiteUrl}/mentions`,
      `${websiteUrl}/legal`,
      `${websiteUrl}/about`,
      `${websiteUrl}/a-propos`
    ];
    
    for (const url of legalUrls) {
      try {
        console.log(`  Trying legal page: ${url}`);
        const response = await fetch(url, { 
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Patterns pour extraire le nom dans les mentions légales
          const patterns = [
            /Dénomination sociale\s*:?\s*([A-ZÀ-Ÿ][^\n<]{3,50})/i,
            /Raison sociale\s*:?\s*([A-ZÀ-Ÿ][^\n<]{3,50})/i,
            /Société\s*:?\s*([A-ZÀ-Ÿ][^\n<]{3,50})/i,
            /Entreprise\s*:?\s*([A-ZÀ-Ÿ][^\n<]{3,50})/i,
          ];
          
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              const extractedName = match[1].trim();
              console.log(`  ✅ Found name in legal page: "${extractedName}"`);
              return {
                name: extractedName,
                source: 'legal',
                confidence: 95
              };
            }
          }
        }
      } catch (e: any) {
        // Continue to next URL
        console.log(`  ⏭️ Failed to fetch ${url}:`, e.message);
      }
    }
    
    // 2. Essayer la page d'accueil pour schema.org
    console.log(`  Trying homepage for schema.org data`);
    const homeResponse = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
    });
    
    if (homeResponse.ok) {
      const html = await homeResponse.text();
      
      // Extraire JSON-LD schema.org
      const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      if (schemaMatch) {
        try {
          const schema = JSON.parse(schemaMatch[1]);
          if (schema.name || schema.legalName) {
            const extractedName = schema.legalName || schema.name;
            console.log(`  ✅ Found name in schema.org: "${extractedName}"`);
            return {
              name: extractedName,
              source: 'schema',
              confidence: 90
            };
          }
        } catch (e: any) {
          console.log(`  ⚠️ Failed to parse JSON-LD:`, e.message);
        }
      }
      
      // Extraire depuis <title> ou <h1>
      const titleMatch = html.match(/<title>([^<]{3,60})<\/title>/i);
      const h1Match = html.match(/<h1[^>]*>([^<]{3,60})<\/h1>/i);
      
      if (titleMatch || h1Match) {
        const name = (titleMatch?.[1] || h1Match?.[1] || '').trim();
        // Nettoyer les suffixes courants dans les titres
        const cleanedName = name
          .replace(/\s-\s.*$/i, '') // "Nom - Slogan"
          .replace(/\|.*$/i, '') // "Nom | Accueil"
          .trim();
        
        if (cleanedName.length >= 3) {
          console.log(`  ✅ Found name in title/h1: "${cleanedName}"`);
          return {
            name: cleanedName,
            source: 'meta',
            confidence: 75
          };
        }
      }
    }
    
    console.log(`  ⚠️ No name found on website`);
    return { name: null, source: null, confidence: 0 };
    
  } catch (error: any) {
    console.error('❌ Error extracting name from website:', error.message);
    return { name: null, source: null, confidence: 0 };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_name, website, address, phone }: NormalizeRequest = await req.json();
    
    console.log('📋 Normalizing business name:', business_name);
    console.log('   Website:', website || 'none');
    console.log('   Address:', address);
    
    // Étape 1 : Nettoyage basique (toujours fait)
    const cleanedName = cleanBusinessName(business_name);
    console.log(`🧹 Cleaned name: "${business_name}" → "${cleanedName}"`);
    
    // Vérifier si on doit exclure cette entreprise
    const shouldExcludeResult = shouldExclude(business_name, cleanedName);
    
    if (shouldExcludeResult) {
      const response: NormalizeResponse = {
        normalized_name: cleanedName,
        confidence_score: 0,
        source: 'gmb_cleaned',
        should_exclude: true
      };
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Étape 2 : Si website existe, essayer d'extraire le nom officiel
    if (website && website !== 'Non disponible') {
      console.log('🌐 Website available, attempting extraction');
      const websiteResult = await extractNameFromWebsite(website);
      
      if (websiteResult.name) {
        // Vérifier si l'extraction web est une forme juridique
        if (isLegalForm(websiteResult.name)) {
          console.log(`⚠️ Website extraction looks like a legal form, preferring GMB name: "${websiteResult.name}"`);
          console.log(`✅ Using cleaned GMB name instead: "${cleanedName}"`);
          const response: NormalizeResponse = {
            normalized_name: cleanedName,
            confidence_score: 70, // Plus de confiance car on évite une forme juridique
            source: 'gmb_cleaned',
            should_exclude: false
          };
          
          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Si l'extraction web est un vrai nom commercial, l'utiliser
        const response: NormalizeResponse = {
          normalized_name: websiteResult.name,
          confidence_score: websiteResult.confidence,
          source: `website_${websiteResult.source}` as any,
          should_exclude: false
        };
        
        console.log(`✅ Using website name: "${websiteResult.name}" (${websiteResult.source}, confidence: ${websiteResult.confidence}%)`);
        
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Fallback : utiliser le nom nettoyé
    console.log(`✅ Using cleaned GMB name: "${cleanedName}"`);
    const response: NormalizeResponse = {
      normalized_name: cleanedName,
      confidence_score: 60,
      source: 'gmb_cleaned',
      should_exclude: false
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('❌ Error in normalize-business-name function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      normalized_name: '',
      confidence_score: 0,
      source: 'gmb_cleaned',
      should_exclude: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
