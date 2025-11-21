import { Calendar, MapPin, Ticket, TrendingUp, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "../media";
import { useLanguage } from "../../hooks/useLanguage";

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  price: string;
  image: string;
  category: string;
  featured?: boolean;
  trending?: boolean;
  soldOut?: boolean;
  lastTickets?: boolean;
}

/**
 * EventCard Component - Tarjeta de evento individual
 * Muestra información del evento con imagen, fecha, ubicación, precio y badges
 */
export function EventCard({
  title,
  date,
  location,
  price,
  image,
  category,
  featured = false,
  trending = false,
  soldOut = false,
  lastTickets = false,
}: EventCardProps) {
  const { t } = useLanguage();
  return (
    <>
      {/* EventCard - Tema negro */}
      <Card className="group cursor-pointer overflow-hidden border border-white/20 bg-black/50 shadow-md transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]">
      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[3/4]">
        <ImageWithFallback
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
        
        {/* Badges Container */}
        <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
          <Badge className="border-0 bg-black/80 text-xs font-medium text-white shadow-lg backdrop-blur-md sm:text-sm transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
            {category}
          </Badge>
          
          {trending && (
            <Badge className="border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-xs font-medium text-white shadow-lg shadow-blue-500/50 sm:text-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/60 group-hover:scale-105">
              <TrendingUp className="mr-1 h-3 w-3" />
              {t('ui.trending')}
            </Badge>
          )}
          
          {lastTickets && !soldOut && (
            <Badge className="border-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-xs font-medium text-white shadow-lg shadow-orange-500/50 sm:text-sm animate-pulse transition-all duration-300 group-hover:scale-105">
              <Clock className="mr-1 h-3 w-3" />
              {t('ui.last_tickets')}
            </Badge>
          )}
        </div>

        {featured && (
          <div className="absolute right-3 top-3 z-10">
            <Badge className="border-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-xs font-medium text-white shadow-lg shadow-amber-500/50 sm:text-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-amber-500/60 group-hover:scale-110">
              ⭐ {t('ui.featured')}
            </Badge>
          </div>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-20">
            <Badge className="border-0 bg-gradient-to-r from-gray-900 to-black px-6 py-2 text-base font-bold text-white shadow-2xl animate-pulse">
              {t('ui.sold_out')}
            </Badge>
          </div>
        )}

        {/* Price overlay */}
        {!soldOut && (
          <div className="absolute bottom-3 left-3 z-10">
            <div className="rounded-xl bg-black/80 px-3 py-1.5 shadow-xl backdrop-blur-md border border-white/20 transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
              <p className="text-[10px] font-medium text-white/60">{t('ui.from')}</p>
              <p className="text-sm font-semibold text-white">{price}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="mb-3 line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-base">{title}</h3>
        
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-white/70 sm:text-sm">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-white/60 sm:h-4 sm:w-4" />
            <span className="line-clamp-1 font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-white/70 sm:text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-white/60 sm:h-4 sm:w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Botón CTA - Tema negro */}
        {!soldOut && (
          <Button className="w-full bg-white text-black font-medium shadow-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:-translate-y-0.5" style={{ color: '#000000' }}>
            <Ticket className="mr-2 h-4 w-4" style={{ color: '#000000' }} />
            {t('event.buy')}
          </Button>
        )}
      </div>
      </Card>
    </>
  );
}
