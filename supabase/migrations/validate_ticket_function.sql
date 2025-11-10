-- Función RPC para validar tickets de forma segura
-- Esta función verifica que el usuario tenga rol de hoster/admin antes de validar

CREATE OR REPLACE FUNCTION validate_ticket(
  p_ticket_id UUID DEFAULT NULL,
  p_ticket_code TEXT DEFAULT NULL,
  p_hoster_id UUID,
  p_hoster_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  ticket_code TEXT,
  qr_code TEXT,
  status TEXT,
  event_id INTEGER,
  event_name TEXT,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  event_category TEXT,
  buyer_id UUID,
  buyer_email TEXT,
  buyer_full_name TEXT,
  buyer_address TEXT,
  ticket_type TEXT,
  seat_number TEXT,
  seat_type TEXT,
  gate_number TEXT,
  ticket_class TEXT,
  ticket_category_id TEXT,
  price NUMERIC,
  price_paid NUMERIC,
  payment_method_id TEXT,
  purchase_id TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE,
  purchase_summary JSONB,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID,
  validation_code TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_user_role TEXT;
  v_validation_code TEXT;
BEGIN
  -- Verificar que se proporcione al menos ticket_id o ticket_code
  IF p_ticket_id IS NULL AND p_ticket_code IS NULL THEN
    RAISE EXCEPTION 'Se requiere ticket_id o ticket_code';
  END IF;

  -- Obtener el ticket
  IF p_ticket_id IS NOT NULL THEN
    SELECT * INTO v_ticket FROM tickets WHERE id = p_ticket_id;
  ELSE
    SELECT * INTO v_ticket FROM tickets WHERE ticket_code = p_ticket_code;
  END IF;

  -- Verificar que el ticket existe
  IF v_ticket IS NULL THEN
    RAISE EXCEPTION 'Ticket no encontrado';
  END IF;

  -- Verificar que el ticket no esté ya usado
  IF v_ticket.status = 'issued_used' THEN
    RAISE EXCEPTION 'Este ticket ya ha sido usado';
  END IF;

  -- Verificar que el ticket no esté cancelado o reembolsado
  IF v_ticket.status IN ('cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Este ticket ha sido %', v_ticket.status;
  END IF;

  -- Verificar fecha del evento
  IF v_ticket.event_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Este ticket no puede ser usado porque la fecha del evento ya pasó';
  END IF;

  -- Verificar que el usuario tenga rol de hoster o admin
  -- Obtener el rol del usuario desde la tabla de usuarios
  SELECT role INTO v_user_role 
  FROM users 
  WHERE id = p_hoster_id;

  IF v_user_role NOT IN ('hoster', 'admin') THEN
    RAISE EXCEPTION 'Solo usuarios con rol de hoster o admin pueden validar tickets';
  END IF;

  -- Generar código de validación único
  v_validation_code := upper(
    substr(md5(random()::text || clock_timestamp()::text), 1, 8)
  );

  -- Actualizar el ticket
  UPDATE tickets
  SET 
    status = 'issued_used',
    used_at = NOW(),
    used_by = p_hoster_id,
    validation_code = v_validation_code,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'validated_by', jsonb_build_object(
        'id', p_hoster_id,
        'email', p_hoster_email,
        'validated_at', NOW(),
        'role', v_user_role
      )
    ),
    updated_at = NOW()
  WHERE id = v_ticket.id;

  -- Retornar el ticket actualizado
  RETURN QUERY
  SELECT * FROM tickets WHERE id = v_ticket.id;
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION validate_ticket IS 'Valida y marca un ticket como usado. Requiere rol de hoster o admin.';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION validate_ticket TO authenticated;

