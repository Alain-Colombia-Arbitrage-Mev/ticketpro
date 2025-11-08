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
          className="w-full justify-between min-h-[40px] h-auto border-white/20 bg-black/50 text-white hover:bg-white/10"
        >
          <div className="flex flex-wrap gap-1 flex-1 mr-2">
            {selectedCities.length === 0 ? (
              <span className="text-white/60 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {placeholder}
              </span>
            ) : multiple ? (
              selectedCities.map((city) => (
                <Badge
                  key={city}
                  variant="secondary"
                  className="gap-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <MapPin className="h-3 w-3" />
                  {city}
                  <button
                    onClick={(e) => handleRemove(city, e)}
                    className="ml-1 hover:text-red-400 rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="flex items-center gap-2 text-white">
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
              className="text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-black border-white/20" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar ciudad..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-white border-white/20 bg-black/50"
          />
          <CommandList>
            <CommandEmpty className="text-white/60">No se encontró la ciudad.</CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => {
                const isSelected = selectedCities.includes(city);
                return (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => handleSelect(city)}
                    className="cursor-pointer text-white hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <MapPin className="h-4 w-4 text-white/60" />
                      <span>{city}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-white" />
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
