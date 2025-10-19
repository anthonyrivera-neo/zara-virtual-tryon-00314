import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads user photo to Supabase Storage
 */
export async function uploadUserPhoto(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('user-photos')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading photo: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('user-photos')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Generates virtual try-on using real AI
 */
export async function generateVirtualTryOn(
  userPhotoUrl: string,
  productPhotoUrl: string,
  productName: string
): Promise<string> {
  console.log('Generating virtual try-on with:', { userPhotoUrl, productPhotoUrl, productName });
  
  const { data, error } = await supabase.functions.invoke('virtual-tryon', {
    body: {
      userPhotoUrl,
      productPhotoUrl,
      productName
    }
  });

  if (error) {
    console.error('Error generating virtual try-on:', error);
    throw new Error(`Error al procesar la imagen con IA: ${error.message || 'Error desconocido'}`);
  }

  if (data?.error) {
    console.error('Edge function returned error:', data.error);
    if (data.error.includes('Rate limit') || data.error.includes('429')) {
      throw new Error('Límite de uso alcanzado. Intenta de nuevo en unos momentos.');
    }
    if (data.error.includes('Payment required') || data.error.includes('402')) {
      throw new Error('Se requieren créditos adicionales en tu cuenta.');
    }
    if (data.error.includes('Invalid URL')) {
      throw new Error('Error al cargar las imágenes. Por favor intenta de nuevo.');
    }
    throw new Error(`Error del modelo de IA: ${data.error}`);
  }

  if (!data?.resultUrl) {
    throw new Error('No se recibió imagen del modelo de IA');
  }

  return data.resultUrl;
}

/**
 * Saves user result with feedback to database
 */
export async function saveUserResult(
  userPhotoUrl: string,
  productUrl: string,
  productName: string,
  resultUrl: string,
  feedback: 'like' | 'dislike'
): Promise<void> {
  const { error } = await supabase
    .from('user_results')
    .insert({
      user_photo_url: userPhotoUrl,
      product_url: productUrl,
      product_name: productName,
      result_url: resultUrl,
      feedback
    });

  if (error) {
    console.error('Error saving user result:', error);
    throw error;
  }
}
