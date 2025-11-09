import { useRouter } from "../hooks/useRouter";
import { useLanguage } from "../hooks/useLanguage";
import { SEOHead } from "../components/common";
import { Button } from "../components/ui/button";
import logohome from "../assets/images/logohome.svg";
import video1 from "../assets/backgrounds/video1.mp4";
import video2 from "../assets/backgrounds/video2.mp4";
import video3 from "../assets/backgrounds/video3.mp4";
import video4 from "../assets/backgrounds/video4.mp4";
import { useEffect, useRef } from "react";

/**
 * HomePage Component - Página principal basada en el diseño de Figma
 * Implementación exacta del nodo 12:197
 */
export function HomePage() {
  const { navigate } = useRouter();
  const { t } = useLanguage();
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      sectionsRef.current.forEach((section) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          // Animación de aparición al hacer scroll (sin parallax)
          const isVisible = rect.top < windowHeight * 0.8;
          if (isVisible && !section.classList.contains('scroll-visible')) {
            section.classList.add('scroll-visible');
            const content = section.querySelector('.hero-content-front');
            if (content) {
              content.classList.add('scroll-fade-in');
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Llamar una vez al montar

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
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
      <div className="relative w-full min-h-screen bg-black">
        
        {/* Primera Sección - Hero con Video de Fondo */}
        <section 
          ref={(el) => (sectionsRef.current[0] = el)}
          className="relative w-full min-h-screen h-screen overflow-hidden"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="hero-video-background w-full max-w-[1576px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[754px] shrink-0">
              {/* Video de fondo - Solo en tablets y desktop para mejor rendimiento */}
              <video 
                className="hidden sm:block w-full h-full object-cover rounded-[10px] sm:rounded-[15px] md:rounded-[20px] animate-pulse-slow"
                autoPlay 
                loop 
                muted 
                playsInline
                preload="metadata"
                src={video1}
              />
              {/* Fondo degradado para móviles - más liviano */}
              <div className="block sm:hidden w-full h-full rounded-[10px] bg-gradient-to-br from-red-900/20 via-black to-gray-900"></div>
            </div>
            
            {/* Máscara con viñeta oscura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="video-mask-container">
                <div className="video-mask"></div>
              </div>
            </div>
            
            {/* Efecto de partículas brillantes - oculto en móvil */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-float-1 opacity-60"></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-float-2 opacity-40"></div>
              <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-float-3 opacity-50"></div>
              <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full animate-float-1 opacity-30"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal - movido más abajo */}
          <div className="relative z-20 h-full flex items-center justify-center pt-20 sm:pt-24 md:pt-32 lg:pt-40">
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
          ref={(el) => (sectionsRef.current[1] = el)}
          className="relative w-full min-h-screen h-screen overflow-hidden"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="hero-video-background w-full max-w-[1576px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[754px] shrink-0">
              {/* Video de fondo - Solo en tablets y desktop */}
              <video 
                className="hidden sm:block w-full h-full object-cover rounded-[10px] sm:rounded-[15px] md:rounded-[20px] animate-pulse-slow"
                autoPlay 
                loop 
                muted 
                playsInline
                preload="metadata"
                src={video2}
              />
              {/* Fondo degradado para móviles */}
              <div className="block sm:hidden w-full h-full rounded-[10px] bg-gradient-to-br from-blue-900/20 via-black to-gray-900"></div>
            </div>
            
            {/* Máscara con viñeta oscura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="video-mask-container">
                <div className="video-mask"></div>
              </div>
            </div>
            
            {/* Efecto de partículas brillantes - oculto en móvil */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-float-1 opacity-60"></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-float-2 opacity-40"></div>
              <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-float-3 opacity-50"></div>
              <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full animate-float-1 opacity-30"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal (sin logo) */}
          <div className="relative z-20 h-full flex items-center justify-center">
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
          ref={(el) => (sectionsRef.current[2] = el)}
          className="relative w-full min-h-screen h-screen overflow-hidden"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="hero-video-background w-full max-w-[1576px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[754px] shrink-0">
              {/* Video de fondo - Solo en tablets y desktop */}
              <video 
                className="hidden sm:block w-full h-full object-cover rounded-[10px] sm:rounded-[15px] md:rounded-[20px] animate-pulse-slow"
                autoPlay 
                loop 
                muted 
                playsInline
                preload="metadata"
                src={video3}
              />
              {/* Fondo degradado para móviles */}
              <div className="block sm:hidden w-full h-full rounded-[10px] bg-gradient-to-br from-green-900/20 via-black to-gray-900"></div>
            </div>
            
            {/* Máscara con viñeta oscura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="video-mask-container">
                <div className="video-mask"></div>
              </div>
            </div>
            
            {/* Efecto de partículas brillantes - oculto en móvil */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-float-1 opacity-60"></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-float-2 opacity-40"></div>
              <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-float-3 opacity-50"></div>
              <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full animate-float-1 opacity-30"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal (sin logo) */}
          <div className="relative z-20 h-full flex items-center justify-center">
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
          ref={(el) => (sectionsRef.current[3] = el)}
          className="relative w-full min-h-screen h-screen overflow-hidden"
        >
          
          {/* Subsección: Video de fondo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="hero-video-background w-full max-w-[1576px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[754px] shrink-0">
              {/* Video de fondo - Solo en tablets y desktop */}
              <video 
                className="hidden sm:block w-full h-full object-cover rounded-[10px] sm:rounded-[15px] md:rounded-[20px] animate-pulse-slow"
                autoPlay 
                loop 
                muted 
                playsInline
                preload="metadata"
                src={video4}
              />
              {/* Fondo degradado para móviles */}
              <div className="block sm:hidden w-full h-full rounded-[10px] bg-gradient-to-br from-purple-900/20 via-black to-gray-900"></div>
            </div>
            
            {/* Máscara con viñeta oscura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="video-mask-container">
                <div className="video-mask"></div>
              </div>
            </div>
            
            {/* Efecto de partículas brillantes - oculto en móvil */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-float-1 opacity-60"></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-float-2 opacity-40"></div>
              <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-float-3 opacity-50"></div>
              <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full animate-float-1 opacity-30"></div>
            </div>
          </div>
          
          {/* Subsección: Contenido frontal (sin logo) con efectos */}
          <div className="relative z-20 h-full flex items-center justify-center">
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
