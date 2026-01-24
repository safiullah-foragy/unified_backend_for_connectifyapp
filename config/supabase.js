import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://nqydqpllowakssgfpevt.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAnonKey) {
  console.warn('⚠️  SUPABASE_ANON_KEY not configured');
}

/**
 * Supabase client with anon key (for public operations)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase client with service role key (for admin operations)
 */
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (!supabaseAdmin) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not configured. Admin operations will be limited.');
}

/**
 * Upload file to Supabase Storage
 */
export const uploadToSupabase = async (bucket, path, file, contentType) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        contentType: contentType,
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Supabase Storage
 */
export const deleteFromSupabase = async (bucket, path) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { error } = await client.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Supabase delete error:', error);
    throw error;
  }
};

/**
 * Get public URL for a file
 */
export const getPublicUrl = (bucket, path) => {
  const client = supabaseAdmin || supabase;
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export default supabase;
