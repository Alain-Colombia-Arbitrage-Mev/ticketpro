import { Search, Menu, User, Ticket, Wallet, LogOut, LogIn } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter } from "../../hooks/useRouter";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { LanguageSelector } from "../common";

/**
 * Header Component - Cabecera principal de la aplicación
 * Incluye navegación, selector de idioma, selector de tema y balance del usuario
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { navigate } = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

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
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/90 dark:border-gray-800/50 dark:bg-gray-900/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-gray-900/90 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Logo y nombre de la marca */}
        <div 
          className="flex cursor-pointer items-center gap-2.5 transition-all duration-300 hover:opacity-80 hover:scale-105 focus-visible-ring group"
          onClick={() => handleNavigation("home")}
          role="button"
          aria-label="Ir a inicio"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigation('home'); }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/60 group-hover:scale-110">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TicketPro
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <button 
            onClick={() => handleNavigation("events", "Concierto")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm hover:scale-105 focus-visible-ring"
          >
            {t('nav.category.concerts')}
          </button>
          <button 
            onClick={() => handleNavigation("events", "Deportes")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm hover:scale-105 focus-visible-ring"
          >
            {t('nav.category.sports')}
          </button>
          <button 
            onClick={() => handleNavigation("events", "Teatro")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm hover:scale-105 focus-visible-ring"
          >
            {t('nav.category.theater')}
          </button>
          <button 
            onClick={() => handleNavigation("events", "Familia")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm hover:scale-105 focus-visible-ring"
          >
            {t('nav.category.family')}
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector - Compact */}
          <LanguageSelector variant="compact" />
          
          <Button 
            variant="ghost"
            size="icon"
            className="hidden rounded-lg md:flex focus-visible-ring transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:scale-110"
            onClick={() => handleNavigation("events")}
          >
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <>
              {/* Balance Display - Clickable */}
              <button
                onClick={() => handleNavigation("wallet" as any)}
                className="hidden items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 px-3 py-1.5 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:text-gray-900 dark:hover:text-white hover:shadow-md hover:scale-105 focus-visible-ring md:flex"
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
                className="rounded-lg focus-visible-ring transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:scale-110"
                onClick={() => handleNavigation("profile")}
                aria-label="Ir a perfil"
              >
                <User className="h-5 w-5" />
              </Button>

              {/* Botón primario - Regla 60-30-10: 10% color de acento */}
              <Button 
                className="hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 focus-visible-ring md:flex transition-all duration-300"
                onClick={() => handleNavigation("profile")}
              >
                Mis Tickets
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hidden rounded-lg focus-visible-ring md:flex transition-all duration-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/30 dark:hover:to-pink-900/30 hover:scale-110"
                onClick={() => signOut()}
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button 
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 focus-visible-ring transition-all duration-300"
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
            className="rounded-lg focus-visible-ring md:hidden transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:scale-110"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl dark:border-gray-800 px-4 py-4 md:hidden shadow-lg">
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
              {t('nav.category.concerts')}
            </button>
            <button 
              onClick={() => handleNavigation("events", "Deportes")}
              className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
            >
              {t('nav.category.sports')}
            </button>
            <button 
              onClick={() => handleNavigation("events", "Teatro")}
              className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
            >
              {t('nav.category.theater')}
            </button>
            <button 
              onClick={() => handleNavigation("events", "Familia")}
              className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
            >
              {t('nav.category.family')}
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => handleNavigation("profile")}
                  className="text-left text-gray-700 dark:text-gray-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus-visible-ring"
                >
                  {t('nav.profile')}
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="text-left text-red-600 dark:text-red-400 transition-colors hover:text-red-700 dark:hover:text-red-500 focus-visible-ring"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleNavigation("login" as any)}
                className="text-left text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-700 dark:hover:text-blue-500 focus-visible-ring"
              >
                {t('nav.login')}
              </button>
            )}
          </nav>
        </div>
      )}
      </header>
    </>
  );
}
