import { useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "./ui/utils";

interface CityDropdownFilterProps {
  cities: string[];
  selectedCity: string | null;
  onCityChange: (city: string | null) => void;
  className?: string;
}

export function CityDropdownFilter({
  cities,
  selectedCity,
  onCityChange,
  className,
}: CityDropdownFilterProps) {
  const [open, setOpen] = useState(false);

  const handleCitySelect = (city: string | null) => {
    onCityChange(city);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 sm:h-14 w-full justify-between bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white text-gray-900 font-medium shadow-lg",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="truncate">
              {selectedCity || "Todas las ciudades"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[280px] max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          Selecciona una ciudad
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Option to show all cities */}
        <DropdownMenuItem
          onClick={() => handleCitySelect(null)}
          className="cursor-pointer flex items-center justify-between"
        >
          <span>Todas las ciudades</span>
          {!selectedCity && (
            <Check className="h-4 w-4 text-blue-600" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* List of cities */}
        {cities.map((city) => (
          <DropdownMenuItem
            key={city}
            onClick={() => handleCitySelect(city)}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span>{city}</span>
            </div>
            {selectedCity === city && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
