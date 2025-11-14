/**
 * Cryptomus Payment Service
 * Servicio para integración con Cryptomus API para procesamiento de pagos con criptomonedas
 */

import CryptoJS from 'crypto-js';

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
  private baseUrl: string = 'https://api.cryptomus.com/v1';

  constructor() {
    // La API key debe estar en las variables de entorno
    this.apiKey = import.meta.env.VITE_CRYPTOMUS_API_KEY || '';
    this.merchantId = import.meta.env.VITE_CRYPTOMUS_MERCHANT_ID || '';

    if (!this.apiKey || !this.merchantId) {
      console.warn('Cryptomus API key or Merchant ID not configured');
    }
  }

  /**
   * Genera la firma para autenticar la petición
   * @param data - Datos a firmar
   * @returns Firma MD5 en base64
   */
  private generateSignature(data: string): string {
    const hash = CryptoJS.MD5(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data)) + this.apiKey);
    return hash.toString();
  }

  /**
   * Crea una factura/invoice en Cryptomus
   * @param params - Parámetros de la factura
   * @returns Promise con la respuesta de Cryptomus
   */
  async createInvoice(params: CryptomusInvoiceRequest): Promise<CryptomusInvoiceResponse> {
    try {
      const body = JSON.stringify(params);
      const signature = this.generateSignature(body);

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': this.merchantId,
          'sign': signature,
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Cryptomus API error:', data);
        throw new Error(data.message || 'Error creating Cryptomus invoice');
      }

      return data;
    } catch (error) {
      console.error('Error creating Cryptomus invoice:', error);
      throw error;
    }
  }

  /**
   * Obtiene información de un pago
   * @param uuid - UUID del pago o order_id
   * @returns Promise con la información del pago
   */
  async getPaymentInfo(uuid: string, isOrderId: boolean = false): Promise<CryptomusPaymentInfo> {
    try {
      const params = isOrderId ? { order_id: uuid } : { uuid };
      const body = JSON.stringify(params);
      const signature = this.generateSignature(body);

      const response = await fetch(`${this.baseUrl}/payment/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': this.merchantId,
          'sign': signature,
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Cryptomus API error:', data);
        throw new Error(data.message || 'Error getting payment info');
      }

      return data;
    } catch (error) {
      console.error('Error getting payment info:', error);
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
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Obtiene las monedas y redes disponibles
   * @returns Promise con la lista de servicios disponibles
   */
  async getAvailableServices(): Promise<any> {
    try {
      const body = '{}';
      const signature = this.generateSignature(body);

      const response = await fetch(`${this.baseUrl}/payment/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': this.merchantId,
          'sign': signature,
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Cryptomus API error:', data);
        throw new Error(data.message || 'Error getting available services');
      }

      return data;
    } catch (error) {
      console.error('Error getting available services:', error);
      throw error;
    }
  }

  /**
   * Crea un pago con conversión automática
   * @param amount - Monto en moneda fiat
   * @param currency - Moneda fiat (USD, EUR, etc)
   * @param orderId - ID único del pedido
   * @param toCurrency - Criptomoneda a la que se convertirá (BTC, ETH, USDT, etc)
   * @param callbackUrl - URL para recibir webhooks
   * @param returnUrl - URL de retorno después del pago
   * @returns Promise con la factura creada
   */
  async createCryptoPayment(
    amount: number,
    currency: string = 'USD',
    orderId: string,
    toCurrency: string = 'USDT',
    callbackUrl?: string,
    returnUrl?: string
  ): Promise<CryptomusInvoiceResponse> {
    const params: CryptomusInvoiceRequest = {
      amount: amount.toString(),
      currency: currency,
      order_id: orderId,
      to_currency: toCurrency,
      url_callback: callbackUrl,
      url_return: returnUrl,
      url_success: returnUrl,
      lifetime: 3600, // 1 hora
      is_payment_multiple: true,
    };

    return this.createInvoice(params);
  }

  /**
   * Verifica el estado de un pago
   * @param orderId - ID del pedido
   * @returns Estado del pago
   */
  async checkPaymentStatus(orderId: string): Promise<string> {
    try {
      const paymentInfo = await this.getPaymentInfo(orderId, true);
      return paymentInfo.result?.payment_status || 'unknown';
    } catch (error) {
      console.error('Error checking payment status:', error);
      return 'error';
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.merchantId);
  }
}

// Exportar instancia singleton
export const cryptomusService = new CryptomusService();

// Tipos de estados de pago de Cryptomus
export enum CryptomusPaymentStatus {
  CHECK = 'check',
  PAID = 'paid',
  PAID_OVER = 'paid_over',
  WRONG_AMOUNT = 'wrong_amount',
  CANCEL = 'cancel',
  FAIL = 'fail',
  CONFIRMING = 'confirming',
}

// Función auxiliar para formatear montos
export function formatCryptoAmount(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals);
}
