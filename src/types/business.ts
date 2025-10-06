export interface Business {
  nom: string;
  adresse: string;
  telephone: string;
  site_web: string;
  lien_maps: string;
}

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface SearchParams {
  address: string;
  maxResults: number;
}
