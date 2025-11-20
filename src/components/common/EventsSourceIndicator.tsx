import { useEventsSource } from '../../hooks/useEvents';

/**
 * Indicador visual que muestra la fuente de datos de eventos
 * Solo visible en desarrollo
 */
export function EventsSourceIndicator() {
  const { usingDatabase, source } = useEventsSource();
  
  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className={`
          px-4 py-2 rounded-lg shadow-lg text-sm font-medium
          ${usingDatabase 
            ? 'bg-green-500/90 text-white' 
            : 'bg-yellow-500/90 text-black'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${usingDatabase ? 'bg-white' : 'bg-black'} animate-pulse`}></div>
          <span>
            {usingDatabase ? '🗄️ Base de Datos' : '📦 Mock Data'}
          </span>
        </div>
        {!usingDatabase && (
          <div className="text-xs mt-1 opacity-75">
            Para usar BD: VITE_USE_DATABASE=true
          </div>
        )}
      </div>
    </div>
  );
}


