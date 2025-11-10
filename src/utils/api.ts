import { projectId, publicAnonKey } from './supabase/info';
import { Currency, MultiCurrencyBalance } from './currency';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-97d4f7c5`;

export interface User {
  id: string;
  email: string;
  name: string;
  address?: string; // Dirección del usuario
  balance: MultiCurrencyBalance | number; // Support both old and new format
  preferredCurrency?: Currency;
  role?: 'user' | 'hoster' | 'admin'; // Rol del usuario
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
  status: 'active' | 'used' | 'transferred';
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
  type: 'deposit' | 'purchase' | 'transfer_in' | 'transfer_out';
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
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : { 'Authorization': `Bearer ${publicAnonKey}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  // Auth
  async signup(email: string, password: string, name: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async sendMagicLink(email: string) {
    return this.request('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // User
  async getProfile(): Promise<{ user: User }> {
    return this.request('/user/profile');
  }

  async addBalance(amount: number, currency: Currency = 'USD'): Promise<{ balance: MultiCurrencyBalance; transaction: Transaction }> {
    return this.request('/user/add-balance', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    });
  }

  async updateCurrency(currency: Currency): Promise<{ message: string; preferredCurrency: Currency }> {
    return this.request('/user/currency', {
      method: 'POST',
      body: JSON.stringify({ currency }),
    });
  }

  async updateAddress(address: string): Promise<{ message: string; address: string }> {
    return this.request('/user/address', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  async getTransactions(): Promise<{ transactions: Transaction[] }> {
    return this.request('/user/transactions');
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
  }): Promise<{ tickets: Ticket[]; balance: MultiCurrencyBalance; transaction: Transaction; message: string }> {
    return this.request('/tickets/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyTickets(): Promise<{ tickets: Ticket[] }> {
    return this.request('/tickets/my-tickets');
  }

  async transferTicket(ticketId: string, recipientEmail: string): Promise<{ message: string; ticket: Ticket }> {
    return this.request('/tickets/transfer', {
      method: 'POST',
      body: JSON.stringify({ ticketId, recipientEmail }),
    });
  }

  async requestDownload(ticketId: string): Promise<{ message: string; verificationToken: string; expiresIn: string }> {
    return this.request('/tickets/request-download', {
      method: 'POST',
      body: JSON.stringify({ ticketId }),
    });
  }

  async verifyDownload(token: string): Promise<{ ticket: Ticket; message: string }> {
    return this.request(`/tickets/verify-download/${token}`);
  }

  async validateTicket(qrCode: string): Promise<{ message: string; ticket: Ticket }> {
    return this.request('/tickets/validate', {
      method: 'POST',
      body: JSON.stringify({ qrCode }),
    });
  }
}

export const api = new ApiClient();
