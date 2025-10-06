// ========================================
// 🔑 CONFIGURATION API GOOGLE PLACES
// ========================================
// 
// ⚠️ IMPORTANT : Remplacez la valeur ci-dessous par votre clé API Google Places
// 
// Pour obtenir votre clé API :
// 1. Rendez-vous sur : https://console.cloud.google.com/google/maps-apis/credentials
// 2. Créez un nouveau projet ou sélectionnez un projet existant
// 3. Activez les APIs suivantes :
//    - Places API
//    - Geocoding API
// 4. Créez une clé API et copiez-la ci-dessous
// 
// ⚠️ SÉCURITÉ : Ne partagez JAMAIS votre clé API publiquement
// Cette configuration est uniquement pour un usage en développement/interne
// ========================================

export const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';

// Vérification de la configuration
if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') {
  console.warn(
    '⚠️ ATTENTION : Vous devez configurer votre clé API Google Places dans src/config/api.config.ts'
  );
}
