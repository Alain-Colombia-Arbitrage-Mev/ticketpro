import { Calendar, MapPin, Ticket, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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
  return (
    <>
      {/* EventCard - Regla 60-30-10: 60% fondo card (bg-white), 30% bordes (border-gray-200), 10% botón CTA (bg-blue-600) */}
      <Card className="group cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[3/4]">
        <ImageWithFallback
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
        
        {/* Badges Container */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <Badge className="border-0 bg-white/95 dark:bg-gray-900/95 text-xs font-medium text-gray-900 dark:text-white shadow-sm backdrop-blur-sm sm:text-sm">
            {category}
          </Badge>
          
          {trending && (
            <Badge className="border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-medium text-white shadow-sm sm:text-sm">
              <TrendingUp className="mr-1 h-3 w-3" />
              Tendencia
            </Badge>
          )}
          
          {lastTickets && !soldOut && (
            <Badge className="border-0 bg-gradient-to-r from-orange-500 to-red-500 text-xs font-medium text-white shadow-sm sm:text-sm animate-pulse">
              <Clock className="mr-1 h-3 w-3" />
              Últimos
            </Badge>
          )}
        </div>

        {featured && (
          <div className="absolute right-3 top-3">
            <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-medium text-white shadow-sm sm:text-sm">
              ⭐ Destacado
            </Badge>
          </div>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Badge className="border-0 bg-gray-900/90 px-6 py-2 text-base font-bold text-white shadow-xl">
              AGOTADO
            </Badge>
          </div>
        )}

        {/* Price overlay */}
        {!soldOut && (
          <div className="absolute bottom-3 left-3">
            <div className="rounded-xl bg-white/95 dark:bg-gray-900/95 px-3 py-1.5 shadow-lg backdrop-blur-sm">
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Desde</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{price}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-tight text-gray-900 dark:text-white sm:text-lg">{title}</h3>
        
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="line-clamp-1 font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Botón CTA - Regla 60-30-10: 10% color de acento para elemento destacado */}
        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-medium shadow-sm transition-shadow hover:shadow-md">
          <Ticket className="mr-2 h-4 w-4" />
          Comprar Tickets
        </Button>
      </div>
      </Card>
    </>
  );
}
