import {
  Search,
  Menu,
  User,
  Wallet,
  LogOut,
  LogIn,
  ShoppingCart,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter } from "../../hooks/useRouter";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { LanguageSelector } from "../common";
import { useCartStore } from "../../stores/cartStore";
import logo2 from "../../assets/images/logo2.svg";
import type { Page } from "../../stores/routerStore";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { navigate } = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { getTotalItems } = useCartStore();
  const cartItemsCount = getTotalItems();

  const isAuthenticated = Boolean(
    user &&
      user.id &&
      user.email &&
      typeof user.id === "string" &&
      typeof user.email === "string" &&
      user.id.length > 0 &&
      user.email.length > 0,
  );

  const handleNavigation = (page: Page, data?: unknown) => {
    setIsMenuOpen(false);
    if (data) {
      navigate(page, data);
    } else {
      navigate(page);
    }
  };

  return (
    <>
      <header className="landing-header sticky top-0 z-50 w-full">
        <div className="flex h-[72px] md:h-[90px] lg:h-[99px] items-center justify-between px-4 sm:px-8 lg:px-14 max-w-[1920px] mx-auto">
          {/* Logo */}
          <div
            className="flex cursor-pointer items-center transition-all duration-300 hover:opacity-80 hover:scale-105 z-10 flex-shrink-0"
            onClick={() => handleNavigation("home")}
            role="button"
            aria-label="Ir a inicio"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleNavigation("home");
            }}
          >
            <img
              src={logo2}
              alt="vetlix.com"
              className="h-7 md:h-8 lg:h-9 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation — Centrado */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-5 2xl:gap-8 flex-1 justify-center">
            <button
              onClick={() => handleNavigation("home")}
              className="nav-link-landing"
            >
              {t("nav.home")}
            </button>
            <button
              onClick={() =>
                handleNavigation("all-events", { category: "Concierto" })
              }
              className="nav-link-landing"
            >
              {t("nav.category.concerts")}
            </button>
            <button
              onClick={() =>
                handleNavigation("all-events", { category: "Deportes" })
              }
              className="nav-link-landing"
            >
              {t("nav.category.sports")}
            </button>
            <button
              onClick={() =>
                handleNavigation("all-events", { category: "Teatro" })
              }
              className="nav-link-landing"
            >
              {t("nav.category.theater")}
            </button>
            <button
              onClick={() => handleNavigation("all-events")}
              className="nav-link-landing"
            >
              {t("nav.events")}
            </button>
            <button
              onClick={() => handleNavigation("contact")}
              className="nav-link-landing"
            >
              {t("nav.contact")}
            </button>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2 xl:gap-3 z-10 flex-shrink-0">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2 xl:gap-3">
              <LanguageSelector variant="compact" />

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-9 w-9"
                onClick={() => handleNavigation("all-events")}
              >
                <Search className="h-5 w-5 !text-white" />
              </Button>

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-9 w-9"
                  onClick={() => handleNavigation("cart")}
                  aria-label="Ver carrito"
                >
                  <ShoppingCart className="h-5 w-5 !text-white" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c61619] text-xs font-bold text-white">
                      {cartItemsCount > 9 ? "9+" : cartItemsCount}
                    </span>
                  )}
                </Button>
              )}

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavigation("wallet")}
                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-1.5 transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:scale-105"
                    aria-label="Ver billetera"
                  >
                    <Wallet className="h-4 w-4 !text-white" />
                    <span className="text-sm font-medium text-white">
                      ${user?.balance?.toLocaleString() || "0"}
                    </span>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-9 w-9"
                    onClick={() => handleNavigation("profile")}
                    aria-label="Ir a perfil"
                  >
                    <User className="h-5 w-5 !text-white" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-9 w-9"
                    onClick={() => signOut()}
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5 !text-white" />
                  </Button>
                </>
              ) : (
                <button
                  className="nav-cta-button"
                  onClick={() => handleNavigation("login")}
                  aria-label="Ingresar"
                >
                  <LogIn className="mr-1.5 h-4 w-4" />
                  {t("nav.login")}
                </button>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSelector variant="compact" />

              {!isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
                  onClick={() => handleNavigation("login")}
                  aria-label="Ingresar"
                >
                  <LogIn className="h-5 w-5 !text-white" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full focus-visible-ring transition-all duration-300 hover:!bg-white/10 hover:scale-110 !text-white h-10 w-10"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5 !text-white" />
                ) : (
                  <Menu className="h-5 w-5 !text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="landing-mobile-menu border-t border-white/10 px-6 py-5 md:hidden">
            {isAuthenticated && (
              <button
                onClick={() => handleNavigation("wallet")}
                className="mb-4 flex w-full items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-2.5 text-left transition-colors hover:border-white/40 hover:bg-white/10"
                aria-label="Ver billetera"
              >
                <Wallet className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  ${user?.balance?.toLocaleString() || "0"}
                </span>
              </button>
            )}
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => handleNavigation("home")}
                className="nav-link-mobile"
              >
                {t("nav.home")}
              </button>
              <button
                onClick={() =>
                  handleNavigation("all-events", { category: "Concierto" })
                }
                className="nav-link-mobile"
              >
                {t("nav.category.concerts")}
              </button>
              <button
                onClick={() =>
                  handleNavigation("all-events", { category: "Deportes" })
                }
                className="nav-link-mobile"
              >
                {t("nav.category.sports")}
              </button>
              <button
                onClick={() =>
                  handleNavigation("all-events", { category: "Teatro" })
                }
                className="nav-link-mobile"
              >
                {t("nav.category.theater")}
              </button>
              <button
                onClick={() => handleNavigation("all-events")}
                className="nav-link-mobile"
              >
                {t("nav.events")}
              </button>
              <button
                onClick={() => handleNavigation("contact")}
                className="nav-link-mobile"
              >
                {t("nav.contact")}
              </button>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavigation("cart")}
                    className="nav-link-mobile flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Carrito
                    {cartItemsCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c61619] text-xs font-bold text-white">
                        {cartItemsCount > 9 ? "9+" : cartItemsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleNavigation("profile")}
                    className="nav-link-mobile"
                  >
                    Perfil
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    className="nav-link-mobile !text-red-400 hover:!text-red-300"
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
