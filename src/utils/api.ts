import { Currency, MultiCurrencyBalance } from "./currency";

// Función para obtener la URL del proyecto dinámicamente
function getProjectUrl(): string {
  const envProjectUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || import.meta.env.VITE_supabase_project_url;
  const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id;
  const defaultProjectId = "***REMOVED***";
  const projectId = envProjectId || defaultProjectId;
  return envProjectUrl || `https://${projectId}.supabase.co`;
}

// Función para obtener la anon key dinámicamente
function getAnonKey(): string {
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_supabase_anon_key;
  const defaultAnonKey = "***REMOVED***";
  return envAnonKey || defaultAnonKey;
}

// Función para obtener el projectId dinámicamente
function getProjectId(): string {
  const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.VITE_supabase_project_id;
  return envProjectId || "***REMOVED***";
}

// URL de la API - usar variable de entorno o construir desde projectUrl
const API_FUNCTION_NAME =
  import.meta.env.VITE_SUPABASE_API_FUNCTION_NAME || "make-server-97d4f7c5";
const API_URL =
  import.meta.env.VITE_SUPABASE_API_URL ||
  `${getProjectUrl()}/functions/v1/${API_FUNCTION_NAME}`;

// Exportar para compatibilidad con código existente
export const projectUrl = getProjectUrl();
export const publicAnonKey = getAnonKey();
export const projectId = getProjectId();

