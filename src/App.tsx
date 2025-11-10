import { QueryProvider, Header, Footer } from "./components/layout";
import { AuthInitializer } from "./components/auth";
import { useRouter } from "./hooks/useRouter";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventsListPage } from "./pages/EventsListPage";
import { AllEventsPage } from "./pages/AllEventsPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { AddBalancePage } from "./pages/AddBalancePage";
import { WalletPage } from "./pages/WalletPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import ContactPage from "./pages/ContactPage";
import { ValidateTicketPage } from "./pages/ValidateTicketPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { CartPage } from "./pages/CartPage";
import { HosterValidatePage } from "./pages/HosterValidatePage";

function AppContent() {
  const { currentPage } = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {currentPage === "home" && <HomePage />}
      {currentPage === "events" && <EventsListPage />}
      {currentPage === "all-events" && <AllEventsPage />}
      {currentPage === "event-detail" && <EventDetailPage />}
      {currentPage === "checkout" && <CheckoutPage />}
      {currentPage === "confirmation" && <ConfirmationPage />}
      {currentPage === "profile" && <ProfilePage />}
      {currentPage === "login" && <LoginPage />}
      {currentPage === "add-balance" && <AddBalancePage />}
      {currentPage === "wallet" && <WalletPage />}
      {currentPage === "terms" && <TermsPage />}
      {currentPage === "privacy" && <PrivacyPage />}
      {currentPage === "refund-policy" && <RefundPolicyPage />}
      {currentPage === "contact" && <ContactPage />}
      {currentPage === "validate-ticket" && <ValidateTicketPage />}
      {currentPage === "my-tickets" && <MyTicketsPage />}
      {currentPage === "cart" && <CartPage />}
      {currentPage === "hoster-validate" && <HosterValidatePage />}
      
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
 */
export default function App() {
  return (
    <QueryProvider>
      <AuthInitializer />
      <AppContent />
    </QueryProvider>
  );
}
