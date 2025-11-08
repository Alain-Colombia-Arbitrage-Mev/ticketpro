import { ArrowLeft, AlertCircle, Clock, CheckCircle, XCircle, RefreshCw, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { useRouter } from "../hooks/useRouter";
import { SEOHead } from "../components/common";
import { useLanguage } from "../hooks/useLanguage";

/**
 * RefundPolicyPage - Página de Política de Devoluciones
 * Contiene información sobre las políticas de reembolso y devolución de tickets
 */
export function RefundPolicyPage() {
  const { navigate } = useRouter();
  const { t } = useLanguage();

  return (
    <>
      <SEOHead
        seo={{
          title: "Política de Devoluciones - vetlix.com",
          description: "Política de devolución y reembolso de tickets de eventos en vetlix.com.",
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
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-montserrat">
                Política de Devoluciones y Reembolsos
              </h1>
              <p className="text-lg text-white/70 mb-4">
                Transparencia y protección en cada compra
              </p>
              <p className="text-sm text-white/50">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-6xl">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white mb-2">Importante</p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Las políticas de devolución pueden variar según el organizador del evento. 
                    Esta política general se aplica cuando el organizador no tiene una política específica. Siempre revise 
                    los términos específicos del evento antes de realizar su compra.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white mb-2">vetlix.com es un Intermediario</p>
                  <p className="text-white/80 text-sm leading-relaxed mb-2">
                    <strong>vetlix.com actúa ÚNICAMENTE como plataforma de intermediación/negociación</strong> entre compradores 
                    y organizadores de eventos. No somos responsables de:
                  </p>
                  <ul className="space-y-1 text-white/70 text-sm ml-4">
                    <li>• Cambios, modificaciones o adiciones realizadas por el organizador del evento</li>
                    <li>• Cancelaciones o postergaciones debido a casos fortuitos o fuerza mayor</li>
                    <li>• Calidad, contenido o experiencia del evento en sí</li>
                    <li>• Cualquier circunstancia relacionada directamente con el organizador o la venue</li>
                  </ul>
                  <p className="text-white/80 text-sm mt-3">
                    Nuestra responsabilidad se limita exclusivamente al procesamiento de la transacción de compra del ticket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-6xl">

          {/* Secciones de contenido con diseño moderno */}
          <div className="space-y-8">
            
            {/* Cancelación por el Organizador */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">1. Cancelación por el Organizador</h2>
                  <p className="text-white/70 mb-4">
                    Si un evento es cancelado por el organizador antes de la fecha programada, los compradores recibirán 
                    un reembolso del precio del ticket.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">✓ Se Reembolsa:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">Precio completo del ticket</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">✗ NO Se Reembolsa:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">Cargos por servicio de la plataforma</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">Fees de procesamiento de pago</span>
                    </li>
                  </ul>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">El reembolso se procesará automáticamente dentro de 5-10 días hábiles</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">El reembolso se realizará al <strong>mismo método de pago</strong> utilizado en la compra</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Recibirá una notificación por correo electrónico cuando se procese el reembolso</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80"><strong>Importante:</strong> No se reembolsa a terceros. El reembolso se realiza únicamente al comprador original</span>
                </li>
              </ul>
            </section>

            {/* Postergación de Eventos */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <RefreshCw className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">2. Postergación de Eventos</h2>
                  <p className="text-white/70 mb-4">
                    Si un evento es pospuesto a una nueva fecha (por cualquier razón, incluyendo desastres naturales):
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Eventos Aplazados</h3>
                    <p className="text-white/80 text-sm">
                      En caso de <strong>desastres naturales</strong> u otras circunstancias de fuerza mayor, 
                      el organizador puede aplazar la fecha del evento. Sus tickets permanecerán válidos para la nueva fecha.
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Sus tickets seguirán siendo válidos para la nueva fecha programada</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Si no puede asistir a la nueva fecha, puede solicitar un reembolso dentro de 30 días posteriores al anuncio</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">El reembolso incluirá <strong>solo el precio del ticket</strong>, NO incluye cargos por servicio ni fees de procesamiento</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">El reembolso se realiza al <strong>mismo método de pago</strong> utilizado en la compra original</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Debe contactarnos para solicitar el reembolso en caso de postergación</span>
                </li>
              </ul>
            </section>

            {/* Cancelación por el Cliente */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30">
                  <XCircle className="h-6 w-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">3. Cancelación por el Cliente</h2>
                  <p className="text-white/70 mb-4">
                    En general, los tickets de eventos son <strong>no reembolsables</strong> una vez adquiridos, excepto 
                    en las siguientes circunstancias:
                  </p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">El evento es cancelado por el organizador</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">El evento es pospuesto y usted no puede asistir a la nueva fecha</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">El evento es modificado significativamente (ej: cambio de artista principal)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">Políticas específicas del organizador permiten reembolsos</span>
                </li>
              </ul>
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-2 text-white">Solicitudes Especiales</h3>
                <p className="text-white/70 text-sm">
                  Puede solicitar un reembolso por razones especiales (emergencias médicas, fallecimiento, etc.). 
                  Estas solicitudes serán evaluadas caso por caso y requerirán documentación apropiada.
                </p>
              </div>
            </section>

            {/* Plazos de Reembolso */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 font-montserrat">4. Plazos de Reembolso</h2>
                  <p className="text-white/70 mb-4">Los tiempos de procesamiento son:</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                  <p className="text-purple-400 font-semibold mb-1">Automáticos</p>
                  <p className="text-2xl font-bold text-white mb-1">5-10 días</p>
                  <p className="text-white/60 text-sm">hábiles</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                  <p className="text-purple-400 font-semibold mb-1">Solicitados</p>
                  <p className="text-2xl font-bold text-white mb-1">10-15 días</p>
                  <p className="text-white/60 text-sm">después de aprobación</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
                  <p className="text-purple-400 font-semibold mb-1">Bancario</p>
                  <p className="text-2xl font-bold text-white mb-1">3-5 días</p>
                  <p className="text-white/60 text-sm">adicionales</p>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Los reembolsos se procesarán al método de pago original. Si ese método ya no está disponible, 
                contactaremos para coordinar una alternativa.
              </p>
            </section>

            {/* Resumen Adicional */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 font-montserrat">Resumen de Políticas</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Casos Reembolsables (Solo Ticket)
                  </h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li>✓ Cancelación por el organizador</li>
                    <li>✓ Postergación (dentro de 30 días)</li>
                    <li>✓ Cambios significativos en el evento</li>
                    <li>✓ Desastres naturales (evento aplazado)</li>
                    <li>✓ Emergencias médicas documentadas</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-400" />
                    No Reembolsables
                  </h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li>✗ Cambio de opinión</li>
                    <li>✗ Razones personales sin documentar</li>
                    <li>✗ Problemas de transporte</li>
                    <li>✗ Cargos por servicio</li>
                    <li>✗ Fees de procesamiento</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">Importante</h3>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li>• Los reembolsos se realizan <strong>únicamente al comprador original</strong>, no a terceros</li>
                      <li>• Los reembolsos se procesan al <strong>mismo método de pago</strong> utilizado en la compra</li>
                      <li>• Los <strong>cargos por servicio y fees de procesamiento</strong> no son reembolsables en ningún caso</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Contacto CTA */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 font-montserrat">¿Necesitas Ayuda?</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Nuestro equipo está listo para ayudarte con cualquier pregunta sobre reembolsos
              </p>
              <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-semibold mb-1">Email</p>
                  <p className="text-sm text-white/80">refunds@vetlix.com</p>
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




