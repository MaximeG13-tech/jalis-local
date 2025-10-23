import { Business } from '@/types/business';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Phone, Globe, X, MapPin, Building2 } from 'lucide-react';

interface ResultsTableProps {
  businesses: Business[];
  onRemove: (index: number) => void;
}

export const ResultsTable = ({ businesses, onRemove }: ResultsTableProps) => {
  if (businesses.length === 0) return null;

  return (
    <div className="space-y-4">
      {businesses.map((business, index) => (
        <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden">
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary-glow" />
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <CardTitle className="text-xl">{business.nom}</CardTitle>
                </div>
                <Badge variant="secondary" className="w-fit text-xs font-medium">
                  {business.type_activite}
                </Badge>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <CardDescription className="text-sm leading-relaxed">
                    {business.adresse}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                title="Supprimer ce résultat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Phone */}
              <a
                href={`tel:${business.telephone}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors group/link"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium group-hover/link:text-primary">
                  {business.telephone}
                </span>
              </a>

              {/* Website */}
              <a
                href={business.site_web}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/5 hover:bg-accent/10 border border-accent/20 transition-colors group/link"
              >
                <Globe className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium group-hover/link:text-accent truncate max-w-[200px]">
                  {business.site_web.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>

              {/* Google Maps */}
              <a
                href={business.lien_maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success/5 hover:bg-success/10 border border-success/20 transition-colors group/link"
              >
                <MapPin className="h-4 w-4 text-success" />
                <span className="text-sm font-medium group-hover/link:text-success">
                  Google Maps
                </span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
