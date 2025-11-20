import { useEffect, useState } from "react";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { getUserTickets, Ticket, resendTicketPinEmail, assignPinToTicket } from "../utils/tickets/ticketService";
import { TicketComponent } from "../components/tickets/TicketComponent";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  Ticket as TicketIcon, 
  Download, 
  QrCode, 
  Calendar, 
  MapPin, 
  User,
  Loader2,
  Filter,
  Search,
  Mail,
  CheckCircle2,
  Shield
} from "lucide-react";
import { SEOHead } from "../components/common";
import { useLanguage } from "../hooks/useLanguage";

export function MyTicketsPage() {
  const { navigate } = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingPin, setSendingPin] = useState<string | null>(null);
  const [pinSent, setPinSent] = useState<string | null>(null);
  const [assigningPin, setAssigningPin] = useState<string | null>(null);

  useEffect(() => {
    // NO redirigir si aún está cargando la autenticación
    if (authLoading) {
      return;
    }
    
    if (user?.email) {
      loadTickets();
    } else {
      // Solo redirigir después de que termine de cargar y NO haya usuario
      navigate("login");
    }
  }, [user, authLoading]);

  const loadTickets = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const userTickets = await getUserTickets(user.email);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    // Usar window.print() para imprimir
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // Abrir el ticket en el modal para que se pueda descargar
    setSelectedTicket(ticket);
  };

  const handleResendPin = async (ticket: Ticket) => {
    if (!user?.email || !ticket.pin) {
      alert('No se puede reenviar el PIN. Verifica que tengas acceso a este ticket.');
      return;
    }

    try {
      setSendingPin(ticket.id);
      setPinSent(null);
      
      const result = await resendTicketPinEmail(ticket.id, user.email);
      
      if (result.success) {
        setPinSent(ticket.id);
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
          setPinSent(null);
        }, 5000);
      } else {
        alert(result.message || 'Error al reenviar el PIN');
      }
    } catch (error) {
      console.error('Error resending PIN:', error);
      alert('Error al reenviar el PIN. Por favor, intenta de nuevo.');
    } finally {
      setSendingPin(null);
    }
  };

  const handleAssignPin = async (ticket: Ticket) => {
    if (!user?.email) {
      alert('Debes estar autenticado para asignar un PIN.');
      return;
    }

    try {
      setAssigningPin(ticket.id);
      
      const result = await assignPinToTicket(ticket.id, user.email);
      
      if (result.success) {
        // Recargar los tickets para obtener el PIN actualizado
        await loadTickets();
        alert('PIN asignado exitosamente y enviado por email. Revisa tu bandeja de entrada.');
      } else {
        alert(result.message || 'Error al asignar el PIN');
      }
    } catch (error) {
      console.error('Error assigning PIN:', error);
      alert('Error al asignar el PIN. Por favor, intenta de nuevo.');
    } finally {
      setAssigningPin(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    // Filtro por estado
    if (filter === 'unused' && ticket.status !== 'issued_unused') return false;
    if (filter === 'used' && ticket.status !== 'issued_used') return false;
    
    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.event_name.toLowerCase().includes(query) ||
        ticket.ticket_code.toLowerCase().includes(query) ||
        ticket.buyer_full_name.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued_unused':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Sin Usar</Badge>;
      case 'issued_used':
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/50">Usado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Cancelado</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">Reembolsado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Mostrar cargando mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  // Si no hay usuario después de cargar, no renderizar (ya se redirigió)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <SEOHead
        seo={{
          title: "Mis Boletas | Tiquetera",
          description: "Ver y descargar tus boletas de eventos",
        }}
      />

      {/* Header */}
      <div className="border-b border-white/20 bg-black/95 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("home")}
              className="gap-2 !text-white hover:!bg-white/10 hover:!text-white"
            >
              ← Volver
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {t('profile.my_tickets_page')}
            </h1>
            <div className="w-20"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros y búsqueda */}
        <div className="mb-6 space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Buscar por evento, código o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-12 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#c61619]"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-[#c61619] hover:bg-[#a01316]' : 'border-white/20 !text-white hover:!bg-white/10'}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'unused' ? 'default' : 'outline'}
              onClick={() => setFilter('unused')}
              className={filter === 'unused' ? 'bg-[#c61619] hover:bg-[#a01316]' : 'border-white/20 !text-white hover:!bg-white/10'}
            >
              Sin Usar
            </Button>
            <Button
              variant={filter === 'used' ? 'default' : 'outline'}
              onClick={() => setFilter('used')}
              className={filter === 'used' ? 'bg-[#c61619] hover:bg-[#a01316]' : 'border-white/20 !text-white hover:!bg-white/10'}
            >
              Usadas
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        )}

        {/* Lista de boletas */}
        {!loading && filteredTickets.length === 0 && (
          <Card className="p-12 text-center !bg-white/5 border-white/20">
            <TicketIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {tickets.length === 0 ? t('profile.no_tickets') : 'No se encontraron boletas'}
            </h3>
            <p className="text-white/60 mb-6">
              {tickets.length === 0 
                ? t('profile.no_tickets_desc')
                : 'Intenta con otros filtros o términos de búsqueda'}
            </p>
            {tickets.length === 0 && (
              <Button
                onClick={() => navigate("events")}
                className="bg-[#c61619] hover:bg-[#a01316] text-white"
              >
                Explorar Eventos
              </Button>
            )}
          </Card>
        )}

        {/* Grid de boletas */}
        {!loading && filteredTickets.length > 0 && (
          <div className="space-y-6">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden !bg-white/5 border-white/20">
                <div className="p-6">
                  {/* Header de la boleta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {ticket.event_name}
                        </h3>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-white/70">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(ticket.event_date)}</span>
                        </div>
                        {ticket.event_location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{ticket.event_location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          <span className="font-mono">{ticket.ticket_code}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#c61619] mb-1">
                        ${ticket.price.toLocaleString()}
                      </p>
                      {ticket.ticket_class && (
                        <Badge variant="outline" className="border-white/20 text-white/80">
                          {ticket.ticket_class}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    {ticket.seat_number && (
                      <div>
                        <p className="text-white/60">Asiento</p>
                        <p className="text-white font-semibold">{ticket.seat_number}</p>
                      </div>
                    )}
                    {ticket.gate_number && (
                      <div>
                        <p className="text-white/60">Puerta</p>
                        <p className="text-white font-semibold">{ticket.gate_number}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-white/60">Comprado</p>
                      <p className="text-white font-semibold">{formatDate(ticket.purchase_date)}</p>
                    </div>
                    {ticket.used_at && (
                      <div>
                        <p className="text-white/60">Usado</p>
                        <p className="text-white font-semibold">{formatDate(ticket.used_at)}</p>
                      </div>
                    )}
                  </div>

                  {/* PIN de Seguridad - Destacado */}
                  {ticket.pin && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-red-900/30 to-red-800/20 border-2 border-red-500/40 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-6 w-6 text-red-400" />
                          <div>
                            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">🔐 PIN de Seguridad</p>
                            <p className="text-3xl font-bold text-white tracking-[0.5em] font-mono">{ticket.pin}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-red-300 font-semibold">⚠️ Requerido en el evento</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSelectedTicket(ticket)}
                        variant="outline"
                        className="flex-1 border-white/20 !text-white hover:!bg-white/10"
                      >
                        <TicketIcon className="h-4 w-4 mr-2" />
                        Ver Boleta
                      </Button>
                      <Button
                        onClick={() => handlePrintTicket(ticket)}
                        variant="outline"
                        className="flex-1 border-white/20 !text-white hover:!bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                    
                    {/* Botón para reenviar PIN o asignar PIN si no existe */}
                    <div className="relative">
                      {!ticket.pin ? (
                        // Si no tiene PIN, mostrar botón para asignar
                        <>
                          <Button
                            onClick={() => handleAssignPin(ticket)}
                            disabled={assigningPin === ticket.id}
                            variant="outline"
                            className="w-full border-white/50 !text-white hover:!bg-white/10 disabled:opacity-50"
                          >
                            {assigningPin === ticket.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Asignando PIN...
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Asignar PIN de Seguridad
                              </>
                            )}
                          </Button>
                          <p className="text-xs !text-white mt-1 text-center">
                            Este ticket no tiene PIN asignado
                          </p>
                        </>
                      ) : (
                        // Si tiene PIN, mostrar botón para reenviar
                        <>
                          <Button
                            onClick={() => handleResendPin(ticket)}
                            disabled={sendingPin === ticket.id}
                            variant="outline"
                            className="w-full border-white/50 !text-white hover:!bg-white/10 disabled:opacity-50"
                          >
                            {sendingPin === ticket.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : pinSent === ticket.id ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                PIN Enviado
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Reenviar PIN por Email
                              </>
                            )}
                          </Button>
                          {pinSent === ticket.id && (
                            <p className="text-xs text-green-400 mt-1 text-center">
                              PIN enviado a {user?.email}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal para ver boleta completa */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setSelectedTicket(null)}
                  variant="ghost"
                  className="!text-white hover:!bg-white/10"
                >
                  ✕ Cerrar
                </Button>
              </div>
              <div className="bg-white rounded-lg p-4">
                <TicketComponent 
                  ticket={selectedTicket}
                  onPrint={() => {
                    window.print();
                  }}
                  onDownload={() => {
                    // La descarga se maneja dentro del componente
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Estilos para impresión */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-ticket, .print-ticket * {
              visibility: visible;
            }
            .print-ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

