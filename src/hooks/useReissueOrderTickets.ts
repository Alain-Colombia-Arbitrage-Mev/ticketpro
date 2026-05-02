import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";

export interface ReissueOrderTicketsInput {
  order_id?: string;
  order_uuid?: string;
}

export interface ReissueOrderTicketsResponse {
  ok: true;
  order_id: string;
  email: string;
  expected_count: number;
  existing_count: number;
  created_count: number;
  sent_count: number;
}

export function useReissueOrderTickets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReissueOrderTicketsInput): Promise<ReissueOrderTicketsResponse> => {
      const { data, error } = await supabase.functions.invoke<ReissueOrderTicketsResponse>(
        "reissue-order-tickets",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}
