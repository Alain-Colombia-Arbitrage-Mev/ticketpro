import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";

export interface IssueCompTicketInput {
  event_id: number;
  buyer_email: string;
  buyer_full_name: string;
  issue_reason: string;
  quantity: number;
  ticket_type?: string;
  seat_type?: string | null;
  gate_number?: string | null;
}

export interface IssueCompTicketResponse {
  ok: true;
  count: number;
  tickets: { id: string; ticket_code: string }[];
}

export function useIssueCompTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: IssueCompTicketInput): Promise<IssueCompTicketResponse> => {
      const { data, error } = await supabase.functions.invoke<IssueCompTicketResponse>(
        "issue-comp-ticket",
        { body: input },
      );
      if (error) {
        // Supabase functions.invoke wraps HTTP errors; try to surface the body
        const context = (error as unknown as { context?: { response?: Response } }).context;
        if (context?.response) {
          try {
            const j = await context.response.clone().json();
            throw new Error(j?.error || j?.details || error.message);
          } catch {
            // fallthrough
          }
        }
        throw new Error(error.message);
      }
      if (!data) throw new Error("Respuesta vacía del servidor");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}
