/**
 * API Types
 * Tipos relacionados con la API
 */
export interface User {
  id: string;
  email: string;
  name: string;
  balance: any;
  preferredCurrency?: string;
  createdAt: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role?: 'user' | 'hoster' | 'admin';
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
  currency?: string;
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
  currency?: string;
  date: string;
  description: string;
}

