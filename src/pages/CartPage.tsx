import { useState } from "react";
import { ShoppingCart, ChevronLeft, Trash2, Plus, Minus, ArrowRight, Calendar, MapPin, Ticket, ChevronDown, Edit2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useCartStore } from "../stores/cartStore";
import { ImageWithFallback } from "../components/media";
import { formatCurrency } from "../utils/currency";

export function CartPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items, removeItem, updateQuantity, updateTicketType, clearCart, getTotalItems, getTotalPrice } = useCartStore();
  const [loading, setLoading] = useState(false);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Tipos de tickets disponibles
  const ticketTypes = [
    { name: "General", price: 800 },
    { name: "VIP", price: 1500 },
    { name: "Palco", price: 3500 },
  ];

  const handleCheckout = () => {
    if (!user) {
      navigate("login");
      return;
    }

    if (items.length === 0) {
      return;
    }

    // Verificar que el usuario tenga una dirección
    if (!user.address) {
      if (confirm("Necesitas agregar una dirección para completar la compra. ¿Deseas ir a tu perfil para agregarla?")) {
        navigate("profile");
      }
      return;
    }

    // Navegar al checkout con todos los items del carrito
    // El checkout procesará todos los items
    navigate("checkout", {
      cartItems: items, // Pasar todos los items del carrito
      // Mantener compatibilidad con checkout de un solo item
      id: items[0].eventId,
      title: items[0].eventName,
      date: items[0].eventDate,
      time: items[0].eventTime,
      location: items[0].eventLocation,
      image: items[0].eventImage,
      category: items[0].eventName,
      ticketType: items[0].ticketType,
      ticketPrice: items[0].ticketPrice.toString(),
      quantity: items[0].quantity,
      seatNumber: items[0].seatNumber,
      seatType: items[0].seatType,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 !bg-black border-white/20 max-w-md w-full">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 !text-white/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold !text-white mb-2">{t('cart.login_required')}</h2>
            <p className="!text-white/70 mb-6">{t('cart.login_required_desc')}</p>
            <Button
              className="bg-[#c61619] hover:bg-[#a01316] text-white"
              onClick={() => navigate("login")}
            >
              {t('nav.login')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-12">
      {/* Header */}
      <div className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("home")}
                className="rounded-lg !text-white hover:!bg-white/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold !text-white">{t('cart.title')}</h1>
                <p className="text-sm !text-white/70">
                  {totalItems > 0 
                    ? `${totalItems} ${totalItems === 1 ? t('cart.item') : t('cart.items')}`
                    : t('cart.empty')
                  }
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                className="border-white/20 !text-white hover:!bg-white/10"
                onClick={clearCart}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('cart.clear')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingCart className="h-24 w-24 !text-white/20 mb-6" />
            <h2 className="text-2xl font-bold !text-white mb-2">{t('cart.empty_title')}</h2>
            <p className="!text-white/70 mb-8 text-center max-w-md">
              {t('cart.empty_desc')}
            </p>
            <Button
              className="bg-[#c61619] hover:bg-[#a01316] text-white"
              onClick={() => navigate("all-events")}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {t('cart.browse_events')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-6 !bg-black border-white/20">
                  <div className="flex gap-4">
                    {/* Event Image */}
                    {item.eventImage && (
                      <div className="hidden sm:block flex-shrink-0">
                        <ImageWithFallback
                          src={item.eventImage}
                          alt={item.eventName}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold !text-white mb-2 hover:!text-[#c61619] transition-colors cursor-pointer"
                            onClick={() => navigate("event-detail", {
                              id: item.eventId,
                              title: item.eventName,
                              date: item.eventDate,
                              location: item.eventLocation,
                              image: item.eventImage,
                            })}
                          >
                          {item.eventName}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm !text-white/70 mb-3">
                          {item.eventDate && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                              <Calendar className="h-4 w-4 !text-white/60" />
                              <span>{new Date(item.eventDate).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                          )}
                          {item.eventLocation && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                              <MapPin className="h-4 w-4 !text-white/60" />
                              <span className="line-clamp-1">{item.eventLocation}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {/* Selector de tipo de ticket */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium !text-white/80 whitespace-nowrap">Tipo de entrada:</span>
                            <Select
                              value={item.ticketType}
                              onValueChange={(value) => {
                                const selectedType = ticketTypes.find(t => t.name === value);
                                if (selectedType) {
                                  updateTicketType(item.id, selectedType.name, selectedType.price);
                                }
                              }}
                            >
                              <SelectTrigger className="w-[160px] !bg-white/10 !border-white/30 hover:!bg-white/20 focus:!ring-[#c61619] focus:!ring-2 [&_svg]:!text-white [&_svg]:!fill-white [&>span]:!text-white [&_*]:!text-white">
                                <SelectValue className="!text-white">
                                  <div className="flex items-center gap-1.5 !text-white">
                                    <Ticket className="h-4 w-4 !text-white !stroke-white" />
                                    <span className="!text-white font-medium">{item.ticketType}</span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="!bg-black !border-white/30 [&_*]:!text-white [&_svg]:!text-white [&_svg]:!stroke-white">
                                {ticketTypes.map((type) => (
                                  <SelectItem 
                                    key={type.name} 
                                    value={type.name}
                                    className="!text-white hover:!bg-white/10 focus:!bg-white/10 focus:!text-white cursor-pointer [&_svg]:!text-white [&_svg]:!stroke-white"
                                  >
                                    <div className="flex items-center justify-between w-full gap-4">
                                      <div className="flex items-center gap-2">
                                        <Ticket className="h-4 w-4 !text-white !stroke-white" />
                                        <span className="font-medium !text-white">{type.name}</span>
                                      </div>
                                      <span className="text-sm !text-white/80">
                                        {formatCurrency(type.price, 'MXN')}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {item.seatNumber && (
                            <Badge variant="secondary" className="!bg-white/10 !text-white border-white/20 w-fit">
                              Asiento: {item.seatNumber}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium !text-white/80">{t('cart.quantity')}:</span>
                          <div className="flex items-center gap-2 border border-white/20 rounded-lg bg-white/5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 !text-white hover:!bg-white/10 hover:!bg-[#c61619]/20"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-10 text-center !text-white font-semibold text-base">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 !text-white hover:!bg-white/10 hover:!bg-[#c61619]/20"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xl font-bold !text-white">
                              {formatCurrency(item.total, 'MXN')}
                            </p>
                            <p className="text-xs !text-white/60">
                              {formatCurrency(item.ticketPrice, 'MXN')} {t('cart.each')}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs !text-white/50 mt-1">
                                {item.quantity} × {formatCurrency(item.ticketPrice, 'MXN')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 !text-red-400 hover:!text-red-300 hover:!bg-red-500/10 h-9 w-9"
                            onClick={() => removeItem(item.id)}
                            aria-label="Eliminar del carrito"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 !bg-black border-white/20 sticky top-24">
                <h2 className="text-xl font-bold !text-white mb-4">{t('cart.summary')}</h2>
                
                {/* Dirección del Usuario */}
                {user?.address && (
                  <div className="mb-4 p-3 rounded-lg border border-white/20 bg-white/5">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 !text-white/70 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs !text-white/60 mb-1">Dirección de entrega</p>
                        <p className="text-sm !text-white/90 break-words">{user.address}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("profile")}
                      className="mt-2 h-8 text-xs !text-white/70 hover:!text-white hover:!bg-white/10"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar dirección
                    </Button>
                  </div>
                )}

                {!user?.address && (
                  <div className="mb-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 !text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs !text-yellow-300 mb-1">Dirección requerida</p>
                        <p className="text-xs !text-yellow-200/80 mb-2">
                          Necesitas agregar una dirección para completar la compra
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("profile")}
                          className="h-8 text-xs !text-yellow-300 hover:!text-yellow-200 hover:!bg-yellow-500/20"
                        >
                          Agregar dirección
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="!text-white/70">{t('cart.subtotal')}</span>
                    <span className="!text-white font-medium">
                      {formatCurrency(items.reduce((sum, item) => sum + item.subtotal, 0), 'MXN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="!text-white/70">{t('cart.service_fee')}</span>
                    <span className="!text-white font-medium">
                      {formatCurrency(items.reduce((sum, item) => sum + item.serviceFee, 0), 'MXN')}
                    </span>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold !text-white">{t('cart.total')}</span>
                    <span className="text-lg font-bold !text-[#c61619]">
                      {formatCurrency(totalPrice, 'MXN')}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-[#c61619] hover:bg-[#a01316] text-white"
                  onClick={handleCheckout}
                  disabled={loading || items.length === 0 || !user?.address}
                >
                  {loading ? t('common.loading') : t('cart.checkout')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs !text-white/60 text-center mt-4">
                  {t('cart.secure_checkout')}
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

