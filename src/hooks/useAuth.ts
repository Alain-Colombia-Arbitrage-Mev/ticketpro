/**
 * useAuth Hook - Compatible con la API anterior
 * Usa Zustand store internamente pero mantiene la misma interfaz
 */
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, loading, signIn, signUp, signOut, refreshUser, sendMagicLink, forgotPassword } = useAuthStore();
  
  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    sendMagicLink,
    forgotPassword,
  };
}

