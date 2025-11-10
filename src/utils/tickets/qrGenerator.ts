import QRCode from 'qrcode';

/**
 * Genera un código QR para un ticket
 * @param ticketId - ID único del ticket
 * @param ticketCode - Código del ticket
 * @returns URL del QR code como string base64
 */
export async function generateQRCode(ticketId: string, ticketCode: string): Promise<string> {
  // URL que se escaneará para validar el ticket
  // Usar la URL guardada en el ticket si está disponible, o generar una nueva
  let validationUrl: string;
  
  // Si estamos en el navegador, usar la URL actual
  if (typeof window !== 'undefined') {
    // Obtener la URL base (sin hash)
    const baseUrl = window.location.origin + window.location.pathname;
    // Asegurar que no termine con /
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    validationUrl = `${cleanBaseUrl}/#validate-ticket?ticketId=${encodeURIComponent(ticketId)}&code=${encodeURIComponent(ticketCode)}`;
  } else {
    // Fallback para SSR
    validationUrl = `/#validate-ticket?ticketId=${encodeURIComponent(ticketId)}&code=${encodeURIComponent(ticketCode)}`;
  }
  
  try {
    // Generar QR code como data URL (base64)
    const qrDataUrl = await QRCode.toDataURL(validationUrl, {
      errorCorrectionLevel: 'H', // Alto nivel de corrección de errores
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Genera un código único para el ticket
 * @returns Código alfanumérico único (ej: XX4444XX)
 */
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 8;
  let code = '';
  
  // Generar código aleatorio
  for (let i = 0; i < codeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

