/**
 * CryptoPaymentModal Component
 * Modal para gestionar pagos con criptomonedas usando Cryptomus
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  QrCode,
} from "lucide-react";
import {
  cryptomusService,
  CryptomusPaymentStatus,
} from "../../services/cryptomus";
import { toast } from "sonner";

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  orderId: string;
  onSuccess: (txId: string) => void;
  onError?: (error: string) => void;
  additionalData?: string;
}

export function CryptoPaymentModal({
  isOpen,
  onClose,
  amount,
  currency = "USD",
  orderId,
  additionalData,
  onSuccess,
  onError,
}: CryptoPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("USDT");
  const [invoiceUuid, setInvoiceUuid] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Opciones de criptomonedas disponibles
  const cryptoOptions = [
    { value: "USDT", label: "USDT (Tether)", icon: "₮" },
    { value: "BTC", label: "Bitcoin", icon: "₿" },
    { value: "ETH", label: "Ethereum", icon: "Ξ" },
    { value: "LTC", label: "Litecoin", icon: "Ł" },
    { value: "TRX", label: "Tron", icon: "T" },
  ];

  // Crear invoice cuando se abre el modal
  useEffect(() => {
    if (isOpen && !paymentUrl) {
      createInvoice();
    }
  }, [isOpen]);

  // Verificar el estado del pago periódicamente
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (
      invoiceUuid &&
      paymentStatus !== "paid" &&
      paymentStatus !== "cancel" &&
      paymentStatus !== "fail"
    ) {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 10000); // Verificar cada 10 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [invoiceUuid, paymentStatus]);

  const createInvoice = async () => {
    if (!cryptomusService.isConfigured()) {
      toast.error("Cryptomus no está configurado correctamente");
      onError?.("Cryptomus no está configurado");
      return;
    }

    setLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/api/cryptomus/webhook`;
      const returnUrl = `${window.location.origin}/#/confirmation?order=${orderId}`;

      const extraData =
        additionalData ||
        JSON.stringify({
          orderId,
          amount,
          currency,
        });

      const response = await cryptomusService.createCryptoPayment(
        amount,
        currency,
        orderId,
        selectedCrypto,
        callbackUrl,
        returnUrl,
        extraData,
      );

      if (response.state === 0 && response.result) {
        setPaymentUrl(response.result.url);
        setInvoiceUuid(response.result.uuid);
        setPaymentAddress(response.result.address);
        setCryptoAmount(response.result.payer_amount);
        setPaymentStatus(response.result.payment_status);
        setExpiresAt(response.result.expired_at);
        toast.success("Invoice creado exitosamente");
      } else {
        throw new Error(response.message || "Error al crear el invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Error al crear el pago. Intenta nuevamente.");
      onError?.(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!invoiceUuid || checkingStatus) return;

    setCheckingStatus(true);
    try {
      const status = await cryptomusService.checkPaymentStatus(orderId);
      setPaymentStatus(status);

      if (
        status === CryptomusPaymentStatus.PAID ||
        status === CryptomusPaymentStatus.PAID_OVER
      ) {
        toast.success("¡Pago confirmado!");
        onSuccess(invoiceUuid);
      } else if (
        status === CryptomusPaymentStatus.CANCEL ||
        status === CryptomusPaymentStatus.FAIL
      ) {
        toast.error("El pago ha fallado o fue cancelado");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case CryptomusPaymentStatus.PAID:
      case CryptomusPaymentStatus.PAID_OVER:
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Pagado
          </Badge>
        );
      case CryptomusPaymentStatus.CONFIRMING:
        return (
          <Badge className="bg-blue-500">
            <Clock className="w-4 h-4 mr-1" /> Confirmando
          </Badge>
        );
      case CryptomusPaymentStatus.CANCEL:
        return (
          <Badge className="bg-gray-500">
            <XCircle className="w-4 h-4 mr-1" /> Cancelado
          </Badge>
        );
      case CryptomusPaymentStatus.FAIL:
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-4 h-4 mr-1" /> Fallido
          </Badge>
        );
      case CryptomusPaymentStatus.WRONG_AMOUNT:
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-4 h-4 mr-1" /> Monto incorrecto
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-4 h-4 mr-1" /> Pendiente
          </Badge>
        );
    }
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    if (remaining <= 0) return "Expirado";

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            Pago con Criptomonedas
          </DialogTitle>
          <DialogDescription>
            Completa tu pago usando criptomonedas a través de Cryptomus
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Creando invoice de pago...
              </p>
            </div>
          ) : (
            <>
              {/* Estado del pago */}
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estado del pago
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge()}
                    {checkingStatus && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </div>
                {expiresAt &&
                  paymentStatus === CryptomusPaymentStatus.CHECK && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Tiempo restante
                      </p>
                      <p className="text-lg font-bold">{getTimeRemaining()}</p>
                    </div>
                  )}
              </div>

              {/* Información del pago */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Monto a pagar
                    </p>
                    <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{currency}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Monto en cripto
                    </p>
                    <p className="text-2xl font-bold">
                      {cryptoAmount || "---"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCrypto}
                    </p>
                  </div>
                </div>

                {/* Dirección de pago */}
                {paymentAddress && (
                  <div className="p-4 bg-secondary rounded-lg space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Dirección de pago
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-xs break-all">
                        {paymentAddress}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(paymentAddress)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ID de la orden */}
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ID de la orden
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded text-xs break-all">
                      {orderId}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(orderId)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold mb-2">Instrucciones de pago:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    Haz clic en "Ir a la página de pago" para abrir Cryptomus
                  </li>
                  <li>Selecciona tu criptomoneda y red preferida</li>
                  <li>Envía el monto exacto a la dirección proporcionada</li>
                  <li>Espera la confirmación de la transacción</li>
                  <li>Tu pedido será procesado automáticamente</li>
                </ol>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3">
                {paymentUrl && (
                  <Button
                    className="flex-1"
                    onClick={() => window.open(paymentUrl, "_blank")}
                    disabled={
                      paymentStatus === CryptomusPaymentStatus.PAID ||
                      paymentStatus === CryptomusPaymentStatus.PAID_OVER
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ir a la página de pago
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={checkPaymentStatus}
                  disabled={checkingStatus || !invoiceUuid}
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar estado"
                  )}
                </Button>
              </div>

              {/* Nota de seguridad */}
              <div className="text-xs text-muted-foreground text-center">
                <p>🔒 Pago seguro procesado por Cryptomus</p>
                <p>
                  Tus fondos están protegidos por encriptación de nivel bancario
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
