/**
 * StripePaymentButton Component
 * Botón para iniciar el proceso de pago con Stripe Checkout
 */

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, CreditCard } from "lucide-react";
import {
  stripeService,
  type StripeCheckoutItem,
} from "../../services/stripe";
import { toast } from "sonner";

interface StripePaymentButtonProps {
  items: StripeCheckoutItem[];
  buyerEmail: string;
  buyerFullName?: string;
  buyerAddress?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function StripePaymentButton({
  items,
  buyerEmail,
  buyerFullName,
  buyerAddress,
  successUrl,
  cancelUrl,
  metadata,
  disabled,
  className,
  children,
}: StripePaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!stripeService.isConfigured()) {
      toast.error("Stripe no está configurado correctamente");
      return;
    }

    if (!items || items.length === 0) {
      toast.error("No hay items para comprar");
      return;
    }

    if (!buyerEmail) {
      toast.error("Se requiere un email válido");
      return;
    }

    setLoading(true);

    try {
      // URLs por defecto
      const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
      const defaultSuccessUrl =
        successUrl || `${baseUrl}/#/confirmation?session_id={CHECKOUT_SESSION_ID}`;
      const defaultCancelUrl =
        cancelUrl || `${baseUrl}/#/payment-cancelled`;

      // Redirigir a Stripe Checkout
      await stripeService.redirectToCheckout({
        items,
        buyerEmail,
        buyerFullName,
        buyerAddress,
        successUrl: defaultSuccessUrl,
        cancelUrl: defaultCancelUrl,
        metadata,
      });
    } catch (error) {
      console.error("Error al iniciar checkout:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al procesar el pago. Intenta nuevamente."
      );
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading || !buyerEmail}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children || "Pagar con Tarjeta"}
        </>
      )}
    </Button>
  );
}
