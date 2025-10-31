import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, 
  MapPin, 
  X, 
  Music, 
  Trophy, 
  Theater, 
  Calendar,
  TrendingUp 
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { cn } from "./ui/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface UnifiedSearchBarProps {
  onSearch?: (query: string, city?: string) => void;
  cities: string[];
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  type: 'category' | 'event';
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const categories = [
  { name: "Conciertos", icon: <Music className="h-4 w-4" /> },
  { name: "Deportes", icon: <Trophy className="h-4 w-4" /> },
  { name: "Teatro", icon: <Theater className="h-4 w-4" /> },
  { name: "Familia", icon: <Calendar className="h-4 w-4" /> },
];

export function UnifiedSearchBar({
  onSearch,
  cities,
  placeholder = "Buscar eventos, artistas, equipos...",
  className,
}: UnifiedSearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Generar sugerencias inteligentes
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];

    const results: Suggestion[] = [];
    const searchLower = query.toLowerCase();

    // Agregar categorías que coincidan
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'category',
          value: category.name,
          label: category.name,
          icon: category.icon,
        });
      }
    });

    // Agregar búsqueda general
    if (query.length > 2) {
      results.push({
        type: 'event',
        value: query,
        label: `Buscar "${query}"`,
        icon: <Search className="h-4 w-4" />,
      });
    }

    return results;
  }, [query]);

  // Click outside para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(value.length > 0);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[focusedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.value);
    setShowSuggestions(false);
    setFocusedIndex(-1);
    onSearch?.(suggestion.value, selectedCity || undefined);
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    setFocusedIndex(-1);
    onSearch?.(query, selectedCity || undefined);
  };

  const handleClearQuery = () => {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleClearCity = () => {
    setSelectedCity("");
  };

  const handleClearAll = () => {
    setQuery("");
    setSelectedCity("");
    setShowSuggestions(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main Search Container */}
      <div className="rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 p-3 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          
          {/* Search Input - Primary */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 z-10" />
            
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length > 0 && setShowSuggestions(true)}
              placeholder={placeholder}
              className="h-12 border-0 pl-12 pr-12 text-base focus-visible:ring-0 sm:h-14 bg-white dark:bg-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />

            {/* Clear Button */}
            {query && (
              <button
                onClick={handleClearQuery}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <Card
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 z-[100] max-h-80 overflow-y-auto shadow-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="p-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.value}-${index}`}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        focusedIndex === index
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {suggestion.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {suggestion.type === 'category' && 'Categoría'}
                          {suggestion.type === 'event' && 'Búsqueda general'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* City Selector - Secondary */}
          <div className="flex items-center gap-2 lg:w-64">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none" />
              <Select value={selectedCity || "all"} onValueChange={(value) => setSelectedCity(value === "all" ? "" : value)}>
                <SelectTrigger className="h-12 sm:h-14 pl-10 pr-10 bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="all">
                    <span className="font-medium">Todas las ciudades</span>
                  </SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {city}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedCity && (
                <button
                  onClick={handleClearCity}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Button */}
          <Button
            size="lg"
            onClick={handleSearch}
            className="h-12 sm:h-14 w-full lg:w-auto lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg transition-all hover:shadow-xl"
          >
            <Search className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Buscar Eventos</span>
            <span className="sm:hidden">Buscar</span>
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCity || query) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 px-2">
          <span className="text-sm text-white/80 dark:text-gray-300">Filtros activos:</span>
          
          {query && (
            <Badge className="gap-1 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600">
              <Search className="h-3 w-3" />
              "{query}"
              <button
                onClick={handleClearQuery}
                className="ml-1 hover:text-destructive dark:hover:text-red-400 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedCity && (
            <Badge className="gap-1 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600">
              <MapPin className="h-3 w-3" />
              {selectedCity}
              <button
                onClick={handleClearCity}
                className="ml-1 hover:text-destructive dark:hover:text-red-400 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <button
            onClick={handleClearAll}
            className="ml-2 text-sm text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 underline transition-colors"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
