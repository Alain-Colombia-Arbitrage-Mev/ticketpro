import { useState } from "react";
import { Check, MapPin, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";

interface CityAutocompleteProps {
  cities: string[];
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

export function CityAutocomplete({
  cities,
  selectedCities,
  onCitiesChange,
  placeholder = "Seleccionar ciudad...",
  multiple = false,
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (city: string) => {
    if (multiple) {
      const newSelection = selectedCities.includes(city)
        ? selectedCities.filter(c => c !== city)
        : [...selectedCities, city];
      onCitiesChange(newSelection);
    } else {
      onCitiesChange([city]);
      setOpen(false);
    }
  };

  const handleRemove = (city: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCitiesChange(selectedCities.filter(c => c !== city));
  };

  const clearAll = () => {
    onCitiesChange([]);
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto"
        >
          <div className="flex flex-wrap gap-1 flex-1 mr-2">
            {selectedCities.length === 0 ? (
              <span className="text-muted-foreground dark:text-gray-400 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {placeholder}
              </span>
            ) : multiple ? (
              selectedCities.map((city) => (
                <Badge
                  key={city}
                  variant="secondary"
                  className="gap-1 hover:bg-secondary"
                >
                  <MapPin className="h-3 w-3" />
                  {city}
                  <button
                    onClick={(e) => handleRemove(city, e)}
                    className="ml-1 hover:text-destructive rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedCities[0]}
              </span>
            )}
          </div>
          {selectedCities.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar ciudad..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No se encontró la ciudad.</CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => {
                const isSelected = selectedCities.includes(city);
                return (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => handleSelect(city)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>{city}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary dark:text-blue-400" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
