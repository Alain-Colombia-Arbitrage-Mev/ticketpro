import { Search, Menu, User, Ticket, Wallet, LogOut, LogIn } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter } from "../../hooks/useRouter";
import { useAuth } from "../../hooks/useAuth";
import { LanguageSelector } from "../common";

/**
 * Header Component - Cabecera principal de la aplicación
 * Incluye navegación, selector de idioma, selector de tema y balance del usuario
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { navigate } = useRouter();
  const { user, signOut } = useAuth();

  const handleNavigation = (page: "home" | "events" | "profile", category?: string) => {
    setIsMenuOpen(false);
    if (category) {
      navigate(page, { category });
    } else {
      navigate(page);
    }
  };

  return (
    <>
      {/* Header - Regla 60-30-10: 60% fondo blanco/gris oscuro (bg-white/80), 30% bordes (border-gray-200), 10% botones primarios (bg-blue-600) */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 dark:border-gray-800/50 dark:bg-gray-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Logo y nombre de la marca */}
        <div 
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80 focus-visible-ring"
          onClick={() => handleNavigation("home")}
          role="button"
          aria-label="Ir a inicio"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigation('home'); }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
            TicketPro
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <button 
            onClick={() => handleNavigation("events", "Concierto")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            Conciertos
          </button>
          <button 
            onClick={() => handleNavigation("events", "Deportes")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            Deportes
          </button>
          <button 
            onClick={() => handleNavigation("events", "Teatro")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            Teatro
          </button>
          <button 
            onClick={() => handleNavigation("events", "Familia")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            Familia
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector - Compact */}
          <LanguageSelector variant="compact" />
          
          <Button 
            variant="ghost"
            size="icon"
            className="hidden rounded-lg md:flex focus-visible-ring"
            onClick={() => handleNavigation("events")}
          >
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <>
              {/* Balance Display - Clickable */}
              <button
                onClick={() => handleNavigation("wallet" as any)}
                className="hidden items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 transition-colors hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-gray-900 dark:hover:text-white focus-visible-ring md:flex"
                aria-label="Ver billetera"
              >
                <Wallet className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${user.balance.toLocaleString()} MXN
                </span>
              </button>

              <Button 
                variant="ghost"
                size="icon"
                className="rounded-lg focus-visible-ring"
                onClick={() => handleNavigation("profile")}
                aria-label="Ir a perfil"
              >
                <User className="h-5 w-5" />
              </Button>

              {/* Botón primario - Regla 60-30-10: 10% color de acento */}
              <Button 
                className="hidden bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm hover:shadow-md focus-visible-ring md:flex"
                onClick={() => handleNavigation("profile")}
              >
                Mis Tickets
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hidden rounded-lg focus-visible-ring md:flex"
                onClick={() => signOut()}
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm hover:shadow-md focus-visible-ring"
              onClick={() => handleNavigation("login" as any)}
              aria-label="Ingresar"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Ingresar
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg focus-visible-ring md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-white dark:bg-gray-900 dark:border-gray-800 px-4 py-4 md:hidden">
          {user && (
            <button
              onClick={() => handleNavigation("wallet" as any)}
              className="mb-4 flex w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left transition-colors hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-gray-900 dark:hover:text-white focus-visible-ring"
              aria-label="Ver billetera"
            >
              <Wallet className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">
                ${user.balance.toLocaleString()} MXN
              </span>
            </button>
          )}
          <nav className="flex flex-col gap-4">
            <button 
              onClick={() => handleNavigation("events", "Concierto")}
              className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
            >
              Conciertos
            </button>
            <button 
              onClick={() => handleNavigation("events", "Deportes")}
              className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
            >
              Deportes
            </button>
            <button 
              onClick={() => handleNavigation("events", "Teatro")}
              className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
            >
              Teatro
            </button>
            <button 
              onClick={() => handleNavigation("events", "Familia")}
              className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
            >
              Familia
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => handleNavigation("profile")}
                  className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
                >
                  Mi Perfil
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="text-left text-red-600 dark:text-red-400 transition-colors hover:text-red-700 dark:hover:text-red-500 focus-visible-ring"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleNavigation("login" as any)}
                className="text-left text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-700 dark:hover:text-blue-500 focus-visible-ring"
              >
                Iniciar Sesión
              </button>
            )}
          </nav>
        </div>
      )}
      </header>
    </>
  );
}
