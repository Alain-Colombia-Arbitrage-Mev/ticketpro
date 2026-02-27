import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, DollarSign, Gift } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';

interface PromoSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  date: string;
  location: string;
  price: string;
  promo?: string;
  eventId?: number;
}

const promoSlides: PromoSlide[] = [
  {
    id: 1,
    image: '/images/events/SALINAS 2.png',
    title: 'Open Salinas California - Conferencia Vicion Power',
    subtitle: 'Puertas abren: 5:00 PM | Inicio: 5:30 PM',
    date: 'Sábado 14 de Marzo, 2026',
    location: '940 N Main ST, Salinas, CA 93906',
    price: '$20 USD',
    promo: '¡Solo 500 entradas disponibles!',
    eventId: 9999,
  },
  {
    id: 2,
    image: '/images/events/SALINAS 3.png',
    title: 'Open Salinas California - Conferencia Vicion Power',
    subtitle: 'Puertas abren: 5:00 PM | Inicio: 5:30 PM',
    date: 'Sábado 14 de Marzo, 2026',
    location: '940 N Main ST, Salinas, CA 93906',
    price: '$20 USD',
    promo: 'Anuncio Importante',
    eventId: 9999,
  },
  {
    id: 3,
    image: '/images/events/SALINAS 4.png',
    title: 'Open Salinas California - Conferencia Vicion Power',
    subtitle: 'Puertas abren: 5:00 PM | Inicio: 5:30 PM',
    date: 'Sábado 14 de Marzo, 2026',
    location: '940 N Main ST, Salinas, CA 93906',
    price: '$20 USD',
    promo: 'Vicion Power',
    eventId: 9999,
  },
];

