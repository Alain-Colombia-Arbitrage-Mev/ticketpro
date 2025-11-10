import { ArrowLeft, FileText, Shield, UserCheck, CreditCard, AlertCircle, Ban, Copyright, Scale, Mail, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { useRouter } from "../hooks/useRouter";
import { SEOHead } from "../components/common";
import { useLanguage } from "../hooks/useLanguage";

/**
 * TermsPage - Página de Términos y Condiciones
 * Contiene los términos y condiciones de uso de la plataforma vetlix.com
 */
export function TermsPage() {
  const { navigate } = useRouter();
  const { t } = useLanguage();

  return (
    <>
      <SEOHead
        seo={{
          title: "Términos y Condiciones - vetlix.com",
          description: "Términos y condiciones de uso de la plataforma vetlix.com para la compra y venta de tickets de eventos.",
          url: typeof window !== 'undefined' ? window.location.origin : undefined,
          type: "website",
        }}
      />
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border-b border-white/10">
          <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("home")}
              className="mb-6 text-white hover:text-white/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-montserrat">
                Términos y Condiciones
              </h1>
              <p className="text-lg text-white/70 mb-4">
                Acuerdo legal entre usted y vetlix.com
              </p>
              <p className="text-sm text-white/50">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-6xl">
          <div className="space-y-8">

            {/* Aceptación de Términos */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">1. Aceptación de los Términos</h2>
                  <p className="text-white/70">
              Al acceder y utilizar la plataforma vetlix.com, usted acepta estar sujeto a estos Términos y Condiciones 
                    y a todas las leyes y regulaciones aplicables.
                  </p>
                </div>
              </div>
              <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/80 text-sm">
                    <strong>Importante:</strong> Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestros servicios.
            </p>
                </div>
              </div>
          </section>

            {/* Descripción del Servicio */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">2. Descripción del Servicio</h2>
                  <p className="text-white/70">
              vetlix.com es una plataforma digital que facilita la compra y venta de tickets para eventos diversos, 
              incluyendo pero no limitado a conciertos, eventos deportivos, obras de teatro, festivales y eventos familiares. 
                  </p>
                </div>
              </div>
              <div className="space-y-4 mt-4">
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/90 font-semibold mb-1">Rol de Intermediario</p>
                      <p className="text-white/70 text-sm">
                        <strong>vetlix.com actúa ÚNICAMENTE como intermediario/negociador</strong> entre compradores y organizadores de eventos. 
                        No somos los organizadores, promotores, ni propietarios de los eventos listados en nuestra plataforma.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/90 font-semibold mb-1">Exención de Responsabilidad Directa</p>
                      <p className="text-white/70 text-sm">
                        Cualquier modificación, adición, cambio o caso fortuito relacionado con el evento (incluyendo pero no limitado a 
                        cambios de artistas, horarios, ubicación, contenido del evento, o cancelaciones) es <strong>responsabilidad exclusiva 
                        del organizador del evento</strong>, no de vetlix.com.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          </section>

            {/* Registro de Usuario */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30">
                  <UserCheck className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">3. Registro de Usuario</h2>
                  <p className="text-white/70 mb-4">
              Para utilizar ciertos servicios de vetlix.com, deberá crear una cuenta proporcionando información precisa, 
                    actualizada y completa.
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">✓ Requisitos</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Mayor de 18 años</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Información veraz y actualizada</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                  <h3 className="text-lg font-semibold text-orange-400 mb-3">⚠️ Responsabilidades</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>Mantener seguridad de cuenta</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>Notificar uso no autorizado</span>
                    </li>
            </ul>
                </div>
              </div>
          </section>

            {/* Compra de Tickets */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                  <CreditCard className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">4. Compra de Tickets</h2>
                  <p className="text-white/70 mb-4">
              Al realizar una compra a través de vetlix.com, usted acepta:
            </p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Pagar el precio total indicado, incluyendo cargos por servicio y cualquier impuesto aplicable</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Proporcionar información de pago válida y autorizada</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Los tickets adquiridos son personales e intransferibles, salvo que se indique lo contrario</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Revisar toda la información del evento antes de confirmar la compra</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Los precios pueden variar según la demanda y disponibilidad</span>
                </li>
            </ul>
          </section>

            {/* Cancelación y Reembolsos */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">5. Cancelación y Reembolsos</h2>
                  <p className="text-white/70 mb-4">
              Las políticas de cancelación y reembolso dependen del organizador del evento y están sujetas a las 
                    condiciones específicas de cada evento.
                  </p>
                </div>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 mb-4">
                <p className="text-white/80 text-sm">
                  Consulte nuestra{" "}
              <button
                onClick={() => navigate("refund-policy")}
                    className="text-blue-400 hover:text-blue-300 underline font-semibold"
              >
                Política de Devoluciones
              </button>{" "}
                  para información detallada.
            </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Los cargos por servicio y fees de procesamiento <strong>NO son reembolsables</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Si un evento es cancelado por el organizador, se aplicará el reembolso del ticket</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">No se permiten cambios de fecha u hora una vez confirmada la compra</span>
                </li>
            </ul>
          </section>

            {/* Uso de la Plataforma */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30">
                  <Ban className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">6. Uso de la Plataforma</h2>
                  <p className="text-white/70 mb-4">Está estrictamente prohibido:</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">Usar la plataforma para fines ilegales</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">Revender tickets a precios superiores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">Usar bots o métodos automatizados</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">Interferir con el funcionamiento de la plataforma</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">Acceso no autorizado a cuentas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm">Publicar información falsa</span>
                  </li>
            </ul>
              </div>
          </section>

            {/* Propiedad Intelectual y Ley Aplicable */}
            <div className="grid md:grid-cols-2 gap-6">
              <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
                  <Copyright className="h-6 w-6 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold mb-3 font-montserrat">7. Propiedad Intelectual</h2>
                <p className="text-white/70 text-sm">
                  Todo el contenido de vetlix.com está protegido por las leyes de propiedad intelectual de los Estados Unidos y tratados internacionales.
            </p>
          </section>

              <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 mb-4">
                  <Scale className="h-6 w-6 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold mb-3 font-montserrat">10. Ley Aplicable</h2>
                <p className="text-white/70 text-sm">
                  Estos términos se rigen por las leyes de los Estados Unidos de América. Cualquier disputa relacionada con estos términos será resuelta en los tribunales competentes de los Estados Unidos.
                </p>
          </section>
            </div>

            {/* Limitación de Responsabilidad */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30">
                  <Shield className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">8. Limitación de Responsabilidad</h2>
                  <p className="text-white/70 mb-4">
                    Como plataforma de intermediación, vetlix.com <strong>NO asume responsabilidad directa</strong> por:
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">🚫 Responsabilidad del Organizador</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Cambios, modificaciones o adiciones al contenido del evento</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Cancelaciones o postergaciones de eventos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Cambios de artistas, participantes o lineup</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">La calidad, seguridad, contenido o legalidad de los eventos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Problemas en la venue o instalaciones del evento</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                  <h3 className="text-lg font-semibold text-orange-400 mb-3">⚠️ Casos Fortuitos y Fuerza Mayor</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Desastres naturales, pandemias o emergencias sanitarias</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Disturbios, actos de terrorismo o violencia</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Condiciones climáticas adversas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Fallos en infraestructura del venue o ciudad</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/20">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">💻 Limitaciones Técnicas</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Errores técnicos o interrupciones temporales del servicio</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">Pérdidas o daños derivados del uso de la plataforma</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/90 font-semibold mb-2">Importante</p>
                    <p className="text-white/80 text-sm">
                      Al comprar un ticket a través de vetlix.com, usted reconoce y acepta que cualquier reclamo relacionado 
                      con el evento en sí debe ser dirigido directamente al organizador del evento. Nuestra responsabilidad 
                      se limita exclusivamente a facilitar la transacción de compra.
            </p>
                  </div>
                </div>
              </div>
          </section>

            {/* Contacto CTA */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-white" />
              <h2 className="text-3xl font-bold mb-4 font-montserrat">¿Preguntas Legales?</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Nuestro equipo legal está disponible para aclarar cualquier duda sobre estos términos
              </p>
              <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1">Email</p>
                  <p className="text-sm text-white/80">legal@vetlix.com</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1">Teléfono</p>
                  <p className="text-sm text-white/80">+1 (555) 123-4567</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1">Horario</p>
                  <p className="text-sm text-white/80">Mon-Fri 9AM-6PM PST</p>
                </div>
              </div>
          </section>

          </div>
        </div>
      </div>
    </>
  );
}



