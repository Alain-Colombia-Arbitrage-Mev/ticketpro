import { useState, useEffect, useRef } from "react";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { validateTicketByHoster, Ticket } from "../utils/tickets/ticketService";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CheckCircle2, XCircle, Loader2, QrCode, Scan, AlertCircle, Shield } from "lucide-react";
import { TicketComponent } from "../components/tickets/TicketComponent";
import { Html5QrcodeScanner } from "html5-qrcode";

export function HosterValidatePage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketCode, setTicketCode] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    validated: boolean;
    message: string;
  } | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrCodeRegionId = "qr-reader";

  // Verificar que el usuario tenga rol de hoster
  useEffect(() => {
    if (user && user.role !== 'hoster' && user.role !== 'admin') {
      alert('No tienes permisos para acceder a esta página. Se requiere rol de hoster o admin.');
      navigate("home");
    }
  }, [user, navigate]);

  // Limpiar escáner al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const handleManualValidation = async () => {
    if (!ticketId && !ticketCode) {
      alert('Por favor ingresa el ID del ticket o el código del ticket');
      return;
    }

    if (!user || (user.role !== 'hoster' && user.role !== 'admin')) {
      alert('No tienes permisos para validar tickets');
      return;
    }

    setLoading(true);
    setValidationResult(null);
    setTicket(null);

    try {
      // Si tenemos ticketId, extraer el código de la URL si es necesario
      let finalTicketId = ticketId;
      let finalTicketCode = ticketCode;

      // Si el ticketId es una URL completa, extraer los parámetros
      if (ticketId.includes('validate-ticket')) {
        const url = new URL(ticketId.startsWith('http') ? ticketId : `https://example.com/${ticketId}`);
        const params = new URLSearchParams(url.search);
        finalTicketId = params.get('ticketId') || ticketId;
        finalTicketCode = params.get('code') || ticketCode;
      }

      const result = await validateTicketByHoster(
        finalTicketId,
        finalTicketCode,
        user.id,
        user.email
      );

      setValidationResult(result);
      if (result.ticket) {
        setTicket(result.ticket);
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      setValidationResult({
        success: false,
        validated: false,
        message: 'Error al validar el ticket'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    if (scannerRef.current) {
      return; // Ya está escaneando
    }

    setScanMode(true);
    setValidationResult(null);
    setTicket(null);

    // Esperar un momento para que el DOM se actualice
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          qrCodeRegionId,
          {
            qrbox: {
              width: 300,
              height: 300
            },
            fps: 10,
            aspectRatio: 1.0,
            supportedScanTypes: []
          },
          false // verbose
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText, decodedResult) => {
            // QR code detectado
            handleQRCodeDetected(decodedText);
          },
          (errorMessage) => {
            // Ignorar errores de escaneo (solo mostrar cuando no encuentra QR)
            // console.log('QR Code scan error:', errorMessage);
          }
        );
      } catch (error) {
        console.error('Error initializing QR scanner:', error);
        alert('Error al iniciar el escáner. Por favor, intenta de nuevo.');
        setScanMode(false);
      }
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanMode(false);
  };

  const handleQRCodeDetected = (qrData: string) => {
    // Detener el escáner inmediatamente
    stopScanning();

    // Mostrar mensaje de que se detectó el QR
    setValidationResult({
      success: false,
      validated: false,
      message: 'QR Code detectado, validando ticket...'
    });
    setLoading(true);

    // Parsear URL del QR code
    try {
      // Si es una URL completa, extraer los parámetros
      let url: URL;
      if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
        url = new URL(qrData);
      } else if (qrData.includes('validate-ticket')) {
        url = new URL(qrData.startsWith('http') ? qrData : `https://example.com/${qrData}`);
      } else {
        // Si no es una URL, tratar como código directo
        setTicketCode(qrData.toUpperCase());
        setTicketId("");
        // Validar automáticamente después de un momento
        setTimeout(() => {
          handleManualValidation();
        }, 300);
        return;
      }

      const params = new URLSearchParams(url.search);
      const extractedTicketId = params.get('ticketId');
      const extractedCode = params.get('code');

      if (extractedTicketId) {
        setTicketId(extractedTicketId);
      }
      if (extractedCode) {
        setTicketCode(extractedCode.toUpperCase());
      }

      // Validar automáticamente
      setTimeout(() => {
        handleManualValidation();
      }, 300);
    } catch (error) {
      // Si no es una URL válida, tratar como código directo
      setTicketCode(qrData.toUpperCase());
      setTicketId("");
      setTimeout(() => {
        handleManualValidation();
      }, 300);
    }
  };

  if (!user || (user.role !== 'hoster' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 !bg-black border-white/20 max-w-md">
          <div className="text-center">
            <Shield className="h-16 w-16 !text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold !text-white mb-2">Acceso Denegado</h2>
            <p className="!text-white/70 mb-6">
              No tienes permisos para acceder a esta página. Se requiere rol de hoster o admin.
            </p>
            <Button
              onClick={() => navigate("home")}
              className="bg-[#c61619] hover:bg-[#a01316] text-white"
            >
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-[#c61619]" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Validación de Entradas
            </h1>
          </div>
          <p className="text-white/70">
            Escanea el código QR o ingresa el código del ticket para validar la entrada
          </p>
          <p className="text-sm text-white/50 mt-2">
            Usuario: {user.name} ({user.email}) - Rol: {user.role}
          </p>
        </div>

        {/* Formulario de validación */}
        <Card className="p-6 mb-8 !bg-white/5 border-white/20">
          <div className="space-y-4">
            <div>
              <Label htmlFor="ticketId" className="!text-white/80">
                ID del Ticket (opcional)
              </Label>
              <Input
                id="ticketId"
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="UUID del ticket o URL completa del QR"
                className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="ticketCode" className="!text-white/80">
                Código del Ticket *
              </Label>
              <Input
                id="ticketCode"
                type="text"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                placeholder="Ej: ZPBU04RU"
                className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 font-mono"
                maxLength={8}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleManualValidation}
                disabled={loading || validating || (!ticketId && !ticketCode)}
                className="flex-1 bg-[#c61619] hover:bg-[#a01316] text-white"
              >
                {loading || validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Validar Ticket
                  </>
                )}
              </Button>

              {!scanMode ? (
                <Button
                  onClick={handleQRScan}
                  variant="outline"
                  className="border-white/20 !text-white hover:!bg-white/10"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Escanear QR
                </Button>
              ) : (
                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="border-red-500/50 !text-red-400 hover:!bg-red-500/10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Detener Escaneo
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Vista de escáner QR */}
        {scanMode && (
          <Card className="p-6 mb-8 !bg-white/5 border-white/20">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Escáner QR
              </h3>
              <p className="text-white/70 text-sm">
                Apunta la cámara al código QR del ticket
              </p>
            </div>
            <div 
              id={qrCodeRegionId} 
              className="w-full"
              style={{
                minHeight: '400px'
              }}
            ></div>
            <p className="text-center text-white/50 mt-4 text-xs">
              El escáner detectará automáticamente el código QR y validará el ticket
            </p>
            
            {/* Estilos personalizados para el escáner */}
            <style>{`
              #${qrCodeRegionId} {
                background: transparent !important;
              }
              #${qrCodeRegionId} video {
                border-radius: 8px;
                background: #000;
              }
              #${qrCodeRegionId} select,
              #${qrCodeRegionId} button {
                background: #1a1a1a !important;
                color: white !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 6px !important;
              }
              #${qrCodeRegionId} select:hover,
              #${qrCodeRegionId} button:hover {
                background: #2a2a2a !important;
              }
              #${qrCodeRegionId} .html5-qrcode-element {
                color: white !important;
              }
            `}</style>
          </Card>
        )}

        {/* Resultado de validación */}
        {validationResult && (
          <Card className={`p-6 mb-8 ${
            validationResult.success && validationResult.validated
              ? '!bg-green-500/10 border-green-500/50' 
              : validationResult.success && !validationResult.validated
              ? '!bg-yellow-500/10 border-yellow-500/50'
              : '!bg-red-500/10 border-red-500/50'
          }`}>
            <div className="flex items-start gap-4">
              {validationResult.success && validationResult.validated ? (
                <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
              ) : validationResult.success && !validationResult.validated ? (
                <AlertCircle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  validationResult.success && validationResult.validated
                    ? 'text-green-500' 
                    : validationResult.success && !validationResult.validated
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}>
                  {validationResult.success && validationResult.validated
                    ? 'Ticket Validado Exitosamente' 
                    : validationResult.success && !validationResult.validated
                    ? 'Ticket Válido (Ya Usado)'
                    : 'Error en la Validación'}
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
                  <p className="font-semibold font-mono">{ticket.ticket_code}</p>
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
                {ticket.seat_number && (
                  <div>
                    <p className="text-sm text-white/60">Asiento</p>
                    <p className="font-semibold">{ticket.seat_number}</p>
                  </div>
                )}
                {ticket.gate_number && (
                  <div>
                    <p className="text-sm text-white/60">Puerta</p>
                    <p className="font-semibold">{ticket.gate_number}</p>
                  </div>
                )}
                {ticket.used_at && (
                  <div>
                    <p className="text-sm text-white/60">Usado el</p>
                    <p className="font-semibold">
                      {new Date(ticket.used_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                )}
                {ticket.used_by && (
                  <div>
                    <p className="text-sm text-white/60">Validado por</p>
                    <p className="font-semibold">{ticket.used_by}</p>
                  </div>
                )}
              </div>
            </Card>

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

