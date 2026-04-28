import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, DollarSign } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';
import { useFeaturedEvents, type Event } from '../../hooks/useEvents';

export function PromoSlider() {
  const { data: featuredEvents = [], isLoading } = useFeaturedEvents();
  const slides: Event[] = featuredEvents;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(isAutoPlaying);
  const { navigate } = useRouter();

  autoPlayRef.current = isAutoPlaying;

  useEffect(() => {
    if (currentSlide >= slides.length) setCurrentSlide(0);
  }, [slides.length, currentSlide]);

  const goTo = useCallback((next: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setPreviousSlide(currentSlide);
    setCurrentSlide(next);
    setTimeout(() => {
      setPreviousSlide(null);
      setIsTransitioning(false);
    }, 800);
  }, [currentSlide, isTransitioning]);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const id = setInterval(() => {
      if (!autoPlayRef.current) return;
      goTo((currentSlide + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [isAutoPlaying, currentSlide, goTo, slides.length]);

  if (isLoading || slides.length === 0) return null;

  const current = slides[currentSlide];
  if (!current) return null;

  const nextSlide = () => {
    setIsAutoPlaying(false);
    goTo((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    goTo((currentSlide - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    setIsAutoPlaying(false);
    goTo(index);
  };

  const handleViewEvent = (slide: Event) => {
    navigate('event-detail', { id: slide.id });
  };

  return (
    <div className="relative w-full h-[280px] min-[375px]:h-[320px] sm:h-[360px] md:h-[420px] lg:h-[480px] overflow-hidden rounded-lg min-[375px]:rounded-xl sm:rounded-2xl shadow-2xl mb-4 min-[375px]:mb-6 sm:mb-8 md:mb-10">

      {slides.map((slide, i) => {
        const isActive = i === currentSlide;
        const isLeaving = i === previousSlide;
        const heroImage = slide.imageSlider || slide.imageDetail || slide.image;
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
              src={heroImage}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
          </div>
        );
      })}

      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-full px-3 min-[375px]:px-4 sm:px-6 md:px-8 lg:px-12">
          <div
            key={currentSlide}
            className="max-w-[280px] min-[375px]:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl animate-[fadeSlideIn_600ms_ease-out_both]"
          >
            <h2 className="text-base min-[375px]:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1.5 min-[375px]:mb-2 sm:mb-3 leading-tight drop-shadow-2xl">
              {current.title}
            </h2>

            <div className="space-y-1 min-[375px]:space-y-1.5 sm:space-y-2 md:space-y-2.5 mb-2.5 min-[375px]:mb-3 sm:mb-4 md:mb-5">
              <div className="flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5 md:gap-3 text-white">
                <Calendar className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0" />
                <span className="text-[10px] min-[375px]:text-xs sm:text-sm md:text-base font-medium drop-shadow-md leading-tight">
                  {current.date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5 md:gap-3 text-white">
                <MapPin className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0" />
                <span className="text-[10px] min-[375px]:text-xs sm:text-sm md:text-base font-medium drop-shadow-md leading-tight">
                  {current.location}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5 md:gap-3 text-white">
                <DollarSign className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400 flex-shrink-0" />
                <span className="text-base min-[375px]:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-400 drop-shadow-lg">
                  {current.price}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleViewEvent(current)}
              className="bg-black hover:bg-gray-900 text-white px-3 min-[375px]:px-4 sm:px-6 md:px-8 py-2 min-[375px]:py-2.5 sm:py-3 md:py-3.5 rounded-full font-bold text-[10px] min-[375px]:text-xs sm:text-sm md:text-base shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 leading-tight border-2 border-white"
            >
              Ver Evento y Comprar Boletos
            </button>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
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

          <div className="absolute bottom-3 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-2.5 md:gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative h-1.5 sm:h-2 md:h-2 rounded-full overflow-hidden transition-all duration-500 ease-out"
                style={{
                  width: index === currentSlide ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 28 : 40) : (typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 10),
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

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
