import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../supabase/info';
import { generateQRCode, generateTicketCode } from './qrGenerator';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface TicketData {
  eventId: number;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM:SS
  eventLocation?: string;
  buyerId?: string;
  buyerEmail: string;
  buyerFullName: string;
  buyerAddress?: string;
  ticketType?: string;
  seatNumber?: string;
  gateNumber?: string;
  ticketClass?: string;
  price: number;
  purchaseId?: string;
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
  buyer_id?: string;
  buyer_email: string;
  buyer_full_name: string;
  buyer_address?: string;
  ticket_type?: string;
  seat_number?: string;
  gate_number?: string;
  ticket_class?: string;
  price: number;
  purchase_id?: string;
  purchase_date: string;
  used_at?: string;
  used_by?: string;
  validation_code?: string;
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
    
    // Crear registro temporal para obtener el ID
    const tempId = crypto.randomUUID();
    
    // Crear URL de validación (el QR se generará cuando se necesite)
    const validationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/#validate-ticket?ticketId=${tempId}&code=${ticketCode}`;
    
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
        buyer_id: ticketData.buyerId || null,
        buyer_email: ticketData.buyerEmail,
        buyer_full_name: ticketData.buyerFullName,
        buyer_address: ticketData.buyerAddress || null,
        ticket_type: ticketData.ticketType || null,
        seat_number: ticketData.seatNumber || null,
        gate_number: ticketData.gateNumber || null,
        ticket_class: ticketData.ticketClass || null,
        price: ticketData.price,
        purchase_id: ticketData.purchaseId || null,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Actualizar con la URL final usando el ID real
    const finalValidationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/#validate-ticket?ticketId=${data.id}&code=${ticketCode}`;
    
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

