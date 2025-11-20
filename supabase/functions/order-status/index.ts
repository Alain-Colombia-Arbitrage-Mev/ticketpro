/**
 * Supabase Edge Function: order-status
 * Consulta el estado de una orden de compra
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusResponse {
  ok: boolean;
  order?: {
    id: string;
    order_id: string;
    payment_status: string;
    payment_method: string;
    total_amount: number;
    currency: string;
    buyer_email: string;
    buyer_name: string;
    items: any[];
    created_at: string;
    updated_at: string;
    completed_at?: string;
    tickets_count: number;
  };
  error?: string;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    // Obtener configuración
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Server not configured",
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...CORS_HEADERS } 
        }
      );
    }

    // Obtener orderId de la URL o query params
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(p => p);
    const orderStatusIndex = pathParts.indexOf("order-status");
    const orderId = orderStatusIndex >= 0 && pathParts[orderStatusIndex + 1] 
      ? pathParts[orderStatusIndex + 1] 
      : url.searchParams.get("orderId") || url.searchParams.get("order_id") || "";

    if (!orderId) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing orderId parameter",
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...CORS_HEADERS } 
        }
      );
    }

    // Inicializar Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar la orden por order_id (TEXT)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Order not found",
        }),
        { 
          status: 404, 
          headers: { "Content-Type": "application/json", ...CORS_HEADERS } 
        }
      );
    }

    // Contar tickets asociados
    const { count: ticketsCount, error: countError } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .or(`purchase_id.eq.${orderId},order_uuid.eq.${order.id}`);

    if (countError) {
      console.error("Error counting tickets:", countError);
    }

    // Construir respuesta
    const response: OrderStatusResponse = {
      ok: true,
      order: {
        id: order.id,
        order_id: order.order_id,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        currency: order.currency,
        buyer_email: order.buyer_email,
        buyer_name: order.buyer_name,
        items: order.items || [],
        created_at: order.created_at,
        updated_at: order.updated_at,
        completed_at: order.completed_at,
        tickets_count: ticketsCount || 0,
      },
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...CORS_HEADERS } 
      }
    );
  } catch (error) {
    console.error("Error in order-status function:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...CORS_HEADERS } 
      }
    );
  }
});

