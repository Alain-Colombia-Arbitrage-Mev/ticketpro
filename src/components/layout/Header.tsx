import { Search, Menu, User, Ticket, Wallet, LogOut, LogIn, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter } from "../../hooks/useRouter";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { LanguageSelector } from "../common";
import { useCartStore } from "../../stores/cartStore";
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
  const { getTotalItems } = useCartStore();
  const cartItemsCount = getTotalItems();
  
  // Verificar estado de autenticación - Verificación estricta
  // Solo considerar autenticado si hay user, id y email válidos
  const isAuthenticated = Boolean(
    user && 
    user.id && 
    user.email &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    user.id.length > 0 &&
    user.email.length > 0
  );

  const handleNavigation = (page: any, data?: any) => {
    setIsMenuOpen(false);
    if (data) {
      navigate(page, data);
    } else {
      navigate(page);
    }
  };

  return (
    <>
      {/* Header - Tema negro sólido según diseño */}
      <header className="sticky top-0 z-50 w-full bg-black">
      <div className="container mx-auto flex h-24 md:h-28 items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        {/* Logo - Logo vetlix */}
        <div 
          className="flex cursor-pointer items-center gap-2.5 transition-all duration-300 hover:opacity-80 hover:scale-105 focus-visible-ring group z-10"
          onClick={() => handleNavigation("home")}
          role="button"
          aria-label="Ir a inicio"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigation('home'); }}
        >
          <img 
            src={logo2} 
            alt="vetlix.com" 
            className="h-14 md:h-16 w-auto object-contain"
          />
        </div>

        {/* Desktop Navigation - Centrado con espaciado uniforme */}
        <nav className="hidden items-center gap-6 lg:flex font-montserrat absolute left-1/2 transform -translate-x-1/2 z-0">
          <button 
            onClick={() => handleNavigation("home")}
            className="px-4 py-3 text-lg font-medium text-white transition-all duration-300 hover:text-white/80 focus-visible-ring whitespace-nowrap"
          >
            {t('nav.home')}
          </button>
          <button 
            onClick={() => handleNavigation("all-events", { category: "Concierto" })}
            className="px-4 py-3 text-lg font-medium text-white transition-all duration-300 hover:text-white/80 focus-visible-ring whitespace-nowrap"
          >
            {t('nav.category.concerts')}
          </button>
          <button 
            onClick={() => handleNavigation("all-events", { category: "Deportes" })}
            className="px-4 py-3 text-lg font-medium text-white transition-all duration-300 hover:text-white/80 focus-visible-ring whitespace-nowrap"
          >
            {t('nav.category.sports')}
          </button>
          <button 
            onClick={() => handleNavigation("all-events", { category: "Teatro" })}
            className="px-4 py-3 text-lg font-medium text-white transition-all duration-300 hover:text-white/80 focus-visible-ring whitespace-nowrap"
          >
            {t('nav.category.theater')}
          </button>
          <button 
            onClick={() => handleNavigation("all-events")}
            className="px-4 py-3 text-lg font-medium text-white transition-all duration-300 hover:text-white/80 focus-visible-ring whitespace-nowrap"
          >
            {t('nav.events')}
          </button>
          <button 
            onClick={() => handleNavigation("contact")}
            className="px-4 py-3 text-lg font-medium text-white transition-all duration-300 hover:text-white/80 focus-visible-ring whitespace-nowrap"
          >
            {t('nav.contact')}
          </button>
        </nav>

        {/* Actions - Right side */}
        <div className="flex items-center gap-2 z-10">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
          {/* Language Selector - Compact */}
          <LanguageSelector variant="compact" />
          
          <Button 
            variant="ghost"
            size="icon"
              className="rounded-lg focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
              onClick={() => handleNavigation("all-events")}
          >
              <Search className="h-6 w-6 !text-white" />
          </Button>

            {/* Solo mostrar carrito si el usuario está autenticado */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-lg focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
                onClick={() => handleNavigation("cart")}
                aria-label="Ver carrito"
              >
                <ShoppingCart className="h-6 w-6 !text-white" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c61619] text-xs font-bold text-white">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </Button>
            )}

            {/* Botones según estado de autenticación - Mutuamente excluyentes */}
            {isAuthenticated ? (
              // USUARIO AUTENTICADO: Mostrar billetera, perfil y logout
            <>
                {/* Balance Display - Reduced size */}
              <button
                  onClick={() => handleNavigation("wallet")}
                  className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/20 backdrop-blur-sm px-3 py-2 transition-all duration-300 hover:border-white/40 hover:bg-black/30 hover:text-white hover:shadow-md hover:scale-105 focus-visible-ring"
                aria-label="Ver billetera"
              >
                  <Wallet className="h-4 w-4 !text-white" />
                  <span className="text-sm font-medium text-white">
                    ${user?.balance?.toLocaleString() || '0'}
                </span>
              </button>

                {/* Botón de Perfil - Icono User */}
              <Button 
                variant="ghost"
                size="icon"
                  className="rounded-lg focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
                onClick={() => handleNavigation("profile")}
                aria-label="Ir a perfil"
              >
                  <User className="h-6 w-6 !text-white" />
              </Button>

                {/* Botón de Logout */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
                  onClick={() => signOut()}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-6 w-6 !text-white" />
                </Button>
              </>
            ) : (
              // USUARIO NO AUTENTICADO: Mostrar solo botón de login
              <Button 
                className="bg-[#c61619] hover:bg-[#a01316] text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 hover:scale-105 focus-visible-ring shadow-lg shadow-[#c61619]/20 hover:shadow-[#c61619]/30 text-sm"
                onClick={() => handleNavigation("login")}
                aria-label="Ingresar"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {t('nav.login')}
              </Button>
            )}
          </div>

          {/* Mobile Actions - Solo: selector de idioma, login (si no hay usuario) y menú */}
          <div className="flex md:hidden items-center gap-2">
            {/* Language Selector - Compact */}
            <LanguageSelector variant="compact" />
            
            {!isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
                onClick={() => handleNavigation("login")}
              aria-label="Ingresar"
            >
                <LogIn className="h-5 w-5 !text-white" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
              className="rounded-lg focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menú"
          >
              <Menu className="h-5 w-5 !text-white" />
          </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-white/20 bg-black/95 backdrop-blur-xl px-4 py-4 md:hidden shadow-lg">
          {isAuthenticated && (
            <button
              onClick={() => handleNavigation("wallet")}
              className="mb-4 flex w-full items-center gap-2 rounded-lg border border-white/20 bg-black/20 backdrop-blur-sm px-3 py-2 text-left transition-colors hover:border-white/40 hover:bg-black/30 hover:text-white focus-visible-ring"
              aria-label="Ver billetera"
            >
              <Wallet className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">
                ${user.balance.toLocaleString()}
              </span>
            </button>
          )}
          <nav className="flex flex-col gap-3">
            <button 
              onClick={() => handleNavigation("home")}
              className="text-left text-white transition-colors hover:text-white/80 focus-visible-ring py-2"
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => handleNavigation("all-events", { category: "Concierto" })}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring py-2"
            >
              {t('nav.category.concerts')}
            </button>
            <button 
              onClick={() => handleNavigation("all-events", { category: "Deportes" })}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring py-2"
            >
              {t('nav.category.sports')}
            </button>
            <button 
              onClick={() => handleNavigation("all-events", { category: "Teatro" })}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring py-2"
            >
              {t('nav.category.theater')}
            </button>
            <button 
              onClick={() => handleNavigation("all-events")}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring py-2"
            >
              {t('nav.events')}
            </button>
            <button 
              onClick={() => handleNavigation("contact")}
              className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring py-2"
            >
              {t('nav.contact')}
            </button>
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => handleNavigation("cart")}
                  className="relative text-left text-white/70 transition-colors hover:text-white focus-visible-ring flex items-center gap-2 py-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Carrito
                  {cartItemsCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c61619] text-xs font-bold text-white">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => handleNavigation("profile")}
                  className="text-left text-white/70 transition-colors hover:text-white focus-visible-ring py-2"
                >
                  Perfil
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="text-left text-red-400 transition-colors hover:text-red-300 focus-visible-ring py-2"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : null}
          </nav>
        </div>
      )}
      </header>
    </>
  );
}