export interface User {
  id: string;
  email: string;
  name: string;
  address?: string; // Dirección del usuario
  balance: MultiCurrencyBalance | number; // Support both old and new format
  preferredCurrency?: Currency;
  role?: "user" | "hoster" | "admin"; // Rol del usuario
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  qrCode: string;
  purchaseDate: string;
  status: "active" | "used" | "transferred";
  price: number;
  currency?: Currency; // Currency used for purchase
  seatNumber: string;
  transferredFrom?: string;
  transferDate?: string;
  usedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "purchase" | "transfer_in" | "transfer_out";
  amount: number;
  currency?: Currency; // Currency of transaction
  date: string;
  description: string;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem("access_token");
    }
    return this.accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : { Authorization: `Bearer ${publicAnonKey}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Parsear respuesta de forma robusta según content-type y status
    const contentType = response.headers.get("content-type") || "";
    let data: any = null;

    try {
      if (response.status === 204 || response.status === 205) {
        // Sin contenido
        data = null;
      } else if (contentType.includes("application/json")) {
        // JSON esperado
        try {
          data = await response.json();
        } catch {
          // Si el servidor envía JSON inválido, intentamos como texto
          const text = await response.text();
          data = text;
        }
      } else {
        // No JSON (texto, html, etc.)
        const text = await response.text();
        data = text;
      }
    } catch {
      // Como último recurso, dejar data en null
      data = null;
    }

    if (!response.ok) {
      const textMessage = typeof data === "string" ? data : "";
      const structuredMessage =
        data && typeof data === "object" ? data.error || data.message : "";
      const errorMessage =
        structuredMessage ||
        textMessage ||
        `Error ${response.status}: ${response.statusText}`;

      // Si es un 404, incluir información adicional
      if (response.status === 404) {
        throw new Error(`User profile not found: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    // Respuestas exitosas no JSON: devolver objeto estándar
    if (typeof data === "string") {
      const trimmed = data.trim();
      if (trimmed.length === 0) {
        return {};
      }
      // Intentar parsear si realmente era JSON válido
      try {
        return JSON.parse(trimmed);
      } catch {
        return { message: data };
      }
    }

    // Para 204/205 o data null
    return data ?? {};
  }

  // Auth
  async signup(email: string, password: string, name: string) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async sendMagicLink(email: string) {
    // Usar directamente Supabase OTP con redirect URL correcto
    const { getSupabaseClient } = await import('./supabase/client');
    const { env } = await import('../config/env');
    const supabase = getSupabaseClient();
    
    // Forzar la URL de producción
    const redirectUrl = env.frontUrl || 'https://veltlix.com';
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        // No usar shouldCreateUser para evitar crear usuarios automáticamente
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async forgotPassword(email: string) {
    // Usar directamente Supabase resetPasswordForEmail con redirect URL correcto
    const { getSupabaseClient } = await import('./supabase/client');
    const { env } = await import('../config/env');
    const supabase = getSupabaseClient();
    
    // Forzar la URL de producción
    const redirectUrl = `${env.frontUrl || 'https://veltlix.com'}/#/reset-password`;
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  // User
  async getProfile(): Promise<{ user: User }> {
    const startTime = Date.now();
    try {
      // Usar instancia singleton de Supabase
      const { supabase } = await import('./supabase/client');

      // Obtener el usuario actual de Auth
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('No hay sesión activa');
      }

      // Buscar perfil en la tabla profiles con timeout
      const profilePromise = supabase
        .from('profiles')
        .select('id, name, address, city, state, zip_code, country, role')
        .eq('id', session.user.id)
        .maybeSingle(); // maybeSingle() no falla si no encuentra el registro

      // Timeout reducido a 1 segundo (optimización)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 1000)
      );

      let profile = null;
      try {
        const result = await Promise.race([profilePromise, timeoutPromise]) as any;
        profile = result?.data;
      } catch (timeoutError) {
        console.warn('⚠️ Profile fetch timeout, using auth data only');
      }

      // Construir objeto User
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
        address: profile?.address || undefined,
        city: profile?.city || undefined,
        state: profile?.state || undefined,
        zipCode: profile?.zip_code || undefined,
        country: profile?.country || undefined,
        balance: 0,
        role: profile?.role || 'user',
        createdAt: session.user.created_at || new Date().toISOString(),
      };

      const elapsed = Date.now() - startTime;
      console.log(`👤 Profile loaded in ${elapsed}ms:`, { 
        id: user.id.substring(0, 8) + '...', 
        email: user.email, 
        hasAddress: !!user.address,
        address: user.address ? user.address.substring(0, 50) + '...' : 'NO ADDRESS',
        fromDB: !!profile
      });
      
      return { user };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }

  async addBalance(
    amount: number,
    currency: Currency = "USD",
  ): Promise<{ balance: MultiCurrencyBalance; transaction: Transaction }> {
    return this.request("/user/add-balance", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    });
  }

  async updateCurrency(
    currency: Currency,
  ): Promise<{ message: string; preferredCurrency: Currency }> {
    return this.request("/user/currency", {
      method: "POST",
      body: JSON.stringify({ currency }),
    });
  }

  async updateAddress(
    address: string,
  ): Promise<{ message: string; address: string }> {
    try {
      // Usar instancia singleton de Supabase
      const { supabase } = await import('./supabase/client');

      // Obtener el usuario actual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('No hay sesión activa');
      }

      // Verificar si el perfil existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (existingProfile) {
        // Perfil existe, actualizar
        const { error } = await supabase
          .from('profiles')
          .update({
            address: address.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.user.id);

        if (error) throw error;
      } else {
        // Perfil no existe, crear uno nuevo
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
            address: address.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return {
        message: 'Dirección actualizada correctamente',
        address: address.trim(),
      };
    } catch (error) {
      console.error('Error in updateAddress:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<{ transactions: Transaction[] }> {
    return this.request("/user/transactions");
  }

  // Tickets
  async purchaseTicket(data: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    eventImage: string;
    price: number;
    quantity: number;
    currency?: Currency;
    buyerInfo?: {
      name: string;
      email: string;
      phone?: string;
    };
    attendees?: Array<{ name: string; email?: string }>;
    specialRequests?: string;
  }): Promise<{
    tickets: Ticket[];
    balance: MultiCurrencyBalance;
    transaction: Transaction;
    message: string;
  }> {
    return this.request("/tickets/purchase", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMyTickets(): Promise<{ tickets: Ticket[] }> {
    try {
      const { supabase } = await import('./supabase/client');
      
      // Obtener el usuario actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.warn('No hay sesión activa para obtener tickets');
        return { tickets: [] };
      }

      // Obtener tickets del usuario por buyer_id O buyer_email
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`buyer_id.eq.${session.user.id},buyer_email.eq.${session.user.email}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }

      console.log(`✅ Cargados ${data?.length || 0} tickets para el usuario`);
      
      return { tickets: (data || []) as Ticket[] };
    } catch (error) {
      console.error('Error in getMyTickets:', error);
      return { tickets: [] };
    }
  }

  async transferTicket(
    ticketId: string,
    recipientEmail: string,
  ): Promise<{ message: string; ticket: Ticket }> {
    return this.request("/tickets/transfer", {
      method: "POST",
      body: JSON.stringify({ ticketId, recipientEmail }),
    });
  }

  async requestDownload(
    ticketId: string,
  ): Promise<{
    message: string;
    verificationToken: string;
    expiresIn: string;
  }> {
    return this.request("/tickets/request-download", {
      method: "POST",
      body: JSON.stringify({ ticketId }),
    });
  }

  async verifyDownload(
    token: string,
  ): Promise<{ ticket: Ticket; message: string }> {
    return this.request(`/tickets/verify-download/${token}`);
  }

  async validateTicket(
    qrCode: string,
  ): Promise<{ message: string; ticket: Ticket }> {
    return this.request("/tickets/validate", {
      method: "POST",
      body: JSON.stringify({ qrCode }),
    });
  }
}

export const api = new ApiClient();
