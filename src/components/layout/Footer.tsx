import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useRouter } from "../../hooks/useRouter";
import { useLanguage } from "../../hooks/useLanguage";
import logo2 from "../../assets/images/logo2.svg";

/**
 * Footer Component - Pie de página de la aplicación
 * Incluye información de la marca, enlaces de eventos, soporte y redes sociales
 */
export function Footer() {
  const { navigate } = useRouter();
  const { t } = useLanguage();

  return (
    <footer className="border-t border-white/20 bg-black">
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center">
              <img 
                src={logo2} 
                alt="vetlix.com" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="mb-6 text-sm leading-relaxed text-white/70">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 hover:text-white focus-visible-ring"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 hover:text-white focus-visible-ring"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 hover:text-white focus-visible-ring"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 hover:text-white focus-visible-ring"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Eventos */}
          <div>
            <h4 className="mb-5 text-base font-semibold text-white font-montserrat">{t('footer.events')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => navigate("events", { category: "Concierto" })}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('nav.category.concerts')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("events", { category: "Deportes" })}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('nav.category.sports')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("events", { category: "Teatro" })}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('nav.category.theater')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("events", { category: "Familia" })}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('category.family')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("events", { category: "Festival" })}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('category.festivals')}
                </button>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="mb-5 text-base font-semibold text-white font-montserrat">{t('footer.help')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  {t('footer.help.center')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  {t('footer.help.contact')}
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate("refund-policy")}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('footer.help.refund')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("terms")}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('footer.help.terms')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("privacy")}
                  className="text-white/70 transition-colors hover:text-white text-left"
                >
                  {t('footer.help.privacy')}
                </button>
              </li>
            </ul>
          </div>

          {/* Organizadores */}
          <div>
            <h4 className="mb-5 text-base font-semibold text-white font-montserrat">{t('footer.organizers')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  {t('footer.organizers.sell')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  {t('footer.organizers.create')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  {t('footer.organizers.resources')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  {t('footer.organizers.pricing')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/20 pt-8 text-center">
          <p className="text-sm text-white/70">
            &copy; 2025 vetlix.com. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
