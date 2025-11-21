import { useState, useEffect } from 'react';
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
    image: '/images/events/navidadHorizontal.jpg',
    title: 'NAVIDAD VICION POWER',
    subtitle: 'Participa en la rifa de 3 automóviles',
    date: 'Sábado 13 de Diciembre, 6:00 PM - 1:00 AM',
    location: 'Fox Theater, San Bernardino, CA',
    price: '$50 USD',
    promo: '🎁 ¡Gana 1 de 3 automóviles!',
    eventId: 21, // ID del evento premium en la BD
  },
];

export function PromoSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { navigate } = useRouter();

  // Auto-play del slider
  useEffect(() => {
    if (!isAutoPlaying || promoSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const handleViewEvent = (slide: PromoSlide) => {
    if (slide.eventId) {
      // Navegar directamente al detalle del evento
      navigate('event-detail', {
        id: slide.eventId,
        title: slide.title,
        date: '13 de Diciembre, 2025',
        location: slide.location,
        price: slide.price,
        image: '/images/events/navidadHorizontal.jpg',
        category: 'Concierto',
        featured: true,
        trending: true,
        soldOut: false,
        lastTickets: false,
      });
    } else {
      navigate('all-events');
    }
  };

  const currentPromo = promoSlides[currentSlide];

  return (
    <div className="relative w-full h-[280px] min-[375px]:h-[320px] sm:h-[360px] md:h-[420px] lg:h-[480px] overflow-hidden rounded-lg min-[375px]:rounded-xl sm:rounded-2xl shadow-2xl mb-4 min-[375px]:mb-6 sm:mb-8 md:mb-10 group">
      {/* Imagen de fondo con overlay */}
      <div className="absolute inset-0 transition-opacity duration-700">
        <img
          src={currentPromo.image}
          alt={currentPromo.title}
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40"></div>
      </div>

      {/* Contenido del slide */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-3 min-[375px]:px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-[280px] min-[375px]:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
            {/* Etiqueta de promoción */}
            {currentPromo.promo && (
              <div className="inline-flex items-center gap-1.5 min-[375px]:gap-2 bg-gradient-to-r from-[#c61619] to-red-700 text-white px-2.5 min-[375px]:px-3 sm:px-4 md:px-5 py-1 min-[375px]:py-1.5 sm:py-2 rounded-full mb-2 min-[375px]:mb-3 sm:mb-4 animate-pulse shadow-lg">
                <Gift className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                <span className="text-[10px] min-[375px]:text-xs sm:text-sm md:text-base font-bold tracking-wide leading-tight">
                  {currentPromo.promo}
                </span>
              </div>
            )}

            {/* Título - Ajustado para iPhone 5 */}
            <h2 className="text-base min-[375px]:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1.5 min-[375px]:mb-2 sm:mb-3 leading-tight drop-shadow-2xl">
              {currentPromo.title}
            </h2>

            {/* Subtítulo */}
            <p className="text-xs min-[375px]:text-sm sm:text-base md:text-lg lg:text-xl text-yellow-400 mb-2 min-[375px]:mb-3 sm:mb-4 md:mb-5 font-semibold drop-shadow-lg leading-tight">
              {currentPromo.subtitle}
            </p>

            {/* Información del evento - Compacta */}
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

            {/* Botón CTA - Responsive con fondo negro */}
            <button
              onClick={() => handleViewEvent(currentPromo)}
              className="bg-black hover:bg-gray-900 text-white px-3 min-[375px]:px-4 sm:px-6 md:px-8 py-2 min-[375px]:py-2.5 sm:py-3 md:py-3.5 rounded-full font-bold text-[10px] min-[375px]:text-xs sm:text-sm md:text-base shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 leading-tight border-2 border-white"
            >
              Ver Evento y Comprar Boletos
            </button>
          </div>
        </div>
      </div>

      {/* Controles del slider - Solo si hay más de 1 slide */}
      {promoSlides.length > 1 && (
        <>
          {/* Botones Anterior/Siguiente */}
          <button
            onClick={prevSlide}
            className="absolute left-1 min-[375px]:left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 min-[375px]:p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-1 min-[375px]:right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 min-[375px]:p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>

          {/* Indicadores de slide */}
          <div className="absolute bottom-2 min-[375px]:bottom-3 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 min-[375px]:gap-2 sm:gap-2.5 md:gap-3">
            {promoSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 min-[375px]:h-2 sm:h-2.5 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-6 min-[375px]:w-8 sm:w-10 md:w-12 bg-yellow-400'
                    : 'w-1.5 min-[375px]:w-2 sm:w-2.5 md:w-3 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Badge de "NUEVO" */}
      <div className="absolute top-2 min-[375px]:top-3 sm:top-4 md:top-5 right-2 min-[375px]:right-3 sm:right-4 md:right-5 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-2 min-[375px]:px-2.5 sm:px-3 md:px-4 py-1 min-[375px]:py-1.5 sm:py-1.5 md:py-2 rounded-full font-bold text-[9px] min-[375px]:text-[10px] sm:text-xs md:text-sm shadow-xl animate-bounce">
        🎄 NUEVO
      </div>
    </div>
  );
}
