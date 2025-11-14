/**
 * Routes Constants
 * Constantes relacionadas con las rutas de la aplicación
 */
export const ROUTES = {
  HOME: 'home',
  EVENTS: 'events',
  EVENT_DETAIL: 'event-detail',
  CHECKOUT: 'checkout',
  PROFILE: 'profile',
  CONFIRMATION: 'confirmation',
  LOGIN: 'login',
  ADD_BALANCE: 'add-balance',
  WALLET: 'wallet',
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];

