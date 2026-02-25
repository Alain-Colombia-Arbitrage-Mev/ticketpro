import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { SEOHead } from "../components/common";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Shield } from "lucide-react";

export function HomePage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isHosterOrAdmin =
    user &&
    user.role &&
    typeof user.role === "string" &&
    (user.role === "hoster" || user.role === "admin");

  if (import.meta.env.DEV && user) {
    console.log(
      "🔍 HomePage - Usuario:",
      user.email,
      "Rol:",
      user.role,
      "isHosterOrAdmin:",
      isHosterOrAdmin,
    );
  }

  return (
    <div data-page="home" className="home-page">
      {/* Banner informativo para usuarios hoster/admin */}
      {isHosterOrAdmin && (
        <div className="fixed top-24 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-500">
          <Card className="!bg-red-900/20 border-red-500/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-400 animate-pulse" />
                  <div>
                    <p className="font-medium text-red-300">
                      Panel de Validación Disponible
                    </p>
                    <p className="text-sm text-red-400/80">
                      Como {user.role}, puedes validar entradas rápidamente
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("hoster-validate")}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25"
                >
                  Validar Ahora ⚡
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <SEOHead
        seo={{
          title: "vetlix.com - Tu plataforma de eventos y boletos",
          description:
            "Descubre y compra boletos para los mejores eventos: conciertos, deportes, teatro, comedia y más. Miles de eventos disponibles con compra segura y rápida.",
          keywords:
            "eventos, boletos, conciertos, deportes, teatro, tickets, compra online",
          url:
            typeof window !== "undefined" ? window.location.origin : undefined,
          type: "website",
        }}
      />

      {/* Container principal */}
      <div className="relative w-full bg-black overflow-x-hidden">

        {/* ============ HERO SECTION ============ */}
        <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-black">
          {/* Video de fondo */}
          <div className="absolute inset-0">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              src="/images/bg1.mp4"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 z-10" />
          </div>

          {/* Contenido Hero */}
          <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 text-center">
            {/* Logo grande */}
            <img
              src="/images/logoveltlixgrande.png"
              alt="Veltlix"
              className="w-[160px] sm:w-[240px] md:w-[340px] lg:w-[420px] xl:w-[480px] mb-4 sm:mb-6 md:mb-8 object-contain animate-fade-in-up mx-auto"
            />

            {/* Mujer recortada superpuesta */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[220px] sm:w-[300px] md:w-[420px] lg:w-[520px] xl:w-[580px] z-30 pointer-events-none">
              <img
                src="/images/home1mujer.png"
                alt=""
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Texto y botón */}
            <div className="relative z-40 text-center mt-2 sm:mt-4 md:mt-8 flex flex-col items-center px-4">
              <h1 className="text-[26px] sm:text-[36px] md:text-[50px] lg:text-[64px] xl:text-[72px] font-bold text-white leading-[1.1] mb-2 md:mb-4 text-center">
                Todo Empieza con un Si
              </h1>
              <p className="text-[13px] sm:text-[15px] md:text-[18px] lg:text-[20px] text-white/80 mb-4 sm:mb-6 md:mb-8 max-w-[520px] md:max-w-[600px] text-center">
                Descubre los mejores eventos, vive experiencias únicas
              </p>
              <Button
                variant="glass"
                className="h-11 w-[160px] sm:h-12 sm:w-[180px] md:h-14 md:w-[216px] rounded-[31px] hover:scale-105 transition-all duration-300 text-[15px] sm:text-[17px] md:text-[20px]"
                onClick={() => navigate("events")}
              >
                Ver mas
              </Button>
            </div>
          </div>
        </section>

        {/* ============ DESCUBRE SECTION ============ */}
        <section className="cutout-section relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black py-16 md:py-0">
          {/* Video de fondo */}
          <div className="absolute inset-0 z-0">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              src="/images/bg2.mp4"
            />
            <div className="absolute inset-0 bg-black/50 z-[1]" />
          </div>

          {/* Texto gigante DETRÁS de la imagen — blanco */}
          <div className="cutout-text-behind cutout-text-white" aria-hidden="true">
            DESCUBRE
          </div>

          {/* Imagen cutout centrada */}
          <div className="cutout-image">
            <img
              src="/images/Descubre.png"
              alt="Descubre eventos"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Texto gigante DELANTE (stroke only) */}
          <div className="cutout-text-front" aria-hidden="true">
            DESCUBRE
          </div>

          {/* Contenido superpuesto */}
          <div className="cutout-content text-center flex flex-col items-center">
            <h2 className="text-[24px] sm:text-[32px] md:text-[42px] lg:text-[52px] font-bold text-white leading-tight mb-2 md:mb-4 text-center">
              Luces encendidas,<br />la multitud vibra
            </h2>
            <p className="text-[13px] sm:text-[15px] md:text-[18px] text-white/70 mb-6 md:mb-8 max-w-[500px] text-center">
              Los mejores conciertos y festivales te esperan
            </p>
            <Button
              variant="glass"
              className="h-11 w-[160px] sm:h-12 sm:w-[180px] md:h-14 md:w-[216px] rounded-[31px] bg-black/20 text-white border-2 border-white backdrop-blur-[5.9px] hover:scale-105 transition-all duration-300 text-[15px] sm:text-[17px] md:text-[20px]"
              onClick={() => navigate("events")}
            >
              Ver mas
            </Button>
          </div>
        </section>

        {/* ============ VÍVELO SECTION ============ */}
        <section className="cutout-section relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black py-16 md:py-0">
          {/* Video de fondo */}
          <div className="absolute inset-0 z-0">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              src="/images/futbol.mp4"
            />
            {/* Máscara bc2 encima del video */}
            <img
              src="/images/bc 2.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover z-[1] pointer-events-none opacity-60 mix-blend-multiply"
            />
          </div>

          <div className="cutout-text-behind cutout-text-xl cutout-text-white" aria-hidden="true">
            VÍVELO
          </div>

          <div className="cutout-image">
            <img
              src="/images/vivelo.png"
              alt="Vívelo en el estadio"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="cutout-text-front cutout-text-xl" aria-hidden="true">
            VÍVELO
          </div>

          <div className="cutout-content text-center flex flex-col items-center">
            <h2 className="text-[24px] sm:text-[32px] md:text-[42px] lg:text-[52px] font-bold text-white leading-tight mb-2 md:mb-4 text-center">
              El rugido del estadio,<br />antes del gol.
            </h2>
            <p className="text-[13px] sm:text-[15px] md:text-[18px] text-white/70 mb-6 md:mb-8 max-w-[500px] text-center">
              Vive la emoción del deporte en primera fila
            </p>
            <Button
              variant="glass"
              className="h-11 w-[160px] sm:h-12 sm:w-[180px] md:h-14 md:w-[216px] rounded-[31px] bg-black/20 text-white border-2 border-white backdrop-blur-[5.9px] hover:scale-105 transition-all duration-300 text-[15px] sm:text-[17px] md:text-[20px]"
              onClick={() => navigate("events")}
            >
              Ver mas
            </Button>
          </div>
        </section>

        {/* ============ EMOCIÓNATE SECTION ============ */}
        <section className="cutout-section relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black py-16 md:py-0">
          {/* Video de fondo */}
          <div className="absolute inset-0 z-0">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              src="/images/bg3.mp4"
            />
            {/* Máscara bc4 encima del video */}
            <img
              src="/images/bc4.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover z-[1] pointer-events-none opacity-60 mix-blend-multiply"
            />
          </div>

          <div className="cutout-text-behind cutout-text-white" aria-hidden="true">
            EMOCIÓNATE
          </div>

          <div className="cutout-image">
            <img
              src="/images/emocionante.png"
              alt="Emociónate"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="cutout-text-front" aria-hidden="true">
            EMOCIÓNATE
          </div>

          <div className="cutout-content text-center flex flex-col items-center">
            <h2 className="text-[24px] sm:text-[32px] md:text-[42px] lg:text-[52px] font-bold text-white leading-tight mb-2 md:mb-4 text-center">
              Ríes, lloras,<br />aplaudes.
            </h2>
            <p className="text-[13px] sm:text-[15px] md:text-[18px] text-white/70 mb-6 md:mb-8 max-w-[500px] text-center">
              Momentos que se quedan contigo para siempre
            </p>
            <Button
              variant="glass"
              className="h-11 w-[160px] sm:h-12 sm:w-[180px] md:h-14 md:w-[216px] rounded-[31px] bg-black/20 text-white border-2 border-white backdrop-blur-[5.9px] hover:scale-105 transition-all duration-300 text-[15px] sm:text-[17px] md:text-[20px]"
              onClick={() => navigate("events")}
            >
              Ver mas
            </Button>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="landing-footer relative w-full bg-black border-t border-white/10 pt-14 sm:pt-20 md:pt-24 pb-8 sm:pb-10 px-6 sm:px-10 md:px-20 lg:px-28">
          <div className="max-w-[1700px] mx-auto">
            {/* Grid principal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 lg:gap-24 mb-14 sm:mb-16 md:mb-20">
              {/* Logo + Tagline */}
              <div className="col-span-2 md:col-span-1">
                <img
                  src="/images/logoveltlixgrande.png"
                  alt="Veltlix"
                  className="w-[140px] sm:w-[180px] md:w-[200px] mb-5 object-contain"
                />
                <p className="text-white/50 text-[15px] sm:text-[16px] md:text-[18px] leading-relaxed max-w-[400px]">
                  La mejor plataforma para encontrar y comprar tickets de tus eventos favoritos.
                </p>
              </div>

              {/* Eventos */}
              <div>
                <h3 className="text-white font-bold text-[18px] sm:text-[20px] mb-5 sm:mb-6">Eventos</h3>
                <ul className="space-y-3 sm:space-y-4">
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Conciertos
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Deportes
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Teatro
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Festivales
                    </button>
                  </li>
                </ul>
              </div>

              {/* Ayuda */}
              <div>
                <h3 className="text-white font-bold text-[18px] sm:text-[20px] mb-5 sm:mb-6">Ayuda</h3>
                <ul className="space-y-3 sm:space-y-4">
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Centro de Ayuda
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Contacto
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Política de Reembolso
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Términos y Condiciones
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Privacidad
                    </button>
                  </li>
                </ul>
              </div>

              {/* Organizadores */}
              <div>
                <h3 className="text-white font-bold text-[18px] sm:text-[20px] mb-5 sm:mb-6">Organizadores</h3>
                <ul className="space-y-3 sm:space-y-4">
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Vende Tickets
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Crea un Evento
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Recursos
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("events")} className="text-white/50 hover:text-white text-[15px] sm:text-[17px] md:text-[18px] transition-colors">
                      Pricing
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-white/10 pt-8 text-center">
              <p className="text-white/40 text-[14px] sm:text-[16px] md:text-[18px]">
                © {new Date().getFullYear()} Veltlix. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
