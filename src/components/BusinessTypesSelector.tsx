import { useState, useMemo, useRef } from "react";
import { X, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { BUSINESS_TYPES, ALL_TYPES_OPTION, BusinessType, normalizeString } from "@/constants/businessTypes";
import { cn } from "@/lib/utils";

interface BusinessTypesSelectorProps {
  selectedTypes: BusinessType[];
  onTypesChange: (types: BusinessType[]) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

export const BusinessTypesSelector = ({ selectedTypes, onTypesChange, disabled, hideLabel }: BusinessTypesSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isAllTypesSelected = selectedTypes.some((t) => t.id === "all");
  const selectedType = selectedTypes.length > 0 ? selectedTypes[0] : null;

  // Trier les types alphabétiquement
  const sortedTypes = useMemo(() => {
    return [...BUSINESS_TYPES].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, []);

  // Filtrer avec tolérance aux accents
  const filteredTypes = useMemo(() => {
    if (!inputValue.trim()) return sortedTypes.slice(0, 50);
    const normalizedQuery = normalizeString(inputValue);
    const filtered = sortedTypes.filter((type) => 
      normalizeString(type.label).includes(normalizedQuery)
    );
    return filtered.slice(0, 50);
  }, [inputValue, sortedTypes]);

  const handleSelect = (type: BusinessType) => {
    if (type.id === "all") {
      onTypesChange([ALL_TYPES_OPTION]);
      setInputValue("Tout type d'activités");
    } else {
      onTypesChange([type]);
      setInputValue(type.label);
    }
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setOpen(true);
    
    // Si l'utilisateur modifie l'input, désélectionner
    if (selectedType && value !== selectedType.label) {
      onTypesChange([]);
    }
  };

  const handleClearInput = () => {
    setInputValue("");
    onTypesChange([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveSelection = () => {
    setInputValue("");
    onTypesChange([]);
  };

  const handleInputFocus = () => {
    if (!selectedType || inputValue === "") {
      setOpen(true);
    }
  };

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <Label className="text-sm font-bold text-foreground uppercase tracking-wide">Type d'activité</Label>
      )}

      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Rechercher une activité..."
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={disabled}
              className="pl-9 pr-9"
            />
            {inputValue && (
              <button
                onClick={handleClearInput}
                disabled={disabled}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <Command>
              <CommandList>
                <CommandEmpty>Aucune activité trouvée.</CommandEmpty>
                <CommandGroup>
                {/* Option "Tout type d'activités" */}
                <CommandItem
                  value={ALL_TYPES_OPTION.label}
                  onSelect={() => handleSelect(ALL_TYPES_OPTION)}
                  className="cursor-pointer"
                >
                  <span className="font-semibold">{ALL_TYPES_OPTION.label}</span>
                </CommandItem>

                {filteredTypes.map((type) => (
                  <CommandItem
                    key={type.id}
                    value={type.label}
                    onSelect={() => handleSelect(type)}
                    className="cursor-pointer"
                  >
                    {type.label}
                  </CommandItem>
                ))}
                
                {inputValue.trim() && filteredTypes.length === 50 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center border-t">
                    Affinez votre recherche pour voir plus de résultats
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        </Popover>
      </div>

      {/* Badge de sélection */}
      {selectedType && (
        <Badge variant="secondary" className="px-3 py-1.5 gap-1.5 w-fit">
          {selectedType.label}
          <button
            onClick={handleRemoveSelection}
            disabled={disabled}
            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
};
