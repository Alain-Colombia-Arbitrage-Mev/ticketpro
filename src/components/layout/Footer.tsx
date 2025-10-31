import { Ticket, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

/**
 * Footer Component - Pie de página de la aplicación
 * Incluye información de la marca, enlaces de eventos, soporte y redes sociales
 */
export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                TicketPro
              </span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              La mejor plataforma para encontrar y comprar tickets de tus eventos favoritos.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white focus-visible-ring"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white focus-visible-ring"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white focus-visible-ring"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white focus-visible-ring"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Eventos */}
          <div>
            <h4 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Eventos</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Conciertos
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Deportes
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Teatro
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Familia
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Festivales
                </a>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Ayuda</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Política de Reembolso
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Organizadores */}
          <div>
            <h4 className="mb-5 text-base font-semibold text-gray-900 dark:text-white">Organizadores</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Vende Tickets
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Crea un Evento
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; 2025 TicketPro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
