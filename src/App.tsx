import { lazy, Suspense } from "react";
import { QueryProvider, Header, Footer } from "./components/layout";
import { AuthInitializer } from "./components/auth";
import { useRouter } from "./hooks/useRouter";
import { HomePage } from "./pages/HomePage";

// Lazy load de todas las páginas excepto HomePage (página principal)
const EventDetailPage = lazy(() => import("./pages/EventDetailPage").then(m => ({ default: m.EventDetailPage })));
const EventsListPage = lazy(() => import("./pages/EventsListPage").then(m => ({ default: m.EventsListPage })));
const AllEventsPage = lazy(() => import("./pages/AllEventsPage").then(m => ({ default: m.AllEventsPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage").then(m => ({ default: m.ConfirmationPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const AddBalancePage = lazy(() => import("./pages/AddBalancePage").then(m => ({ default: m.AddBalancePage })));
const WalletPage = lazy(() => import("./pages/WalletPage").then(m => ({ default: m.WalletPage })));
const TermsPage = lazy(() => import("./pages/TermsPage").then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage").then(m => ({ default: m.RefundPolicyPage })));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ValidateTicketPage = lazy(() => import("./pages/ValidateTicketPage").then(m => ({ default: m.ValidateTicketPage })));
const MyTicketsPage = lazy(() => import("./pages/MyTicketsPage").then(m => ({ default: m.MyTicketsPage })));
const CartPage = lazy(() => import("./pages/CartPage").then(m => ({ default: m.CartPage })));
const HosterValidatePage = lazy(() => import("./pages/HosterValidatePage").then(m => ({ default: m.HosterValidatePage })));

// Componente de carga
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#c61619] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white/70 text-sm">Cargando...</p>
    </div>
  </div>
);

function AppContent() {
  const { currentPage } = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
      
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
