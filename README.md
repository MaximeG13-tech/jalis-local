# Guide Local Jalis - Prospection Intelligente

Générez automatiquement une liste d'entreprises qualifiées avec site web et téléphone à partir d'une adresse.

## 🚀 Fonctionnalités

- **Autocomplétion d'adresse** : Recherche intelligente avec suggestions automatiques
- **Filtrage intelligent** : Uniquement les entreprises avec téléphone ET site web
- **Données complètes** : Nom, adresse, téléphone, site web et lien Google Maps
- **Export JSON** : Téléchargez vos résultats en un clic
- **Interface moderne** : Design élégant avec indicateur de progression

## 🔧 Configuration

### Prérequis

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer les APIs suivantes :
   - **Places API (New)** - API v1
   - **Geocoding API**
3. Créer une clé API avec les restrictions appropriées

### Installation

Le projet utilise **Lovable Cloud** pour sécuriser votre clé API côté backend.

La clé API Google Places est déjà configurée dans les secrets du backend. Si vous devez la modifier :
1. Ouvrez le backend de votre projet
2. Modifiez le secret `GOOGLE_PLACES_API_KEY` avec votre nouvelle clé API

## 🏗️ Architecture

### Backend (Edge Functions)

Trois fonctions backend sécurisées :

- **google-autocomplete** : Autocomplétion d'adresses via Places API (New)
- **google-nearby-search** : Recherche à proximité via Nearby Search (New)  
- **google-place-details** : Détails des lieux via Place Details (New)

### Frontend

- React + TypeScript + Vite
- Tailwind CSS pour le design
- Shadcn UI pour les composants
- Supabase Client pour les appels backend

## 📖 Utilisation

1. Saisissez une adresse dans le champ de recherche
2. Sélectionnez une suggestion de l'autocomplétion
3. Choisissez le nombre d'entreprises à générer (10, 20 ou 50)
4. Cliquez sur "Générer la liste"
5. Attendez que la recherche se termine
6. Exportez les résultats en JSON

## 🔐 Sécurité

- La clé API Google Places est stockée de manière sécurisée dans les secrets backend
- Toutes les requêtes API passent par des edge functions sécurisées
- Aucune clé API n'est exposée côté frontend

## 🛠️ Technologies

- **Frontend** : React, TypeScript, Vite, Tailwind CSS
- **Backend** : Lovable Cloud (Supabase Edge Functions)
- **API** : Google Places API (New) v1
- **Deployment** : Lovable

## 📝 Notes

- L'application utilise la **nouvelle API Google Places v1**
- Les anciennes APIs (nearbysearch/json, details/json) ne sont pas utilisées
- Les résultats sont filtrés pour inclure uniquement les entreprises avec téléphone ET site web

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/69a13559-0093-427a-a955-41b7006d01ed) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
