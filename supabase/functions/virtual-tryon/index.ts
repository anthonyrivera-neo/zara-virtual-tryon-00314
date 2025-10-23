import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPhotoUrl, productPhotoUrl, productName } = await req.json();
    
    if (!userPhotoUrl || !productPhotoUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userPhotoUrl and productPhotoUrl are required" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log("Starting virtual try-on generation...");
    console.log("User photo:", userPhotoUrl);
    console.log("Product photo:", productPhotoUrl);

    // Validate URLs
    try {
      new URL(userPhotoUrl);
      new URL(productPhotoUrl);
    } catch (urlError) {
      console.error("Invalid URL provided:", urlError);
      return new Response(
        JSON.stringify({ error: "Invalid URL: Las URLs de las imágenes no son válidas" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Verify input URLs are publicly accessible (HEAD request)
    console.log("Verifying public accessibility for images...");
    const [userHead, productHead] = await Promise.all([
      fetch(userPhotoUrl, { method: "HEAD" }),
      fetch(productPhotoUrl, { method: "HEAD" })
    ]);

    if (!userHead.ok || !productHead.ok) {
      console.error("Image URLs not publicly accessible", {
        userStatus: userHead.status,
        productStatus: productHead.status,
      });
      return new Response(
        JSON.stringify({ error: "Las imágenes no son públicas o accesibles." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Preparing images for AI...");
    // Fetch and convert BOTH images to base64 data URLs to avoid external fetch issues
    const [productRes, userRes] = await Promise.all([
      fetch(productPhotoUrl),
      fetch(userPhotoUrl),
    ]);

    if (!productRes.ok || !userRes.ok) {
      console.error("Failed to fetch images for conversion:", {
        productStatus: productRes.status,
        userStatus: userRes.status,
      });
      return new Response(
        JSON.stringify({ error: "No se pudieron obtener las imágenes para la simulación." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const [productBuffer, userBuffer] = await Promise.all([
      productRes.arrayBuffer(),
      userRes.arrayBuffer(),
    ]);

    function arrayBufferToBase64(buffer: ArrayBuffer): string {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      return btoa(binary);
    }

    const productMime = productRes.headers.get('content-type') || 'image/jpeg';
    const userMime = userRes.headers.get('content-type') || 'image/jpeg';

    const productDataUrl = `data:${productMime};base64,${arrayBufferToBase64(productBuffer)}`;
    const userDataUrl = `data:${userMime};base64,${arrayBufferToBase64(userBuffer)}`;

    // Call Lovable AI to merge the images
    const prompt = `Create a realistic fashion photo showing the person from the first image wearing the garment from the second image. 
    Preserve the person's face, pose, body proportions, and background from the first image. 
    Seamlessly blend the clothing item from the second image onto the person, ensuring proper fit, lighting, shadows, and fabric draping. 
    Maintain realistic lighting and a clean, editorial aesthetic similar to high-end fashion photography. 
    The result should look natural and professional, as if the person is actually wearing that garment.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: userDataUrl
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: productDataUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      let message = "AI gateway error";
      try {
        const parsed = JSON.parse(errorText);
        message = parsed?.error?.message || message;
      } catch (_) {
        // ignore parse error
      }
      return new Response(
        JSON.stringify({ error: message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: aiResponse.status }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      console.error("AI did not return image_url. Full payload:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No se pudo generar la simulación, intenta con otra foto o prenda." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Virtual try-on generated successfully");

    return new Response(
      JSON.stringify({ resultUrl: generatedImageUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in virtual-tryon:", errorMessage);
    console.error("Full error:", error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Failed to generate virtual try-on image"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status === 400 || status === 402 || status === 429 ? status : 500,
      }
    );
  }
});
