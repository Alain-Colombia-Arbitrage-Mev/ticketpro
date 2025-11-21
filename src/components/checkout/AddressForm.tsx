/**
 * AddressForm Component - Formulario mejorado para dirección
 */
import React, { useEffect, useState } from 'react';
import { MapPin, Save, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useCheckoutStore } from '../../stores/checkoutStore';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

interface AddressFormProps {
  onAddressValid?: (isValid: boolean) => void;
}

export function AddressForm({ onAddressValid }: AddressFormProps) {
  const { user, refreshUser } = useAuth();
  const { checkoutInfo, updateField, setCheckoutInfo, isAddressComplete } = useCheckoutStore();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar con datos del usuario o del store
  useEffect(() => {
    if (user) {
      // Si el usuario tiene dirección guardada pero el store está vacío, usar la del usuario
      if (!checkoutInfo.address && (user.address || user.city)) {
        console.log('📍 AddressForm: Cargando dirección del usuario al store');
        
        // Si el usuario tiene campos individuales (nuevo formato), usarlos directamente
        if (user.city || user.country) {
          console.log('✅ Usando campos estructurados:', { 
            address: user.address?.substring(0, 30), 
            city: user.city, 
            country: user.country 
          });
          
        setCheckoutInfo({
          fullName: user.name || '',
          email: user.email || '',
          address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zipCode: user.zipCode || '',
            country: user.country || 'Colombia'
          });
        } 
        // Fallback: Si solo hay campo 'address' (formato antiguo), intentar parsear
        else if (user.address) {
          console.log('⚠️ Parseando dirección antigua:', user.address.substring(0, 50));
          const parts = user.address.split(',').map(p => p.trim());
          
          let parsedAddress = {
            address: user.address,
            city: '',
            state: '',
            zipCode: '',
            country: 'Colombia'
          };

          if (parts.length >= 3) {
            const isZip = /^\d+$/.test(parts[parts.length - 2]) || /^\w+\d+$/.test(parts[parts.length - 2]);
            
            if (parts.length >= 5 && isZip) {
              parsedAddress = {
                country: parts.pop() || 'Colombia',
                zipCode: parts.pop() || '',
                state: parts.pop() || '',
                city: parts.pop() || '',
                address: parts.join(', ')
              };
            } else if (parts.length >= 4) {
              parsedAddress = {
                country: parts.pop() || 'Colombia',
                state: parts.pop() || '',
                city: parts.pop() || '',
                zipCode: '',
                address: parts.join(', ')
              };
            }
          }

          setCheckoutInfo({
            fullName: user.name || '',
            email: user.email || '',
            address: parsedAddress.address,
            city: parsedAddress.city,
            state: parsedAddress.state,
            zipCode: parsedAddress.zipCode,
            country: parsedAddress.country
          });
        }
      } else if (!checkoutInfo.email || !checkoutInfo.fullName) {
        // Asegurar que email y nombre estén siempre actualizados
        setCheckoutInfo({
          ...checkoutInfo,
          fullName: checkoutInfo.fullName || user.name || '',
          email: checkoutInfo.email || user.email || '',
        });
      }
    }
  }, [user]);

  // Notificar cuando la dirección esté completa
  useEffect(() => {
    const isValid = !!checkoutInfo.address && checkoutInfo.address.trim().length > 5;
    console.log('✅ AddressForm: Validación de dirección -', { 
      hasAddress: !!checkoutInfo.address, 
      length: checkoutInfo.address?.length || 0, 
      isValid 
    });
    onAddressValid?.(isValid);
  }, [checkoutInfo.address, onAddressValid]);

  const handleFieldChange = (field: keyof typeof checkoutInfo, value: string) => {
    console.log(`🔄 Campo cambiado: ${field} = "${value}"`);
    updateField(field, value);
    setHasChanges(true);
  };

  // 🔍 DEBUG: Verificar estado actual del checkoutInfo
  useEffect(() => {
    console.log('📋 Estado actual de checkoutInfo:', {
      address: checkoutInfo.address || 'VACÍO',
      city: checkoutInfo.city || 'VACÍO',
      state: checkoutInfo.state || 'VACÍO',
      zipCode: checkoutInfo.zipCode || 'VACÍO',
      country: checkoutInfo.country || 'VACÍO',
    });
  }, [checkoutInfo]);

  const handleSaveToProfile = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar la dirección');
      return;
    }

    if (!checkoutInfo.address || checkoutInfo.address.trim().length < 5) {
      toast.error('Por favor ingresa una dirección válida');
      return;
    }

    setSaving(true);
    try {
      // Guardar en Supabase usando instancia singleton
      const { supabase } = await import('../../utils/supabase/client');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('No hay sesión activa');
      }

      // Preparar datos de dirección estructurados
      const addressData = {
        address: checkoutInfo.address?.trim() || null,
        city: checkoutInfo.city?.trim() || null,
        state: checkoutInfo.state?.trim() || null,
        zip_code: checkoutInfo.zipCode?.trim() || null,
        country: checkoutInfo.country?.trim() || 'Colombia',
        updated_at: new Date().toISOString(),
      };

      // 🔍 DEBUG: Verificar qué datos se están enviando
      console.log('🔍 DATOS QUE SE VAN A GUARDAR EN SUPABASE:', {
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code,
        country: addressData.country
      });

      // Validar que al menos ciudad y país estén presentes
      if (!addressData.city || !addressData.country) {
        console.error('❌ FALTAN CAMPOS REQUERIDOS:', {
          hasCity: !!addressData.city,
          hasCountry: !!addressData.country,
          checkoutInfo: checkoutInfo
        });
        toast.error('Por favor completa al menos la ciudad y el país');
        return;
      }

      // Primero verificar si el perfil existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error verificando perfil:', checkError);
        throw checkError;
      }

      console.log('📍 Guardando dirección estructurada:', { 
        exists: !!existingProfile, 
        userId: session.user.id.substring(0, 8) + '...', 
        address: addressData.address?.substring(0, 30) + '...',
        city: addressData.city,
        country: addressData.country
      });

      if (existingProfile) {
        // Perfil existe, actualizar
        const { data: updatedData, error: updateError } = await supabase
          .from('profiles')
          .update(addressData)
          .eq('id', session.user.id)
          .select();

        if (updateError) {
          console.error('❌ Error actualizando dirección:', updateError);
          throw updateError;
        }
        
        if (!updatedData || updatedData.length === 0) {
          console.error('❌ No se actualizó ninguna fila. Posible bloqueo RLS.');
          throw new Error('No se pudo guardar la dirección. Verifique sus permisos.');
        }
        
        console.log('✅ Dirección actualizada en BD:', updatedData[0]);
      } else {
        // Perfil no existe, crear uno nuevo
        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            name: checkoutInfo.fullName || session.user.user_metadata?.name || '',
            ...addressData,
            created_at: new Date().toISOString(),
          })
          .select();

        if (insertError) {
          console.error('❌ Error creando perfil:', insertError);
          throw insertError;
      }

        console.log('✅ Perfil creado con dirección en BD:', insertedData?.[0]);
      }

      // Refrescar usuario para cargar la nueva dirección
      await refreshUser();
      setHasChanges(false);
      toast.success('Dirección guardada en tu perfil');
      console.log('🔄 Usuario refrescado con nueva dirección');
    } catch (error: any) {
      console.error('❌ Error guardando dirección:', error);
      
      // Mensajes de error más específicos según el código de error de Postgres
      if (error?.code === '42501') {
        toast.error('No tienes permisos para actualizar tu dirección. Verifica las políticas RLS.');
      } else if (error?.code === '23505') {
        toast.error('Ya existe un perfil con este ID. Por favor recarga la página.');
      } else if (error?.message) {
        toast.error('Error al guardar: ' + error.message);
      } else {
        toast.error('Error desconocido al guardar la dirección');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-2.5 min-[375px]:p-3 sm:p-4 md:p-6 !bg-white/5 border-white/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 min-[375px]:mb-4">
        <h3 className="text-base min-[375px]:text-lg font-semibold !text-white flex items-center gap-1.5 sm:gap-2">
          <MapPin className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5" />
          <span className="leading-tight">Información de Envío</span>
        </h3>
        {hasChanges && user && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveToProfile}
            disabled={saving}
            className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 h-8 text-xs w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 min-[375px]:h-4 min-[375px]:w-4 mr-1.5 animate-spin" />
                <span className="text-[11px] min-[375px]:text-xs">Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3 min-[375px]:h-4 min-[375px]:w-4 mr-1.5" />
                <span className="text-[11px] min-[375px]:text-xs">Guardar</span>
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-2.5 min-[375px]:space-y-3 sm:space-y-4">
        {/* Nombre Completo */}
        <div>
          <Label htmlFor="fullName" className="!text-white/80 text-xs min-[375px]:text-sm">
            Nombre Completo *
          </Label>
          <Input
            id="fullName"
            type="text"
            value={checkoutInfo.fullName || ''}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-sm"
            placeholder="Juan Pérez"
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="!text-white/80 text-xs min-[375px]:text-sm">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={checkoutInfo.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-sm"
            placeholder="juan@ejemplo.com"
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <Label htmlFor="phone" className="!text-white/80 text-xs min-[375px]:text-sm">
            Teléfono *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={checkoutInfo.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-sm"
            placeholder="+52 555 123 4567"
            required
          />
        </div>

        {/* Dirección */}
        <div>
          <Label htmlFor="address" className="!text-white/80 text-xs min-[375px]:text-sm">
            Calle y Número *
          </Label>
          <Input
            id="address"
            type="text"
            value={checkoutInfo.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-sm"
            placeholder="Ej: Cra 65f #31-40"
            required
          />
        </div>

        {/* Ciudad y Estado */}
        <div className="grid grid-cols-2 gap-2 min-[375px]:gap-2.5 sm:gap-4">
          <div>
            <Label htmlFor="city" className="!text-white/80 text-xs min-[375px]:text-sm">
              Ciudad *
            </Label>
            <Input
              id="city"
              type="text"
              value={checkoutInfo.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-xs min-[375px]:text-sm"
              placeholder="CDMX"
              required
            />
          </div>
          <div>
            <Label htmlFor="state" className="!text-white/80 text-xs min-[375px]:text-sm">
              Estado *
            </Label>
            <Input
              id="state"
              type="text"
              value={checkoutInfo.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-xs min-[375px]:text-sm"
              placeholder="CDMX"
              required
            />
          </div>
        </div>

        {/* Código Postal y País */}
        <div className="grid grid-cols-2 gap-2 min-[375px]:gap-2.5 sm:gap-4">
          <div>
            <Label htmlFor="zipCode" className="!text-white/80 text-xs min-[375px]:text-sm">
              C.P. *
            </Label>
            <Input
              id="zipCode"
              type="text"
              value={checkoutInfo.zipCode || ''}
              onChange={(e) => handleFieldChange('zipCode', e.target.value)}
              className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-xs min-[375px]:text-sm"
              placeholder="06000"
              required
            />
          </div>
          <div>
            <Label htmlFor="country" className="!text-white/80 text-xs min-[375px]:text-sm">
              País *
            </Label>
            <Input
              id="country"
              type="text"
              value={checkoutInfo.country || ''}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              className="mt-1 !bg-white/10 border-white/20 !text-white placeholder:!text-white/40 h-9 min-[375px]:h-10 text-xs min-[375px]:text-sm"
              placeholder="Ej: Colombia"
              required
            />
          </div>
        </div>

        {user?.address && !hasChanges && (
          <p className="text-xs !text-green-400 flex items-center gap-1">
            <Save className="h-3 w-3" />
            Usando tu dirección guardada
          </p>
        )}
      </div>
    </Card>
  );
}

