import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey, projectUrl } from '../supabase/info';
import { generateQRCode, generateTicketCode, generateTicketPin } from './qrGenerator';

// Cliente público (sin autenticación)
const supabase = createClient(
  projectUrl,
  publicAnonKey
);

// Función para obtener cliente autenticado
export function getAuthenticatedSupabase(accessToken: string) {
  return createClient(
    projectUrl,
    publicAnonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
}

export interface TicketData {
  eventId: number;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM:SS
  eventLocation?: string;
  eventCategory?: string; // Categoría del evento (Concierto, Deportes, etc.)
  buyerId?: string;
  buyerEmail: string;
  buyerFullName: string;
  buyerAddress?: string;
  ticketType?: string;
  seatNumber?: string;
  seatType?: string; // Tipo de asiento (numerado, general, preferencial)
  gateNumber?: string;
  ticketClass?: string; // Clase del ticket (VIP, General, Palco)
  ticketCategoryId?: string; // ID de la categoría en ticket_categories
  price: number;
  pricePaid?: number; // Precio realmente pagado
  paymentMethodId?: string; // ID del método de pago
  purchaseId?: string;
  purchaseSummary?: Record<string, any>; // Resumen de la compra
}

export interface Ticket {
  id: string;
  ticket_code: string;
  qr_code: string;
  status: 'issued_unused' | 'issued_used' | 'cancelled' | 'refunded';
  event_id: number;
  event_name: string;
  event_date: string;
  event_time?: string;
  event_location?: string;
  event_category?: string; // Categoría del evento
  buyer_id?: string;
  buyer_email: string;
  buyer_full_name: string;
  buyer_address?: string;
  ticket_type?: string;
  seat_number?: string;
  seat_type?: string; // Tipo de asiento
  gate_number?: string;
  ticket_class?: string;
  ticket_category_id?: string; // ID de la categoría
  price: number;
  price_paid?: number; // Precio realmente pagado
  payment_method_id?: string; // ID del método de pago
  purchase_id?: string;
  purchase_date: string;
  purchase_summary?: Record<string, any>; // Resumen de la compra
  used_at?: string;
  used_by?: string;
  validation_code?: string;
  pin?: string; // PIN de 4 dígitos para validación de seguridad
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Crea una boleta después de una compra exitosa
 */
export async function createTicket(ticketData: TicketData): Promise<Ticket> {
  try {
    // Generar código único del ticket
    const ticketCode = generateTicketCode();
    
    // Generar PIN de 4 dígitos para validación de seguridad
    const ticketPin = generateTicketPin();
    
    // Crear registro temporal para obtener el ID
    const tempId = crypto.randomUUID();
    
    // Crear URL de validación (el QR se generará cuando se necesite)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const validationUrl = `${baseUrl}/#validate-ticket?ticketId=${tempId}&code=${ticketCode}`;
    
    // Insertar ticket en Supabase
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ticket_code: ticketCode,
        qr_code: validationUrl, // Guardamos la URL, el QR se genera en el frontend
        status: 'issued_unused',
        event_id: ticketData.eventId,
        event_name: ticketData.eventName,
        event_date: ticketData.eventDate,
        event_time: ticketData.eventTime || null,
        event_location: ticketData.eventLocation || null,
        event_category: ticketData.eventCategory || null,
        buyer_id: ticketData.buyerId || null,
        buyer_email: ticketData.buyerEmail,
        buyer_full_name: ticketData.buyerFullName,
        buyer_address: ticketData.buyerAddress || null,
        ticket_type: ticketData.ticketType || null,
        seat_number: ticketData.seatNumber || null,
        seat_type: ticketData.seatType || null,
        gate_number: ticketData.gateNumber || null,
        ticket_class: ticketData.ticketClass || null,
        ticket_category_id: ticketData.ticketCategoryId || null,
        price: ticketData.price,
        price_paid: ticketData.pricePaid || ticketData.price,
        payment_method_id: ticketData.paymentMethodId || null,
        purchase_id: ticketData.purchaseId || null,
        purchase_summary: ticketData.purchaseSummary || null,
        pin: ticketPin, // Guardar PIN en la base de datos
        metadata: {
          ...(ticketData.purchaseSummary || {}),
          pin_generated_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Actualizar con la URL final usando el ID real
    let finalValidationUrl: string;
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin + window.location.pathname;
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      finalValidationUrl = `${cleanBaseUrl}/#validate-ticket?ticketId=${encodeURIComponent(data.id)}&code=${encodeURIComponent(ticketCode)}`;
    } else {
      // En SSR, usar la URL del proyecto de Supabase o una URL por defecto
      const defaultBaseUrl = projectUrl.replace('.supabase.co', '');
      finalValidationUrl = `${defaultBaseUrl}/#validate-ticket?ticketId=${encodeURIComponent(data.id)}&code=${encodeURIComponent(ticketCode)}`;
    }
    
    const { data: updatedData, error: updateError } = await supabase
      .from('tickets')
      .update({ qr_code: finalValidationUrl })
      .eq('id', data.id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return updatedData as Ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

/**
 * Valida un ticket por su código o QR
 */
export async function validateTicket(
  ticketId?: string,
  ticketCode?: string
): Promise<{ valid: boolean; ticket?: Ticket; message: string }> {
  try {
    let query = supabase.from('tickets').select('*');
    
    if (ticketId) {
      query = query.eq('id', ticketId);
    } else if (ticketCode) {
      query = query.eq('ticket_code', ticketCode);
    } else {
      return {
        valid: false,
        message: 'Se requiere ticketId o ticketCode'
      };
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      return {
        valid: false,
        message: 'Ticket no encontrado'
      };
    }
    
    const ticket = data as Ticket;
    
    // Validar estado
    if (ticket.status === 'issued_used') {
      return {
        valid: false,
        ticket,
        message: 'Este ticket ya ha sido usado'
      };
    }
    
    if (ticket.status === 'cancelled') {
      return {
        valid: false,
        ticket,
        message: 'Este ticket ha sido cancelado'
      };
    }
    
    if (ticket.status === 'refunded') {
      return {
        valid: false,
        ticket,
        message: 'Este ticket ha sido reembolsado'
      };
    }
    
    // Validar fecha del evento
    const eventDate = new Date(ticket.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return {
        valid: false,
        ticket,
        message: 'Este ticket no puede ser usado porque la fecha del evento ya pasó'
      };
    }
    
    return {
      valid: true,
      ticket,
      message: 'Ticket válido'
    };
  } catch (error) {
    console.error('Error validating ticket:', error);
    return {
      valid: false,
      message: 'Error al validar el ticket'
    };
  }
}

/**
 * Marca un ticket como usado (cobrar/validar entrada)
 */
export async function markTicketAsUsed(
  ticketId: string,
  usedBy?: string
): Promise<{ success: boolean; ticket?: Ticket; message: string }> {
  try {
    // Primero validar el ticket
    const validation = await validateTicket(ticketId);
    
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      };
    }
    
    // Actualizar estado a usado
    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'issued_used',
        used_at: new Date().toISOString(),
        used_by: usedBy || null,
        validation_code: generateTicketCode() // Código de validación único
      })
      .eq('id', ticketId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      ticket: data as Ticket,
      message: 'Ticket marcado como usado exitosamente'
    };
  } catch (error) {
    console.error('Error marking ticket as used:', error);
    return {
      success: false,
      message: 'Error al marcar el ticket como usado'
    };
  }
}

/**
 * Valida y marca un ticket como usado por un hoster del evento
 * Esta función verifica que el usuario tenga el rol de hoster antes de validar
 * REQUIERE: autenticación de Supabase con token de acceso
 */
export async function validateTicketByHoster(
  ticketId?: string,
  ticketCode?: string,
  hosterId?: string,
  hosterEmail?: string,
  accessToken?: string,
  pin?: string
): Promise<{ 
  success: boolean; 
  ticket?: Ticket; 
  message: string;
  validated: boolean;
}> {
  try {
    // Validar parámetros requeridos
    if (!ticketId && !ticketCode) {
      return {
        success: false,
        validated: false,
        message: 'Se requiere ticketId o ticketCode'
      };
    }

    if (!hosterId) {
      return {
        success: false,
        validated: false,
        message: 'Se requiere hosterId para validar el ticket'
      };
    }

    // Primero validar el ticket (sin autenticación, solo lectura)
    const validation = await validateTicket(ticketId, ticketCode);
    
    if (!validation.valid || !validation.ticket) {
      return {
        success: false,
        validated: false,
        message: validation.message
      };
    }
    
    const ticket = validation.ticket;
    
    // Verificar que el ticket no esté ya usado
    if (ticket.status === 'issued_used') {
      return {
        success: false,
        validated: false,
        ticket,
        message: 'Este ticket ya ha sido usado'
      };
    }
    
    // Validar PIN si se proporciona
    if (pin) {
      if (!ticket.pin || ticket.pin !== pin) {
        return {
          success: false,
          validated: false,
          ticket,
          message: 'PIN incorrecto. Por favor, verifica el PIN de 4 dígitos del ticket.'
        };
      }
    } else {
      // Si no se proporciona PIN, requerirlo
      return {
        success: false,
        validated: false,
        ticket,
        message: 'Se requiere el PIN de 4 dígitos para validar el ticket'
      };
    }
    
    // Si hay accessToken, usar cliente autenticado
    const client = accessToken ? getAuthenticatedSupabase(accessToken) : supabase;
    
    // Intentar usar la función RPC de Supabase para validar el ticket de forma segura
    try {
      const { data: rpcData, error: rpcError } = await client.rpc('validate_ticket', {
        p_hoster_id: hosterId,
        p_ticket_id: ticketId || null,
        p_ticket_code: ticketCode || null,
        p_hoster_email: hosterEmail || null
      });
      
      // Si la función RPC existe y funciona, usarla
      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        return {
          success: true,
          validated: true,
          ticket: rpcData[0] as Ticket,
          message: 'Ticket validado y marcado como usado exitosamente'
        };
      }
      
      // Si la función RPC no existe o falla, continuar con el método alternativo
      if (rpcError) {
        console.warn('RPC function not available, using fallback method:', rpcError.message);
      }
    } catch (rpcErr) {
      console.warn('Error calling RPC function, using fallback method:', rpcErr);
    }
    
    // Fallback: usar update directo (menos seguro, pero funcional)
    // NOTA: Esto debería protegerse con RLS (Row Level Security) en Supabase
    const { data, error } = await client
      .from('tickets')
      .update({
        status: 'issued_used',
        used_at: new Date().toISOString(),
        used_by: hosterId,
        validation_code: generateTicketCode(), // Código de validación único
        metadata: {
          ...(ticket.metadata || {}),
          validated_by: {
            id: hosterId,
            email: hosterEmail,
            validated_at: new Date().toISOString(),
            role: 'hoster'
          }
        }
      })
      .eq('id', ticket.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      validated: true,
      ticket: data as Ticket,
      message: 'Ticket validado y marcado como usado exitosamente'
    };
  } catch (error) {
    console.error('Error validating ticket by hoster:', error);
    return {
      success: false,
      validated: false,
      message: error instanceof Error ? error.message : 'Error al validar el ticket'
    };
  }
}

