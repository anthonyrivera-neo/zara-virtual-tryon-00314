import { supabase } from "@/integrations/supabase/client";

export async function uploadUserPhoto(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('user-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Error al subir la foto');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('user-photos')
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function simulateTryOn(photoUrl: string, productName: string): Promise<string> {
  // Simular retardo de procesamiento IA (2.5 segundos)
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Buscar simulación mock en la base de datos
  const { data, error } = await supabase
    .from('simulations')
    .select('result_url')
    .ilike('product_name', `%${productName}%`)
    .single();

  if (error || !data) {
    console.log('No simulation found, using default');
    // Retornar imagen de ejemplo si no hay simulación
    return 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800';
  }

  return data.result_url;
}

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
    console.error('Error saving result:', error);
    throw new Error('Error al guardar el resultado');
  }
}
