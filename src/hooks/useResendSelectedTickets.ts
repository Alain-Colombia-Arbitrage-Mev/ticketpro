import { useMutation } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";

export interface ResendSelectedTicketsInput {
  ticket_ids: string[];
}

export interface ResendSelectedTicketsResponse {
  ok: true;
  sent_count: number;
  recipient_count: number;
  recipients: { email: string; count: number }[];
}

export function useResendSelectedTickets() {
  return useMutation({
    mutationFn: async (input: ResendSelectedTicketsInput): Promise<ResendSelectedTicketsResponse> => {
      const { data, error } = await supabase.functions.invoke<ResendSelectedTicketsResponse>(
        "resend-selected-tickets",
        { body: input },
      );

      if (error) {
        const context = (error as unknown as { context?: { response?: Response } }).context;
        if (context?.response) {
          let message: string | undefined;
          try {
            const body = await context.response.clone().json();
            message = body?.error || body?.details;
          } catch {
            // Fall back to Supabase's error message.
          }
          if (message) throw new Error(message);
        }
        throw new Error(error.message);
      }

      if (!data) throw new Error("Respuesta vacia del servidor");
      return data;
    },
  });
}
