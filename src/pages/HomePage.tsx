import { EventCard, CategoryCard } from "../components/events";
import { Button } from "../components/ui/button";
import { UnifiedSearchBar } from "../components/search";
import { Search, Music, Trophy, Theater, Heart, Sparkles, TrendingUp, Palette, Laugh, Users, Shield, BarChart3, Plus, Info, Ticket as TicketIcon, Star, CalendarDays } from "lucide-react";
import { useRouter } from "../hooks/useRouter";
import { useLanguage } from "../hooks/useLanguage";
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
  const { t } = useLanguage();
  
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
      title: t('category.concerts'),
      icon: Music,
      count: mockEvents.filter(e => e.category === "Concierto").length.toString(),
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
    },
    {
      title: t('category.sports'),
      icon: Trophy,
      count: mockEvents.filter(e => e.category === "Deportes").length.toString(),
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
    },
    {
      title: t('category.theater'),
      icon: Theater,
      count: mockEvents.filter(e => e.category === "Teatro").length.toString(),
      gradient: "bg-gradient-to-br from-red-500 to-orange-500",
    },
    {
      title: t('category.family'),
      icon: Heart,
      count: mockEvents.filter(e => e.category === "Familia").length.toString(),
      gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
    },
    {
      title: t('category.art'),
      icon: Palette,
      count: mockEvents.filter(e => e.category === "Arte").length.toString(),
      gradient: "bg-gradient-to-br from-amber-500 to-yellow-500",
    },
    {
      title: t('category.comedy'),
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
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 dark:bg-white/10 backdrop-blur-xl px-4 py-2 text-sm shadow-lg shadow-white/20 sm:mb-8 transition-all duration-300 hover:bg-white/30 hover:scale-105"
            >
              <Sparkles className="h-4 w-4 flex-shrink-0 text-yellow-300 dark:text-yellow-400 animate-pulse" />
              <span className="font-medium text-white drop-shadow-lg">{t('home.events.badge')}</span>
            </motion.div>
            
            {/* Título principal */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-2xl"
              >
                {t('hero.title')}
              </motion.h1>
              
              {/* Descripción */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8 px-4 text-lg text-white/95 dark:text-white/90 sm:mb-10 sm:text-xl drop-shadow-lg"
              >
                {t('hero.subtitle')}
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
                  placeholder={t('hero.search.placeholder')}
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
                <p className="text-gray-600 dark:text-gray-400">{t('home.stats.tickets')}</p>
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
                <p className="text-gray-600 dark:text-gray-400">{t('page.events.available')}</p>
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
          <h2 className="mb-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent sm:text-4xl">
            {t('home.categories.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('home.categories.subtitle')}</p>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-110">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent sm:text-4xl">
                {t('page.events.featured')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{t('home.featured.subtitle')}</p>
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
            <h2 className="mb-3 text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent sm:text-4xl">
              {t('page.events.upcoming')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('home.upcoming.subtitle')}</p>
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
              {t('page.events.view_all')}
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Para Organizadores */}
      {/* Regla 60-30-10: 60% fondo azul (dominante), 30% cards blancas (secundario), 10% botones primarios (acento) */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-20 sm:py-28">
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Header - 60% fondo azul */}
            <div className="mb-12 text-center sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {t('page.organizers.badge')}
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl"
              >
                {t('page.organizers.title')}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg"
              >
                {t('page.organizers.subtitle')}
              </motion.p>
            </div>

            {/* Features Grid - 30% cards blancas (secundario) */}
            <div className="mb-12 grid gap-4 sm:grid-cols-3 sm:gap-6">
              {[
                { icon: Users, title: "Alcance Masivo", description: "Llega a miles de personas con nuestras herramientas de marketing" },
                { icon: Shield, title: "100% Seguro", description: "Pagos protegidos y códigos QR únicos anti-fraude" },
                { icon: BarChart3, title: "Dashboard Real-time", description: "Estadísticas y reportes instantáneos para optimizar tus eventos" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="group rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] hover:border-blue-200"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:scale-110 group-hover:shadow-lg">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* CTAs - 10% botones primarios (acento) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 font-semibold text-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 sm:w-auto sm:px-8"
              >
                <Plus className="h-5 w-5" />
                {t('page.organizers.create_event')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-2 border-white bg-white/10 font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-white hover:bg-white hover:text-blue-600 hover:shadow-lg hover:scale-105 sm:w-auto sm:px-8"
              >
                <Info className="h-5 w-5" />
                {t('page.organizers.how_it_works')}
              </Button>
            </motion.div>

            {/* Stats - 30% card blanca (secundario) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="grid grid-cols-3 gap-4 divide-x divide-gray-200">
                <div className="text-center">
                  <div className="mb-1 text-3xl font-bold text-gray-900 sm:text-4xl">
                    <CountUp end={500} suffix="K+" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 sm:text-sm">{t('page.organizers.stats.tickets')}</div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-3xl font-bold text-gray-900 sm:text-4xl">
                    <CountUp end={15} suffix="K+" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 sm:text-sm">{t('page.organizers.stats.events')}</div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-3xl font-bold text-gray-900 sm:text-4xl">
                    <CountUp end={98} suffix="%" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 sm:text-sm">{t('page.organizers.stats.satisfaction')}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
