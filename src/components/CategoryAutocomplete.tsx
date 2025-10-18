import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GBPCategory {
  id: string;
  displayName: string;
  displayNameFr?: string;
}

interface CategoryAutocompleteProps {
  value: GBPCategory | null;
  onChange: (category: GBPCategory | null) => void;
  disabled?: boolean;
}

export const CategoryAutocomplete = ({ value, onChange, disabled }: CategoryAutocompleteProps) => {
  const [categories, setCategories] = useState<GBPCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load categories and French translations
    Promise.all([
      fetch('/gcid_raw.txt').then(res => res.text()),
      fetch('/categories_fr.json').then(res => res.json())
    ])
      .then(([rawText, translations]) => {
        const categoriesArray = JSON.parse(rawText);
        const converted = categoriesArray.map((category: string) => {
          const id = `gcid:${category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
          const translation = translations[id];
          return {
            id,
            displayName: category,
            displayNameFr: translation?.fr || category
          };
        });
        setCategories(converted);
        console.log(`Chargé ${converted.length} catégories GBP (avec traductions FR)`);
      })
      .catch(err => console.error('Erreur chargement catégories GBP:', err));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-autocomplete-container')) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return categories
      .filter(cat => 
        (cat.displayNameFr?.toLowerCase().includes(query) || 
         cat.displayName.toLowerCase().includes(query))
      )
      .slice(0, 50);
  }, [categories, searchQuery]);

  return (
    <div className="space-y-2 category-autocomplete-container">
      <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
        Catégorie d'activité
      </Label>
      <div className="relative">
        <Input
          placeholder="Tapez votre activité (ex: Notaire, Plombier, Coiffeur...)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.length > 0) {
              setOpen(true);
            } else {
              setOpen(false);
            }
          }}
          onFocus={() => {
            if (searchQuery.length > 0) {
              setOpen(true);
            }
          }}
          disabled={disabled}
          className="h-[42px]"
        />
        {value && (
          <div className="mt-2 p-2 bg-muted rounded-md flex items-center justify-between">
            <span className="text-sm font-medium">{value.displayNameFr || value.displayName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null);
                setSearchQuery('');
              }}
              className="h-6 px-2"
            >
              ✕
            </Button>
          </div>
        )}
        {open && filteredCategories.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-[300px] overflow-y-auto shadow-lg">
            <div className="p-2">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => {
                    onChange(category);
                    setSearchQuery('');
                    setOpen(false);
                  }}
                  className={cn(
                    "px-3 py-2 cursor-pointer rounded-md hover:bg-accent transition-colors",
                    value?.id === category.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value?.id === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{category.displayNameFr || category.displayName}</span>
                      {category.displayNameFr && category.displayNameFr !== category.displayName && (
                        <span className="text-xs text-muted-foreground">{category.displayName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {open && searchQuery.length > 0 && filteredCategories.length === 0 && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune catégorie trouvée pour "{searchQuery}"
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
