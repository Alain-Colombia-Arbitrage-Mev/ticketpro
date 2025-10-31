import { Calendar, MapPin, Clock, Users, Share2, Heart, ChevronLeft, Star, Ticket } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useRouter } from "../hooks/useRouter";
import { SEOHead } from "../components/SEOHead";

export function EventDetailPage() {
  const { navigate, pageData } = useRouter();

  if (!pageData) {
    navigate("home");
    return null;
  }

  // Parsear fecha del evento para formato ISO
  const parseDate = (dateStr: string): string => {
    // Formato esperado: "15 de Noviembre, 2025"
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

  const eventDateISO = parseDate(pageData.date);

  const ticketTypes = [
    { id: 1, name: "General", price: "800", benefits: ["Acceso general", "Estacionamiento incluido"] },
    { id: 2, name: "VIP", price: "1,500", benefits: ["Asientos preferentes", "Acceso a zona VIP", "Meet & Greet"] },
    { id: 3, name: "Palco", price: "3,500", benefits: ["Palco privado (4 personas)", "Servicio de mesero", "Bebidas incluidas"] },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        seo={{
          title: `${pageData.title} - Tiquetera`,
          description: `Compra boletos para ${pageData.title}. ${pageData.date} en ${pageData.location}. ${pageData.category}. Precio desde ${pageData.price}. No te lo pierdas, compra tus tickets ahora.`,
          keywords: `${pageData.title}, ${pageData.category}, eventos ${pageData.location}, boletos ${pageData.location}, ${pageData.date}`,
          image: pageData.image,
          url: typeof window !== 'undefined' ? `${window.location.origin}#event-detail?id=${pageData.id}` : undefined,
          type: "event",
          event: {
            name: pageData.title,
            startDate: eventDateISO,
            location: {
              name: pageData.location,
              address: pageData.location,
            },
            price: pageData.price,
            image: pageData.image,
          },
        }}
      />
      {/* Back Button */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="gap-2 rounded-lg font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-72 w-full overflow-hidden sm:h-96 lg:h-[32rem]">
        <ImageWithFallback
          src={pageData.image}
          alt={pageData.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Actions Overlay */}
        <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
          <Button size="icon" variant="secondary" className="rounded-xl bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-xl bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white">
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {pageData.featured && (
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
            <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 font-medium shadow-lg">
              ⭐ Destacado
            </Badge>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <Badge className="mb-4 border-0 bg-blue-100 dark:bg-blue-900/30 font-medium text-blue-700 dark:text-blue-400">{pageData.category}</Badge>
              <h1 className="mb-6 text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                {pageData.title}
              </h1>
              
              <div className="flex flex-wrap gap-5 text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pageData.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Hora</p>
                    <p className="font-medium text-gray-900 dark:text-white">8:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ubicación</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pageData.location}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Description */}
            <div className="mb-10">
              <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Descripción del Evento</h3>
              <div className="space-y-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
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

            {/* Venue Info */}
            <Card className="mb-8 p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="mb-4 text-gray-900 dark:text-white">Información del Lugar</h3>
              <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1759507058895-6df3cb75902b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwdmVudWUlMjBlbXB0eXxlbnwxfHx8fDE3NjE3OTkwNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Venue"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900 dark:text-white">{pageData.location}</p>
                    <p className="text-sm">Av. Principal #123, Col. Centro</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Capacidad: 5,000 personas</span>
                </div>
              </div>
            </Card>

            {/* Reviews */}
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-white">Reseñas</h3>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-900 dark:text-white">4.8</span>
                  <span className="text-gray-600 dark:text-gray-400">(234 reseñas)</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">hace 2 días</span>
                  </div>
                  <p className="mb-1 text-gray-900 dark:text-white">Excelente experiencia</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    El mejor concierto al que he asistido. La organización fue impecable y el ambiente increíble.
                  </p>
                </div>
                
                <div className="pb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <Star className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">hace 1 semana</span>
                  </div>
                  <p className="mb-1 text-gray-900 dark:text-white">Muy bueno</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Gran evento, aunque el estacionamiento estaba un poco lleno. Lo recomiendo totalmente.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Ticket Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-lg dark:bg-gray-800">
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                  <h3 className="text-xl font-bold text-white">Selecciona tus Tickets</h3>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 space-y-3">
                    {ticketTypes.map((ticket) => (
                      <Card key={ticket.id} className="cursor-pointer border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-4 transition-all hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-md">
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{ticket.name}</p>
                            <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">${ticket.price} MXN</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {ticket.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>

                  <Button
                    className="h-12 w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg transition-shadow hover:shadow-xl"
                    onClick={() => navigate("checkout", pageData)}
                  >
                    <Ticket className="mr-2 h-5 w-5" />
                    Comprar Tickets
                  </Button>

                  <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-indigo-900/20 p-4">
                    <p className="mb-1 font-semibold text-blue-900 dark:text-blue-300">
                      🎉 Oferta especial
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Compra 3 tickets y obtén 15% de descuento
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
