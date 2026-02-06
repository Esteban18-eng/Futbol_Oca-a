import { supabase } from './supabaseClient';
import { Escuela } from './supabaseClient';

// Interface para el resultado
export interface LogoUploadResult {
  success: boolean;
  logoUrl?: string;
  error?: string;
}

/**
 * Sube un logo para una escuela/equipo
 */
export const uploadTeamLogo = async (escuelaId: string, file: File): Promise<LogoUploadResult> => {
  try {
    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Formato no válido. Use JPG, PNG, WEBP o SVG'
      };
    }

    // Tamaño máximo: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'El logo no puede superar los 5MB'
      };
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${escuelaId}_logo_${timestamp}.${fileExt}`;
    const filePath = `logos/${fileName}`;
    
    console.log('🖼️ Subiendo logo para escuela:', escuelaId, fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('team-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Error subiendo logo:', uploadError);
      return { success: false, error: uploadError.message };
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('team-logos')
      .getPublicUrl(filePath);
    
    const logoUrl = urlData.publicUrl;
    
    // Actualizar la tabla escuelas
    const { error: updateError } = await supabase
      .from('escuelas')
      .update({ 
        logo_url: logoUrl,
        logo_file_type: file.type
      })
      .eq('id', escuelaId);
    
    if (updateError) {
      console.error('❌ Error actualizando escuela:', updateError);
      
      // Intentar eliminar el archivo subido
      try {
        await supabase.storage
          .from('team-logos')
          .remove([filePath]);
      } catch (deleteError) {
        console.error('Error limpiando archivo:', deleteError);
      }
      
      return { success: false, error: updateError.message };
    }
    
    console.log('✅ Logo subido exitosamente:', logoUrl);
    return { success: true, logoUrl };
    
  } catch (error: any) {
    console.error('💥 Error inesperado subiendo logo:', error);
    return { success: false, error: error.message || 'Error inesperado' };
  }
};

/**
 * Obtener logo de una escuela
 */
export const getEscuelaLogo = async (escuelaId: string): Promise<{
  logoUrl: string | null;
  fileType: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('escuelas')
      .select('logo_url, logo_file_type')
      .eq('id', escuelaId)
      .single();
    
    if (error) {
      console.error('❌ Error obteniendo logo:', error);
      return { logoUrl: null, fileType: null };
    }
    
    // El tipo Escuela ya incluye logo_url y logo_file_type
    const escuela = data as Escuela;
    
    return {
      logoUrl: escuela?.logo_url || null,
      fileType: escuela?.logo_file_type || null
    };
  } catch (error) {
    console.error('💥 Error obteniendo logo:', error);
    return { logoUrl: null, fileType: null };
  }
};

/**
 * Elimina el logo de una escuela
 */
export const deleteTeamLogo = async (escuelaId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Primero obtener el URL actual para extraer el path del archivo
    const { data: escuelaData, error: fetchError } = await supabase
      .from('escuelas')
      .select('logo_url')
      .eq('id', escuelaId)
      .single();
    
    if (fetchError) {
      return {
        success: false,
        error: fetchError.message
      };
    }
    
    const escuela = escuelaData as Escuela;
    const logoUrl = escuela?.logo_url;
    
    // Extraer path del archivo desde la URL
    if (logoUrl) {
      try {
        // Intentar extraer y eliminar el archivo
        const urlObj = new URL(logoUrl);
        const pathParts = urlObj.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // Obtiene "logos/nombre-archivo.ext"
        
        if (filePath) {
          const { error: deleteError } = await supabase.storage
            .from('team-logos')
            .remove([filePath]);
          
          if (deleteError) {
            console.warn('⚠️ No se pudo eliminar archivo físico:', deleteError);
          }
        }
      } catch (urlError) {
        console.warn('⚠️ Error procesando URL del logo:', urlError);
      }
    }
    
    // Actualizar escuela a null
    const { error: updateError } = await supabase
      .from('escuelas')
      .update({
        logo_url: null,
        logo_file_type: null
      })
      .eq('id', escuelaId);
    
    if (updateError) {
      return {
        success: false,
        error: updateError.message
      };
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Valida si una URL de logo es válida
 */
export const isValidLogoUrl = (url: string | null): boolean => {
  if (!url) return false;
  
  try {
    // Verificar que sea una URL válida
    new URL(url);
    
    // Verificar que sea una imagen
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
  } catch {
    return false;
  }
};

/**
 * Obtiene todas las escuelas con logos
 */
export const getEscuelasWithLogos = async (): Promise<Escuela[]> => {
  try {
    const { data, error } = await supabase
      .from('escuelas')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    
    return data as Escuela[] || [];
  } catch (error) {
    console.error('Error obteniendo escuelas con logos:', error);
    return [];
  }
};

/**
 * Verifica si una escuela tiene logo
 */
export const escuelaTieneLogo = (escuela: Escuela): boolean => {
  return !!escuela.logo_url && escuela.logo_url.length > 0;
};

/**
 * Obtiene URL del logo con tamaño específico (para optimización)
 */
export const getLogoUrlWithSize = (logoUrl: string | null /*size: 'small' | 'medium' | 'large' = 'medium'*/): string | null => {
  if (!logoUrl) return null;
  
  // Puedes usar transformaciones de imagen de Supabase si las configuras
  // Por ahora, retornamos la URL original
  return logoUrl;
};