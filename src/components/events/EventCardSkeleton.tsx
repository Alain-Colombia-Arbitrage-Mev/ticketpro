import { Card } from "../ui/card";

/**
 * EventCardSkeleton - Loading skeleton para EventCard
 * Mejora la percepción de velocidad mientras cargan los eventos
 */
export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-white/20 bg-black/50 animate-pulse">
      {/* Imagen skeleton */}
      <div className="relative aspect-[4/3] sm:aspect-[3/4] bg-white/10" />
      
      {/* Contenido skeleton */}
      <div className="p-4 sm:p-5">
        {/* Título */}
        <div className="h-6 bg-white/10 rounded mb-3" />
        
        {/* Fecha y ubicación */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
        </div>
        
        {/* Precio y botón */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="h-6 bg-white/10 rounded w-20" />
          <div className="h-10 bg-white/10 rounded w-32" />
        </div>
      </div>
    </Card>
  );
}
