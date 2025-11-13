import { Business } from '@/types/business';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ExternalLink, Phone, Globe, X, MapPin, Building2, Pencil, Check } from 'lucide-react';
import { useState } from 'react';

interface ResultsTableProps {
  businesses: Business[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, updatedBusiness: Business) => void;
}

const formatRating = (rating?: number, totalReviews?: number): string => {
  if (!rating || rating === 0 || !totalReviews || totalReviews === 0) {
    return '';
  }

  const roundedRating = Math.round(rating * 2) / 2;
  let stars = '';
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  
  stars += '⭐'.repeat(fullStars);
  
  if (hasHalfStar) {
    stars += '☆';
  }
  
  const emptyStars = 5 - Math.ceil(roundedRating);
  stars += '☆'.repeat(emptyStars);
  
  return ` ${rating.toFixed(1)} ${stars} (${totalReviews} avis)`;
};

export const ResultsTable = ({ businesses, onRemove, onUpdate }: ResultsTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState<string>('');

  const handleStartEdit = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditedName(currentName);
  };

  const handleSaveEdit = (index: number, business: Business) => {
    if (editedName.trim() && editedName !== business.nom) {
      onUpdate(index, { ...business, nom: editedName.trim() });
    }
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedName('');
  };

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
                  {editingIndex === index ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(index, business);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="text-xl font-semibold h-auto py-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveEdit(index, business)}
                        className="h-8 w-8 text-success hover:text-success"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-xl">
                        {business.nom}
                        {business.rating && business.user_ratings_total && (
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            {formatRating(business.rating, business.user_ratings_total)}
                          </span>
                        )}
                      </CardTitle>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEdit(index, business.nom)}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Modifier le nom"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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
