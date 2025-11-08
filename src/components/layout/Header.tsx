import { Search, Menu, User, Ticket, Wallet, LogOut, LogIn } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter } from "../../hooks/useRouter";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { LanguageSelector } from "../common";
import logo2 from "../../assets/images/logo2.svg";

/**
 * Header Component - Cabecera principal de la aplicación
 * Incluye navegación, selector de idioma, selector de tema y balance del usuario
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { navigate } = useRouter();
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  
  // Log para debug
  console.log('Header - Idioma actual:', language);

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
      {/* Header - Tema negro con backdrop blur según Figma - Responsive */}
      <header className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-[4.3px] supports-[backdrop-filter]:bg-black/50">
      <div className="container mx-auto flex h-16 md:h-20 lg:h-[120px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Logo vetlix */}
        <div 
          className="flex cursor-pointer items-center gap-2.5 transition-all duration-300 hover:opacity-80 hover:scale-105 focus-visible-ring group"
          onClick={() => handleNavigation("home")}
          role="button"
          aria-label="Ir a inicio"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigation('home'); }}
        >
          <img 
            src={logo2} 
            alt="vetlix.com" 
            className="h-6 md:h-8 lg:h-[49px] w-auto max-w-[140px] md:max-w-[180px] lg:max-w-[249px] object-contain"
          />
        </div>

        {/* Desktop Navigation - Con más opciones para eventos */}
        <nav className="hidden items-center gap-1 lg:flex font-montserrat">
          <button 
            onClick={() => handleNavigation("home")}
            className="rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-[20px] font-semibold text-white transition-all duration-300 hover:text-white/80 focus-visible-ring"
          >
            {t('nav.home')}
          </button>
          <button 
            onClick={() => handleNavigation("events", "Concierto")}
            className="rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-[20px] font-semibold text-white transition-all duration-300 hover:text-white/80 focus-visible-ring"
          >
            {t('nav.category.concerts')}
          </button>
          <button 
            onClick={() => handleNavigation("events", "Deportes")}
            className="rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-[20px] font-semibold text-white transition-all duration-300 hover:text-white/80 focus-visible-ring"
          >
            {t('nav.category.sports')}
          </button>
          <button 
            onClick={() => handleNavigation("events", "Teatro")}
            className="rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-[20px] font-semibold text-white transition-all duration-300 hover:text-white/80 focus-visible-ring"
          >
            {t('nav.category.theater')}
          </button>
          <button 
            onClick={() => handleNavigation("events")}
            className="rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-[20px] font-semibold text-white transition-all duration-300 hover:text-white/80 focus-visible-ring"
          >
            {t('nav.events')}
          </button>
          <button 
            onClick={() => handleNavigation("profile")}
            className="rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-[20px] font-semibold text-white transition-all duration-300 hover:text-white/80 focus-visible-ring"
          >
            Contacto
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector - Compact */}
          <LanguageSelector variant="compact" />
          
          <Button 
            variant="ghost"
            size="icon"
            className="hidden rounded-lg md:flex focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white"
            onClick={() => handleNavigation("events")}
          >
            <Search className="h-5 w-5 !text-white" />
          </Button>

          {user ? (
            <>
              {/* Balance Display - Clickable */}
              <button
                onClick={() => handleNavigation("wallet")}
                className="hidden items-center gap-2 rounded-lg border border-white/20 bg-black/20 backdrop-blur-sm px-3 py-1.5 transition-all duration-300 hover:border-white/40 hover:bg-black/30 hover:text-white hover:shadow-md hover:scale-105 focus-visible-ring md:flex"
                aria-label="Ver billetera"
              >
                <Wallet className="h-4 w-4 !text-white" />
                <span className="text-sm font-semibold text-white">
                  ${user.balance.toLocaleString()} MXN
                </span>
              </button>

              <Button 
                variant="ghost"
                size="icon"
                className="rounded-lg focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white"
                onClick={() => handleNavigation("profile")}
                aria-label="Ir a perfil"
              >
                <User className="h-5 w-5 !text-white" />
              </Button>

              {/* Botón primario - Estilo del diseño */}
              <Button 
                variant="glass"
                className="hidden lg:flex h-12 w-[140px] lg:w-[172px] px-4 rounded-[31px] hover:scale-105 focus-visible-ring transition-all duration-300 text-base lg:text-[20px]"
                onClick={() => handleNavigation("events")}
              >
                {t('page.events.view_all')}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hidden rounded-lg focus-visible-ring md:flex transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white"
                onClick={() => signOut()}
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5 !text-white" />
              </Button>
            </>
          ) : (
            <Button 
              variant="glass"
              size="nav"
              className="hover:scale-105 focus-visible-ring transition-all duration-300"
              onClick={() => handleNavigation("login")}
              aria-label="Ingresar"
            >
              <LogIn className="mr-2 h-4 w-4 !text-white" />
              Ingresar
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg focus-visible-ring md:hidden transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5 !text-white" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-white/20 bg-black/95 backdrop-blur-xl px-4 py-4 md:hidden shadow-lg">
          {user && (
            <button
              onClick={() => handleNavigation("wallet")}
              className="mb-4 flex w-full items-center gap-2 rounded-lg border border-white/20 bg-black/20 backdrop-blur-sm px-3 py-2 text-left transition-colors hover:border-white/40 hover:bg-black/30 hover:text-white focus-visible-ring"
              aria-label="Ver billetera"
            >
              <Wallet className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">
                ${user.balance.toLocaleString()} MXN
              </span>
            </button>
          )}
          <nav className="flex flex-col gap-4">
            <button 
              onClick={() => handleNavigation("home")}
              className="text-left text-white transition-colors hover:text-white/80 focus-visible-ring"
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => handleNavigation("events", "Concierto")}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring"
            >
              {t('nav.category.concerts')}
            </button>
            <button 
              onClick={() => handleNavigation("events", "Deportes")}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring"
            >
              {t('nav.category.sports')}
            </button>
            <button 
              onClick={() => handleNavigation("events", "Teatro")}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring"
            >
              {t('nav.category.theater')}
            </button>
            <button 
              onClick={() => handleNavigation("events")}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring"
            >
              {t('nav.events')}
            </button>
            <button 
              onClick={() => handleNavigation("profile")}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring"
            >
              Contacto
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => handleNavigation("profile")}
                  className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring"
                >
                  Perfil
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="text-left text-red-400 transition-colors hover:text-red-300 focus-visible-ring"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleNavigation("login")}
                className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring"
              >
                Ingresar
              </button>
            )}
          </nav>
        </div>
      )}
      </header>
    </>
  );
}
