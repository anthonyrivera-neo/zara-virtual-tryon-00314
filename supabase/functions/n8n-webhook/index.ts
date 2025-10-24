import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Webhook received from n8n:", payload);

    const { action, data } = payload;

    // Diferentes acciones que n8n puede ejecutar
    switch (action) {
      case "get_results": {
        // Obtener resultados de pruebas virtuales
        const { data: results, error } = await supabase
          .from("user_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(data?.limit || 10);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            data: results,
            message: "Resultados obtenidos exitosamente",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_feedback": {
        // Obtener estadísticas de feedback
        const { count: likesCount, error: likesError } = await supabase
          .from("user_results")
          .select("*", { count: "exact", head: true })
          .eq("feedback", "like");

        const { count: dislikesCount, error: dislikesError } = await supabase
          .from("user_results")
          .select("*", { count: "exact", head: true })
          .eq("feedback", "dislike");

        if (likesError || dislikesError) {
          throw likesError || dislikesError;
        }

        const likes = likesCount || 0;
        const dislikes = dislikesCount || 0;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              likes,
              dislikes,
              total: likes + dislikes,
            },
            message: "Estadísticas obtenidas exitosamente",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "save_result": {
        // Guardar un resultado desde n8n
        const { error } = await supabase.from("user_results").insert({
          user_photo_url: data.userPhotoUrl,
          product_url: data.productUrl,
          product_name: data.productName,
          result_url: data.resultUrl,
          feedback: data.feedback,
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            message: "Resultado guardado exitosamente",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_popular_products": {
        // Obtener productos más probados
        const { data: results, error } = await supabase
          .from("user_results")
          .select("product_name")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Contar frecuencias
        const productCounts = results?.reduce((acc: any, curr: any) => {
          acc[curr.product_name] = (acc[curr.product_name] || 0) + 1;
          return acc;
        }, {});

        const sortedProducts = Object.entries(productCounts || {})
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, data?.limit || 5)
          .map(([name, count]) => ({ product: name, tries: count }));

        return new Response(
          JSON.stringify({
            success: true,
            data: sortedProducts,
            message: "Productos populares obtenidos",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "Acción no reconocida. Usa: get_results, get_feedback, save_result, get_popular_products",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error en webhook:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
