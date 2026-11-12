import { supabase } from '@/integrations/supabase/client';

export async function uploadBusinessAsset(
  file: File,
  folder: string = 'general',
  prefix: string = 'asset'
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${folder}/${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('business-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('business-assets')
      .getPublicUrl(fileName);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Error uploading file to business-assets:', err);
    return { url: null, error: err };
  }
}