export function PromoSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(isAutoPlaying);
  const { navigate } = useRouter();

  autoPlayRef.current = isAutoPlaying;

  const goTo = useCallback((next: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setPreviousSlide(currentSlide);
    setCurrentSlide(next);
    // Allow the CSS transition to finish before clearing
    setTimeout(() => {
      setPreviousSlide(null);
      setIsTransitioning(false);
    }, 800);
  }, [currentSlide, isTransitioning]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || promoSlides.length <= 1) return;
    const id = setInterval(() => {
      if (!autoPlayRef.current) return;
      goTo((currentSlide + 1) % promoSlides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [isAutoPlaying, currentSlide, goTo]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    goTo((currentSlide + 1) % promoSlides.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    goTo((currentSlide - 1 + promoSlides.length) % promoSlides.length);
  };

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    setIsAutoPlaying(false);
    goTo(index);
  };

  const handleViewEvent = (slide: PromoSlide) => {
    if (slide.eventId) {
      navigate('event-detail', { id: slide.eventId });
    } else {
      navigate('all-events');
    }
  };

  const currentPromo = promoSlides[currentSlide];

  return (
    <div className="relative w-full h-[280px] min-[375px]:h-[320px] sm:h-[360px] md:h-[420px] lg:h-[480px] overflow-hidden rounded-lg min-[375px]:rounded-xl sm:rounded-2xl shadow-2xl mb-4 min-[375px]:mb-6 sm:mb-8 md:mb-10">

      {/* ── Image layers (crossfade) ── */}
      {promoSlides.map((slide, i) => {
        const isActive = i === currentSlide;
        const isLeaving = i === previousSlide;
        return (
          <div
            key={slide.id}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : isLeaving ? 0 : 0,
              transition: 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: isActive ? 2 : isLeaving ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
          </div>
        );
      })}

      {/* ── Content (text + CTA) ── */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-full px-3 min-[375px]:px-4 sm:px-6 md:px-8 lg:px-12">
          <div
            key={currentSlide}
            className="max-w-[280px] min-[375px]:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl animate-[fadeSlideIn_600ms_ease-out_both]"
          >
            {/* Promo badge */}
            {currentPromo.promo && (
              <div className="inline-flex items-center gap-1.5 min-[375px]:gap-2 bg-gradient-to-r from-[#c61619] to-red-700 text-white px-2.5 min-[375px]:px-3 sm:px-4 md:px-5 py-1 min-[375px]:py-1.5 sm:py-2 rounded-full mb-2 min-[375px]:mb-3 sm:mb-4 shadow-lg">
                <Gift className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                <span className="text-[10px] min-[375px]:text-xs sm:text-sm md:text-base font-bold tracking-wide leading-tight">
                  {currentPromo.promo}
                </span>
              </div>
            )}

            {/* Title */}
            <h2 className="text-base min-[375px]:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1.5 min-[375px]:mb-2 sm:mb-3 leading-tight drop-shadow-2xl">
              {currentPromo.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs min-[375px]:text-sm sm:text-base md:text-lg lg:text-xl text-yellow-400 mb-2 min-[375px]:mb-3 sm:mb-4 md:mb-5 font-semibold drop-shadow-lg leading-tight">
              {currentPromo.subtitle}
            </p>

            {/* Event info */}
            <div className="space-y-1 min-[375px]:space-y-1.5 sm:space-y-2 md:space-y-2.5 mb-2.5 min-[375px]:mb-3 sm:mb-4 md:mb-5">
              <div className="flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5 md:gap-3 text-white">
                <Calendar className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0" />
                <span className="text-[10px] min-[375px]:text-xs sm:text-sm md:text-base font-medium drop-shadow-md leading-tight">
                  {currentPromo.date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5 md:gap-3 text-white">
                <MapPin className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0" />
                <span className="text-[10px] min-[375px]:text-xs sm:text-sm md:text-base font-medium drop-shadow-md leading-tight">
                  {currentPromo.location}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5 md:gap-3 text-white">
                <DollarSign className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0" />
                <span className="text-base min-[375px]:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-400 drop-shadow-lg">
                  {currentPromo.price}
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => handleViewEvent(currentPromo)}
              className="bg-black hover:bg-gray-900 text-white px-3 min-[375px]:px-4 sm:px-6 md:px-8 py-2 min-[375px]:py-2.5 sm:py-3 md:py-3.5 rounded-full font-bold text-[10px] min-[375px]:text-xs sm:text-sm md:text-base shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 leading-tight border-2 border-white"
            >
              Ver Evento y Comprar Boletos
            </button>
          </div>
        </div>
      </div>

      {/* ── Arrow controls (always visible, subtle) ── */}
      {promoSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 active:bg-white/35 text-white p-2 sm:p-2.5 md:p-3 rounded-full transition-colors duration-200 backdrop-blur-md border border-white/15"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 active:bg-white/35 text-white p-2 sm:p-2.5 md:p-3 rounded-full transition-colors duration-200 backdrop-blur-md border border-white/15"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>

          {/* Dot indicators with progress bar */}
          <div className="absolute bottom-3 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-2.5 md:gap-3">
            {promoSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative h-1.5 sm:h-2 md:h-2 rounded-full overflow-hidden transition-all duration-500 ease-out"
                style={{
                  width: index === currentSlide ? (window.innerWidth < 640 ? 28 : 40) : (window.innerWidth < 640 ? 8 : 10),
                  backgroundColor: index === currentSlide ? 'transparent' : 'rgba(255,255,255,0.4)',
                }}
                aria-label={`Ir al slide ${index + 1}`}
              >
                {index === currentSlide && (
                  <>
                    <div className="absolute inset-0 bg-white/30 rounded-full" />
                    <div
                      className="absolute inset-y-0 left-0 bg-yellow-400 rounded-full"
                      style={{
                        animation: isAutoPlaying ? 'progressFill 6s linear forwards' : 'none',
                        width: isAutoPlaying ? undefined : '100%',
                      }}
                    />
                  </>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Badge */}
      <div className="absolute top-2 min-[375px]:top-3 sm:top-4 md:top-5 right-2 min-[375px]:right-3 sm:right-4 md:right-5 z-20 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-2 min-[375px]:px-2.5 sm:px-3 md:px-4 py-1 min-[375px]:py-1.5 sm:py-1.5 md:py-2 rounded-full font-bold text-[9px] min-[375px]:text-[10px] sm:text-xs md:text-sm shadow-xl">
        NUEVO
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
