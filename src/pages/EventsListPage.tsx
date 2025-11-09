import { useState, useMemo, useEffect } from "react";
import { Search, Users, Ticket, CalendarDays, Star, Music, Trophy, Drama, UsersRound, Palette, Smile } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useRouter } from "../hooks/useRouter";
import { useLanguage } from "../hooks/useLanguage";
import { mockEvents, categories as mockCategories } from "../data/mockEvents";
import { SEOHead } from "../components/common";
import video1 from "../assets/backgrounds/video1.mp4";
import logohome from "../assets/images/logohome.svg";

export function EventsListPage() {
  const { pageData, navigate } = useRouter();
  const { t } = useLanguage();
  
  // Filter states (initialize from pageData if coming from search)
  const [selectedCategory, setSelectedCategory] = useState<string>(pageData?.category || "all");
  const [searchQuery, setSearchQuery] = useState<string>(pageData?.searchQuery || "");
  const [selectedCities, setSelectedCities] = useState<string[]>(
    pageData?.selectedCity ? [pageData.selectedCity] : []
  );

  // Update filters when pageData changes (e.g., navigation from Header)
  useEffect(() => {
    if (pageData?.category) {
      setSelectedCategory(pageData.category);
    }
    if (pageData?.searchQuery) {
      setSearchQuery(pageData.searchQuery);
    }
    if (pageData?.selectedCity) {
      setSelectedCities([pageData.selectedCity]);
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

    return result;
  }, [selectedCategory, selectedCities, searchQuery]);

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
    return `${title} | vetlix.com`;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead
        seo={{
          title: seoTitle,
          description: seoDescription,
          keywords: `${selectedCategory !== "all" ? selectedCategory + ", " : ""}eventos, boletos, tickets${selectedCities.length > 0 ? ", " + selectedCities.join(", ") : ""}`,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          type: "website",
        }}
      />

      {/* Sección Principal: Página de Eventos Completa */}
      <section 
        id="events-page-content"
        className="w-full"
        aria-label="Página de eventos: búsqueda, estadísticas, categorías y eventos destacados"
      >
        {/* Hero Section con Video de Fondo - Búsqueda de Eventos */}
        <div className="relative w-full min-h-[420px] sm:min-h-[520px] md:h-[60vh] lg:h-[70vh] overflow-hidden bg-black">
        {/* Capa de color de fondo (solo visible en el óvalo) */}
        <div className="absolute inset-0 bg-[#68211A]"></div>

        {/* Video de fondo con opacidad reducida */}
        <div className="absolute inset-0 opacity-40">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={video1} type="video/mp4" />
          </video>
        </div>
        
        {/* Capa de color adicional para intensificar el tinte */}
        <div className="absolute inset-0 bg-[#68211A]/60"></div>

        {/* Máscara oval degradado (negro en los bordes, transparente en el centro) */}
        <div className="video-mask"></div>

        {/* Contenido frontal */}
        <div className="absolute inset-0 flex items-center justify-center z-10 py-3 sm:py-6 md:py-10">
          <div className="container mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-9 lg:gap-[68px]">
              
              {/* Sección superior: Logo + Título + Subtítulo */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-[19px] text-center animate-fade-in-up w-full">
                {/* Logo VELTLIX */}
                <img 
                  src={logohome} 
                  alt="VELTLIX" 
                  className="h-16 sm:h-18 md:h-20 lg:h-24 xl:h-[75px] w-auto"
                />

                {/* Título principal */}
                <h1 className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl max-w-6xl leading-tight px-3" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('events.hero.title')}
                </h1>

                {/* Subtítulo */}
                <p className="text-white font-montserrat font-semibold text-[10px] sm:text-[11px] md:text-xs lg:text-sm xl:text-base max-w-4xl leading-snug px-3">
                  {t('events.hero.subtitle')}
                </p>
              </div>

              {/* Caja roja con blur - Búsqueda */}
              <div className="w-full max-w-[1202px] px-2 sm:px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div 
                  className="relative bg-[#460000]/60 backdrop-blur-[30.95px] rounded-[8px] sm:rounded-[10px] px-3 sm:px-5 md:px-7 lg:px-10 py-2.5 sm:py-4 md:py-5"
                  style={{ mixBlendMode: 'hard-light' }}
                >
                  <div className="flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4 items-stretch md:items-center">
                    {/* Campo de búsqueda */}
                    <div className="relative w-full md:flex-1 md:max-w-[516px]">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 -translate-y-1/2 text-black/60" />
                      <Input
                        placeholder={t('events.search.placeholder')}
                        className="pl-8 sm:pl-10 md:pl-14 pr-2.5 sm:pr-3 !h-9 sm:!h-11 md:!h-13 !min-h-9 sm:!min-h-11 md:!min-h-13 !max-h-9 sm:!max-h-11 md:!max-h-13 border-0 !bg-white text-black placeholder:text-black/60 text-xs sm:text-sm md:text-base rounded-[8px] sm:rounded-[10px] shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)] focus:ring-2 focus:ring-white/30 font-montserrat font-semibold"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                        }}
                      />
                    </div>

                    {/* Dropdown de ciudades */}
                    <div className="w-full md:w-auto md:flex-1 md:max-w-[315px]">
                      <Select 
                        value={selectedCities.length > 0 ? selectedCities[0] : "all"}
                        onValueChange={(value: string) => {
                          if (value === "all") {
                            setSelectedCities([]);
                          } else {
                            setSelectedCities([value]);
                          }
                        }}
                      >
                        <SelectTrigger className="!h-9 sm:!h-11 md:!h-13 !min-h-9 sm:!min-h-11 md:!min-h-13 !max-h-9 sm:!max-h-11 md:!max-h-13 border-0 !bg-white text-black rounded-[8px] sm:rounded-[10px] focus:ring-2 focus:ring-white/30 font-montserrat font-semibold text-xs sm:text-sm md:text-base">
                          <SelectValue placeholder={t('events.search.cities')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('events.search.cities')}</SelectItem>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Botón de búsqueda */}
                    <Button
                      onClick={() => {
                        document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="!h-9 sm:!h-11 md:!h-13 !min-h-9 sm:!min-h-11 md:!min-h-13 !max-h-9 sm:!max-h-11 md:!max-h-13 w-full md:w-auto md:min-w-[160px] lg:min-w-[220px] bg-[#c61619] hover:bg-[#a01316] text-white font-montserrat font-semibold rounded-[8px] sm:rounded-[10px] text-xs sm:text-sm md:text-base transition-all shrink-0"
                    >
                      {t('events.search.button')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Categorías rápidas */}
              <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-[13px] justify-center animate-fade-in-up px-2" style={{ animationDelay: '0.3s' }}>
                {mockCategories.slice(1, 5).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`min-w-[80px] sm:min-w-[100px] md:w-[120px] h-[30px] sm:h-[34px] md:h-[38px] rounded-[8px] sm:rounded-[10px] text-xs sm:text-sm md:text-base font-montserrat font-semibold transition-all flex items-center justify-center px-2 sm:px-3 ${
                      selectedCategory === cat.name
                        ? 'bg-white text-black shadow-lg'
                        : 'bg-[#e6e6e6] text-black hover:bg-white hover:shadow-md'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
        </div>

        {/* Estadísticas y Exploración de Categorías */}
        <div className="bg-black py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          
          {/* Estadísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 md:gap-7 mb-6 sm:mb-8 md:mb-12 lg:mb-16">
            
            {/* Usuarios Activos */}
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                <Users className="w-full h-full text-[#c61619]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-xl lg:text-2xl text-white text-center leading-tight" style={{ fontFamily: 'Germania One, sans-serif' }}>
                2.5M +
              </h3>
              <p className="font-montserrat font-semibold text-[9px] sm:text-[10px] md:text-xs text-white/80 text-center">
                {t('events.stats.users')}
              </p>
            </div>

            {/* Tickets Vendidos */}
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                <Ticket className="w-full h-full text-[#c61619]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-xl lg:text-2xl text-white text-center leading-tight" style={{ fontFamily: 'Germania One, sans-serif' }}>
                500K +
              </h3>
              <p className="font-montserrat font-semibold text-[9px] sm:text-[10px] md:text-xs text-white/80 text-center">
                {t('events.stats.tickets')}
              </p>
            </div>

            {/* Eventos Disponibles */}
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                <CalendarDays className="w-full h-full text-[#c61619]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-xl lg:text-2xl text-white text-center leading-tight" style={{ fontFamily: 'Germania One, sans-serif' }}>
                10K +
              </h3>
              <p className="font-montserrat font-semibold text-[9px] sm:text-[10px] md:text-xs text-white/80 text-center">
                {t('events.stats.events')}
              </p>
            </div>

            {/* Calificación Promedio */}
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                <Star className="w-full h-full text-[#c61619]" strokeWidth={1.5} fill="#c61619" />
              </div>
              <h3 className="font-bold text-sm sm:text-base md:text-xl lg:text-2xl text-white text-center leading-tight" style={{ fontFamily: 'Germania One, sans-serif' }}>
                4.9
              </h3>
              <p className="font-montserrat font-semibold text-[9px] sm:text-[10px] md:text-xs text-white/80 text-center">
                {t('events.stats.rating')}
              </p>
            </div>

          </div>

          {/* Título de Explorar por Categoría */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-11">
            <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-2 sm:mb-3 md:mb-4" style={{ fontFamily: 'Germania One, sans-serif' }}>
              {t('home.categories.title')}
            </h2>
            <p className="font-montserrat font-semibold text-sm sm:text-base md:text-lg text-white/80">
              {t('home.categories.subtitle')}
            </p>
          </div>

          {/* Cards de Categorías */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {/* Conciertos */}
            <div 
              onClick={() => {
                setSelectedCategory("Concierto");
                document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] rounded-[10px] sm:rounded-[13px] overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop" 
                alt="Concerts"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 sm:p-4 gap-3 sm:gap-4">
                <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white text-center" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('nav.category.concerts')}
                </h3>
                <div className="p-4 sm:p-5 md:p-6 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  <Music className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" strokeWidth={2} />
                </div>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white">
                  8 {t('events.category.eventsCount')}
                </p>
              </div>
            </div>

            {/* Deportes */}
            <div 
              onClick={() => {
                setSelectedCategory("Deportes");
                document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] rounded-[10px] sm:rounded-[13px] overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop" 
                alt="Sports"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 sm:p-4 gap-3 sm:gap-4">
                <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white text-center" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('nav.category.sports')}
                </h3>
                <div className="p-4 sm:p-5 md:p-6 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" strokeWidth={2} />
                </div>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white">
                  15 {t('events.category.eventsCount')}
                </p>
              </div>
            </div>

            {/* Teatro */}
            <div 
              onClick={() => {
                setSelectedCategory("Teatro");
                document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] rounded-[10px] sm:rounded-[13px] overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&h=600&fit=crop" 
                alt="Theater"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 sm:p-4 gap-3 sm:gap-4">
                <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white text-center" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('nav.category.theater')}
                </h3>
                <div className="p-4 sm:p-5 md:p-6 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  <Drama className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" strokeWidth={2} />
                </div>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white">
                  3 {t('events.category.eventsCount')}
                </p>
              </div>
            </div>

            {/* Familia */}
            <div 
              onClick={() => {
                setSelectedCategory("Familia");
                document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] rounded-[10px] sm:rounded-[13px] overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop" 
                alt="Family"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 sm:p-4 gap-3 sm:gap-4">
                <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white text-center" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('category.family')}
                </h3>
                <div className="p-4 sm:p-5 md:p-6 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  <UsersRound className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" strokeWidth={2} />
                </div>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white">
                  20 {t('events.category.eventsCount')}
                </p>
              </div>
            </div>

            {/* Arte */}
            <div 
              onClick={() => {
                setSelectedCategory("Arte");
                document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] rounded-[10px] sm:rounded-[13px] overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop" 
                alt="Art"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 sm:p-4 gap-3 sm:gap-4">
                <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white text-center" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('category.art')}
                </h3>
                <div className="p-4 sm:p-5 md:p-6 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  <Palette className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" strokeWidth={2} />
                </div>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white">
                  10 {t('events.category.eventsCount')}
                </p>
              </div>
            </div>

            {/* Comedia */}
            <div 
              onClick={() => {
                setSelectedCategory("Comedia");
                document.getElementById('eventos-destacados')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative w-full h-[160px] sm:h-[180px] md:h-[220px] lg:h-[260px] rounded-[10px] sm:rounded-[13px] overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&h=600&fit=crop" 
                alt="Comedy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 sm:p-4 gap-3 sm:gap-4">
                <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-white text-center" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('category.comedy')}
                </h3>
                <div className="p-4 sm:p-5 md:p-6 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                  <Smile className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" strokeWidth={2} />
                </div>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white">
                  5 {t('events.category.eventsCount')}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Eventos Destacados */}
        <div id="eventos-destacados" className="bg-white py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Título de la sección */}
            <div className="flex items-center gap-4 mb-8 md:mb-11">
              <Ticket className="w-12 h-12 md:w-16 md:h-16 text-[#c61619]" strokeWidth={1.5} />
              <div>
                <h2 className="font-bold text-3xl md:text-5xl text-black" style={{ fontFamily: 'Germania One, sans-serif' }}>
                  {t('events.featured.title')}
                </h2>
                <p className="font-montserrat font-semibold text-sm md:text-lg text-black">
                  {t('home.featured.subtitle')}
                </p>
              </div>
            </div>

            {/* Grid de Eventos Destacados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
              {filteredAndSortedEvents.slice(0, 8).map((event, index) => (
                <div key={event.id} className="relative flex flex-col w-full">
                  {/* Imagen del evento */}
                  <div className="h-[220px] sm:h-[320px] md:h-[420px] lg:h-[544px] rounded-t-[10px] sm:rounded-t-[13px] overflow-hidden relative">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badges superiores */}
                    <div className="absolute top-1.5 sm:top-2 md:top-3 left-2 sm:left-3 md:left-[23px] flex flex-col gap-1.5 sm:gap-2 md:gap-[12px] z-10">
                      {/* Badge de categoría */}
                      <div className="bg-white h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                        <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-black">
                          {t(`category.${event.category.toLowerCase()}`)}
                        </p>
                      </div>
                      
                      {/* Badge de estado (Últimos/Próximos/Futuros) */}
                      {event.lastTickets && (
                        <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.lastTickets')}
                          </p>
                        </div>
                      )}
                      {!event.lastTickets && index % 2 === 0 && (
                        <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.upcoming')}
                          </p>
                        </div>
                      )}
                      {!event.lastTickets && index % 2 !== 0 && (
                        <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.future')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Badge de Destacado/Imperdible */}
                    {event.featured && (
                      <div className="absolute top-1.5 sm:top-2 md:top-3 right-2 sm:right-3 md:right-[17px] z-10">
                        <div className="bg-[#f55d09] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.featured')}
                          </p>
                        </div>
                      </div>
                    )}
                    {!event.featured && event.trending && (
                      <div className="absolute top-1.5 sm:top-2 md:top-3 right-2 sm:right-3 md:right-[17px] z-10">
                        <div className="bg-[#f55d09] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.recommended')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Badge de precio */}
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
                  </div>

                  {/* Información del evento - FONDO GRIS #e3e0e0 */}
                  <div className="bg-[#e3e0e0] h-[130px] sm:h-[170px] md:h-[220px] lg:h-[258px] rounded-b-[10px] sm:rounded-b-[13px] p-3 sm:p-4 md:p-5 lg:p-[27px] flex flex-col">
                    {/* Título */}
                    <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-[26px] xl:text-[30px] text-black mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 leading-tight line-clamp-1" style={{ fontFamily: 'Germania One, sans-serif' }}>
                      {t(`event.title.${event.id}`)}
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
                      className="mt-auto bg-[#c61619] hover:bg-[#a01316] h-[28px] sm:h-[32px] md:h-[36px] lg:h-[40px] rounded-[7px] w-full transition-colors"
                      onClick={() => {
                        navigate("event-detail", {
                          id: event.id,
                          title: event.title,
                          date: event.date,
                          location: event.location,
                          price: event.price,
                          image: event.image,
                          category: event.category,
                          featured: event.featured,
                        });
                      }}
                    >
                    <p className="font-montserrat font-bold text-[9px] sm:text-[10px] md:text-[12px] lg:text-[14px] !text-white text-center">
                      {t('events.button.buy')}
                    </p>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Próximos Eventos */}
        <div className="bg-black py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Título de la sección */}
            <div className="text-center mb-4">
              <h2 className="font-bold text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: 'Germania One, sans-serif' }}>
                {t('events.upcoming.title')}
              </h2>
              <p className="font-montserrat font-semibold text-base md:text-lg text-white">
                {t('events.upcoming.subtitle')}
              </p>
            </div>

            {/* Grid de Próximos Eventos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-9 mt-12 md:mt-[51px]">
              {filteredAndSortedEvents.slice(0, 8).map((event, index) => (
                <div key={event.id} className="relative flex flex-col w-full">
                  {/* Imagen del evento */}
                  <div className="h-[220px] sm:h-[320px] md:h-[420px] lg:h-[544px] rounded-t-[10px] sm:rounded-t-[13px] overflow-hidden relative">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badges superiores */}
                    <div className="absolute top-1.5 sm:top-2 md:top-3 left-2 sm:left-3 md:left-[23px] flex flex-col gap-1.5 sm:gap-2 md:gap-[12px] z-10">
                      {/* Badge de categoría */}
                      <div className="bg-white h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                        <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-black">
                          {t(`category.${event.category.toLowerCase()}`)}
                        </p>
                      </div>
                      
                      {/* Badge de estado (Últimos/Próximos/Actuales) */}
                      {event.lastTickets && (
                        <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.lastTickets')}
                          </p>
                        </div>
                      )}
                      {!event.lastTickets && index % 2 === 0 && (
                        <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.upcoming')}
                          </p>
                        </div>
                      )}
                      {!event.lastTickets && index % 2 !== 0 && (
                        <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.current')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Badge de Destacado */}
                    {event.featured && (
                      <div className="absolute top-1.5 sm:top-2 md:top-3 right-2 sm:right-3 md:right-[17px] z-10">
                        <div className="bg-[#f55d09] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                            {t('events.card.featuredAlt')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Badge de precio */}
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
                  </div>

                  {/* Información del evento */}
                  <div className="bg-white h-[130px] sm:h-[170px] md:h-[220px] lg:h-[258px] rounded-b-[10px] sm:rounded-b-[13px] p-3 sm:p-4 md:p-5 lg:p-[27px] flex flex-col">
                    {/* Título */}
                    <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-[26px] xl:text-[30px] text-black mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 leading-tight line-clamp-1" style={{ fontFamily: 'Germania One, sans-serif' }}>
                      {t(`event.title.${event.id}`)}
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
                      className="mt-auto bg-[#c61619] hover:bg-[#a01316] h-[28px] sm:h-[32px] md:h-[36px] lg:h-[40px] rounded-[7px] w-full transition-colors"
                      onClick={() => {
                        navigate("event-detail", {
                          id: event.id,
                          title: event.title,
                          date: event.date,
                          location: event.location,
                          price: event.price,
                          image: event.image,
                          category: event.category,
                          featured: event.featured,
                        });
                      }}
                    >
                    <p className="font-montserrat font-bold text-[9px] sm:text-[10px] md:text-[12px] lg:text-[14px] !text-white text-center">
                      {t('events.button.buy')}
                    </p>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Ver todos los eventos */}
            <div className="flex justify-center mt-12 md:mt-16">
              <button 
                className="bg-[#c61619] hover:bg-[#a01316] h-[40px] rounded-[7px] w-full max-w-[338px] transition-colors"
                onClick={() => {
                  navigate("all-events" as any);
                }}
              >
                <p className="font-montserrat font-bold text-[14px] !text-white text-center">
                  {t('events.button.viewAll')}
                </p>
              </button>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
