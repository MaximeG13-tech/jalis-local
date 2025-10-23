export interface Business {
  nom: string;
  type_activite: string;
  adresse: string;
  telephone: string;
  site_web: string;
  lien_maps: string;
  category_id?: string;
  primary_type_display_name?: string;
}

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  types?: string[];
  primary_type?: string;
  primary_type_display_name?: string;
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
