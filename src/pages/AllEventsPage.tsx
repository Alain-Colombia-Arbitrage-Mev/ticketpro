import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, X, Calendar, DollarSign, TrendingUp, SlidersHorizontal } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Slider } from "../components/ui/slider";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Card } from "../components/ui/card";
import { CityAutocomplete } from "../components/search";
import { PromoSlider } from "../components/events/PromoSlider";
import { EventCardSkeleton } from "../components/events/EventCardSkeleton";
import { useRouter } from "../hooks/useRouter";
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../hooks/useAuth";
import { useCartStore } from "../stores/cartStore";
import { useEvents } from "../hooks/useEvents";
import { categories as mockCategories } from "../data/mockEvents";
import { SEOHead } from "../components/common";

const ITEMS_PER_PAGE = 12;

export function AllEventsPage() {
  const { navigate, pageData } = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCartStore();
  
  // Obtener eventos de BD (con fallback a mockEvents)
  const { data: events = [], isLoading, error } = useEvents();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(pageData?.category || "all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [searchQuery, setSearchQuery] = useState<string>(pageData?.searchQuery || "");
  const [currentPage, setCurrentPage] = useState(1);

  // Actualizar filtros cuando cambie pageData (navegación desde navbar)
  useEffect(() => {
    if (pageData?.category) {
      setSelectedCategory(pageData.category);
      setCurrentPage(1); // Resetear a la primera página
    }
    if (pageData?.searchQuery !== undefined) {
      setSearchQuery(pageData.searchQuery);
      setCurrentPage(1);
    }
    if (pageData?.selectedCity) {
      setSelectedCities([pageData.selectedCity]);
      setCurrentPage(1);
    }
  }, [pageData]);
  
  // Advanced filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [showLastTickets, setShowLastTickets] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>(
    pageData?.selectedCity ? [pageData.selectedCity] : []
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Extract unique cities
  const cities = useMemo(() => {
    const citiesSet = new Set<string>();
    events.forEach(event => {
      const city = event.location.split(',').pop()?.trim() || event.location;
      citiesSet.add(city);
    });
    return Array.from(citiesSet).sort();
  }, [events]);

  // Extract price from string
  const extractPrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
  };

  // Helper function to parse date
  const parseDate = (dateStr: string): string => {
    const months: Record<string, string> = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    const parts = dateStr.toLowerCase().split(',');
    if (parts.length === 2) {
      const year = parts[1].trim();
      const dayMonth = parts[0].split('de');
      if (dayMonth.length === 2) {
        const day = dayMonth[0].trim();
        const month = dayMonth[1].trim();
        const monthNum = months[month] || '01';
        return `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleAddToCart = (event: any) => {
    if (!user) {
      navigate("login");
      return;
    }

    const ticketPrice = parseInt(event.price.replace(/[^0-9]/g, "") || "800");
    
    addItem({
      eventId: event.id,
      eventName: event.title,
      eventDate: parseDate(event.date),
      eventTime: undefined,
      eventLocation: event.location,
      eventImage: event.image,
      ticketType: "General",
      ticketPrice: ticketPrice,
      quantity: 1,
      seatNumber: undefined,
      seatType: undefined,
      ticketCategoryId: undefined,
    });

    navigate("cart");
  };

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

    // Category filter - Open Salinas siempre visible en todas las categorías
    if (selectedCategory !== "all") {
      result = result.filter(event => {
        // Evento prioritario (id: 1 - Open Salinas) aparece en TODAS las categorías
        const isPriority = event.id === 1;
        return isPriority || event.category === selectedCategory;
      });
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

    // ORDENAMIENTO FINAL: Open Salinas (id: 1) SIEMPRE PRIMERO
    result.sort((a, b) => {
      const isPriorityA = a.id === 1;
      const isPriorityB = b.id === 1;

      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;

      // Para el resto, mantener el orden del sort anterior
      return 0;
    });

    return result;
  }, [events, selectedCategory, selectedCities, searchQuery, sortBy, priceRange, showFeatured, showTrending, showLastTickets]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00FFFF] mx-auto mb-4"></div>
            <p className="text-white text-lg">Cargando eventos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (aún muestra mockEvents como fallback)
  if (error) {
    console.warn('Error cargando eventos, usando datos de respaldo:', error);
  }

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

  return (
    <div className="min-h-screen bg-black">
      <SEOHead
        seo={{
          title: `Todos los Eventos | vetlix.com`,
          description: "Explora todos los eventos disponibles con filtros avanzados. Encuentra conciertos, deportes, teatro y más.",
          keywords: "eventos, boletos, tickets, filtros, búsqueda avanzada",
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          type: "website",
        }}
      />

      {/* Slider Promocional - Antes de todo */}
      <div className="container mx-auto px-2 min-[375px]:px-3 sm:px-4 md:px-6 lg:px-8 pt-4 min-[375px]:pt-5 sm:pt-6 md:pt-8">
        <PromoSlider />
      </div>

      {/* Header con filtros y búsqueda */}
      <div className="border-b border-white/20 bg-black/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4 flex items-center gap-3 justify-between">
            <Button 
              variant="ghost"
              onClick={() => navigate("events")}
              className="gap-2 !text-white hover:!bg-white/10 hover:!text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('allevents.back')}
            </Button>
            
            {hasActiveFilters && (
              <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-white/30">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}
              </Badge>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
              <Input
                placeholder={t('allevents.search.placeholder')}
                className="pl-12 pr-4 h-12 border-white/20 bg-black/50 text-white placeholder:text-white/60"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            {/* Category Tabs */}
            <div className="relative">
              <div className="flex gap-1.5 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide">
                <Button
                  variant="outline"
                  onClick={() => handleCategoryChange("all")}
                  className={`shrink-0 h-9 px-3 text-xs sm:text-sm snap-start ${selectedCategory === "all" ? '!bg-white !text-black border-white' : 'border-white/20 !bg-black/50 !text-white hover:!bg-white/10'}`}
                >
                  {t('allevents.categories.all')}
                </Button>
                {mockCategories.slice(1).map((cat) => (
                  <Button
                    key={cat.name}
                    variant="outline"
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`shrink-0 h-9 px-3 text-xs sm:text-sm whitespace-nowrap snap-start ${selectedCategory === cat.name ? '!bg-white !text-black border-white' : 'border-white/20 !bg-black/50 !text-white hover:!bg-white/10'}`}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
              {/* Gradient indicators */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-black to-transparent"></div>
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {/* Sort */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-48 h-11 border-white/20 !bg-black !text-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="!bg-black border-white/20 !text-white">
                  <SelectItem value="date" className="!text-white !bg-black hover:!bg-white/10 focus:!bg-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha
                    </div>
                  </SelectItem>
                  <SelectItem value="price-asc" className="!text-white !bg-black hover:!bg-white/10 focus:!bg-white/10">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precio: Menor a Mayor
                    </div>
                  </SelectItem>
                  <SelectItem value="price-desc" className="!text-white !bg-black hover:!bg-white/10 focus:!bg-white/10">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precio: Mayor a Menor
                    </div>
                  </SelectItem>
                  <SelectItem value="popular" className="!text-white !bg-black hover:!bg-white/10 focus:!bg-white/10">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Popularidad
                    </div>
                  </SelectItem>
                  <SelectItem value="name" className="!text-white !bg-black hover:!bg-white/10 focus:!bg-white/10">Nombre A-Z</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Advanced Filters Button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`gap-2 h-11 px-4 border-white/20 !bg-black !text-white hover:!bg-white/10 ${hasActiveFilters ? 'border-white/40' : ''}`}
                  >
                    <SlidersHorizontal className="h-4 w-4 !text-white" />
                    <span className="hidden sm:inline">{t('allevents.filters')}</span>
                    {activeFiltersCount > 0 && (
                      <Badge variant="default" className="ml-1 h-5 min-w-[20px] px-1 !bg-white/20 !text-white border-white/30">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-black border-white/20">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-white">
                      <SlidersHorizontal className="h-5 w-5" />
                      Filtros Avanzados
                    </SheetTitle>
                    <SheetDescription className="text-white/70">
                      Personaliza tu búsqueda para encontrar el evento perfecto
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Cities - Autocomplete */}
                    <Card className="p-4 bg-black/50 border-white/20">
                      <Label className="mb-3 block text-base text-white">
                        🌆 Ciudades
                      </Label>
                      <CityAutocomplete
                        cities={cities}
                        selectedCities={selectedCities}
                        onCitiesChange={handleCitiesChange}
                        placeholder="Buscar y seleccionar ciudades..."
                        multiple={true}
                      />
                      <p className="text-xs text-white/60 mt-2">
                        Selecciona una o varias ciudades para filtrar eventos
                      </p>
                    </Card>

                    <Separator className="bg-white/20" />

                    {/* Price Range */}
                    <Card className="p-4 bg-black/50 border-white/20">
                      <Label className="mb-3 block text-base text-white">
                        💰 Rango de Precio
                      </Label>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-white">
                            ${priceRange[0].toLocaleString()}
                          </span>
                          <span className="text-sm text-white/60">a</span>
                          <span className="text-2xl font-bold text-white">
                            ${priceRange[1].toLocaleString()}
                          </span>
                        </div>
                        <Slider
                          min={0}
                          max={3000}
                          step={50}
                          value={priceRange}
                          onValueChange={(value: number[]) => setPriceRange(value as [number, number])}
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-white/60 mt-2">
                        Ajusta el rango de precios para tu presupuesto
                      </p>
                    </Card>

                    <Separator className="bg-white/20" />

                    {/* Quick Filters */}
                    <Card className="p-4 bg-black/50 border-white/20">
                      <Label className="mb-3 block text-base text-white">
                        ⚡ Filtros Rápidos
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="featured" className="flex items-center gap-2 text-white cursor-pointer">
                            <span>⭐</span>
                            <span>Solo Destacados</span>
                          </Label>
                          <Switch
                            id="featured"
                            checked={showFeatured}
                            onCheckedChange={(checked: boolean) => setShowFeatured(checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="trending" className="flex items-center gap-2 text-white cursor-pointer">
                            <span>🔥</span>
                            <span>En Tendencia</span>
                          </Label>
                          <Switch
                            id="trending"
                            checked={showTrending}
                            onCheckedChange={(checked: boolean) => setShowTrending(checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="lastTickets" className="flex items-center gap-2 text-white cursor-pointer">
                            <span>🎫</span>
                            <span>Últimos Boletos</span>
                          </Label>
                          <Switch
                            id="lastTickets"
                            checked={showLastTickets}
                            onCheckedChange={(checked: boolean) => setShowLastTickets(checked)}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Clear All Button */}
                    <Button
                      variant="outline"
                      className="w-full border-white/20 !bg-black/50 !text-white hover:!bg-white/10"
                      onClick={clearAllFilters}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="bg-black/50 border-b border-white/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-2 items-center">
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-white/30">
                  {selectedCategory}
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-white/30">
                  Búsqueda: "{searchQuery}"
                  <button
                    onClick={() => handleSearchChange("")}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(priceRange[0] !== 0 || priceRange[1] !== 3000) && (
                <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-white/30">
                  ${priceRange[0]} - ${priceRange[1]}
                  <button
                    onClick={() => {
                      setPriceRange([0, 3000]);
                      handleFilterChange();
                    }}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCities.map(city => (
                <Badge key={city} variant="secondary" className="gap-1 bg-white/20 text-white border-white/30">
                  📍 {city}
                  <button
                    onClick={() => handleCitiesChange(selectedCities.filter(c => c !== city))}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 text-xs !text-white hover:!bg-white/10"
              >
                <X className="mr-1 h-3 w-3" />
                Limpiar todo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-white/70">
            Mostrando <span className="font-semibold text-white">{currentEvents.length}</span> de{" "}
            <span className="font-semibold text-white">{filteredAndSortedEvents.length}</span> evento
            {filteredAndSortedEvents.length !== 1 ? "s" : ""}
            {currentPage > 1 && ` · Página ${currentPage} de ${totalPages}`}
          </p>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          // Skeleton loading mientras cargan los eventos
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : currentEvents.length === 0 ? (
          <Card className="p-20 text-center bg-black/50 border-white/20">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900">
              <Search className="h-10 w-10 text-white/60" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No se encontraron eventos
            </h3>
            <p className="mb-6 text-white/70">
              Intenta ajustar tus filtros de búsqueda para obtener más resultados
            </p>
            <Button onClick={clearAllFilters} variant="outline" className="border-2 border-white/20 !bg-black/50 !text-white hover:!bg-white/10">
              <X className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  onClick={() => !event.soldOut && navigate("event-detail", event)}
                  className={`transition-all duration-300 ${!event.soldOut ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : 'cursor-not-allowed opacity-90'}`}
                >
                  <div className="relative flex flex-col w-full">
                    {/* Imagen del evento - Optimizada */}
                    <div className="h-[180px] sm:h-[240px] md:h-[300px] lg:h-[360px] rounded-t-[10px] sm:rounded-t-[13px] overflow-hidden relative">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      
                      {/* Overlay SOLD OUT */}
                      {event.soldOut && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
                          <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-3 rounded-lg shadow-2xl border-2 border-white/20">
                            <p className="font-bold text-lg sm:text-xl md:text-2xl text-white tracking-wide">
                              AGOTADO
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Badges superiores */}
                      <div className="absolute top-1.5 sm:top-2 md:top-3 left-2 sm:left-3 md:left-[23px] flex flex-col gap-1.5 sm:gap-2 md:gap-[12px] z-10">
                        {/* Badge de categoría */}
                        <div className="bg-white h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-black">
                            {event.category}
                          </p>
                        </div>
                        
                        {/* Badge de estado */}
                        {event.lastTickets && !event.soldOut && (
                          <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              Últimos
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Badge de Destacado */}
                      {event.featured && (
                        <div className="absolute top-1.5 sm:top-2 md:top-3 right-2 sm:right-3 md:right-[17px] z-10">
                          <div className="bg-[#f55d09] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              Destacado
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Badge de precio */}
                      {!event.soldOut && (
                        <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-[15px] left-2 sm:left-3 md:left-[23px] z-10">
                          <div className="bg-white h-[42px] sm:h-[52px] md:h-[60px] lg:h-[67px] rounded-[15px] sm:rounded-[20px] px-2 sm:px-3 md:px-4 flex flex-col items-start justify-center">
                            <p className="font-montserrat font-medium text-[9px] sm:text-[11px] md:text-[12px] lg:text-[14px] text-black">
                              {t('events.card.from')}
                            </p>
                            <p className="font-bold text-[16px] sm:text-[20px] md:text-[24px] lg:text-[30px] text-black leading-tight" style={{ fontFamily: 'Germania One, sans-serif' }}>
                              {event.price}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Información del evento */}
                    <div className="bg-white h-[130px] sm:h-[170px] md:h-[220px] lg:h-[258px] rounded-b-[10px] sm:rounded-b-[13px] p-3 sm:p-4 md:p-5 lg:p-[27px] flex flex-col">
                      {/* Título */}
                      <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg text-black mb-1 sm:mb-1.5 leading-tight line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {t(`event.title.${event.id}`) !== `event.title.${event.id}` ? t(`event.title.${event.id}`) : event.title}
                      </h3>

                      {/* Fecha */}
                      <p className="font-montserrat font-black text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] xl:text-[14px] text-black mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                        {event.date}
                      </p>

                      {/* Ubicación */}
                      <p className="font-montserrat font-semibold text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] xl:text-[14px] text-black mb-2 sm:mb-3 md:mb-4 lg:mb-6 line-clamp-1">
                        {event.location}
                      </p>

                      {/* Botón de acción */}
                      <button 
                        className={`mt-auto h-[28px] sm:h-[32px] md:h-[36px] lg:h-[40px] rounded-[7px] w-full transition-colors ${
                          event.soldOut 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[#c61619] hover:bg-[#a01316] cursor-pointer'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!event.soldOut) {
                            handleAddToCart(event);
                          }
                        }}
                        disabled={event.soldOut}
                      >
                        <p className="font-montserrat font-bold text-[9px] sm:text-[10px] md:text-[12px] lg:text-[14px] !text-white text-center">
                          {event.soldOut ? 'AGOTADO' : 'Comprar boletos'}
                        </p>
                      </button>
                    </div>
                  </div>
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
                    className="border-2 border-white/20 !bg-black !text-white hover:!bg-white/10 disabled:opacity-50"
                  >
              {t('allevents.pagination.previous')}
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
                          variant="outline"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 border-2 border-white/20 ${currentPage === pageNum ? '!bg-black !text-white shadow-lg border-white' : '!bg-black/50 !text-white hover:!bg-white/10'}`}
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
                    className="border-2 border-white/20 !bg-black !text-white hover:!bg-white/10 disabled:opacity-50"
                  >
              {t('allevents.pagination.next')}
            </Button>
                </div>

                <p className="text-sm text-white/70">
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

