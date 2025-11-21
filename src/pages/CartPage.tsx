import { useState, useEffect } from "react";
import { ShoppingCart, ChevronLeft, Trash2, Plus, Minus, ArrowRight, Calendar, MapPin, Ticket, ChevronDown, Check, Info } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { useRouter } from "../hooks/useRouter";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useCartStore } from "../stores/cartStore";
import { useCheckoutStore } from "../stores/checkoutStore";
import { ImageWithFallback } from "../components/media";
import { formatCurrency } from "../utils/currency";
import { toast } from "sonner";

export function CartPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items, removeItem, updateQuantity, updateTicketType, clearCart, getTotalItems, getTotalPrice, getDiscount, getTotalWithDiscount } = useCartStore();
  const { checkoutInfo, updateField, setCheckoutInfo, isAddressComplete } = useCheckoutStore();
  const [loading, setLoading] = useState(false);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const discount = getDiscount();
  const totalWithDiscount = getTotalWithDiscount();

  // Debug: Verificar descuento
  console.log('💰 CartPage - Discount Debug:', {
    totalItems,
    totalPrice,
    discount,
    totalWithDiscount,
    shouldHaveDiscount: totalItems >= 2,
    discountPercentage: totalItems >= 2 ? '10%' : '0%'
  });

  // Cargar dirección del usuario al montar
  useEffect(() => {
    console.log('🔍 CartPage - User Debug:', {
      hasUser: !!user,
      userEmail: user?.email,
      userAddress: user?.address,
      checkoutAddress: checkoutInfo.address,
      willLoadAddress: !!(user?.address && !checkoutInfo.address)
    });

    if (user) {
      // Siempre sincronizar email y nombre del usuario autenticado
      if (user.email && !checkoutInfo.email) {
        updateField('email', user.email);
      }
      if (user.name && !checkoutInfo.fullName) {
        updateField('fullName', user.name);
      }
      
      // Si el usuario tiene dirección guardada en su perfil y el checkoutStore está vacío
      if ((user.address || user.city) && !checkoutInfo.address) {
        console.log('📍 Cargando dirección completa del perfil:', {
          address: user.address?.substring(0, 30),
          city: user.city,
          country: user.country
        });
        setCheckoutInfo({
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || '',
          country: user.country || 'Colombia',
        });
      } else if (!user.address && !user.city) {
        console.log('⚠️ Usuario NO tiene dirección en su perfil');
      } else if (checkoutInfo.address) {
        console.log('ℹ️ Ya hay dirección en checkoutStore:', checkoutInfo.address.substring(0, 50));
      }
    }
  }, [user, checkoutInfo.address, checkoutInfo.email, checkoutInfo.fullName, setCheckoutInfo, updateField]);

  // Los boletos son digitales y se envían por correo
  // La dirección solo se necesita para pagos con Stripe en CheckoutPage

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

    // La dirección se validará y completará en CheckoutPage
    // No requerimos dirección completa aquí

    // Navegar al checkout con la dirección del checkoutStore
    navigate("checkout", {
      cartItems: items,
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

  // ❌ ELIMINADA: La dirección solo se edita en CheckoutPage con el formulario completo
  // que guarda directamente en Supabase

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
                <Card key={item.id} className="p-2 sm:p-3 md:p-6 !bg-black border-white/20">
                  <div className="flex gap-1.5 sm:gap-2 md:gap-4">
                    {/* Event Image - Ultra compacto 320px */}
                    {item.eventImage && (
                      <div className="flex-shrink-0">
                        <ImageWithFallback
                          src={item.eventImage}
                          alt={item.eventName}
                          className="w-14 h-14 min-[375px]:w-16 min-[375px]:h-16 sm:w-24 sm:h-24 object-cover rounded-md sm:rounded-lg"
                        />
                      </div>
                    )}
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 sm:mb-3 md:mb-4">
                        <h3 className="text-sm min-[375px]:text-base sm:text-lg md:text-xl font-semibold !text-white mb-1 sm:mb-2 hover:!text-[#c61619] transition-colors cursor-pointer line-clamp-2"
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
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 text-[10px] min-[375px]:text-xs sm:text-sm !text-white/70 mb-1.5 sm:mb-2 md:mb-3">
                          {item.eventDate && (
                            <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded">
                              <Calendar className="h-2.5 w-2.5 min-[375px]:h-3 min-[375px]:w-3 sm:h-4 sm:w-4 !text-white/60 flex-shrink-0" />
                              <span className="text-[10px] min-[375px]:text-xs sm:text-sm whitespace-nowrap">{new Date(item.eventDate).toLocaleDateString('es-MX', {
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                            </div>
                          )}
                          {item.eventLocation && (
                            <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded max-w-[140px] min-[375px]:max-w-none">
                              <MapPin className="h-2.5 w-2.5 min-[375px]:h-3 min-[375px]:w-3 sm:h-4 sm:w-4 !text-white/60 flex-shrink-0" />
                              <span className="line-clamp-1 text-[10px] min-[375px]:text-xs sm:text-sm">{item.eventLocation}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                          {/* Selector de tipo de ticket - Ultra compacto */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0.5 sm:gap-1 md:gap-2">
                            <span className="text-[10px] min-[375px]:text-xs sm:text-sm font-medium !text-white/80 whitespace-nowrap">Tipo:</span>
                            <Select
                              value={item.ticketType}
                              onValueChange={(value) => {
                                const selectedType = ticketTypes.find(t => t.name === value);
                                if (selectedType) {
                                  updateTicketType(item.id, selectedType.name, selectedType.price);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full sm:w-[140px] h-7 min-[375px]:h-8 sm:h-10 text-[11px] min-[375px]:text-xs sm:text-sm !bg-white/10 !border-white/30 hover:!bg-white/20 focus:!ring-[#c61619] focus:!ring-2 [&_svg]:!text-white [&_svg]:!fill-white [&>span]:!text-white [&_*]:!text-white">
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
                                        {formatCurrency(type.price, 'USD')}
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

                      {/* Quantity and Price - Ultra compacto 320px */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2 md:gap-4 pt-2 sm:pt-3 md:pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 md:gap-3">
                          <span className="text-[10px] min-[375px]:text-xs sm:text-sm font-medium !text-white/80">{t('cart.quantity')}:</span>
                          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 border border-white/20 rounded-md sm:rounded-lg bg-white/5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 min-[375px]:h-7 min-[375px]:w-7 sm:h-9 sm:w-9 !text-white hover:!bg-white/10 hover:!bg-[#c61619]/20"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-2.5 w-2.5 min-[375px]:h-3 min-[375px]:w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="w-6 min-[375px]:w-8 sm:w-10 text-center !text-white font-semibold text-xs min-[375px]:text-sm sm:text-base">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 min-[375px]:h-7 min-[375px]:w-7 sm:h-9 sm:w-9 !text-white hover:!bg-white/10 hover:!bg-[#c61619]/20"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                            >
                              <Plus className="h-2.5 w-2.5 min-[375px]:h-3 min-[375px]:w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 md:gap-4">
                          <div className="text-right flex-1 sm:flex-initial">
                            <p className="text-base min-[375px]:text-lg sm:text-xl font-bold !text-white">
                              {formatCurrency(item.total, 'USD')}
                            </p>
                            <p className="text-[10px] min-[375px]:text-xs !text-white/60">
                              {formatCurrency(item.ticketPrice, 'USD')} {t('cart.each')}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs !text-white/50 mt-1">
                                {item.quantity} × {formatCurrency(item.ticketPrice, 'USD')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 !text-red-400 hover:!text-red-300 hover:!bg-red-500/10 h-6 w-6 min-[375px]:h-7 min-[375px]:w-7 sm:h-9 sm:w-9"
                            onClick={() => removeItem(item.id)}
                            aria-label="Eliminar del carrito"
                          >
                            <Trash2 className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-5 sm:w-5" />
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
              <Card className="p-3 min-[375px]:p-4 sm:p-6 !bg-black border-white/20 lg:sticky lg:top-24">
                <h2 className="text-lg min-[375px]:text-xl font-bold !text-white mb-3 min-[375px]:mb-4">{t('cart.summary')}</h2>
                
                {/* Información sobre entrega digital */}
                <div className="mb-3 min-[375px]:mb-4 p-3 min-[375px]:p-4 sm:p-4 rounded-lg border-2 border-blue-400/50 bg-blue-500/20">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Ticket className="h-5 w-5 min-[375px]:h-6 min-[375px]:w-6 !text-blue-300 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm min-[375px]:text-base sm:text-lg font-bold !text-blue-100 mb-1">
                        Boletos Digitales
                      </p>
                      <p className="text-xs min-[375px]:text-sm sm:text-base !text-blue-50 leading-relaxed">
                        Recibirás tus boletos por correo con un PIN de seguridad
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 min-[375px]:space-y-2.5 sm:space-y-3 mb-3 min-[375px]:mb-4">
                  <div className="flex justify-between text-xs min-[375px]:text-sm">
                    <span className="!text-white/70">{t('cart.subtotal')}</span>
                    <span className="!text-white font-medium">
                      {formatCurrency(items.reduce((sum, item) => sum + item.subtotal, 0), 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs min-[375px]:text-sm">
                    <span className="!text-white/70">{t('cart.service_fee')}</span>
                    <span className="!text-white font-medium">
                      {formatCurrency(items.reduce((sum, item) => sum + item.serviceFee, 0), 'USD')}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs min-[375px]:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="!text-green-400">Descuento (10%)</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-400/50 text-[10px] px-1.5 py-0">
                          2+ tickets
                        </Badge>
                      </div>
                      <span className="!text-green-400 font-medium">
                        -{formatCurrency(discount, 'USD')}
                      </span>
                    </div>
                  )}
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between">
                    <span className="text-base min-[375px]:text-lg font-semibold !text-white">{t('cart.total')}</span>
                    <span className="text-base min-[375px]:text-lg font-bold !text-[#c61619]">
                      {formatCurrency(discount > 0 ? totalWithDiscount : totalPrice, 'USD')}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-[#c61619] hover:bg-[#a01316] text-white"
                  onClick={handleCheckout}
                  disabled={loading || items.length === 0}
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

