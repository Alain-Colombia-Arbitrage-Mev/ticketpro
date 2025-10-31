import { useState, useMemo, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, X, TrendingUp } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { cn } from "./ui/utils";

interface SmartSearchBarProps {
  onSearch?: (query: string, city?: string) => void;
  cities: string[];
  placeholder?: string;
  className?: string;
  externalSelectedCity?: string | null;
}

interface Suggestion {
  type: 'city' | 'event' | 'category';
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function SmartSearchBar({
  onSearch,
  cities,
  placeholder = "Buscar eventos, artistas, equipos...",
  className,
  externalSelectedCity,
}: SmartSearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Use external city if provided
  const effectiveCity = externalSelectedCity || selectedCity;

  // Detectar búsqueda de ciudad
  const cityKeywords = ["en", "de", "cerca", "ciudad"];
  const containsCityKeyword = cityKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );

  // Generar sugerencias inteligentes
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];

    const results: Suggestion[] = [];
    const searchLower = query.toLowerCase();

    // Sugerencias de ciudades (prioritarias si contiene keywords)
    const matchedCities = cities.filter(city =>
      city.toLowerCase().includes(searchLower)
    );

    matchedCities.slice(0, 5).forEach(city => {
      results.push({
        type: 'city',
        value: city,
        label: `Eventos en ${city}`,
        icon: <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      });
    });

    // Si la búsqueda contiene keywords de ciudad, priorizar ciudades
    if (containsCityKeyword) {
      return results;
    }

    // Sugerencias de categorías
    const categories = ['Conciertos', 'Deportes', 'Teatro', 'Familia', 'Arte', 'Comedia'];
    const matchedCategories = categories.filter(cat =>
      cat.toLowerCase().includes(searchLower)
    );

    matchedCategories.forEach(category => {
      results.push({
        type: 'category',
        value: category,
        label: `${category}`,
        icon: <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
      });
    });

    // Sugerencias de búsqueda general
    if (query.length >= 2) {
      results.push({
        type: 'event',
        value: query,
        label: `Buscar "${query}"`,
        icon: <Search className="h-4 w-4 text-gray-600" />,
      });
    }

    return results.slice(0, 8);
  }, [query, cities, containsCityKeyword]);

  // Manejar clicks fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

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
        if (focusedIndex >= 0 && suggestions[focusedIndex]) {
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
    if (suggestion.type === 'city') {
      setSelectedCity(suggestion.value);
      setQuery("");
      setShowSuggestions(false);
      setFocusedIndex(-1);
      onSearch?.("", suggestion.value);
    } else if (suggestion.type === 'category') {
      setQuery(suggestion.value);
      setShowSuggestions(false);
      setFocusedIndex(-1);
      onSearch?.(suggestion.value, effectiveCity || undefined);
    } else {
      setQuery(suggestion.value);
      setShowSuggestions(false);
      setFocusedIndex(-1);
      onSearch?.(suggestion.value, effectiveCity || undefined);
    }
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    setFocusedIndex(-1);
    onSearch?.(query, effectiveCity || undefined);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(value.length > 0);
    setFocusedIndex(-1);
  };

  const handleRemoveCity = () => {
    setSelectedCity(null);
    inputRef.current?.focus();
  };

  const handleClearQuery = () => {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex flex-col gap-3 rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 p-2 shadow-2xl backdrop-blur-sm md:flex-row">
        {/* Search Input Container */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 z-10" />
          
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            placeholder={effectiveCity ? `Buscar en ${effectiveCity}...` : placeholder}
            className="h-12 border-0 pl-12 pr-24 text-base focus-visible:ring-0 sm:h-14"
          />

          {/* Selected City Badge */}
          {selectedCity && !externalSelectedCity && (
            <Badge
              className="absolute right-12 top-1/2 -translate-y-1/2 gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/40"
            >
              <MapPin className="h-3 w-3" />
              {selectedCity}
              <button
                onClick={handleRemoveCity}
                className="ml-1 hover:text-blue-900 dark:hover:text-blue-200 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClearQuery}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <Card
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto shadow-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800"
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
                        {suggestion.type === 'city' && 'Ciudad'}
                        {suggestion.type === 'category' && 'Categoría'}
                        {suggestion.type === 'event' && 'Búsqueda general'}
                      </div>
                    </div>
                    {suggestion.type === 'city' && (
                      <Badge variant="outline" className="text-xs">
                        Filtrar
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              {/* Helper text */}
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Escribe "en" o el nombre de una ciudad para filtrar por ubicación
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Search Button */}
        <Button
          size="lg"
          onClick={handleSearch}
          className="h-12 w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg transition-all hover:shadow-xl sm:h-14 md:w-auto md:px-8"
        >
          <Search className="mr-2 h-5 w-5" />
          <span className="hidden sm:inline">Buscar Eventos</span>
          <span className="sm:hidden">Buscar</span>
        </Button>
      </div>

      {/* Active Filters Display */}
      {((selectedCity && !externalSelectedCity) || query) && (
        <div className="mt-3 flex flex-wrap gap-2 px-2">
          {selectedCity && !externalSelectedCity && (
            <Badge className="gap-1 bg-white/90 text-gray-700 border-gray-300 hover:bg-white">
              <MapPin className="h-3 w-3" />
              Ciudad: {selectedCity}
              <button
                onClick={handleRemoveCity}
                className="ml-1 hover:text-destructive rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {query && (
            <Badge className="gap-1 bg-white/90 text-gray-700 border-gray-300 hover:bg-white">
              <Search className="h-3 w-3" />
              Buscar: "{query}"
              <button
                onClick={handleClearQuery}
                className="ml-1 hover:text-destructive rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
