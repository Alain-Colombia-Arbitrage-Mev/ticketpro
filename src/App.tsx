import { ThemeProvider } from "next-themes";
import { QueryProvider } from "./components/QueryProvider";
import { AuthInitializer } from "./components/AuthInitializer";
import { Header } from "./components/Header";
import { ThemeScript } from "./components/Scripts";
import { Footer } from "./components/Footer";
import { useRouter } from "./hooks/useRouter";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventsListPage } from "./pages/EventsListPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { AddBalancePage } from "./pages/AddBalancePage";
import { WalletPage } from "./pages/WalletPage";

function AppContent() {
  const { currentPage } = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {currentPage === "home" && <HomePage />}
      {currentPage === "events" && <EventsListPage />}
      {currentPage === "event-detail" && <EventDetailPage />}
      {currentPage === "checkout" && <CheckoutPage />}
      {currentPage === "confirmation" && <ConfirmationPage />}
      {currentPage === "profile" && <ProfilePage />}
      {currentPage === "login" && <LoginPage />}
      {currentPage === "add-balance" && <AddBalancePage />}
      {currentPage === "wallet" && <WalletPage />}
      
      <Footer />
    </div>
  );
}

/**
 * App Component - Aplicación principal
 * 
 * Stack Modernizado:
 * - TanStack Query para data fetching con cache
 * - Zustand stores para state management (en lugar de Context API)
 * - ThemeProvider para dark mode
 */
export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="ticketpro-theme">
      <ThemeScript />
      <QueryProvider>
        <AuthInitializer />
        <AppContent />
      </QueryProvider>
    </ThemeProvider>
  );
}
