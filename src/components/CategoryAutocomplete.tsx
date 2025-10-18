import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GBPCategory {
  id: string;
  displayName: string;
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
    fetch('/gcid_categories.json')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Erreur chargement catégories GBP:', err));
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return categories
      .filter(cat => cat.displayName.toLowerCase().includes(query))
      .slice(0, 50);
  }, [categories, searchQuery]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
        Catégorie d'activité
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between h-[42px]"
          >
            <span className="truncate">
              {value ? value.displayName : "Rechercher une catégorie..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-popover z-50" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0"
              />
            </div>
            <CommandList>
              <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.displayName}
                    onSelect={() => {
                      onChange(category);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.displayName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
