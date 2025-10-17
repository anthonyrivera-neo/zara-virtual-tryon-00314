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
 * Simulates AI try-on process
 * In production, this would call a real AI model
 */
export async function simulateTryOn(
  userPhotoUrl: string,
  productName: string
): Promise<string> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Fetch mock result from simulations table
  const { data, error } = await supabase
    .from('simulations')
    .select('result_url')
    .eq('product_name', productName)
    .maybeSingle();

  if (error) {
    console.error('Error fetching simulation:', error);
  }

  return data?.result_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800';
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
