import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, conversationHistory, products } = await req.json();

    console.log("Chatbot request:", { message, context });

    // Obtener API key de Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no configurada");
    }

    // Construir prompt del sistema con contexto
    const systemPrompt = `Eres un asistente de moda inteligente para una tienda de ropa online.

Tu rol es ayudar al usuario con:
1. Activar/desactivar el modo "Probar ahora" (actualmente: ${context.tryOnModeActive ? "activo" : "inactivo"})
2. Recomendar prendas similares basándote en su historial
3. Agregar prendas al carrito

Contexto actual:
- Prendas probadas: ${context.triedProducts.join(", ") || "ninguna"}
- Carrito: ${context.cartItems.join(", ") || "vacío"}
- Productos disponibles: ${context.availableProducts.join(", ")}

Instrucciones importantes:
- Sé amigable, conciso y útil
- Si el usuario quiere activar/desactivar el modo prueba, confirma la acción
- Si pide recomendaciones, sugiere productos similares basándote en lo que ha probado
- Si quiere agregar algo al carrito, confirma qué producto específico
- Usa emojis ocasionalmente para ser más amigable

Formato de respuesta:
- Para acciones, tu respuesta debe ser clara sobre lo que vas a hacer
- Si recomiendas productos, menciónalos por nombre exacto`;

    // Preparar mensajes para la API
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6), // Últimos 6 mensajes para contexto
      { role: "user", content: message },
    ];

    // Llamar a Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "toggle_tryon_mode",
              description: "Activa o desactiva el modo de prueba virtual de prendas",
              parameters: {
                type: "object",
                properties: {
                  enable: {
                    type: "boolean",
                    description: "true para activar, false para desactivar",
                  },
                },
                required: ["enable"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "add_to_cart",
              description: "Agrega un producto específico al carrito de compras",
              parameters: {
                type: "object",
                properties: {
                  product_name: {
                    type: "string",
                    description: "Nombre exacto del producto a agregar",
                  },
                },
                required: ["product_name"],
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error de Lovable AI:", response.status, errorText);
      throw new Error(`Error de IA: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", data);

    const choice = data.choices[0];
    let responseText = choice.message.content || "¿En qué más te puedo ayudar?";
    let action = null;
    let mentionedProducts = [];

    // Detectar productos mencionados en la respuesta
    if (products && products.length > 0) {
      const lowerResponse = responseText.toLowerCase();
      mentionedProducts = products.filter((p: any) => 
        lowerResponse.includes(p.name.toLowerCase())
      );
    }

    // Procesar tool calls si existen
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (functionName === "toggle_tryon_mode") {
        action = {
          type: "toggle_tryon",
          value: args.enable,
        };
      } else if (functionName === "add_to_cart") {
        action = {
          type: "add_to_cart",
          productName: args.product_name,
        };
      }
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        action,
        products: mentionedProducts,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en chatbot-agent:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
        response: "Lo siento, tuve un problema. ¿Puedes intentar de nuevo?",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
