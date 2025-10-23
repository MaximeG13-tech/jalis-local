import { useState, useMemo, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAllTypesSelected = selectedTypes.some((t) => t.id === "all");
  const maxSelections = 5;

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

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type: BusinessType) => {
    if (type.id === "all") {
      onTypesChange([ALL_TYPES_OPTION]);
      setInputValue("");
      setOpen(false);
    } else {
      // Vérifier si déjà sélectionné
      const alreadySelected = selectedTypes.some((t) => t.id === type.id);
      if (alreadySelected) return;
      
      // Limiter à 5 sélections
      if (selectedTypes.length >= maxSelections) {
        return;
      }
      
      // Retirer "all" si présent et ajouter le nouveau type
      const newTypes = selectedTypes.filter((t) => t.id !== "all");
      onTypesChange([...newTypes, type]);
      setInputValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setOpen(true);
  };

  const handleClearInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInputValue("");
    onTypesChange([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveSelection = (typeId: string) => {
    onTypesChange(selectedTypes.filter((t) => t.id !== typeId));
  };

  const handleInputFocus = () => {
    setOpen(true);
  };

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <Label className="text-sm font-bold text-foreground uppercase tracking-wide">
          Type d'activité {!isAllTypesSelected && `(${selectedTypes.length}/${maxSelections})`}
        </Label>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={isAllTypesSelected ? "Toutes les activités sélectionnées" : "Rechercher et sélectionner jusqu'à 5 activités..."}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled || isAllTypesSelected || selectedTypes.length >= maxSelections}
          className="pl-9 pr-9"
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onMouseDown={handleClearInput}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown personnalisé */}
        {open && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-[300px] overflow-y-auto z-50"
          >
            <div className="py-1">
              {/* Option "Tout type d'activités" */}
              <button
                type="button"
                onClick={() => handleSelect(ALL_TYPES_OPTION)}
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer font-semibold text-sm"
              >
                {ALL_TYPES_OPTION.label}
              </button>

              {filteredTypes.length > 0 ? (
                <>
                  {filteredTypes.map((type) => {
                    const isSelected = selectedTypes.some((t) => t.id === type.id);
                    const isDisabled = selectedTypes.length >= maxSelections && !isSelected;
                    
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelect(type)}
                        disabled={isDisabled}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm",
                          isSelected && "bg-accent text-accent-foreground font-medium",
                          !isSelected && !isDisabled && "hover:bg-accent hover:text-accent-foreground cursor-pointer",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {type.label}
                      </button>
                    );
                  })}

                  {inputValue.trim() && filteredTypes.length === 50 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                      Affinez votre recherche pour voir plus de résultats
                    </div>
                  )}
                </>
              ) : inputValue.trim() ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                  Aucune activité trouvée pour "{inputValue}"
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Badges de sélection */}
      {selectedTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTypes.map((type) => (
            <Badge key={type.id} variant="secondary" className="px-3 py-1.5 gap-1.5 w-fit">
              {type.label}
              <button
                onClick={() => handleRemoveSelection(type.id)}
                disabled={disabled}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
