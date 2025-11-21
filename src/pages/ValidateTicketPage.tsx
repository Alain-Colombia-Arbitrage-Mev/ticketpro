import { useEffect, useState } from "react";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { validateTicket, validateTicketByHoster, Ticket } from "../utils/tickets/ticketService";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { CheckCircle2, XCircle, Loader2, QrCode, Shield, LogIn } from "lucide-react";

export function ValidateTicketPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const isAuthenticated = !!user && !!user.id && !!user.email;
  const isAuthorized = isAuthenticated && user && (user.role === 'hoster' || user.role === 'admin');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [securityPin, setSecurityPin] = useState('');

  // 🔒 PROTECCIÓN: Verificar autenticación y rol ANTES de cargar ticket
  useEffect(() => {
    if (!isAuthenticated) {
      // No autenticado: guardar URL y redirigir a login
      setLoading(false);
      return;
    }

    if (!isAuthorized) {
      // Autenticado pero sin rol correcto
      setLoading(false);
      setValidationResult({
        valid: false,
        message: 'Acceso denegado: Solo usuarios con rol de hoster o admin pueden validar tickets'
      });
      return;
    }

    // Usuario autorizado: proceder a validar ticket
    loadAndValidateTicket();
  }, [isAuthenticated, isAuthorized]);

  const loadAndValidateTicket = () => {
    // Leer parámetros de la URL (tanto del hash como de la query string)
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Intentar leer del hash primero (formato: #validate-ticket?ticketId=...&code=...)
    let ticketId: string | null = null;
    let code: string | null = null;
    
    if (hash.includes('?')) {
      const hashParams = new URLSearchParams(hash.split('?')[1]);
      ticketId = hashParams.get('ticketId');
      code = hashParams.get('code');
    }
    
    // Si no se encontraron en el hash, intentar en la query string
    if (!ticketId && !code) {
      ticketId = urlParams.get('ticketId');
      code = urlParams.get('code');
    }

    if (ticketId || code) {
      validateTicketOnLoad(ticketId || undefined, code || undefined);
    } else {
      setLoading(false);
      setValidationResult({
        valid: false,
        message: 'No se proporcionó información del ticket'
      });
    }
  };

  const validateTicketOnLoad = async (ticketId?: string, code?: string) => {
    try {
      setLoading(true);
      const result = await validateTicket(ticketId, code);
      setValidationResult(result);
      if (result.ticket) {
        setTicket(result.ticket);
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      setValidationResult({
        valid: false,
        message: 'Error al validar el ticket'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!ticket) return;

    // Verificar autenticación y rol
    if (!isAuthenticated || !user) {
      const shouldLogin = confirm(
        'Debes iniciar sesión con una cuenta de hoster o admin para validar tickets.\n\n¿Deseas iniciar sesión?'
      );
      if (shouldLogin) {
        navigate("login");
      }
      return;
    }

    // Verificar rol
    if (user.role !== 'hoster' && user.role !== 'admin') {
      alert('Solo los usuarios con rol de hoster o admin pueden validar tickets.');
      return;
    }

    // Verificar PIN de seguridad
    if (!securityPin) {
      alert('Por favor ingresa el PIN de seguridad del ticket');
      return;
    }

    if (securityPin !== ticket.security_pin) {
      alert('❌ PIN de seguridad incorrecto. Por favor verifica el PIN en el ticket físico.');
      setSecurityPin(''); // Limpiar el campo
      return;
    }

    // Confirmar antes de marcar como usado
    const confirmMessage = `¿Estás seguro de que deseas marcar este ticket como usado?\n\n` +
      `Evento: ${ticket.event_name}\n` +
      `Código: ${ticket.ticket_code}\n` +
      `Comprador: ${ticket.buyer_full_name}\n\n` +
      `Esta acción no se puede deshacer.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setValidating(true);
    try {
      // Obtener el token de acceso de Supabase si está disponible
      // Esto requiere que el usuario esté autenticado con Supabase
      let accessToken: string | undefined;
      try {
        const { supabase: supabaseClient } = await import('../utils/supabase/client');
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        accessToken = session?.access_token;
      } catch (err) {
        console.warn('Could not get Supabase session token:', err);
      }
      
      // Usar validateTicketByHoster que requiere autenticación
      const result = await validateTicketByHoster(
        ticket.id,
        ticket.ticket_code,
        user.id,
        user.email || '',
        accessToken
      );
      
      if (result.success && result.validated) {
        setTicket(result.ticket || null);
        setValidationResult({
          valid: true,
          message: '✅ Ticket validado y marcado como usado exitosamente'
        });
      } else {
        alert(result.message || 'Error al validar el ticket');
      }
    } catch (error) {
      console.error('Error marking ticket as used:', error);
      alert('Error al marcar el ticket como usado');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Validando ticket...</p>
        </div>
      </div>
    );
  }

  // 🔒 PANTALLA DE LOGIN REQUERIDO
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 !bg-white/5 border-white/20">
          <div className="text-center">
            <Shield className="h-16 w-16 text-[#c61619] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Autenticación Requerida
            </h2>
            <p className="text-white/80 mb-6">
              Para validar tickets debes iniciar sesión con una cuenta de <strong>hoster</strong> o <strong>admin</strong>.
            </p>
            <Button
              onClick={() => navigate("login")}
              className="w-full bg-[#c61619] hover:bg-[#a01316] text-white"
              size="lg"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Iniciar Sesión
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 🔒 PANTALLA DE ACCESO DENEGADO
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 !bg-red-500/10 border-red-500/50">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Acceso Denegado
            </h2>
            <p className="text-white/80 mb-2">
              Solo usuarios con rol de <strong>hoster</strong> o <strong>admin</strong> pueden acceder a esta página.
            </p>
            <p className="text-white/60 text-sm mb-6">
              Tu rol actual: <strong>{user?.role || 'usuario'}</strong>
            </p>
            <Button
              onClick={() => navigate("home")}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              ← Regresar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Validación de Ticket
          </h1>
          <p className="text-sm sm:text-base text-white/70">
            Información del ticket escaneado
          </p>
        </div>

        {/* Resultado de validación */}
        {validationResult && (
          <Card className={`p-6 mb-8 ${
            validationResult.valid 
              ? '!bg-green-500/10 border-green-500/50' 
              : '!bg-red-500/10 border-red-500/50'
          }`}>
            <div className="flex items-start gap-4">
              {validationResult.valid ? (
                <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  validationResult.valid ? 'text-green-500' : 'text-red-500'
                }`}>
                  {validationResult.valid ? 'Ticket Válido' : 'Ticket Inválido'}
                </h3>
                <p className="text-white/80">
                  {validationResult.message}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Información del ticket */}
        {ticket && (
          <div className="space-y-6">
            <Card className="p-6 !bg-white/5 border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Información del Ticket
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
                <div>
                  <p className="text-sm text-white/60">Código</p>
                  <p className="font-semibold">{ticket.ticket_code}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Evento</p>
                  <p className="font-semibold">{ticket.event_name}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Fecha</p>
                  <p className="font-semibold">{ticket.event_date}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Estado</p>
                  <p className="font-semibold capitalize">
                    {ticket.status === 'issued_unused' ? 'Sin usar' : 
                     ticket.status === 'issued_used' ? 'Usado' : 
                     ticket.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Comprador</p>
                  <p className="font-semibold">{ticket.buyer_full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <p className="font-semibold">{ticket.buyer_email}</p>
                </div>
              </div>
            </Card>

            {/* Tarjeta visual del ticket con detalles adicionales */}
            <Card className="p-6 !bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-400" />
                Detalles del Ticket
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white/80">
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">Asiento</p>
                  <p className="text-xl font-bold text-white">{ticket.seat || 'General'}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">Puerta</p>
                  <p className="text-xl font-bold text-white">{ticket.gate || 'Principal'}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">Clase</p>
                  <p className="text-xl font-bold text-white">{ticket.ticket_class || 'General'}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/50 mb-1">Código de Ticket</p>
                <p className="text-2xl font-mono font-bold text-white tracking-wider">{ticket.ticket_code}</p>
              </div>
            </Card>

            {/* Verificación PIN y Botón para marcar como usado */}
            {validationResult?.valid && ticket.status === 'issued_unused' && (
              <Card className="p-6 !bg-yellow-500/10 border-yellow-500/50">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-2">
                    🔒 Verificación de Seguridad
                  </h3>
                  <p className="text-sm text-white/70 mb-4">
                    Ingresa el PIN de seguridad que aparece en el ticket físico del comprador
                  </p>
                  <div className="max-w-xs mx-auto">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      PIN de Seguridad (4 dígitos)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="####"
                      className="w-full px-4 py-3 text-center text-2xl font-mono font-bold bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-white/90 mb-2 font-semibold">
                    Este ticket está sin usar
                  </p>
                  <p className="text-sm text-white/70 mb-4">
                    Después de verificar el PIN, haz clic para marcarlo como usado
                  </p>
                  <div className="flex justify-center">
                    <Button
                      onClick={handleMarkAsUsed}
                      disabled={validating || securityPin.length !== 4}
                      className="bg-[#c61619] hover:bg-[#a01316] text-white px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {validating ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5 mr-2" />
                          Validar y Marcar como Usado
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Mensaje si ya está usado */}
            {ticket && ticket.status === 'issued_used' && (
              <Card className="p-6 !bg-red-500/10 border-red-500/50">
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-500 mb-2">
                    Ticket Ya Usado
                  </h3>
                  <p className="text-white/80">
                    Este ticket ya fue marcado como usado
                    {ticket.used_at && (
                      <span className="block mt-2 text-sm text-white/60">
                        Fecha de uso: {new Date(ticket.used_at).toLocaleString('es-ES')}
                      </span>
                    )}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Botón para volver */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("home")}
            variant="outline"
            className="border-white/20 !text-white hover:!bg-white/10"
          >
            ← Regresar
          </Button>
        </div>
      </div>
    </div>
  );
}

