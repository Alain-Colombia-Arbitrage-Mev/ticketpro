/**
 * Stripe Service
 * Servicio para interactuar con Stripe a través de Supabase Edge Functions
 */

import { env } from "../config/env";
import { getSupabaseClient } from "../utils/supabase/client";

export interface StripeCheckoutItem {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventCategory?: string;
  ticketType?: string;
  seatType?: string;
  price: number;
  quantity: number;
}

export interface CreateCheckoutSessionRequest {
  items: StripeCheckoutItem[];
  buyerEmail: string;
  buyerFullName?: string;
  buyerAddress?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionResponse {
  ok: boolean;
  sessionId?: string;
  url?: string;
  orderId?: string;
  error?: string;
}

export interface VerifySessionResponse {
  ok: boolean;
  session?: {
    id: string;
    payment_status: string;
    payment_intent?: string;
    customer_email?: string;
    amount_total?: number;
    currency?: string;
  };
  orderId?: string;
  isPaid?: boolean;
  hasTickets?: boolean;
  isComplete?: boolean;
  ticketsCount?: number;
  tickets?: any[];
  error?: string;
}

class StripeService {
  private supabaseUrl: string;
  private functionPath = "/functions/v1/stripe-create-checkout";

  constructor() {
    // Construir URL de Supabase
    const projectId = env.supabase.projectId;
    this.supabaseUrl = `https://${projectId}.supabase.co`;
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!env.stripe.publishableKey && !!env.supabase.projectId;
  }

  /**
   * Crea una sesión de checkout de Stripe
   */
  async createCheckoutSession(
    request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        error: "Stripe no está configurado correctamente",
      };
    }

    try {
      const response = await fetch(`${this.supabaseUrl}${this.functionPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.supabase.anonKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: CreateCheckoutSessionResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error al crear la sesión",
      };
    }
  }

  /**
   * Redirige al usuario a la página de checkout de Stripe
   */
  async redirectToCheckout(
    request: CreateCheckoutSessionRequest
  ): Promise<void> {
    const result = await this.createCheckoutSession(request);

    if (result.ok && result.url) {
      // Redirigir a Stripe Checkout
      window.location.href = result.url;
    } else {
      throw new Error(result.error || "No se pudo crear la sesión de pago");
    }
  }

  /**
   * Verifica el estado de una sesión de checkout de Stripe
   * Retorna información sobre el pago y los tickets asociados
   */
  async verifySession(sessionId: string): Promise<VerifySessionResponse> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        error: "Stripe no está configurado correctamente",
      };
    }

    try {
      // Use the user's JWT when available, fall back to anon key
      let token = env.supabase.anonKey;
      try {
        const { data } = await getSupabaseClient().auth.getSession();
        if (data.session?.access_token) token = data.session.access_token;
      } catch { /* ignore */ }

      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/stripe-verify-session/${sessionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: VerifySessionResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error verifying Stripe session:", error);
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error al verificar la sesión",
      };
    }
  }

  /**
   * Obtiene la clave pública de Stripe según el entorno
   */
  getPublishableKey(): string {
    return env.stripe.publishableKey;
  }
}

// Exportar instancia singleton
export const stripeService = new StripeService();
