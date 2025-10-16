import { useState, useMemo, useEffect, useRef } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BUSINESS_TYPES, ALL_TYPES_OPTION, BusinessType } from "@/constants/businessTypes";
import { cn } from "@/lib/utils";

interface BusinessTypesSelectorProps {
  selectedTypes: BusinessType[];
  onTypesChange: (types: BusinessType[]) => void;
  disabled?: boolean;
}

export const BusinessTypesSelector = ({ selectedTypes, onTypesChange, disabled }: BusinessTypesSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const shouldReopenRef = useRef(false);

  const isAllTypesSelected = selectedTypes.some((t) => t.id === "all");

  // Surveiller les changements de selectedTypes pour rouvrir le dropdown
  useEffect(() => {
    if (shouldReopenRef.current && selectedTypes.length === 0) {
      shouldReopenRef.current = false;
      setOpen(true);
    }
  }, [selectedTypes]);

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return BUSINESS_TYPES;
    return BUSINESS_TYPES.filter((type) => type.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const handleSelect = (type: BusinessType) => {
    // Si on sélectionne "Tout type d'activités"
    if (type.id === "all") {
      if (isAllTypesSelected) {
        onTypesChange([]);
      } else {
        onTypesChange([ALL_TYPES_OPTION]);
        setOpen(false); // Fermer le dropdown automatiquement
      }
      return;
    }

    // Si "Tout type" est sélectionné, on le retire
    if (isAllTypesSelected) {
      onTypesChange([type]);
      return;
    }

    // Toggle le type
    const isSelected = selectedTypes.some((t) => t.id === type.id);
    if (isSelected) {
      onTypesChange(selectedTypes.filter((t) => t.id !== type.id));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleClearAllTypes = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Fermer le dropdown
    setOpen(false);
    // Marquer qu'on veut rouvrir le dropdown après l'effacement
    shouldReopenRef.current = true;
    // Effacer la sélection
    onTypesChange([]);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    // Permettre toujours l'ouverture du dropdown
    // La croix gère la désélection séparément
    if (!open) {
      setOpen(true);
    }
  };

  const removeType = (typeId: string) => {
    onTypesChange(selectedTypes.filter((t) => t.id !== typeId));
  };

  const clearAll = () => {
    onTypesChange([]);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-foreground uppercase tracking-wide">Types d'activités</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            onClick={handleButtonClick}
            className="w-full justify-between h-auto min-h-[42px] py-2"
          >
            <span className="truncate">
              {selectedTypes.length === 0
                ? "Sélectionner des activités..."
                : isAllTypesSelected
                  ? "Tout type d'activités"
                  : `${selectedTypes.length} activité${selectedTypes.length > 1 ? "s" : ""} sélectionnée${selectedTypes.length > 1 ? "s" : ""}`}
            </span>
            {isAllTypesSelected ? (
              <X
                className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleClearAllTypes}
              />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-popover z-50" align="start">
          <Command>
            <CommandInput placeholder="Rechercher une activité..." value={searchQuery} onValueChange={setSearchQuery} />
            <CommandList>
              <CommandEmpty>Aucune activité trouvée.</CommandEmpty>
              <CommandGroup>
                {/* Option "Tout type d'activités" */}
                <CommandItem
                  value={ALL_TYPES_OPTION.label}
                  onSelect={() => handleSelect(ALL_TYPES_OPTION)}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", isAllTypesSelected ? "opacity-100" : "opacity-0")} />
                  <span className="font-semibold">{ALL_TYPES_OPTION.label}</span>
                </CommandItem>

                {filteredTypes.map((type) => {
                  const isSelected = selectedTypes.some((t) => t.id === type.id);
                  return (
                    <CommandItem
                      key={type.id}
                      value={type.label}
                      onSelect={() => handleSelect(type)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", isSelected && !isAllTypesSelected ? "opacity-100" : "opacity-0")}
                      />
                      {type.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected types badges */}
      {selectedTypes.length > 0 && !isAllTypesSelected && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedTypes.map((type) => (
            <Badge key={type.id} variant="secondary" className="px-3 py-1.5 gap-1.5">
              {type.label}
              <button
                onClick={() => removeType(type.id)}
                disabled={disabled}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedTypes.length > 1 && (
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={disabled} className="h-7 text-xs">
              Tout effacer
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
