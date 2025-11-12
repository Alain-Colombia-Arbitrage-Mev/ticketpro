import { useEffect, useRef } from "react";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { SEOHead } from "../components/common";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Shield } from "lucide-react";
import logohome from "../assets/images/logohome.svg";
import video1 from "../assets/backgrounds/video1.mp4";
import video2 from "../assets/backgrounds/video2.mp4";
import video3 from "../assets/backgrounds/video3.mp4";
import video4 from "../assets/backgrounds/video4.mp4";

/**
 * HomePage Component - Página principal basada en el diseño de Figma
 * Implementación exacta del nodo 12:197
 */
export function HomePage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const video4Ref = useRef<HTMLVideoElement>(null);

  // Verificación estricta del rol para mostrar el banner
  const isHosterOrAdmin = user && 
    user.role && 
    typeof user.role === 'string' && 
    (user.role === 'hoster' || user.role === 'admin');

  // Debug: solo loguear en desarrollo
  if (import.meta.env.DEV && user) {
    console.log('🔍 HomePage - Usuario:', user.email, 'Rol:', user.role, 'isHosterOrAdmin:', isHosterOrAdmin);
  }

  // Lazy load videos cuando están cerca de ser visibles
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '200px', // Cargar cuando está a 200px de ser visible
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLVideoElement) {
          const video = entry.target;
          if (video.readyState === 0) { // Si aún no se ha cargado
            video.load();
          }
          observer.unobserve(video);
        }
      });
    }, observerOptions);

    if (video2Ref.current) observer.observe(video2Ref.current);
    if (video3Ref.current) observer.observe(video3Ref.current);
    if (video4Ref.current) observer.observe(video4Ref.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Banner informativo para usuarios hoster/admin */}
      {isHosterOrAdmin && (
        <div className="fixed top-24 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-500">
          <Card className="!bg-red-900/20 border-red-500/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-400 animate-pulse" />
                  <div>
                    <p className="font-medium text-red-300">Panel de Validación Disponible</p>
                    <p className="text-sm text-red-400/80">Como {user.role}, puedes validar entradas rápidamente</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("hoster-validate")}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25"
                >
                  Validar Ahora ⚡
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <SEOHead
        seo={{
          title: "vetlix.com - Tu plataforma de eventos y boletos",
          description: "Descubre y compra boletos para los mejores eventos: conciertos, deportes, teatro, comedia y más. Miles de eventos disponibles con compra segura y rápida.",
          keywords: "eventos, boletos, conciertos, deportes, teatro, tickets, compra online",
          url: typeof window !== 'undefined' ? window.location.origin : undefined,
          type: "website",
        }}
      />
      
      {/* Container principal */}
      <div className="relative w-full min-h-screen bg-black overflow-x-hidden">
        
        {/* Primera Sección - Hero con Video de Fondo */}
        <section 
          className="relative w-full min-h-screen h-screen overflow-hidden bg-black"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0">
            {/* Video de fondo - ocupa toda la pantalla */}
            <video 
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline
              preload="metadata"
              src={video1}
            />
            
            {/* Máscara con viñeta oscura - óvalo transparente en centro */}
            <div className="video-mask-container">
              <div className="video-mask"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal */}
          <div className="relative z-30 h-full flex items-center justify-center">
            <div className="hero-content-front flex flex-col items-center w-full max-w-[1502px] px-4 sm:px-6 md:px-8 gap-4 sm:gap-6 md:gap-8">
              
              {/* Logo - responsive */}
              <div className="w-[180px] h-[86px] sm:w-[220px] sm:h-[105px] md:w-[260px] md:h-[125px] lg:w-[296px] lg:h-[142px] shrink-0 animate-fade-in-up">
              <img 
                src={logohome} 
                alt="vetlix.com" 
                  className="w-full h-full object-contain"
              />
            </div>
            
              {/* Grupo de textos con efectos - responsive */}
              <div className="text-center text-white shrink-0 animate-fade-in-up px-4">
                {/* Título con efecto de brillo */}
                <h1 className="font-germania text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-tight sm:leading-normal mb-2 sm:mb-0 hover:scale-105 transition-transform duration-500 hover:text-shadow-glow">
                  {t('home.hero.title')}
              </h1>
                
                {/* Subtítulo con efecto sutil */}
                <p className="font-montserrat font-semibold text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-snug sm:leading-normal opacity-90 hover:opacity-100 transition-opacity duration-300">
                  {t('home.hero.subtitle')}
              </p>
            </div>
            
              {/* Botón Ver más con efecto de pulso - responsive */}
              <div className="shrink-0 animate-pulse-button">
                <Button
                  variant="glass"
                  className="h-12 w-[180px] sm:h-12 sm:w-[190px] md:h-14 md:w-[216px] px-6 sm:px-7 md:px-9 rounded-[31px] hover:scale-110 transition-all duration-300 text-[16px] sm:text-[18px] md:text-[20px]"
              onClick={() => navigate("events")}
            >
                  {t('home.hero.button')}
                </Button>
              </div>
              
            </div>
          </div>
          
        </section>
        
        {/* Segunda Sección - Sin Logo */}
        <section 
          className="relative w-full min-h-screen h-screen overflow-hidden bg-black"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0">
            {/* Video de fondo - ocupa toda la pantalla */}
            <video 
              ref={video2Ref}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline
              preload="none"
              src={video2}
            />
            
            {/* Máscara con viñeta oscura - óvalo transparente en centro */}
            <div className="video-mask-container">
              <div className="video-mask"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal (sin logo) */}
          <div className="relative z-30 h-full flex items-center justify-center">
            <div className="hero-content-front flex flex-col items-center w-full max-w-[1502px] px-4 sm:px-6 md:px-8 gap-4 sm:gap-6 md:gap-8">
              
              {/* Grupo de textos con efectos - responsive */}
              <div className="text-center text-white shrink-0 animate-fade-in-up px-4">
                {/* Título con efecto de brillo */}
                <h1 className="font-germania text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-tight sm:leading-normal mb-2 sm:mb-0 hover:scale-105 transition-transform duration-500 hover:text-shadow-glow">
                  {t('home.section2.title')}
                </h1>
                
                {/* Subtítulo con efecto sutil */}
                <p className="font-montserrat font-semibold text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-snug sm:leading-normal opacity-90 hover:opacity-100 transition-opacity duration-300">
                  {t('home.section2.subtitle')}
                </p>
                </div>
              
              {/* Botón Ver más con efecto de pulso - responsive */}
              <div className="shrink-0 animate-pulse-button">
                <Button
                  variant="glass"
                  className="h-12 w-[180px] sm:h-12 sm:w-[190px] md:h-14 md:w-[216px] px-6 sm:px-7 md:px-9 rounded-[31px] hover:scale-110 transition-all duration-300 text-[16px] sm:text-[18px] md:text-[20px]"
                  onClick={() => navigate("events")}
                >
                  {t('home.hero.button')}
                </Button>
              </div>
              
            </div>
          </div>
          
        </section>

        {/* Tercera Sección - Sin Logo */}
        <section 
          className="relative w-full min-h-screen h-screen overflow-hidden bg-black"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0">
            {/* Video de fondo - ocupa toda la pantalla */}
            <video 
              ref={video3Ref}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline
              preload="none"
              src={video3}
            />
            
            {/* Máscara con viñeta oscura - óvalo transparente en centro */}
            <div className="video-mask-container">
              <div className="video-mask"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal (sin logo) */}
          <div className="relative z-30 h-full flex items-center justify-center">
            <div className="hero-content-front flex flex-col items-center w-full max-w-[1502px] px-4 sm:px-6 md:px-8 gap-4 sm:gap-6 md:gap-8">
              
              {/* Grupo de textos con efectos - responsive */}
              <div className="text-center text-white shrink-0 animate-fade-in-up px-4">
                {/* Título con efecto de brillo */}
                <h1 className="font-germania text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-tight sm:leading-normal mb-2 sm:mb-0 hover:scale-105 transition-transform duration-500 hover:text-shadow-glow">
                  {t('home.section3.title')}
                </h1>
                
                {/* Subtítulo con efecto sutil */}
                <p className="font-montserrat font-semibold text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-snug sm:leading-normal opacity-90 hover:opacity-100 transition-opacity duration-300">
                  {t('home.section3.subtitle')}
                </p>
                </div>
              
              {/* Botón Ver más con efecto de pulso - responsive */}
              <div className="shrink-0 animate-pulse-button">
                <Button
                  variant="glass"
                  className="h-12 w-[180px] sm:h-12 sm:w-[190px] md:h-14 md:w-[216px] px-6 sm:px-7 md:px-9 rounded-[31px] hover:scale-110 transition-all duration-300 text-[16px] sm:text-[18px] md:text-[20px]"
                  onClick={() => navigate("events")}
                >
                  {t('home.hero.button')}
                </Button>
              </div>
              
            </div>
          </div>
          
        </section>
            
        {/* Cuarta Sección - Sin Logo con Efectos */}
        <section 
          className="relative w-full min-h-screen h-screen overflow-hidden bg-black"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0">
            {/* Video de fondo - ocupa toda la pantalla */}
            <video 
              ref={video4Ref}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline
              preload="none"
              src={video4}
            />
            
            {/* Máscara con viñeta oscura - óvalo transparente en centro */}
            <div className="video-mask-container">
              <div className="video-mask"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal (sin logo) con efectos */}
          <div className="relative z-30 h-full flex items-center justify-center">
            <div className="hero-content-front flex flex-col items-center w-full max-w-[1502px] px-4 sm:px-6 md:px-8 gap-4 sm:gap-6 md:gap-8">
              
              {/* Grupo de textos con efectos - responsive */}
              <div className="text-center text-white shrink-0 animate-fade-in-up px-4">
                {/* Título con efecto de brillo */}
                <h1 className="font-germania text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-tight sm:leading-normal mb-2 sm:mb-0 hover:scale-105 transition-transform duration-500 hover:text-shadow-glow">
                  {t('home.section4.title')}
                </h1>
                
                {/* Subtítulo con efecto sutil */}
                <p className="font-montserrat font-semibold text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-snug sm:leading-normal opacity-90 hover:opacity-100 transition-opacity duration-300">
                  {t('home.section4.subtitle')}
                </p>
              </div>
              
              {/* Botón Ver más con efecto de pulso - responsive */}
              <div className="shrink-0 animate-pulse-button">
                <Button
                  variant="glass"
                  className="h-12 w-[180px] sm:h-12 sm:w-[190px] md:h-14 md:w-[216px] px-6 sm:px-7 md:px-9 rounded-[31px] hover:scale-110 transition-all duration-300 text-[16px] sm:text-[18px] md:text-[20px]"
                onClick={() => navigate("events")}
              >
                  {t('home.hero.button')}
                </Button>
              </div>
              
            </div>
          </div>
          
          </section>
        
      </div>
    </>
  );
}
