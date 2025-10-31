import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, X, Calendar, DollarSign, Sparkles, TrendingUp, Zap, SlidersHorizontal } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { EventCard } from "../components/EventCard";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Slider } from "../components/ui/slider";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Card } from "../components/ui/card";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { useRouter } from "../hooks/useRouter";
import { mockEvents, categories as mockCategories } from "../data/mockEvents";
import { SEOHead } from "../components/SEOHead";

const ITEMS_PER_PAGE = 12;

export function EventsListPage() {
  const { navigate, pageData } = useRouter();
  
  // Filter states (initialize from pageData if coming from search)
  const [selectedCategory, setSelectedCategory] = useState<string>(pageData?.category || "all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [searchQuery, setSearchQuery] = useState<string>(pageData?.searchQuery || "");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [showLastTickets, setShowLastTickets] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>(
    pageData?.selectedCity ? [pageData.selectedCity] : []
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Update filters when pageData changes (e.g., navigation from Header)
  useEffect(() => {
    if (pageData?.category) {
      setSelectedCategory(pageData.category);
      setCurrentPage(1); // Reset to first page when category changes
    }
    if (pageData?.searchQuery) {
      setSearchQuery(pageData.searchQuery);
      setCurrentPage(1);
    }
    if (pageData?.selectedCity) {
      setSelectedCities([pageData.selectedCity]);
      setCurrentPage(1);
    }
  }, [pageData]);

  // Extract unique cities
  const cities = useMemo(() => {
    const citiesSet = new Set<string>();
    mockEvents.forEach(event => {
      const city = event.location.split(',').pop()?.trim() || event.location;
      citiesSet.add(city);
    });
    return Array.from(citiesSet).sort();
  }, []);

  // Extract price from string
  const extractPrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
  };

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...mockEvents];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(event => event.category === selectedCategory);
    }

    // City filter
    if (selectedCities.length > 0) {
      result = result.filter(event => {
        const city = event.location.split(',').pop()?.trim() || event.location;
        return selectedCities.includes(city);
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query)
      );
    }

    // Price range filter
    result = result.filter(event => {
      const price = extractPrice(event.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Featured filter
    if (showFeatured) {
      result = result.filter(event => event.featured);
    }

    // Trending filter
    if (showTrending) {
      result = result.filter(event => event.trending);
    }

    // Last tickets filter
    if (showLastTickets) {
      result = result.filter(event => event.lastTickets);
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
        break;
      case "date":
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "popular":
        result.sort((a, b) => {
          const scoreA = (a.featured ? 2 : 0) + (a.trending ? 1 : 0);
          const scoreB = (b.featured ? 2 : 0) + (b.trending ? 1 : 0);
          return scoreB - scoreA;
        });
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [selectedCategory, selectedCities, searchQuery, sortBy, priceRange, showFeatured, showTrending, showLastTickets]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEvents = filteredAndSortedEvents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    handleFilterChange();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    handleFilterChange();
  };

  const handleCitiesChange = (cities: string[]) => {
    setSelectedCities(cities);
    handleFilterChange();
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedCities([]);
    setSearchQuery("");
    setSortBy("date");
    setPriceRange([0, 3000]);
    setShowFeatured(false);
    setShowTrending(false);
    setShowLastTickets(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    selectedCategory !== "all" ||
    selectedCities.length > 0 ||
    searchQuery.trim() !== "" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 3000 ||
    showFeatured ||
    showTrending ||
    showLastTickets;

  const activeFiltersCount = 
    (selectedCategory !== "all" ? 1 : 0) +
    selectedCities.length +
    (searchQuery.trim() !== "" ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 3000 ? 1 : 0) +
    (showFeatured ? 1 : 0) +
    (showTrending ? 1 : 0) +
    (showLastTickets ? 1 : 0);

  // Generar descripción SEO dinámica
  const seoDescription = useMemo(() => {
    let desc = "Explora miles de eventos disponibles";
    if (selectedCategory !== "all") {
      desc += ` en la categoría ${selectedCategory}`;
    }
    if (selectedCities.length > 0) {
      desc += ` en ${selectedCities.join(", ")}`;
    }
    if (searchQuery) {
      desc += ` relacionados con "${searchQuery}"`;
    }
    desc += ". Encuentra conciertos, deportes, teatro y más. Compra tus boletos de forma segura.";
    return desc;
  }, [selectedCategory, selectedCities, searchQuery]);

  const seoTitle = useMemo(() => {
    let title = "Eventos";
    if (selectedCategory !== "all") {
      title = `${selectedCategory} - ${title}`;
    }
    if (searchQuery) {
      title = `${searchQuery} - ${title}`;
    }
    return `${title} | Tiquetera`;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-blue-50/30 dark:via-gray-900 to-purple-50/30 dark:to-gray-900">
      <SEOHead
        seo={{
          title: seoTitle,
          description: seoDescription,
          keywords: `${selectedCategory !== "all" ? selectedCategory + ", " : ""}eventos, boletos, tickets${selectedCities.length > 0 ? ", " + selectedCities.join(", ") : ""}`,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          type: "website",
        }}
      />
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="mb-4 gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
          
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-gray-900 dark:text-white">Explorar Eventos</h1>
            {hasActiveFilters && (
              <Badge variant="secondary" className="gap-1">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}
              </Badge>
            )}
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar eventos, artistas, lugares..."
                className="pl-10 pr-10 h-11 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {/* Sort */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-48 h-11 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha
                    </div>
                  </SelectItem>
                  <SelectItem value="price-asc">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precio: Menor a Mayor
                    </div>
                  </SelectItem>
                  <SelectItem value="price-desc">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precio: Mayor a Menor
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Popularidad
                    </div>
                  </SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Advanced Filters Button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`gap-2 h-11 px-4 border-gray-300 dark:border-gray-700 ${hasActiveFilters ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtros</span>
                    {activeFiltersCount > 0 && (
                      <Badge variant="default" className="ml-1 h-5 min-w-[20px] px-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5" />
                      Filtros Avanzados
                    </SheetTitle>
                    <SheetDescription>
                      Personaliza tu búsqueda para encontrar el evento perfecto
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Cities - Autocomplete */}
                    <Card className="p-4 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                      <Label className="mb-3 block text-base">
                        🌆 Ciudades
                      </Label>
                      <CityAutocomplete
                        cities={cities}
                        selectedCities={selectedCities}
                        onCitiesChange={handleCitiesChange}
                        placeholder="Buscar y seleccionar ciudades..."
                        multiple={true}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Selecciona una o varias ciudades para filtrar eventos
                      </p>
                    </Card>

                    <Separator />

                    {/* Price Range */}
                    <Card className="p-4 bg-gradient-to-br from-green-50 dark:from-green-900/20 to-emerald-50 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                      <Label className="mb-3 block text-base">
                        💰 Rango de Precio
                      </Label>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                            ${priceRange[0].toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground dark:text-gray-400">a</span>
                          <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                            ${priceRange[1].toLocaleString()}
                          </span>
                        </div>
                        <Slider
                          min={0}
                          max={3000}
                          step={50}
                          value={priceRange}
                          onValueChange={(value) => {
                            setPriceRange(value as [number, number]);
                            handleFilterChange();
                          }}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>$0 MXN</span>
                          <span>$3,000 MXN</span>
                        </div>
                      </div>
                    </Card>

                    <Separator />

                    {/* Event Type Filters */}
                    <Card className="p-4 bg-gradient-to-br from-purple-50 dark:from-purple-900/20 to-pink-50 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                      <Label className="mb-3 block text-base">
                        ✨ Tipos Especiales
                      </Label>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                              <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">Eventos Destacados</div>
                              <div className="text-xs text-muted-foreground">Los mejores eventos</div>
                            </div>
                          </div>
                          <Switch
                            checked={showFeatured}
                            onCheckedChange={(checked) => {
                              setShowFeatured(checked);
                              handleFilterChange();
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500">
                              <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">En Tendencia</div>
                              <div className="text-xs text-muted-foreground">Los más populares ahora</div>
                            </div>
                          </div>
                          <Switch
                            checked={showTrending}
                            onCheckedChange={(checked) => {
                              setShowTrending(checked);
                              handleFilterChange();
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                              <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">Últimos Boletos</div>
                              <div className="text-xs text-muted-foreground">¡Date prisa!</div>
                            </div>
                          </div>
                          <Switch
                            checked={showLastTickets}
                            onCheckedChange={(checked) => {
                              setShowLastTickets(checked);
                              handleFilterChange();
                            }}
                          />
                        </div>
                      </div>
                    </Card>

                    <Separator />

                    {/* Clear Filters */}
                    <Button
                      variant="outline"
                      className="w-full h-11 border-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                      onClick={clearAllFilters}
                      disabled={!hasActiveFilters}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpiar Todos los Filtros
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {mockCategories.map((category) => (
            <Badge
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap transition-all hover:scale-105 px-4 py-2 ${
                selectedCategory === category.name 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/50' 
                  : 'hover:border-blue-400'
              }`}
              onClick={() => handleCategoryChange(category.name)}
            >
              {category.label}
            </Badge>
          ))}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros activos:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                  {mockCategories.find(c => c.name === selectedCategory)?.label}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="ml-1 hover:text-destructive dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                  Búsqueda: "{searchQuery}"
                  <button
                    onClick={() => handleSearchChange("")}
                    className="ml-1 hover:text-destructive dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(priceRange[0] !== 0 || priceRange[1] !== 3000) && (
                <Badge variant="secondary" className="gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                  ${priceRange[0]} - ${priceRange[1]}
                  <button
                    onClick={() => {
                      setPriceRange([0, 3000]);
                      handleFilterChange();
                    }}
                    className="ml-1 hover:text-destructive dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCities.map(city => (
                <Badge key={city} variant="secondary" className="gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700">
                  📍 {city}
                  <button
                    onClick={() => handleCitiesChange(selectedCities.filter(c => c !== city))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 text-xs hover:bg-red-50 hover:text-red-600"
              >
                <X className="mr-1 h-3 w-3" />
                Limpiar todo
              </Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-400">
            Mostrando <span className="font-semibold text-gray-900 dark:text-white">{currentEvents.length}</span> de{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSortedEvents.length}</span> evento
            {filteredAndSortedEvents.length !== 1 ? "s" : ""}
            {currentPage > 1 && ` · Página ${currentPage} de ${totalPages}`}
          </p>
        </div>

        {/* Events Grid */}
        {currentEvents.length === 0 ? (
          <Card className="p-20 text-center bg-white dark:bg-gray-800">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600">
              <Search className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              No se encontraron eventos
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Intenta ajustar tus filtros de búsqueda para obtener más resultados
            </p>
            <Button onClick={clearAllFilters} variant="outline" className="border-2">
              <X className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {currentEvents.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => navigate("event-detail", event)}
                  className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <EventCard {...event} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-2"
                  >
                    Anterior
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 ${currentPage === pageNum ? 'shadow-lg' : 'border-2'}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-2"
                  >
                    Siguiente
                  </Button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
