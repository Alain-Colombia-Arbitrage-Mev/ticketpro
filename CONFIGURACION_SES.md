# 📧 CONFIGURACIÓN DE AMAZON SES PARA ALERTAS DE FRAUDE

## 🎯 Objetivo

Configurar Amazon SES para enviar emails automáticos de alerta de fraude a `info@trustwisebank.co`.

---

## 📋 PASOS DE CONFIGURACIÓN

### 1. Obtener Credenciales de AWS IAM

#### Opción A: Usar usuario IAM existente

Si ya tienes un usuario IAM con permisos de SES:

```bash
# Buscar en tu .env o archivos de configuración
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

#### Opción B: Crear nuevo usuario IAM

1. Ir a **AWS Console** → **IAM** → **Users** → **Create user**
2. Nombre: `veltlix-ses-sender`
3. **Attach policies**: Buscar y seleccionar `AmazonSESFullAccess`
4. **Create access key** → **Application running outside AWS**
5. Copiar `Access Key ID` y `Secret Access Key`

---

### 2. Configurar Secrets en Supabase

```bash
# Configurar credenciales de AWS
npx supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
npx supabase secrets set AWS_SECRET_ACCESS_KEY=...

# Opcional: Configurar región (default: us-east-1)
npx supabase secrets set AWS_REGION=us-east-1

# Opcional: Configurar email remitente (default: alerts@veltlix.com)
npx supabase secrets set SES_FROM_EMAIL=alerts@veltlix.com
```

**Verificar secrets**:
```bash
npx supabase secrets list
```

**Redesplegar función** (si ya configuraste secrets):
```bash
npx supabase functions deploy send-fraud-alert
```

---

### 3. Verificar Emails en Amazon SES

⚠️ **IMPORTANTE**: Por defecto, Amazon SES está en **Sandbox Mode**, que solo permite enviar a emails verificados.

#### A. Verificar Email Remitente

1. Ir a **AWS Console** → **Amazon SES** → **Verified identities**
2. Click **Create identity**
3. **Identity type**: Email address
4. **Email**: `alerts@veltlix.com`
5. Click **Create identity**
6. **Verificar email**: Revisar inbox de `alerts@veltlix.com` y hacer click en el link

#### B. Verificar Email Destinatario (Sandbox Mode)

1. **AWS Console** → **Amazon SES** → **Verified identities**
2. Click **Create identity**
3. **Email**: `info@trustwisebank.co`
4. Click **Create identity**
5. **Verificar email**: Revisar inbox de `info@trustwisebank.co` y hacer click en el link

---

### 4. Salir de Sandbox Mode (Producción)

Para enviar a cualquier email sin verificar:

1. **AWS Console** → **Amazon SES** → **Account dashboard**
2. En la sección **Sending statistics**, buscar "Sandbox"
3. Click **Request production access**
4. Completar formulario:
   - **Use case**: Fraud alerts for ticket sales platform
   - **Website URL**: https://veltlix.com
   - **Use case description**:
     ```
     We need to send fraud detection alerts to our security team 
     (info@trustwisebank.co) when suspicious card transactions are detected. 
     These are critical security notifications sent automatically by our system.
     ```
   - **Expected monthly volume**: < 100 emails/month
5. Submit y esperar aprobación (usualmente 24 horas)

---

## 🧪 TESTING

### 1. Probar que las credenciales funcionan

```bash
# Ver logs de la función
npx supabase functions logs send-fraud-alert --tail
```

### 2. Invocar manualmente (testing)

```bash
curl -X POST https://***REMOVED***.supabase.co/functions/v1/send-fraud-alert \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "fingerprint": "test_fingerprint_123",
    "current_buyer_email": "test@example.com",
    "current_buyer_name": "Test User",
    "original_buyer_email": "original@example.com",
    "original_buyer_name": "Original User",
    "card_last4": "4242",
    "card_brand": "visa",
    "order_id": "TEST_ORDER_123",
    "session_id": "cs_test_123",
    "amount": 10000,
    "currency": "usd",
    "original_first_used": "2025-11-15T10:00:00Z",
    "alert_type": "blocked"
  }'
```

### 3. Verificar en logs

Deberías ver:
```
✅ Email enviado via Amazon SES: <message-id>
```

O si falta configuración:
```
⚠️ AWS SES no configurado (faltan AWS_ACCESS_KEY_ID o AWS_SECRET_ACCESS_KEY)
```

---

## ❌ TROUBLESHOOTING

### Error: "Email address is not verified"

**Causa**: SES está en Sandbox Mode y el email no está verificado

**Solución**:
1. Verificar `alerts@veltlix.com` (remitente)
2. Verificar `info@trustwisebank.co` (destinatario)
3. O salir de Sandbox Mode

---

### Error: "Access Denied"

**Causa**: El usuario IAM no tiene permisos de SES

**Solución**: Agregar policy al usuario IAM:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### Error: "Invalid credentials"

**Causa**: Las credenciales en Supabase secrets son incorrectas

**Solución**:
```bash
# Verificar secrets actuales
npx supabase secrets list

# Reconfigurar si son incorrectos
npx supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
npx supabase secrets set AWS_SECRET_ACCESS_KEY=...

# Redesplegar
npx supabase functions deploy send-fraud-alert
```

---

### No se envían emails (sin error)

**Causa**: Secrets no configurados, función usa fallback de logging

**Verificar en logs**:
```bash
npx supabase functions logs send-fraud-alert
```

Si ves:
```
⚠️ AWS SES no configurado
```

**Solución**: Configurar secrets (ver paso 2)

---

## 📊 MONITOREO

### Ver emails enviados en AWS

1. **AWS Console** → **Amazon SES** → **Email sending**
2. Ver métricas de envíos, bounces, complaints

### Ver logs en Supabase

```bash
# Logs en tiempo real
npx supabase functions logs send-fraud-alert --tail

# Últimos 100 logs
npx supabase functions logs send-fraud-alert
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Obtener credenciales de AWS IAM
- [ ] Configurar `AWS_ACCESS_KEY_ID` en Supabase secrets
- [ ] Configurar `AWS_SECRET_ACCESS_KEY` en Supabase secrets
- [ ] (Opcional) Configurar `AWS_REGION` y `SES_FROM_EMAIL`
- [ ] Verificar `alerts@veltlix.com` en Amazon SES
- [ ] Verificar `info@trustwisebank.co` en Amazon SES (si Sandbox)
- [ ] Probar envío con curl
- [ ] Verificar email recibido en `info@trustwisebank.co`
- [ ] (Opcional) Solicitar salir de Sandbox Mode

---

## 📧 RESULTADO ESPERADO

Cuando se detecte fraude, se enviará automáticamente un email como este:

**De**: Veltlix Seguridad <alerts@veltlix.com>  
**Para**: info@trustwisebank.co  
**Asunto**: 🚨 FRAUDE BLOQUEADO: Tarjeta VISA ****4242 - Orden #ORDER123  

**Contenido**: Email HTML profesional con:
- Detalles de la transacción actual
- Información del usuario original
- Nivel de alerta (WARNING/BLOCKED)
- Pasos de acción requerida
- Links rápidos a dashboards

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE CONFIGURAR

1. ✅ Probar con transacción real de prueba
2. ✅ Verificar que el email llega a `info@trustwisebank.co`
3. ✅ Solicitar salir de Sandbox Mode si es necesario
4. ✅ Configurar dominio personalizado (`alerts@veltlix.com`)
5. ✅ Agregar CC a otros emails del equipo (opcional)

---

**Fecha**: 22 de Noviembre, 2025  
**Versión**: 1.0

