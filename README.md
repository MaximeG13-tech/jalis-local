# Application Prospection Entreprises

Application web de prospection intelligente permettant de générer automatiquement des listes d'entreprises qualifiées avec site web et numéro de téléphone.

## 🚀 Démarrage rapide

### 1. Configuration de la clé API Google Places

**IMPORTANT** : Avant d'utiliser l'application, vous devez configurer votre clé API Google Places.

1. Rendez-vous sur [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs suivantes :
   - **Places API**
   - **Geocoding API**
4. Créez une clé API
5. Ouvrez le fichier `src/config/api.config.ts`
6. Remplacez `YOUR_GOOGLE_PLACES_API_KEY` par votre clé API

```typescript
// src/config/api.config.ts
export const GOOGLE_PLACES_API_KEY = 'VOTRE_CLE_API_ICI';
```

### 2. Installation et lancement

```sh
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run dev
```

## ✨ Fonctionnalités

- 🔍 **Recherche intelligente** : Trouvez des entreprises par adresse ou nom
- 📊 **Filtrage automatique** : Uniquement les entreprises avec téléphone ET site web
- 📈 **Suivi en temps réel** : Barre de progression pendant la recherche
- 💾 **Export JSON** : Exportez vos résultats facilement
- 🎨 **Design moderne** : Interface élégante et responsive

## 🛠️ Technologies

- **React** + **TypeScript**
- **Vite** pour le build
- **Tailwind CSS** pour le design
- **shadcn-ui** pour les composants
- **Google Places API** pour les données

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/69a13559-0093-427a-a955-41b7006d01ed) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
