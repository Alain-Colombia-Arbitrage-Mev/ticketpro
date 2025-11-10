import { useEffect, useState } from "react";
import { useRouter } from "../hooks/useRouter";
import { validateTicket, markTicketAsUsed, Ticket } from "../utils/tickets/ticketService";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { CheckCircle2, XCircle, Loader2, QrCode } from "lucide-react";
import { TicketComponent } from "../components/tickets/TicketComponent";

export function ValidateTicketPage() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Leer parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('ticketId');
    const code = urlParams.get('code');

    if (ticketId || code) {
      validateTicketOnLoad(ticketId || undefined, code || undefined);
    } else {
      setLoading(false);
      setValidationResult({
        valid: false,
        message: 'No se proporcionó información del ticket'
      });
    }
  }, []);

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

    setValidating(true);
    try {
      const result = await markTicketAsUsed(ticket.id);
      if (result.success) {
        setTicket(result.ticket || null);
        setValidationResult({
          valid: true,
          message: 'Ticket marcado como usado exitosamente'
        });
      } else {
        alert(result.message);
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

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Validación de Ticket
          </h1>
          <p className="text-white/70">
            Escanea el código QR o ingresa el código del ticket
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

            {/* Botón para marcar como usado */}
            {validationResult?.valid && ticket.status === 'issued_unused' && (
              <div className="flex justify-center">
                <Button
                  onClick={handleMarkAsUsed}
                  disabled={validating}
                  className="bg-[#c61619] hover:bg-[#a01316] text-white px-8 py-3"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Marcar como Usado'
                  )}
                </Button>
              </div>
            )}

            {/* Vista previa de la boleta */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-4">Vista Previa de la Boleta</h3>
              <div className="bg-white p-4 rounded-lg">
                <TicketComponent ticket={ticket} />
              </div>
            </div>
          </div>
        )}

        {/* Botón para volver */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("home")}
            variant="outline"
            className="border-white/20 !text-white hover:!bg-white/10"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}

