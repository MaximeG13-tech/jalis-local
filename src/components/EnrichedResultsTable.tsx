import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Building2, MapPin } from 'lucide-react';

interface EnrichedBusiness {
  name: string;
  activity: string;
  city: string;
  extract: string;
  description: string;
}

interface EnrichedResultsTableProps {
  businesses: EnrichedBusiness[];
  onRemove: (index: number) => void;
}

export const EnrichedResultsTable = ({ businesses, onRemove }: EnrichedResultsTableProps) => {
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
                  <CardTitle className="text-xl">{business.name}</CardTitle>
                </div>
                <div className="text-base font-semibold text-foreground">
                  {business.activity} {business.city}
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

          <CardContent className="space-y-4">
            {/* Extract */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                {business.extract}
              </p>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed text-foreground">
                {business.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
