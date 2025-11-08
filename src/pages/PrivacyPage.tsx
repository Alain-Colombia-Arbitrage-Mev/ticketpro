import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useRouter } from "../hooks/useRouter";
import { SEOHead } from "../components/common";
import { useLanguage } from "../hooks/useLanguage";

/**
 * PrivacyPage - Página de Política de Privacidad
 * Contiene información sobre cómo vetlix.com recopila, usa y protege la información personal
 */
export function PrivacyPage() {
  const { navigate } = useRouter();
  const { t } = useLanguage();

  return (
    <>
      <SEOHead
        seo={{
          title: "Política de Privacidad - vetlix.com",
          description: "Política de privacidad de vetlix.com sobre cómo recopilamos, usamos y protegemos su información personal.",
          url: typeof window !== 'undefined' ? window.location.origin : undefined,
          type: "website",
        }}
      />
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("home")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
          
          <p className="text-gray-600 mb-6">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
            <p className="mb-4">
              vetlix.com ("nosotros", "nuestro" o "la plataforma") se compromete a proteger su privacidad. Esta Política 
              de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información personal cuando 
              utiliza nuestros servicios, de acuerdo con las leyes federales y estatales de privacidad de los Estados Unidos, 
              incluyendo CCPA (California Consumer Privacy Act) y otras regulaciones aplicables.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Información que Recopilamos</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Información Personal</h3>
            <p className="mb-4">Recopilamos información que usted nos proporciona directamente:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Información de pago (procesada de forma segura a través de proveedores de terceros)</li>
              <li>Dirección de facturación</li>
              <li>Información de asistentes a eventos (si aplica)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Información de Uso</h3>
            <p className="mb-4">Recopilamos automáticamente información sobre cómo utiliza nuestra plataforma:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Dirección IP</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Páginas visitadas y tiempo de permanencia</li>
              <li>Búsquedas realizadas</li>
              <li>Eventos visualizados y comprados</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Cookies y Tecnologías Similares</h3>
            <p className="mb-4">
              Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el tráfico del sitio 
              y personalizar contenido. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar 
              la funcionalidad del sitio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Uso de la Información</h2>
            <p className="mb-4">Utilizamos su información personal para:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Procesar y gestionar sus compras de tickets</li>
              <li>Enviar confirmaciones de compra y tickets electrónicos</li>
              <li>Comunicarnos con usted sobre su cuenta y transacciones</li>
              <li>Enviar notificaciones sobre eventos que puedan interesarle (con su consentimiento)</li>
              <li>Mejorar nuestros servicios y experiencia del usuario</li>
              <li>Prevenir fraudes y proteger la seguridad de la plataforma</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
              <li>Responder a consultas y solicitudes de soporte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Compartir Información</h2>
            <p className="mb-4">No vendemos su información personal. Podemos compartir su información con:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Organizadores de eventos:</strong> Información necesaria para validar su entrada y gestionar el evento
              </li>
              <li>
                <strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar (procesamiento de pagos, hosting, análisis)
              </li>
              <li>
                <strong>Autoridades legales:</strong> Cuando sea requerido por ley o para proteger nuestros derechos
              </li>
              <li>
                <strong>En caso de fusión o adquisición:</strong> Si vetlix.com es adquirido, sus datos pueden transferirse
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Seguridad de los Datos</h2>
            <p className="mb-4">
              Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información personal 
              contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encriptación SSL/TLS para transmisiones de datos</li>
              <li>Almacenamiento seguro de información sensible</li>
              <li>Acceso restringido a información personal</li>
              <li>Monitoreo regular de sistemas de seguridad</li>
              <li>Cumplimiento con estándares de seguridad PCI DSS para pagos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Sus Derechos (ARCO)</h2>
            <p className="mb-4">
              De acuerdo con la Ley Federal de Protección de Datos Personales, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Acceso:</strong> Conocer qué datos personales tenemos sobre usted y cómo los utilizamos
              </li>
              <li>
                <strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos
              </li>
              <li>
                <strong>Cancelación:</strong> Solicitar la eliminación de sus datos cuando ya no sean necesarios
              </li>
              <li>
                <strong>Oposición:</strong> Oponerse al tratamiento de sus datos para fines específicos
              </li>
            </ul>
            <p className="mb-4">
              Para ejercer estos derechos, puede contactarnos en: <strong>privacy@ticketpro.com</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Retención de Datos</h2>
            <p className="mb-4">
              Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos descritos 
              en esta política, a menos que la ley requiera o permita un período de retención más largo. Los datos de 
              transacciones se conservan según los requisitos legales y fiscales aplicables.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Transferencias Internacionales</h2>
            <p className="mb-4">
              Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de los Estados Unidos. Al utilizar nuestros 
              servicios, usted consiente la transferencia de su información a estos países. Nos aseguramos de que estos 
              proveedores cumplan con estándares de protección de datos adecuados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Menores de Edad</h2>
            <p className="mb-4">
              Nuestros servicios están dirigidos a usuarios mayores de 18 años. No recopilamos intencionalmente información 
              personal de menores de edad. Si descubrimos que hemos recopilado información de un menor, tomaremos medidas 
              para eliminarla inmediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Cambios a esta Política</h2>
            <p className="mb-4">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios significativos 
              mediante un aviso en nuestra plataforma o por correo electrónico. La fecha de "Última actualización" indica 
              cuándo se realizó la última revisión.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contacto</h2>
            <p className="mb-4">
              Si tiene preguntas, comentarios o solicitudes relacionadas con esta Política de Privacidad o el manejo de 
              sus datos personales, puede contactarnos:
            </p>
            <ul className="list-none pl-0 mb-4">
              <li><strong>Email:</strong> privacy@vetlix.com</li>
              <li><strong>Teléfono:</strong> +1 (555) 123-4567</li>
              <li><strong>Dirección:</strong> Los Angeles, California, United States</li>
              <li><strong>Horario de atención:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM (PST)</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}



