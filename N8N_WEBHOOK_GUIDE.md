# Guía de Integración con n8n Webhook

## 🔗 URL del Webhook
```
https://dtpxrogvnvnooksmnkzx.supabase.co/functions/v1/n8n-webhook
```

## 📋 Configuración en n8n

### 1. Crear un Nodo HTTP Request en n8n

**Configuración básica:**
- **Method:** POST
- **URL:** `https://dtpxrogvnvnooksmnkzx.supabase.co/functions/v1/n8n-webhook`
- **Authentication:** None (el webhook es público)
- **Body Content Type:** JSON

### 2. Headers Necesarios
```json
{
  "Content-Type": "application/json",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cHhyb2d2bnZub29rc21ua3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTY4MDYsImV4cCI6MjA3Njg5MjgwNn0.1bGYvizFSvxdh3MyqnVdW6hcrwJ0xBYQgSiAW1_1tOk"
}
```

## 🎯 Acciones Disponibles

### 1. Obtener Resultados Recientes
**Acción:** `get_results`

**Body:**
```json
{
  "action": "get_results",
  "data": {
    "limit": 10
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_photo_url": "url",
      "product_name": "Camiseta Básica",
      "result_url": "url",
      "feedback": "like",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Resultados obtenidos exitosamente"
}
```

### 2. Obtener Estadísticas de Feedback
**Acción:** `get_feedback`

**Body:**
```json
{
  "action": "get_feedback",
  "data": {}
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "likes": 45,
    "dislikes": 12,
    "total": 57
  },
  "message": "Estadísticas obtenidas exitosamente"
}
```

### 3. Guardar Resultado
**Acción:** `save_result`

**Body:**
```json
{
  "action": "save_result",
  "data": {
    "userPhotoUrl": "https://example.com/user.jpg",
    "productUrl": "https://example.com/product.jpg",
    "productName": "Camiseta Básica",
    "resultUrl": "https://example.com/result.jpg",
    "feedback": "like"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Resultado guardado exitosamente"
}
```

### 4. Obtener Productos Populares
**Acción:** `get_popular_products`

**Body:**
```json
{
  "action": "get_popular_products",
  "data": {
    "limit": 5
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    { "product": "Camiseta Básica", "tries": 45 },
    { "product": "Jeans Clásicos", "tries": 32 },
    { "product": "Chaqueta de Cuero", "tries": 28 }
  ],
  "message": "Productos populares obtenidos"
}
```

## 🔄 Ejemplo de Workflow en n8n

### Flujo Básico:
1. **Trigger:** Webhook, Schedule, o Manual
2. **HTTP Request Node:** 
   - Method: POST
   - URL: El webhook URL
   - Body: JSON con action y data
3. **IF Node:** Verificar `success === true`
4. **Acciones:** Enviar email, guardar en Google Sheets, notificar Slack, etc.

## 🛠️ Casos de Uso

### 1. Reporte Diario de Actividad
```
Schedule Trigger (diario 9am)
  → HTTP Request (get_feedback)
  → IF (success)
  → Send Email con estadísticas
```

### 2. Alerta de Productos Populares
```
Schedule Trigger (semanal)
  → HTTP Request (get_popular_products)
  → Format Data
  → Send to Slack/Discord
```

### 3. Backup de Resultados
```
Schedule Trigger (cada hora)
  → HTTP Request (get_results)
  → Google Sheets (append)
```

## 🔐 Seguridad

- El webhook está protegido por CORS
- Usa la API key en los headers
- Todas las consultas pasan por RLS (Row Level Security)
- Las tablas son públicas para lectura/escritura (configurable)

## 📊 Monitoreo

Puedes ver los logs del webhook en:
- Lovable Cloud Dashboard
- Busca la función "n8n-webhook" en Edge Functions

## ⚠️ Límites y Consideraciones

- **Rate Limits:** Respeta los límites de Supabase (max 60 requests/min)
- **Timeout:** Las funciones tienen un timeout de 60 segundos
- **Payload Size:** Máximo 6MB por request
- **CORS:** Habilitado para todos los orígenes (*)

## 🆘 Troubleshooting

### Error 400
- Verifica que el `action` sea válido
- Revisa el formato del JSON body

### Error 500
- Revisa los logs en el dashboard
- Verifica que la tabla existe en la base de datos
- Confirma que los datos enviados son correctos

### No Response
- Verifica la URL del webhook
- Confirma que el header `apikey` está presente
- Revisa el formato del body JSON