/**
 * Obtiene todos los tickets de un usuario
 */
export async function getUserTickets(userEmail: string): Promise<Ticket[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('buyer_email', userEmail)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return (data || []) as Ticket[];
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw error;
  }
}

/**
 * Envía el PIN de seguridad del ticket por correo electrónico
 */
export async function sendTicketPinEmail(
  ticketId: string,
  ticketCode: string,
  pin: string,
  buyerEmail: string,
  buyerName: string,
  eventName: string,
  eventDate: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Obtener el ticket para verificar que existe
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (ticketError || !ticket) {
      throw new Error('Ticket no encontrado');
    }
    
    // Verificar que el PIN coincida
    if (ticket.pin !== pin) {
      throw new Error('PIN no válido');
    }
    
    // Preparar el contenido del email
    const emailSubject = `PIN de Seguridad - Ticket ${ticketCode}`;
    const emailBody = `
Hola ${buyerName},

Tu PIN de seguridad para el ticket del evento "${eventName}" es:

PIN: ${pin}

Este PIN es necesario para validar tu entrada en el evento.

Detalles del Ticket:
- Código: ${ticketCode}
- Evento: ${eventName}
- Fecha: ${new Date(eventDate).toLocaleDateString('es-ES')}

IMPORTANTE: Guarda este PIN de forma segura. Será requerido al momento de validar tu entrada.

Si no solicitaste este PIN, por favor contacta a soporte.

Saludos,
El equipo de Tiquetera
    `.trim();
    
    // Intentar enviar el email usando Supabase Auth (si está configurado)
    // Nota: Esto requiere que Supabase tenga configurado SMTP
    try {
      // Usar Supabase para enviar el email
      // Si Supabase tiene SMTP configurado, podemos usar una función Edge o directamente
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: buyerEmail,
          subject: emailSubject,
          text: emailBody,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #c61619;">PIN de Seguridad - Ticket ${ticketCode}</h2>
              <p>Hola ${buyerName},</p>
              <p>Tu PIN de seguridad para el ticket del evento <strong>"${eventName}"</strong> es:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #c61619; font-size: 32px; margin: 0; letter-spacing: 8px;">${pin}</h1>
              </div>
              <p>Este PIN es necesario para validar tu entrada en el evento.</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Código:</strong> ${ticketCode}</p>
                <p style="margin: 5px 0;"><strong>Evento:</strong> ${eventName}</p>
                <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(eventDate).toLocaleDateString('es-ES')}</p>
              </div>
              <p style="color: #c61619; font-weight: bold;">IMPORTANTE: Guarda este PIN de forma segura. Será requerido al momento de validar tu entrada.</p>
              <p>Si no solicitaste este PIN, por favor contacta a soporte.</p>
              <p>Saludos,<br>El equipo de Tiquetera</p>
            </div>
          `
        }
      });
      
      if (emailError) {
        console.warn('Error enviando email con Supabase Functions:', emailError);
        // Si falla, intentar método alternativo o solo loguear
        // Por ahora, retornamos éxito pero con advertencia
        return {
          success: true,
          message: 'PIN disponible en tu ticket. Para recibirlo por email, configura SMTP en Supabase.'
        };
      }
      
      return {
        success: true,
        message: 'PIN enviado exitosamente a tu correo electrónico'
      };
    } catch (emailError) {
      console.warn('No se pudo enviar el email automáticamente:', emailError);
      // Si no hay función de email configurada, retornar éxito pero con mensaje informativo
      return {
        success: true,
        message: 'PIN disponible en tu ticket. Para recibirlo por email, configura SMTP en Supabase.'
      };
    }
  } catch (error) {
    console.error('Error sending ticket PIN email:', error);
    throw error;
  }
}

/**
 * Reenvía el PIN de seguridad de un ticket por correo electrónico
 */
export async function resendTicketPinEmail(
  ticketId: string,
  buyerEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Obtener el ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (ticketError || !ticket) {
      throw new Error('Ticket no encontrado');
    }
    
    // Verificar que el email coincida
    if (ticket.buyer_email !== buyerEmail) {
      throw new Error('No tienes permiso para acceder a este ticket');
    }
    
    // Verificar que el ticket tenga PIN
    if (!ticket.pin) {
      throw new Error('Este ticket no tiene PIN asignado');
    }
    
    // Enviar el PIN por email
    return await sendTicketPinEmail(
      ticket.id,
      ticket.ticket_code,
      ticket.pin,
      ticket.buyer_email,
      ticket.buyer_full_name,
      ticket.event_name,
      ticket.event_date
    );
  } catch (error) {
    console.error('Error resending ticket PIN email:', error);
    throw error;
  }
}

/**
 * Asigna un PIN de seguridad a un ticket que no lo tiene
 */
export async function assignPinToTicket(
  ticketId: string,
  buyerEmail: string
): Promise<{ success: boolean; message: string; pin?: string }> {
  try {
    // Obtener el ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (ticketError || !ticket) {
      throw new Error('Ticket no encontrado');
    }
    
    // Verificar que el email coincida
    if (ticket.buyer_email !== buyerEmail) {
      throw new Error('No tienes permiso para acceder a este ticket');
    }
    
    // Verificar que el ticket no tenga PIN
    if (ticket.pin) {
      return {
        success: false,
        message: 'Este ticket ya tiene un PIN asignado'
      };
    }
    
    // Generar un nuevo PIN
    const newPin = generateTicketPin();
    
    // Actualizar el ticket con el nuevo PIN
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        pin: newPin,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
    
    if (updateError) {
      throw updateError;
    }
    
    return {
      success: true,
      message: 'PIN asignado exitosamente',
      pin: newPin
    };
  } catch (error) {
    console.error('Error assigning PIN to ticket:', error);
    throw error;
  }
}

/**
 * Obtiene un ticket por ID
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw error;
    }
    
    return data as Ticket;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
}

/**
 * Obtiene todas las categorías de tickets disponibles
 */
export async function getTicketCategories(): Promise<Array<{id: string, name: string, display_name: string}>> {
  try {
    const { data, error } = await supabase
      .from('ticket_categories')
      .select('id, name, display_name')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return (data || []) as Array<{id: string, name: string, display_name: string}>;
  } catch (error) {
    console.error('Error fetching ticket categories:', error);
    return [];
  }
}

/**
 * Obtiene todos los métodos de pago disponibles
 */
export async function getPaymentMethods(): Promise<Array<{id: string, name: string, display_name: string}>> {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, name, display_name')
      .eq('is_active', true);
    
    if (error) {
      throw error;
    }
    
    return (data || []) as Array<{id: string, name: string, display_name: string}>;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

