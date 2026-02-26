import React from "react";
import { Calendar, MapPin, Clock, Users, Share2, Heart, ChevronLeft, Ticket, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { ImageWithFallback } from "../components/media";
import { useRouter } from "../hooks/useRouter";
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../hooks/useAuth";
import { useCartStore } from "../stores/cartStore";
import { SEOHead } from "../components/common";
import { saveLoginReturn } from "../utils/loginReturn";
import { useEvent } from "../hooks/useEvents";

export function EventDetailPage() {
  const { navigate, pageData } = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCartStore();

  // Solo necesitamos el ID de la URL
  const eventId = pageData?.id ? (typeof pageData.id === 'string' ? parseInt(pageData.id) : pageData.id) : null;

  // Cargar datos del evento desde cache/BD
  const { data: eventData, isLoading, error } = useEvent(eventId ?? 0);

  // Todos los hooks ANTES de cualquier return condicional
  const [selectedTicketType, setSelectedTicketType] = React.useState<number | null>(1);

  if (!eventId) {
    navigate("home");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    navigate("home");
    return null;
  }

  const isPriorityEvent = eventId === 9999;

  // Parsear fecha del evento para formato ISO
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
        return `${year}-${monthNum}-${day.padStart(2, '0')}T20:00:00-06:00`;
      }
    }
    return new Date().toISOString();
  };

  const eventDateISO = parseDate(eventData.date);

  // Extraer precio del formato "$50 USD" -> "50"
  const extractPrice = (priceStr: string | undefined): string => {
    if (!priceStr) return '0';
    const match = priceStr.match(/[\d,]+/);
    return match ? match[0].replace(/,/g, '') : '0';
  };

  const ticketTypes = [
    {
      id: 1,
      name: "Entrada General",
      price: extractPrice(eventData.price),
      benefits: [
        "Acceso al evento",
        "Entrada digital por correo",
        "PIN de seguridad único",
        "Válido para una persona"
      ]
    },
  ];

  const handleTicketSelection = (ticketId: number) => {
    setSelectedTicketType(ticketId);
  };

  const handleAddToCart = () => {
    if (!user) {
      saveLoginReturn("event-detail", { id: eventId });
      navigate("login");
      return;
    }

    const selectedTicket = ticketTypes.find(t => t.id === selectedTicketType);
    if (selectedTicket) {
      const ticketPrice = parseInt(selectedTicket.price.replace(/[^0-9]/g, ""));

      addItem({
        eventId: eventData.id,
        eventName: eventData.title,
        eventDate: eventDateISO.split('T')[0],
        eventTime: undefined,
        eventLocation: eventData.location,
        eventImage: eventData.image,
        ticketType: selectedTicket.name,
        ticketPrice: ticketPrice,
        quantity: 1,
        seatNumber: undefined,
        seatType: undefined,
        ticketCategoryId: undefined,
      });

      // Opcional: Mostrar notificación o navegar al carrito
      navigate("cart");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <SEOHead
        seo={{
          title: `${eventData.title} - vetlix.com`,
          description: `Compra boletos para ${eventData.title}. ${eventData.date} en ${eventData.location}. ${eventData.category}. Precio desde ${eventData.price}. No te lo pierdas, compra tus tickets ahora.`,
          keywords: `${eventData.title}, ${eventData.category}, eventos ${eventData.location}, boletos ${eventData.location}, ${eventData.date}`,
          image: eventData.image,
          url: typeof window !== 'undefined' ? `${window.location.origin}#event-detail?id=${eventId}` : undefined,
          type: "event",
          event: {
            name: eventData.title,
            startDate: eventDateISO,
            location: {
              name: eventData.location,
              address: eventData.location,
            },
            price: eventData.price,
            image: eventData.image,
          },
        }}
      />
      {/* Back Button */}
      <div className="border-b border-white/20 bg-black">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="gap-2 rounded-lg font-medium !text-white hover:!bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 !text-white" />
            {t('event.detail.back')}
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-56 w-full overflow-hidden sm:h-80 md:h-96 lg:h-[32rem]">
        <ImageWithFallback
          src={isPriorityEvent ? "/images/events/SALINAS 3.png" : eventData.image}
          alt={eventData.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Actions Overlay */}
        <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
          <Button size="icon" variant="secondary" className="rounded-xl !bg-black/80 !text-white shadow-lg backdrop-blur-sm hover:!bg-black/90 border border-white/20">
            <Share2 className="h-4 w-4 !text-white" />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-xl !bg-black/80 !text-white shadow-lg backdrop-blur-sm hover:!bg-black/90 border border-white/20">
            <Heart className="h-4 w-4 !text-white" />
          </Button>
        </div>

        {eventData.featured && (
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
            <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 font-medium shadow-lg">
              ⭐ Destacado
            </Badge>
          </div>
        )}
      </div>

      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:py-8 lg:px-8">
        <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-4 sm:mb-6 md:mb-8">
              <Badge className="mb-2 sm:mb-3 md:mb-4 border-0 !bg-[#c61619] hover:!bg-[#a01316] font-bold !text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 shadow-md transition-all uppercase tracking-wider">
                {t(`category.${eventData.category.toLowerCase()}`)}
              </Badge>
              <h1 className="mb-3 sm:mb-4 md:mb-6 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight tracking-tight !text-white">
                {t(`event.title.${eventId}`) !== `event.title.${eventId}` ? t(`event.title.${eventId}`) : eventData.title}
              </h1>
              
              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-5 !text-white/80">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg sm:rounded-xl !bg-white/10">
                    <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 !text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium !text-white/60">{t('event.detail.date')}</p>
                    <p className="text-xs sm:text-sm md:text-base font-medium !text-white">{eventData.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg sm:rounded-xl !bg-white/10">
                    <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 !text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium !text-white/60">{t('event.detail.time')}</p>
                    <p className="text-xs sm:text-sm md:text-base font-medium !text-white">8:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg sm:rounded-xl !bg-white/10">
                    <MapPin className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 !text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium !text-white/60">{t('event.detail.location')}</p>
                    <p className="text-xs sm:text-sm md:text-base font-medium !text-white">{eventData.location}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4 sm:my-6 md:my-8 !bg-white/10" />

            {/* Description */}
            <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-10">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold !text-white mb-3 sm:mb-4">{t('event.detail.description')}</h3>
              <div className="rounded-lg sm:rounded-xl border border-white/20 !bg-white/5 p-4 sm:p-5 md:p-6">
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed !text-white/90">
                <p>
                  Prepárate para vivir una experiencia inolvidable. Este evento reunirá a los mejores 
                  artistas y talentos para ofrecerte una noche llena de emoción y entretenimiento.
                </p>
                <p>
                  No te pierdas esta oportunidad única de ser parte de uno de los eventos más esperados 
                  del año. Asegura tus tickets ahora y vive momentos que recordarás para siempre.
                </p>
                </div>
              </div>
            </div>

            {/* Venue Info */}
            <Card className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-5 lg:p-6 !bg-white/5 border-white/20">
              <h3 className="mb-2 sm:mb-3 md:mb-4 text-base sm:text-lg md:text-xl !text-white">Información del Lugar</h3>
              <div className="mb-3 sm:mb-4 aspect-video w-full overflow-hidden rounded-lg !bg-white/10">
                <ImageWithFallback
                  src={
                    isPriorityEvent
                      ? "/images/events/salinassquare.png"
                      : "https://images.unsplash.com/photo-1759507058895-6df3cb75902b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwdmVudWUlMjBlbXB0eXxlbnwxfHx8fDE3NjE3OTkwNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  }
                  alt="Venue"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-2 text-xs sm:text-sm md:text-base !text-white/70">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 sm:mt-1 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 !text-white" />
                  <div>
                    <p className="text-xs sm:text-sm md:text-base !text-white">{eventData.location}</p>
                    <p className="text-[11px] sm:text-xs md:text-sm">Av. Principal #123, Col. Centro</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 !text-white" />
                  <span className="text-xs sm:text-sm md:text-base">Capacidad: 5,000 personas</span>
                </div>
              </div>
            </Card>

          </div>

          {/* Sidebar - Ticket Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="overflow-hidden border-white/20 shadow-lg !bg-white/5">
                <div className="border-b border-white/20 bg-[#c61619] p-3 sm:p-4 md:p-5 lg:p-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{t('event.detail.tickets')}</h3>
                </div>
                
                <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                  <div className="mb-4 sm:mb-5 md:mb-6 space-y-2 sm:space-y-2.5 md:space-y-3">
                    {ticketTypes.map((ticket) => (
                      <Card 
                        key={ticket.id} 
                        onClick={() => handleTicketSelection(ticket.id)}
                        className={`cursor-pointer border-2 p-2.5 sm:p-3 md:p-4 transition-all hover:shadow-md ${
                          selectedTicketType === ticket.id 
                            ? '!border-[#c61619] !bg-gradient-to-br !from-[#c61619]/25 !to-[#c61619]/10 shadow-lg shadow-[#c61619]/20' 
                            : 'border-white/30 !bg-gradient-to-br !from-white/15 !to-white/5 hover:!border-[#c61619]/50 hover:!from-white/20 hover:!to-white/10'
                        }`}
                      >
                        <div className="mb-2 sm:mb-2.5 md:mb-3 flex items-start justify-between">
                          <div>
                            <p className="text-sm sm:text-base font-semibold !text-white">{ticket.name}</p>
                            <p className={`mt-0.5 sm:mt-1 text-base sm:text-lg font-bold ${
                              selectedTicketType === ticket.id ? '!text-[#ff4d4d]' : '!text-[#c61619]'
                            }`}>${ticket.price} USD</p>
                          </div>
                          <div className={`flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg sm:rounded-xl transition-all ${
                            selectedTicketType === ticket.id 
                              ? '!bg-gradient-to-br !from-[#c61619] !to-[#a01316] shadow-lg shadow-[#c61619]/30' 
                              : '!bg-white/15 hover:!bg-white/20'
                          }`}>
                            <Ticket className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 !text-white" />
                          </div>
                        </div>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {ticket.benefits.map((benefit, index) => (
                            <li key={index} className={`flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm transition-colors ${
                              selectedTicketType === ticket.id ? '!text-white/90' : '!text-white/70'
                            }`}>
                              <div className={`mt-1 sm:mt-1.5 h-1 w-1 sm:h-1.5 sm:w-1.5 flex-shrink-0 rounded-full ${
                                selectedTicketType === ticket.id ? '!bg-[#ff4d4d]' : '!bg-[#c61619]'
                              }`} />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>

                  <Button
                    disabled={!selectedTicketType}
                    className="h-10 sm:h-11 md:h-12 w-full text-sm sm:text-base !bg-[#c61619] hover:!bg-[#a01316] font-semibold shadow-lg transition-shadow hover:shadow-xl !text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 !text-white" />
                    {selectedTicketType ? t('event.detail.buyTickets') : t('event.detail.selectTicket')}
                  </Button>

                  <div className="mt-3 sm:mt-4 rounded-lg sm:rounded-xl !bg-white/10 p-3 sm:p-4 border border-white/20">
                    <p className="mb-0.5 sm:mb-1 text-sm sm:text-base font-semibold !text-white">
                      {t('event.detail.offer')}
                    </p>
                    <p className="text-xs sm:text-sm !text-white/70">
                      {t('event.detail.offerText')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
