import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Users,
  Ticket,
  CalendarDays,
  Star,
  Music,
  Trophy,
  Drama,
  UsersRound,
  Palette,
  Smile,
  Globe,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useRouter } from "../hooks/useRouter";
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../hooks/useAuth";
import { useCartStore } from "../stores/cartStore";
import { mockEvents, categories as mockCategories } from "../data/mockEvents";
import { SEOHead } from "../components/common";
import { useEvents } from "../hooks/useEvents";
import { EventCardSkeleton } from "../components/events/EventCardSkeleton";
// URL de video desde Cloudflare R2
const video1 =
  import.meta.env.VITE_VIDEO_URL_1 || "https://video.veltlix.com/video1.mp4";
import logohome from "../assets/images/logohome.svg";

export function EventsListPage() {
  const { pageData, navigate } = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCartStore();
  const { data: events = [], isLoading, error } = useEvents();

  // Filter states (initialize from pageData if coming from search)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    pageData?.category || "all",
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    pageData?.searchQuery || "",
  );
  const [selectedCities, setSelectedCities] = useState<string[]>(
    pageData?.selectedCity ? [pageData.selectedCity] : [],
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

  // Helper function to parse date
  const parseDate = (dateStr: string): string => {
    const months: Record<string, string> = {
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12",
    };
    const parts = dateStr.toLowerCase().split(",");
    if (parts.length === 2) {
      const year = parts[1].trim();
      const dayMonth = parts[0].split("de");
      if (dayMonth.length === 2) {
        const day = dayMonth[0].trim();
        const month = dayMonth[1].trim();
        const monthNum = months[month] || "01";
        return `${year}-${monthNum}-${day.padStart(2, "0")}`;
      }
    }
    return new Date().toISOString().split("T")[0];
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

  // Extract unique cities
  const cities = useMemo(() => {
    if (!events) return [];
    const citiesSet = new Set<string>();
    events.forEach((event) => {
      const city = event.location.split(",").pop()?.trim() || event.location;
      citiesSet.add(city);
    });
    return Array.from(citiesSet).sort();
  }, [events]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    let result = [...events];

    // Category filter - Open Salinas siempre visible en todas las categorías
    if (selectedCategory !== "all") {
      result = result.filter((event) => {
        // Evento prioritario (id: 1 - Open Salinas) aparece en TODAS las categorías
        const isPriority = event.id === 1;
        return isPriority || event.category === selectedCategory;
      });
    }

    // City filter
    if (selectedCities.length > 0) {
      result = result.filter((event) => {
        const city = event.location.split(",").pop()?.trim() || event.location;
        return selectedCities.includes(city);
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query),
      );
    }

    // ORDENAMIENTO FINAL: Open Salinas (id: 1) SIEMPRE PRIMERO
    result.sort((a, b) => {
      const isPriorityA = a.id === 1;
      const isPriorityB = b.id === 1;

      if (isPriorityA && !isPriorityB) return -1;
      if (!isPriorityA && isPriorityB) return 1;

      // Para el resto, mantener el orden original
      return 0;
    });

    return result;
  }, [events, selectedCategory, selectedCities, searchQuery]);

  // Loading state - Mostrar skeleton en lugar de spinner
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
      {Array.from({ length: 8 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );

  // Error state (aún muestra mockEvents como fallback)
  if (error) {
    console.warn('Error cargando eventos, usando datos de respaldo:', error);
  }

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
    desc +=
      ". Encuentra conciertos, deportes, teatro y más. Compra tus boletos de forma segura.";
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
          url: typeof window !== "undefined" ? window.location.href : undefined,
          type: "website",
        }}
      />

      <section
        id="events-page-content"
        className="w-full"
        aria-label="Página de eventos: búsqueda, estadísticas, categorías y eventos destacados"
      >

        {/* ─────────────────────────────────────────────────────────────
            SECCIÓN 1: HERO — video de fondo + búsqueda + categorías
        ───────────────────────────────────────────────────────────── */}
        <div className="relative w-full min-h-[420px] sm:min-h-[520px] md:h-[60vh] lg:h-[70vh] overflow-hidden bg-black">
          {/* Capa de color de fondo */}
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

          {/* Máscara oval degradado */}
          <div className="video-mask"></div>

          {/* Contenido frontal */}
          <div className="absolute inset-0 flex items-center justify-center z-10 py-3 sm:py-6 md:py-10">
            <div className="container mx-auto px-3 sm:px-4 lg:px-8">
              <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-9 lg:gap-[68px]">

                {/* Logo + Título + Subtítulo */}
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-[19px] text-center animate-fade-in-up w-full">
                  <img
                    src={logohome}
                    alt="VELTLIX"
                    className="h-16 sm:h-18 md:h-20 lg:h-24 xl:h-[75px] w-auto"
                  />
                  <h1
                    className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl max-w-6xl leading-tight px-3"
                    style={{ fontFamily: "Germania One, sans-serif" }}
                  >
                    {t("events.hero.title")}
                  </h1>
                  <p className="text-white font-montserrat font-semibold text-[10px] sm:text-[11px] md:text-xs lg:text-sm xl:text-base max-w-4xl leading-snug px-3">
                    {t("events.hero.subtitle")}
                  </p>
                </div>

                {/* Caja de búsqueda */}
                <div
                  className="w-full max-w-[1202px] px-2 sm:px-4 animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div
                    className="relative bg-[#460000]/60 backdrop-blur-[30.95px] rounded-[8px] sm:rounded-[10px] px-3 sm:px-5 md:px-7 lg:px-10 py-2.5 sm:py-4 md:py-5"
                    style={{ mixBlendMode: "hard-light" }}
                  >
                    <div className="flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4 items-stretch md:items-center">
                      {/* Campo de búsqueda */}
                      <div className="relative w-full md:flex-1 md:max-w-[516px]">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 -translate-y-1/2 text-black/60" />
                        <Input
                          placeholder={t("events.search.placeholder")}
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
                          value={
                            selectedCities.length > 0
                              ? selectedCities[0]
                              : "all"
                          }
                          onValueChange={(value: string) => {
                            if (value === "all") {
                              setSelectedCities([]);
                            } else {
                              setSelectedCities([value]);
                            }
                          }}
                        >
                          <SelectTrigger className="!h-9 sm:!h-11 md:!h-13 !min-h-9 sm:!min-h-11 md:!min-h-13 !max-h-9 sm:!max-h-11 md:!max-h-13 border-0 !bg-white text-black rounded-[8px] sm:rounded-[10px] focus:ring-2 focus:ring-white/30 font-montserrat font-semibold text-xs sm:text-sm md:text-base">
                            <SelectValue
                              placeholder={t("events.search.cities")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {t("events.search.cities")}
                            </SelectItem>
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
                          document
                            .getElementById("eventos-destacados")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="!h-9 sm:!h-11 md:!h-13 !min-h-9 sm:!min-h-11 md:!min-h-13 !max-h-9 sm:!max-h-11 md:!max-h-13 w-full md:w-auto md:min-w-[160px] lg:min-w-[220px] bg-[#c61619] hover:bg-[#a01316] text-white font-montserrat font-semibold rounded-[8px] sm:rounded-[10px] text-xs sm:text-sm md:text-base transition-all shrink-0"
                      >
                        {t("events.search.button")}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Categorías rápidas */}
                <div
                  className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-[13px] justify-center animate-fade-in-up px-2"
                  style={{ animationDelay: "0.3s" }}
                >
                  {mockCategories.slice(1, 5).map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        document
                          .getElementById("eventos-destacados")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`min-w-[80px] sm:min-w-[100px] md:w-[120px] h-[30px] sm:h-[34px] md:h-[38px] rounded-[8px] sm:rounded-[10px] text-xs sm:text-sm md:text-base font-montserrat font-semibold transition-all flex items-center justify-center px-2 sm:px-3 ${
                        selectedCategory === cat.name
                          ? "bg-white text-black shadow-lg"
                          : "bg-[#e6e6e6] text-black hover:bg-white hover:shadow-md"
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

        {/* ─────────────────────────────────────────────────────────────
            SECCIÓN 2: STATS BAR — dark gradient bg + ticket-shaped cards
        ───────────────────────────────────────────────────────────── */}
        <div
          className="w-full py-14 sm:py-16 md:py-20"
          style={{
            background: "linear-gradient(180deg, #000000 0%, #1a0205 40%, #2d0408 70%, #000000 100%)",
          }}
        >
          <div className="container mx-auto px-4">
            {/* Headline */}
            <p
              className="text-white text-center font-bold text-xl sm:text-2xl md:text-3xl max-w-3xl mx-auto leading-snug mb-12 sm:mb-14 md:mb-16 px-4"
              style={{ fontFamily: "Germania One, sans-serif" }}
            >
              Hemos impulsado el éxito de los organizadores al facilitar la venta de más de 30 millones de entradas.
            </p>

            {/* 4 Ticket-shaped stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">

              {/* Card: Usuarios Activos */}
              <div
                className="flex flex-col items-center gap-3 sm:gap-4 rounded-[16px] px-4 sm:px-6 py-6 sm:py-8 md:py-10"
                style={{ background: "#1e3a47" }}
              >
                <Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                <p
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  2.500.000 +
                </p>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white/80 text-center">
                  {t("events.stats.users")}
                </p>
              </div>

              {/* Card: Tickets Vendidos */}
              <div
                className="flex flex-col items-center gap-3 sm:gap-4 rounded-[16px] px-4 sm:px-6 py-6 sm:py-8 md:py-10"
                style={{ background: "#1e3a47" }}
              >
                <Ticket className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                <p
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  500.000 +
                </p>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white/80 text-center">
                  {t("events.stats.tickets")}
                </p>
              </div>

              {/* Card: Eventos Disponibles */}
              <div
                className="flex flex-col items-center gap-3 sm:gap-4 rounded-[16px] px-4 sm:px-6 py-6 sm:py-8 md:py-10"
                style={{ background: "#1e3a47" }}
              >
                <CalendarDays className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                <p
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  10.000 +
                </p>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white/80 text-center">
                  {t("events.stats.events")}
                </p>
              </div>

              {/* Card: Calificación Promedio */}
              <div
                className="flex flex-col items-center gap-3 sm:gap-4 rounded-[16px] px-4 sm:px-6 py-6 sm:py-8 md:py-10"
                style={{ background: "#1e3a47" }}
              >
                <Star className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                <p
                  className="font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  4.9
                </p>
                <p className="font-montserrat font-semibold text-xs sm:text-sm text-white/80 text-center">
                  {t("events.stats.rating")}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECCIÓN 3: EXPLORA POR CATEGORÍA — gradient magenta → black
        ───────────────────────────────────────────────────────────── */}
        <div
          className="w-full py-12 sm:py-14 md:py-20"
          style={{
            background: "linear-gradient(180deg, #7a0c0e 0%, #3d0608 30%, #000000 100%)",
          }}
        >
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-10 sm:mb-12 md:mb-14">
              <h2
                className="font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-3"
                style={{ fontFamily: "Germania One, sans-serif" }}
              >
                {t("home.categories.title")}
              </h2>
              <p className="font-montserrat font-semibold text-sm sm:text-base md:text-lg text-white/80">
                {t("home.categories.subtitle")}
              </p>
            </div>

            {/* 6 Category cards — image + icon inside, name BELOW */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">

              {/* Conciertos */}
              <div
                className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                onClick={() => {
                  setSelectedCategory("Concierto");
                  document
                    .getElementById("eventos-destacados")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-full aspect-square rounded-[16px] overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=600&fit=crop"
                    alt="Conciertos"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                    <p className="font-montserrat font-semibold text-[10px] sm:text-xs text-white">
                      8 {t("events.category.eventsCount")}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold text-sm sm:text-base md:text-lg text-white text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  {t("nav.category.concerts")}
                </p>
              </div>

              {/* Deportes */}
              <div
                className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                onClick={() => {
                  setSelectedCategory("Deportes");
                  document
                    .getElementById("eventos-destacados")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-full aspect-square rounded-[16px] overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop"
                    alt="Deportes"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                    <p className="font-montserrat font-semibold text-[10px] sm:text-xs text-white">
                      15 {t("events.category.eventsCount")}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold text-sm sm:text-base md:text-lg text-white text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  {t("nav.category.sports")}
                </p>
              </div>

              {/* Teatro */}
              <div
                className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                onClick={() => {
                  setSelectedCategory("Teatro");
                  document
                    .getElementById("eventos-destacados")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-full aspect-square rounded-[16px] overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=600&h=600&fit=crop"
                    alt="Teatro"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Drama className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                    <p className="font-montserrat font-semibold text-[10px] sm:text-xs text-white">
                      3 {t("events.category.eventsCount")}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold text-sm sm:text-base md:text-lg text-white text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  {t("nav.category.theater")}
                </p>
              </div>

              {/* Familia */}
              <div
                className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                onClick={() => {
                  setSelectedCategory("Familia");
                  document
                    .getElementById("eventos-destacados")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-full aspect-square rounded-[16px] overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=600&fit=crop"
                    alt="Familia"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <UsersRound className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                    <p className="font-montserrat font-semibold text-[10px] sm:text-xs text-white">
                      20 {t("events.category.eventsCount")}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold text-sm sm:text-base md:text-lg text-white text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  {t("category.family")}
                </p>
              </div>

              {/* Arte */}
              <div
                className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                onClick={() => {
                  setSelectedCategory("Arte");
                  document
                    .getElementById("eventos-destacados")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-full aspect-square rounded-[16px] overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=600&fit=crop"
                    alt="Arte"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Palette className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                    <p className="font-montserrat font-semibold text-[10px] sm:text-xs text-white">
                      10 {t("events.category.eventsCount")}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold text-sm sm:text-base md:text-lg text-white text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  {t("category.art")}
                </p>
              </div>

              {/* Comedia */}
              <div
                className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer group"
                onClick={() => {
                  setSelectedCategory("Comedia");
                  document
                    .getElementById("eventos-destacados")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative w-full aspect-square rounded-[16px] overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&h=600&fit=crop"
                    alt="Comedia"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-all"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Smile className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                    <p className="font-montserrat font-semibold text-[10px] sm:text-xs text-white">
                      5 {t("events.category.eventsCount")}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold text-sm sm:text-base md:text-lg text-white text-center"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  {t("category.comedy")}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECCIÓN 4: EVENTOS DESTACADOS — fondo negro/dark navy
        ───────────────────────────────────────────────────────────── */}
        <div id="eventos-destacados" className="bg-black py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Encabezado */}
            <div className="flex items-center gap-4 mb-8 md:mb-11">
              <Ticket
                className="w-12 h-12 md:w-16 md:h-16 text-[#c61619]"
                strokeWidth={1.5}
              />
              <div>
                <h2
                  className="font-bold text-3xl md:text-5xl text-white"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  {t("events.featured.title")}
                </h2>
                <p className="font-montserrat font-semibold text-sm md:text-lg text-white/70">
                  {t("home.featured.subtitle")}
                </p>
              </div>
            </div>

            {/* Grid de Eventos Destacados */}
            {isLoading ? (
              renderSkeletons()
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
                {filteredAndSortedEvents.slice(0, 8).map((event, index) => (
                  <div
                    key={event.id}
                    className={`relative flex flex-col w-full ${event.soldOut ? "opacity-90" : ""}`}
                  >
                    {/* Imagen del evento */}
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

                      {/* Badges superiores izquierda */}
                      <div className="absolute top-1.5 sm:top-2 md:top-3 left-2 sm:left-3 md:left-[23px] flex flex-col gap-1.5 sm:gap-2 md:gap-[12px] z-10">
                        <div className="bg-white h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-black">
                            {t(`category.${event.category.toLowerCase()}`)}
                          </p>
                        </div>
                        {event.lastTickets && !event.soldOut && (
                          <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.lastTickets")}
                            </p>
                          </div>
                        )}
                        {!event.lastTickets && !event.soldOut && index % 2 === 0 && (
                          <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.upcoming")}
                            </p>
                          </div>
                        )}
                        {!event.lastTickets && !event.soldOut && index % 2 !== 0 && (
                          <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.future")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Badge Destacado/Trending (derecha) */}
                      {event.featured && (
                        <div className="absolute top-1.5 sm:top-2 md:top-3 right-2 sm:right-3 md:right-[17px] z-10">
                          <div className="bg-[#f55d09] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.featured")}
                            </p>
                          </div>
                        </div>
                      )}
                      {!event.featured && event.trending && (
                        <div className="absolute top-1.5 sm:top-2 md:top-3 right-2 sm:right-3 md:right-[17px] z-10">
                          <div className="bg-[#f55d09] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.recommended")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Badge de precio */}
                      {!event.soldOut && (
                        <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-[15px] left-2 sm:left-3 md:left-[23px] z-10">
                          <div className="bg-white h-[42px] sm:h-[52px] md:h-[60px] lg:h-[67px] rounded-[15px] sm:rounded-[20px] px-2 sm:px-3 md:px-4 flex flex-col items-start justify-center">
                            <p className="font-montserrat font-medium text-[9px] sm:text-[11px] md:text-[12px] lg:text-[14px] text-black">
                              {t("events.card.from")}
                            </p>
                            <p
                              className="font-bold text-[16px] sm:text-[20px] md:text-[24px] lg:text-[30px] text-black leading-tight"
                              style={{ fontFamily: "Germania One, sans-serif" }}
                            >
                              {event.price}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Información del evento — fondo dark blue-gray */}
                    <div
                      className="h-[130px] sm:h-[170px] md:h-[220px] lg:h-[258px] rounded-b-[10px] sm:rounded-b-[13px] p-3 sm:p-4 md:p-5 lg:p-[27px] flex flex-col"
                      style={{ background: "#111827" }}
                    >
                      <h3
                        className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg text-white mb-1 sm:mb-1.5 leading-tight line-clamp-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {t(`event.title.${event.id}`) !== `event.title.${event.id}` ? t(`event.title.${event.id}`) : event.title}
                      </h3>
                      <p className="font-montserrat font-black text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] xl:text-[14px] text-white mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                        {event.date}
                      </p>
                      <p className="font-montserrat font-semibold text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] xl:text-[14px] text-white/70 mb-2 sm:mb-3 md:mb-4 lg:mb-6 line-clamp-1">
                        {event.location}
                      </p>
                      <button
                        className={`mt-auto h-[28px] sm:h-[32px] md:h-[36px] lg:h-[40px] rounded-[100px] w-full transition-colors font-montserrat font-bold text-[9px] sm:text-[10px] md:text-[12px] lg:text-[14px] text-white ${
                          event.soldOut
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-[#c61619] hover:bg-[#a01316] cursor-pointer"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!event.soldOut) {
                            handleAddToCart(event);
                          }
                        }}
                        disabled={event.soldOut}
                      >
                        {event.soldOut ? "AGOTADO" : t("events.button.buy")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECCIÓN 5: PRÓXIMOS EVENTOS — fondo negro, glow effects
        ───────────────────────────────────────────────────────────── */}
        <div className="relative bg-black py-12 md:py-20 overflow-hidden">
          {/* Subtle red glow edges */}
          <div
            className="absolute top-0 left-0 w-[300px] h-[300px] opacity-20 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #c61619 0%, transparent 70%)",
              transform: "translate(-40%, -40%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[300px] h-[300px] opacity-20 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #c61619 0%, transparent 70%)",
              transform: "translate(40%, 40%)",
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            {/* Encabezado centrado */}
            <div className="text-center mb-10 md:mb-14">
              <h2
                className="font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-3"
                style={{ fontFamily: "Germania One, sans-serif" }}
              >
                {t("events.upcoming.title")}
              </h2>
              <p className="font-montserrat font-semibold text-sm sm:text-base md:text-lg text-white/70">
                {t("events.upcoming.subtitle")}
              </p>
            </div>

            {/* Grid de Próximos Eventos */}
            {isLoading ? (
              renderSkeletons()
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
                {filteredAndSortedEvents.slice(0, 8).map((event, index) => (
                  <div
                    key={event.id}
                    className={`relative flex flex-col w-full rounded-[10px] sm:rounded-[13px] overflow-hidden ${event.soldOut ? "opacity-90" : ""}`}
                  >
                    {/* Imagen del evento */}
                    <div className="h-[180px] sm:h-[240px] md:h-[300px] lg:h-[360px] relative overflow-hidden">
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

                      {/* Badges superiores izquierda */}
                      <div className="absolute top-1.5 sm:top-2 md:top-3 left-2 sm:left-3 md:left-[23px] flex flex-col gap-1.5 sm:gap-2 md:gap-[12px] z-10">
                        <div className="bg-white h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                          <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-black">
                            {t(`category.${event.category.toLowerCase()}`)}
                          </p>
                        </div>
                        {event.lastTickets && !event.soldOut && (
                          <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.lastTickets")}
                            </p>
                          </div>
                        )}
                        {!event.lastTickets && !event.soldOut && index % 2 === 0 && (
                          <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.upcoming")}
                            </p>
                          </div>
                        )}
                        {!event.lastTickets && !event.soldOut && index % 2 !== 0 && (
                          <div className="bg-[#f9487f] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.current")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Badge Destacado (derecha) */}
                      {event.featured && (
                        <div className="absolute top-1.5 sm:top-2 md:top-3 right-2 sm:right-3 md:right-[17px] z-10">
                          <div className="bg-[#f55d09] h-[20px] sm:h-[22px] md:h-[27px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center justify-center">
                            <p className="font-montserrat font-bold text-[9px] sm:text-[11px] md:text-[14px] text-white">
                              {t("events.card.featuredAlt")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Badge de precio */}
                      {!event.soldOut && (
                        <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-[15px] left-2 sm:left-3 md:left-[23px] z-10">
                          <div className="bg-white h-[42px] sm:h-[52px] md:h-[60px] lg:h-[67px] rounded-[15px] sm:rounded-[20px] px-2 sm:px-3 md:px-4 flex flex-col items-start justify-center">
                            <p className="font-montserrat font-medium text-[9px] sm:text-[11px] md:text-[12px] lg:text-[14px] text-black">
                              {t("events.card.from")}
                            </p>
                            <p
                              className="font-bold text-[16px] sm:text-[20px] md:text-[24px] lg:text-[30px] text-black leading-tight"
                              style={{ fontFamily: "Germania One, sans-serif" }}
                            >
                              {event.price}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Información del evento — negro puro */}
                    <div className="bg-black h-[130px] sm:h-[170px] md:h-[220px] lg:h-[258px] p-3 sm:p-4 md:p-5 lg:p-[27px] flex flex-col">
                      <h3
                        className="font-bold text-base sm:text-lg md:text-xl lg:text-[22px] text-white mb-1 sm:mb-1.5 leading-tight line-clamp-2"
                        style={{ fontFamily: "Germania One, sans-serif" }}
                      >
                        {t(`event.title.${event.id}`) !== `event.title.${event.id}` ? t(`event.title.${event.id}`) : event.title}
                      </h3>
                      <p className="font-montserrat font-black text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] xl:text-[14px] text-white mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
                        {event.date}
                      </p>
                      <p className="font-montserrat font-light text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] xl:text-[14px] text-white/60 mb-2 sm:mb-3 md:mb-4 lg:mb-6 line-clamp-1">
                        {event.location}
                      </p>
                      <button
                        className={`mt-auto h-[32px] sm:h-[36px] md:h-[40px] lg:h-[44px] rounded-[100px] w-full transition-colors font-montserrat font-bold text-[10px] sm:text-[11px] md:text-[13px] lg:text-[14px] text-white ${
                          event.soldOut
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-[#c61619] hover:bg-[#a01316] cursor-pointer"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!event.soldOut) {
                            handleAddToCart(event);
                          }
                        }}
                        disabled={event.soldOut}
                      >
                        {event.soldOut ? "AGOTADO" : t("events.button.buy")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón Ver todos los eventos */}
            <div className="flex justify-center mt-12 md:mt-16">
              <button
                className="bg-[#c61619] hover:bg-[#a01316] h-[58px] rounded-[100px] w-full max-w-[338px] transition-colors font-montserrat font-bold text-sm sm:text-base text-white"
                onClick={() => {
                  navigate("all-events" as any);
                }}
              >
                {t("events.button.viewAll")}
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECCIÓN 6: ¿ORGANIZAS EVENTOS? — negro puro, iconos grandes
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-black py-16 md:py-24">
          <div className="container mx-auto px-4">

            {/* Título */}
            <div className="text-center mb-5">
              <h2
                className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight"
                style={{ fontFamily: "Germania One, sans-serif" }}
              >
                {t("page.organizers.title")}
              </h2>
            </div>

            {/* Subtítulo */}
            <p className="font-montserrat text-sm sm:text-base md:text-lg text-white/60 text-center max-w-2xl mx-auto mb-14 md:mb-20 leading-relaxed">
              {t("page.organizers.subtitle")}
            </p>

            {/* 3 Feature columns — no cards, just icon + title + description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-16 md:mb-20">

              {/* Alcance Masivo */}
              <div className="flex flex-col items-center text-center gap-5">
                <Globe className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white/70" strokeWidth={1} />
                <h3
                  className="font-bold text-xl sm:text-2xl text-white"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  Alcance Masivo
                </h3>
                <p className="font-montserrat text-base sm:text-lg text-white/60 leading-relaxed max-w-xs">
                  Llega a miles de personas con nuestras herramientas de Marketing
                </p>
              </div>

              {/* 100% Seguro */}
              <div className="flex flex-col items-center text-center gap-5">
                <ShieldCheck className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white/70" strokeWidth={1} />
                <h3
                  className="font-bold text-xl sm:text-2xl text-white"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  100% Seguro
                </h3>
                <p className="font-montserrat text-base sm:text-lg text-white/60 leading-relaxed max-w-xs">
                  Pagos protegidos y códigos QR únicos anti-fraude
                </p>
              </div>

              {/* Dashboard Real-Time */}
              <div className="flex flex-col items-center text-center gap-5">
                <LayoutDashboard className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white/70" strokeWidth={1} />
                <h3
                  className="font-bold text-xl sm:text-2xl text-white"
                  style={{ fontFamily: "Germania One, sans-serif" }}
                >
                  Dashboard Real-Time
                </h3>
                <p className="font-montserrat text-base sm:text-lg text-white/60 leading-relaxed max-w-xs">
                  Estadísticas y reportes instantáneos para optimizar tus eventos
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECCIÓN 7: CTA + STATS — concert crowd bg + glass card
        ───────────────────────────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden bg-black">
          {/* Top dark fade */}
          <div
            className="absolute inset-x-0 top-0 h-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(180deg, #000000 0%, transparent 100%)" }}
          />

          {/* Concert crowd background image */}
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: "url('/images/bg2.png')" }}
          />

          {/* Dark overlay over image */}
          <div className="absolute inset-0 bg-black/65" />

          {/* Bottom dark fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(0deg, #000000 0%, transparent 100%)" }}
          />

          {/* Content */}
          <div className="relative z-20 flex flex-col items-center px-4 py-20 sm:py-24 md:py-32 gap-8 sm:gap-10">

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <button
                className="bg-[#c61619] hover:bg-[#a01316] h-[58px] rounded-[100px] w-full max-w-[426px] transition-colors font-montserrat font-bold text-sm sm:text-base text-white"
                onClick={() => navigate("create-event" as any)}
              >
                {t("page.organizers.create_event")}
              </button>
              <button
                className="bg-[#fff6f6] hover:bg-white border border-black h-[58px] rounded-[100px] w-full max-w-[426px] transition-colors font-montserrat font-bold text-sm sm:text-base text-black"
                onClick={() => navigate("how-it-works" as any)}
              >
                {t("page.organizers.how_it_works")}
              </button>
            </div>

            {/* Glass morphism stats card */}
            <div
              className="w-full max-w-3xl rounded-[10px] border border-white/20 px-6 sm:px-10 md:px-16 py-6 sm:py-8"
              style={{
                background: "rgba(81, 8, 12, 0.5)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              <div className="grid grid-cols-3 divide-x divide-white/20">
                {/* Tickets Vendidos */}
                <div className="flex flex-col items-center gap-1 px-4">
                  <p
                    className="font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight"
                    style={{ fontFamily: "Germania One, sans-serif" }}
                  >
                    500K+
                  </p>
                  <p className="font-montserrat font-semibold text-[10px] sm:text-xs md:text-sm text-white/90 text-center">
                    {t("page.organizers.stats.tickets")}
                  </p>
                </div>

                {/* Eventos Exitosos */}
                <div className="flex flex-col items-center gap-1 px-4">
                  <p
                    className="font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight"
                    style={{ fontFamily: "Germania One, sans-serif" }}
                  >
                    15K+
                  </p>
                  <p className="font-montserrat font-semibold text-[10px] sm:text-xs md:text-sm text-white/90 text-center">
                    {t("page.organizers.stats.events")}
                  </p>
                </div>

                {/* Satisfacción */}
                <div className="flex flex-col items-center gap-1 px-4">
                  <p
                    className="font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight"
                    style={{ fontFamily: "Germania One, sans-serif" }}
                  >
                    98%
                  </p>
                  <p className="font-montserrat font-semibold text-[10px] sm:text-xs md:text-sm text-white/90 text-center">
                    {t("page.organizers.stats.satisfaction")}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>
    </div>
  );
}
