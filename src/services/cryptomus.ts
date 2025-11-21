/**
 * Cryptomus Payment Service
 * Servicio para integración con Cryptomus API para procesamiento de pagos con criptomonedas
 */

import CryptoJS from "crypto-js";

// Tipos de datos para Cryptomus
export interface CryptomusInvoiceRequest {
  amount: string;
  currency: string;
  order_id: string;
  url_callback?: string;
  url_return?: string;
  url_success?: string;
  lifetime?: number;
  to_currency?: string;
  network?: string;
  is_payment_multiple?: boolean;
  additional_data?: string;
}

export interface CryptomusInvoiceResponse {
  state: number;
  result?: {
    uuid: string;
    order_id: string;
    amount: string;
    payment_amount: string | null;
    payer_amount: string | null;
    discount_percent: number | null;
    discount: string;
    payer_currency: string | null;
    currency: string;
    merchant_amount: string | null;
    network: string | null;
    address: string | null;
    from: string | null;
    txid: string | null;
    payment_status: string;
    url: string;
    expired_at: number;
    status: string;
    is_final: boolean;
    additional_data: string | null;
    created_at: string;
    updated_at: string;
  };
  message?: string;
  errors?: Record<string, string[]>;
}

export interface CryptomusPaymentInfo {
  state: number;
  result?: {
    uuid: string;
    order_id: string;
    amount: string;
    payment_amount: string;
    payer_amount: string;
    payer_currency: string;
    currency: string;
    payment_status: string;
    url: string;
    expired_at: number;
    txid: string | null;
    network: string;
    address: string;
    is_final: boolean;
  };
  message?: string;
}

class CryptomusService {
  private apiKey: string;
  private merchantId: string;
  private baseUrl: string = "https://api.cryptomus.com/v1";

  constructor() {
    // La API key NO se necesita en el frontend - se maneja en Edge Function
    // Solo necesitamos el Merchant ID para mostrar en la UI
    this.apiKey = ""; // No se usa en el frontend
    this.merchantId = import.meta.env.VITE_CRYPTOMUS_MERCHANT_ID || "";

    if (!this.merchantId) {
      console.warn("Cryptomus Merchant ID not configured");
    }
  }

  /**
   * Genera la firma para autenticar la petición
   * @param data - Datos a firmar
   * @returns Firma MD5 en base64
   */
  private generateSignature(data: string): string {
    const hash = CryptoJS.MD5(
      CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data)) +
        this.apiKey,
    );
    return hash.toString();
  }

  /**
   * Crea una factura/invoice en Cryptomus
   * @param params - Parámetros de la factura
   * @returns Promise con la respuesta de Cryptomus
   */
  async createInvoice(
    params: CryptomusInvoiceRequest,
  ): Promise<CryptomusInvoiceResponse> {
    try {
      const body = JSON.stringify(params);
      const signature = this.generateSignature(body);

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          merchant: this.merchantId,
          sign: signature,
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Cryptomus API error:", data);
        throw new Error(data.message || "Error creating Cryptomus invoice");
      }

      return data;
    } catch (error) {
      console.error("Error creating Cryptomus invoice:", error);
      throw error;
    }
  }

  /**
   * Obtiene información de un pago
   * @param uuid - UUID del pago o order_id
   * @returns Promise con la información del pago
   */
  async getPaymentInfo(
    uuid: string,
    isOrderId: boolean = false,
  ): Promise<CryptomusPaymentInfo> {
    try {
      const params = isOrderId ? { order_id: uuid } : { uuid };
      const body = JSON.stringify(params);
      const signature = this.generateSignature(body);

      const response = await fetch(`${this.baseUrl}/payment/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          merchant: this.merchantId,
          sign: signature,
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Cryptomus API error:", data);
        throw new Error(data.message || "Error getting payment info");
      }

      return data;
    } catch (error) {
      console.error("Error getting payment info:", error);
      throw error;
    }
  }

  /**
   * Verifica la firma del webhook recibido
   * @param body - Cuerpo del webhook
   * @param receivedSign - Firma recibida en el webhook
   * @returns true si la firma es válida
   */
  verifyWebhookSignature(body: string, receivedSign: string): boolean {
    try {
      const calculatedSign = this.generateSignature(body);
      return calculatedSign === receivedSign;
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  /**
   * Obtiene las monedas y redes disponibles
   * @returns Promise con la lista de servicios disponibles
   */
  async getAvailableServices(): Promise<any> {
    try {
      const body = "{}";
      const signature = this.generateSignature(body);

      const response = await fetch(`${this.baseUrl}/payment/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          merchant: this.merchantId,
          sign: signature,
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Cryptomus API error:", data);
        throw new Error(data.message || "Error getting available services");
      }

      return data;
    } catch (error) {
      console.error("Error getting available services:", error);
      throw error;
    }
  }

  /**
   * Crea un pago con conversión automática usando Edge Function
   * NUNCA expone la API key al frontend - todo se maneja en el backend
   * @param amount - Monto en moneda fiat
   * @param currency - Moneda fiat (USD, EUR, etc)
   * @param orderId - ID único del pedido
   * @param toCurrency - Criptomoneda a la que se convertirá (BTC, ETH, USDT, etc)
   * @param items - Items del carrito
   * @param buyerEmail - Email del comprador
   * @param buyerFullName - Nombre del comprador
   * @param buyerAddress - Dirección del comprador
   * @returns Promise con la URL de pago de Cryptomus
   */
  async createCryptoPayment(
    amount: number,
    currency: string = "USD",
    orderId: string,
    toCurrency: string = "USDT",
    items: any[] = [],
    buyerEmail?: string,
    buyerFullName?: string,
    buyerAddress?: string,
  ): Promise<{ paymentUrl: string; invoice: any }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/cryptomus-create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          orderId,
          toCurrency,
          items,
          buyerEmail,
          buyerFullName,
          buyerAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error creating Cryptomus invoice');
      }

      return {
        paymentUrl: data.paymentUrl,
        invoice: data.invoice,
    };
    } catch (error) {
      console.error('Error creating crypto payment:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado de un pago
   * @param orderId - ID del pedido
   * @returns Estado del pago
   */
  async checkPaymentStatus(orderId: string): Promise<string> {
    try {
      const paymentInfo = await this.getPaymentInfo(orderId, true);
      return paymentInfo.result?.payment_status || "unknown";
    } catch (error) {
      console.error("Error checking payment status:", error);
      return "error";
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   * Solo necesita el Merchant ID ya que la API Key se maneja en el backend
   */
  isConfigured(): boolean {
    return !!this.merchantId;
  }
}

// Exportar instancia singleton
export const cryptomusService = new CryptomusService();

// Tipos de estados de pago de Cryptomus
export enum CryptomusPaymentStatus {
  CHECK = "check",
  PAID = "paid",
  PAID_OVER = "paid_over",
  WRONG_AMOUNT = "wrong_amount",
  CANCEL = "cancel",
  FAIL = "fail",
  CONFIRMING = "confirming",
}

// Función auxiliar para formatear montos
export function formatCryptoAmount(
  amount: number,
  decimals: number = 2,
): string {
  return amount.toFixed(decimals);
}
