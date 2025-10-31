import { EventCard, CategoryCard } from "../components/events";
import { Button } from "../components/ui/button";
import { UnifiedSearchBar } from "../components/search";
import { Search, Music, Trophy, Theater, Heart, Sparkles, TrendingUp, Palette, Laugh, Users, Shield, BarChart3, Plus, Info, Ticket as TicketIcon, Star, CalendarDays } from "lucide-react";
import { useRouter } from "../hooks/useRouter";
import { mockEvents } from "../data/mockEvents";
import { FadeIn, CountUp, FloatingParticles } from "../components/common";
import { motion } from "motion/react";
import { useMemo } from "react";
import { SEOHead } from "../components/common";

/**
 * HomePage Component - Página principal de la aplicación
 * Muestra hero section, categorías, eventos destacados y próximos eventos
 */
export function HomePage() {
  const { navigate } = useRouter();
  
  const featuredEvents = mockEvents.filter(event => event.featured).slice(0, 8);
  const upcomingEvents = mockEvents.filter(event => !event.featured).slice(0, 8);

  // Extract unique cities for search
  const cities = useMemo(() => {
    const citiesSet = new Set<string>();
    mockEvents.forEach(event => {
      const city = event.location.split(',').pop()?.trim() || event.location;
      citiesSet.add(city);
    });
    return Array.from(citiesSet).sort();
  }, []);

  const handleSearch = (query: string, city?: string) => {
    // Navigate to events page with search params
    navigate("events", { searchQuery: query, selectedCity: city });
  };

  const categories = [
    {
      title: "Conciertos",
      icon: Music,
      count: mockEvents.filter(e => e.category === "Concierto").length.toString(),
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
    },
    {
      title: "Deportes",
      icon: Trophy,
      count: mockEvents.filter(e => e.category === "Deportes").length.toString(),
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
    },
    {
      title: "Teatro",
      icon: Theater,
      count: mockEvents.filter(e => e.category === "Teatro").length.toString(),
      gradient: "bg-gradient-to-br from-red-500 to-orange-500",
    },
    {
      title: "Familia",
      icon: Heart,
      count: mockEvents.filter(e => e.category === "Familia").length.toString(),
      gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
    },
    {
      title: "Arte",
      icon: Palette,
      count: mockEvents.filter(e => e.category === "Arte").length.toString(),
      gradient: "bg-gradient-to-br from-amber-500 to-yellow-500",
    },
    {
      title: "Comedia",
      icon: Laugh,
      count: mockEvents.filter(e => e.category === "Comedia").length.toString(),
      gradient: "bg-gradient-to-br from-indigo-500 to-purple-500",
    },
  ];

  return (
    <>
      <SEOHead
        seo={{
          title: "TicketPro - Tu plataforma de eventos y boletos",
          description: "Descubre y compra boletos para los mejores eventos: conciertos, deportes, teatro, comedia y más. Miles de eventos disponibles con compra segura y rápida.",
          keywords: "eventos, boletos, conciertos, deportes, teatro, tickets, compra online, CDMX, México, Monterrey, Guadalajara",
          url: typeof window !== 'undefined' ? window.location.origin : undefined,
          type: "website",
        }}
      />
      {/* Hero Section - Sección principal con título, descripción y búsqueda */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30 dark:opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/50 dark:from-gray-900/50 via-transparent to-transparent" />
        <FloatingParticles />
        
        <div className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-20 md:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge de eventos disponibles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 px-4 py-2 text-sm backdrop-blur-sm sm:mb-8"
            >
              <Sparkles className="h-4 w-4 flex-shrink-0 text-yellow-300 dark:text-yellow-400" />
              <span className="font-medium text-white">Más de 10,000 eventos disponibles</span>
            </motion.div>
            
            {/* Título principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Vive la Experiencia de tus{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                Eventos Favoritos
              </span>
            </motion.h1>
            
            {/* Descripción */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 px-4 text-lg text-white/90 dark:text-white/80 sm:mb-10 sm:text-xl"
            >
              Descubre y compra tickets para conciertos, deportes, teatro y más.
              <br className="hidden sm:block" />
              Los mejores eventos al alcance de tu mano.
            </motion.p>

            {/* Unified Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto max-w-4xl px-2 sm:px-0"
            >
              <UnifiedSearchBar
                cities={cities}
                onSearch={handleSearch}
                placeholder="Buscar eventos, artistas, equipos..."
              />
            </motion.div>

            {/* Quick Links - Botones rápidos de categorías */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap justify-center gap-3 px-4"
            >
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSearch("Conciertos")}
                className="border-white/30 bg-white/10 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 sm:h-10 sm:px-5"
              >
                <Music className="mr-2 h-4 w-4" />
                Conciertos
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSearch("Deportes")}
                className="border-white/30 bg-white/10 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 sm:h-10 sm:px-5"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Deportes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSearch("Teatro")}
                className="border-white/30 bg-white/10 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 sm:h-10 sm:px-5"
              >
                <Theater className="mr-2 h-4 w-4" />
                Teatro
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSearch("Familia")}
                className="border-white/30 bg-white/10 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 sm:h-10 sm:px-5"
              >
                <Heart className="mr-2 h-4 w-4" />
                Familia
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Wave Separator - Separador de ola al final del hero */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-white dark:fill-gray-900"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section - Sección de estadísticas */}
      <section className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FadeIn delay={0.1}>
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  <CountUp end={2500000} suffix="+" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Usuarios Activos</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                  <TicketIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  <CountUp end={500000} suffix="+" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Tickets Vendidos</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                  <CalendarDays className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  <CountUp end={10000} suffix="+" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Eventos Disponibles</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
                  <CountUp end={4} suffix="." />
                  <CountUp end={9} />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Calificación Promedio</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Categories Section - Sección de categorías */}
      <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Explora por Categoría
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Encuentra eventos que te apasionan</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.map((category, index) => (
            <FadeIn key={category.title} delay={index * 0.1}>
              <div onClick={() => navigate("events", { category: category.title })}>
                <CategoryCard {...category} />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Featured Events - Eventos destacados */}
      <section className="bg-gradient-to-b from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center gap-4 sm:mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Eventos Destacados
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Los eventos más populares del momento</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredEvents.map((event, index) => (
              <FadeIn key={event.id} delay={index * 0.05}>
                <div onClick={() => navigate("event-detail", event)}>
                  <EventCard {...event} />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events - Próximos eventos */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Próximos Eventos
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">No te pierdas estos increíbles eventos</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcomingEvents.map((event, index) => (
              <FadeIn key={event.id} delay={index * 0.05}>
                <div onClick={() => navigate("event-detail", event)}>
                  <EventCard {...event} />
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-2 border-gray-300 dark:border-gray-700 font-semibold text-gray-900 dark:text-white transition-all hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-600 hover:text-white sm:w-auto sm:px-8"
              onClick={() => navigate("events")}
            >
              Ver Todos los Eventos
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Call to action para organizadores */}
      {/* Diseño moderno y profesional con mejor jerarquía visual */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 py-24 sm:py-28 lg:py-36">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA4IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        {/* Elementos decorativos mejorados */}
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-white/20 via-white/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[700px] w-[700px] rounded-full bg-gradient-to-tl from-white/20 via-white/10 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-yellow-300/10 via-transparent to-transparent blur-3xl" />
        
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Header Section - Centrado */}
            <div className="mb-16 text-center">
              {/* Badge premium */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-white/15 px-6 py-3 backdrop-blur-lg border border-white/30 shadow-lg"
              >
                <span className="relative h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
                </span>
                <span className="text-sm font-semibold tracking-wide text-white">Para Organizadores de Eventos</span>
              </motion.div>
              
              {/* Título mejorado con mejor tipografía */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              >
                ¿Organizas{" "}
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
                  Eventos?
                </span>
              </motion.h2>
              
              {/* Descripción mejorada */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto max-w-3xl text-lg leading-relaxed text-white/95 sm:text-xl lg:text-2xl"
              >
                Transforma tu evento en una experiencia inolvidable. Vende tickets, gestiona asistentes y maximiza tus ingresos con nuestra plataforma profesional diseñada para el éxito.
              </motion.p>
            </div>

            {/* Características destacadas - Diseño mejorado */}
            <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="group relative overflow-hidden rounded-3xl bg-white/15 p-8 backdrop-blur-xl border border-white/25 shadow-xl transition-all duration-500 hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl"
              >
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                
                <div className="relative">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/30 to-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">Alcance Masivo</h3>
                  <p className="text-base leading-relaxed text-white/90">
                    Llega a miles de personas en toda la región con nuestras herramientas de marketing integradas
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="group relative overflow-hidden rounded-3xl bg-white/15 p-8 backdrop-blur-xl border border-white/25 shadow-xl transition-all duration-500 hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                
                <div className="relative">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/30 to-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">100% Seguro</h3>
                  <p className="text-base leading-relaxed text-white/90">
                    Pagos protegidos con cifrado de nivel bancario y códigos QR únicos anti-fraude
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="group relative overflow-hidden rounded-3xl bg-white/15 p-8 backdrop-blur-xl border border-white/25 shadow-xl transition-all duration-500 hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl sm:col-span-2 lg:col-span-1"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                
                <div className="relative">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/30 to-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white">Dashboard en Tiempo Real</h3>
                  <p className="text-base leading-relaxed text-white/90">
                    Estadísticas y reportes instantáneos para optimizar tus eventos y maximizar ingresos
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Botones mejorados con mejor diseño */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
            >
              <Button
                size="lg"
                className="group relative h-16 w-full gap-3 overflow-hidden bg-white font-bold text-blue-600 shadow-2xl transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] sm:w-auto sm:px-12"
              >
                <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
                <span className="text-lg">Crear mi Primer Evento</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group relative h-16 w-full gap-3 border-2 border-white/40 bg-white/10 font-bold text-white backdrop-blur-xl transition-all hover:border-white hover:bg-white hover:text-blue-600 hover:shadow-xl sm:w-auto sm:px-12"
              >
                <Info className="h-6 w-6" />
                <span className="text-lg">Ver Cómo Funciona</span>
              </Button>
            </motion.div>

            {/* Stats mejoradas con mejor diseño */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/25 shadow-2xl"
            >
              <div className="grid grid-cols-3 divide-x divide-white/20">
                <div className="px-6 py-10 text-center sm:px-8 sm:py-12">
                  <div className="mb-3 text-5xl font-extrabold text-white sm:text-6xl lg:text-7xl">
                    <CountUp end={500} suffix="K+" />
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-white/90 sm:text-base">
                    Tickets Vendidos
                  </div>
                </div>
                <div className="px-6 py-10 text-center sm:px-8 sm:py-12">
                  <div className="mb-3 text-5xl font-extrabold text-white sm:text-6xl lg:text-7xl">
                    <CountUp end={15} suffix="K+" />
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-white/90 sm:text-base">
                    Eventos Exitosos
                  </div>
                </div>
                <div className="px-6 py-10 text-center sm:px-8 sm:py-12">
                  <div className="mb-3 text-5xl font-extrabold text-white sm:text-6xl lg:text-7xl">
                    <CountUp end={98} suffix="%" />
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-white/90 sm:text-base">
                    Satisfacción
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
