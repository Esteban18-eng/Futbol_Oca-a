import { createClient } from '@supabase/supabase-js'
import { Database } from '../components/Dasboard/coach/types/supabase.types'

// Debug: Verificar que las variables se están cargando
console.log('Variables de entorno:')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Definida' : 'No definida')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Definida' : 'No definida')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables faltantes:')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseAnonKey ? 'Existe' : 'No existe')
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ============ TIPOS ACTUALIZADOS ============

// Usa los tipos directamente de Database
export type Escuela = Database['public']['Tables']['escuelas']['Row']

export type Usuario = Database['public']['Tables']['usuarios']['Row'] & {
  escuela?: Escuela | null
}

export type Jugador = Database['public']['Tables']['jugadores']['Row'] & {
  categoria?: Database['public']['Tables']['categorias']['Row']
  escuela?: Escuela
}

export type Categoria = Database['public']['Tables']['categorias']['Row']
export type UserRole = Database['public']['Enums']['user_role']

// Tipos para las nuevas tablas de ubicaciones
export type Pais = Database['public']['Tables']['paises']['Row']
export type Departamento = Database['public']['Tables']['departamentos']['Row']
export type Ciudad = Database['public']['Tables']['ciudades']['Row']

export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']
export type JugadorInsert = Database['public']['Tables']['jugadores']['Insert']
export type JugadorUpdate = Database['public']['Tables']['jugadores']['Update']

// ===========================================
// TIPOS Y FUNCIONES PARA ARCHIVOS
// ===========================================

// Tipos para archivos
export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PlayerFiles {
  foto_perfil?: File | null;
  documento_pdf?: File | null;
  registro_civil?: File | null;
}

// ===========================================
// FUNCIONES PARA LOGOS DE ESCUELAS/EQUIPOS
// ===========================================

export interface LogoUploadResult {
  success: boolean;
  logoUrl?: string;
  error?: string;
}

/**
 * Subir logo de escuela/equipo
 */
export const uploadEscuelaLogo = async (escuelaId: string, file: File): Promise<LogoUploadResult> => {
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
export const getEscuelaLogoUrl = async (escuelaId: string): Promise<string | null> => {
  try {
    console.log('🔍 Consultando BD para escuelaId:', escuelaId);
    const { data, error } = await supabase
      .from('escuelas')
      .select('logo_url')
      .eq('id', escuelaId)
      .single();
    
    if (error) {
      console.error('❌ Error obteniendo logo de BD:', error);
      return null;
    }
    
    console.log('✅ Logo URL de BD:', data?.logo_url);
    return data?.logo_url || null;
  } catch (error) {
    console.error('💥 Error obteniendo logo:', error);
    return null;
  }
};

/**
 * Eliminar logo de una escuela
 */
export const deleteEscuelaLogo = async (escuelaId: string): Promise<LogoUploadResult> => {
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
    
    // Extraer path del archivo desde la URL
    const logoUrl = escuelaData?.logo_url;
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
 * Verificar si una escuela tiene logo
 */
export const escuelaTieneLogo = async (escuelaId: string): Promise<boolean> => {
  try {
    const logoUrl = await getEscuelaLogoUrl(escuelaId);
    return !!logoUrl && logoUrl.length > 0;
  } catch (error) {
    return false;
  }
};

// ===========================================
// FUNCIONES EXISTENTES (se mantienen igual)
// ===========================================

// Función para validar tipos de archivo
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Función para validar tamaño de archivo (en MB)
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Función para generar nombre único de archivo
const generateUniqueFileName = (originalName: string, documento: string, tipo: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `${documento}_${tipo}_${timestamp}.${extension}`;
};

// Función para subir foto de perfil
export const uploadProfilePhoto = async (file: File, documento: string): Promise<FileUploadResult> => {
  try {
    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validateFileType(file, allowedTypes)) {
      return { success: false, error: 'Tipo de archivo no válido. Solo se permiten JPG, PNG y WEBP.' };
    }
    
    if (!validateFileSize(file, 5)) { // 5MB máximo
      return { success: false, error: 'La imagen no puede ser mayor a 5MB.' };
    }
    
    const fileName = generateUniqueFileName(file.name, documento, 'foto');
    const filePath = `fotos_perfil/${fileName}`;
    
    console.log('🖼️ Subiendo foto de perfil:', filePath);
    
    const { error } = await supabase.storage
      .from('jugadores')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Error uploading profile photo:', error);
      return { success: false, error: error.message };
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('jugadores')
      .getPublicUrl(filePath);
    
    console.log('✅ Foto subida exitosamente:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
    
  } catch (error: any) {
    console.error('💥 Error in uploadProfilePhoto:', error);
    return { success: false, error: error.message };
  }
};

// Función para subir documento PDF
export const uploadDocumentPDF = async (file: File, documento: string): Promise<FileUploadResult> => {
  try {
    // Validaciones
    const allowedTypes = ['application/pdf'];
    if (!validateFileType(file, allowedTypes)) {
      return { success: false, error: 'Solo se permiten archivos PDF.' };
    }
    
    if (!validateFileSize(file, 10)) { // 10MB máximo
      return { success: false, error: 'El PDF no puede ser mayor a 10MB.' };
    }
    
    const fileName = generateUniqueFileName(file.name, documento, 'documento');
    const filePath = `documentos/${fileName}`;
    
    console.log('📄 Subiendo documento PDF:', filePath);
    
    const { error } = await supabase.storage
      .from('jugadores')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Error uploading document PDF:', error);
      return { success: false, error: error.message };
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('jugadores')
      .getPublicUrl(filePath);
    
    console.log('✅ Documento PDF subido exitosamente:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
    
  } catch (error: any) {
    console.error('💥 Error in uploadDocumentPDF:', error);
    return { success: false, error: error.message };
  }
};

// Función para subir registro civil PDF
export const uploadRegistroCivilPDF = async (file: File, documento: string): Promise<FileUploadResult> => {
  try {
    // Validaciones
    const allowedTypes = ['application/pdf'];
    if (!validateFileType(file, allowedTypes)) {
      return { success: false, error: 'Solo se permiten archivos PDF.' };
    }
    
    if (!validateFileSize(file, 10)) { // 10MB máximo
      return { success: false, error: 'El PDF no puede ser mayor a 10MB.' };
    }
    
    const fileName = generateUniqueFileName(file.name, documento, 'registro_civil');
    const filePath = `registros_civiles/${fileName}`;
    
    console.log('📋 Subiendo registro civil PDF:', filePath);
    
    const { error } = await supabase.storage
      .from('jugadores')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Error uploading registro civil PDF:', error);
      return { success: false, error: error.message };
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('jugadores')
      .getPublicUrl(filePath);
    
    console.log('✅ Registro civil subido exitosamente:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
    
  } catch (error: any) {
    console.error('💥 Error in uploadRegistroCivilPDF:', error);
    return { success: false, error: error.message };
  }
};

// Función para subir múltiples archivos de un jugador
export const uploadPlayerFiles = async (files: PlayerFiles, documento: string) => {
  const results = {
    foto_perfil_url: '',
    documento_pdf_url: '',
    registro_civil_url: '',
    errors: [] as string[]
  };
  
  try {
    console.log('📤 Iniciando subida de archivos para documento:', documento);
    console.log('📁 Archivos a subir:', {
      foto_perfil: files.foto_perfil?.name || 'No seleccionada',
      documento_pdf: files.documento_pdf?.name || 'No seleccionado', 
      registro_civil: files.registro_civil?.name || 'No seleccionado'
    });

    // Subir foto de perfil (OBLIGATORIA)
    if (files.foto_perfil) {
      console.log('🖼️ Subiendo foto de perfil...');
      const photoResult = await uploadProfilePhoto(files.foto_perfil, documento);
      if (photoResult.success) {
        results.foto_perfil_url = photoResult.url!;
        console.log('✅ Foto de perfil subida:', results.foto_perfil_url);
      } else {
        results.errors.push(`Foto de perfil: ${photoResult.error}`);
        console.error('❌ Error subiendo foto:', photoResult.error);
      }
    } else {
      results.errors.push('Foto de perfil: No se seleccionó ninguna foto');
      console.error('❌ Foto de perfil no seleccionada');
    }
    
    // Subir documento PDF (OPCIONAL)
    if (files.documento_pdf) {
      console.log('📄 Subiendo documento PDF...');
      const docResult = await uploadDocumentPDF(files.documento_pdf, documento);
      if (docResult.success) {
        results.documento_pdf_url = docResult.url!;
        console.log('✅ Documento PDF subido:', results.documento_pdf_url);
      } else {
        results.errors.push(`Documento PDF: ${docResult.error}`);
        console.error('❌ Error subiendo documento:', docResult.error);
      }
    } else {
      console.log('ℹ️ Documento PDF no seleccionado (opcional)');
    }

    // Subir registro civil PDF (OPCIONAL)
    if (files.registro_civil) {
      console.log('📋 Subiendo registro civil PDF...');
      const registroResult = await uploadRegistroCivilPDF(files.registro_civil, documento);
      if (registroResult.success) {
        results.registro_civil_url = registroResult.url!;
        console.log('✅ Registro civil subido:', results.registro_civil_url);
      } else {
        results.errors.push(`Registro civil: ${registroResult.error}`);
        console.error('❌ Error subiendo registro civil:', registroResult.error);
      }
    } else {
      console.log('ℹ️ Registro civil no seleccionado (opcional)');
    }

    console.log('📊 Resultados de subida:', results);
    return results;
    
  } catch (error: any) {
    console.error('💥 Error general en uploadPlayerFiles:', error);
    results.errors.push(`Error general: ${error.message}`);
    return results;
  }
};

// Función para eliminar archivo del storage
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('jugadores')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return false;
  }
};

// Función para extraer el path del archivo desde la URL
export const extractFilePathFromUrl = (url: string): string | null => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const storagePrefix = `${supabaseUrl}/storage/v1/object/public/jugadores/`;
    
    if (url.startsWith(storagePrefix)) {
      return url.replace(storagePrefix, '');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting file path:', error);
    return null;
  }
};

// ===========================================
// FUNCIONES MODIFICADAS PARA PAGINACIÓN DE JUGADORES
// ===========================================

// Función para obtener todos los jugadores (solo para admins) CON PAGINACIÓN
export const getAllJugadores = async () => {
  try {
    // Primero, obtenemos el conteo total para saber cuántas páginas necesitamos
    const { count: totalCount, error: countError } = await supabase
      .from('jugadores')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);
    
    if (countError) throw countError;
    
    console.log(`📊 Total de jugadores en BD: ${totalCount}`);
    
    // Supabase tiene límite de 1000 por consulta, así que necesitamos paginación
    const LIMIT = 1000;
    const allJugadores: Jugador[] = [];
    
    // Si tenemos más de 1000 jugadores, hacemos múltiples consultas
    if (totalCount && totalCount > LIMIT) {
      const totalPages = Math.ceil(totalCount / LIMIT);
      console.log(`🔄 Se necesitan ${totalPages} consultas para obtener todos los jugadores`);
      
      // Hacemos consultas paginadas
      for (let page = 0; page < totalPages; page++) {
        const from = page * LIMIT;
        const to = from + LIMIT - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('jugadores')
          .select(`
            *,
            categoria:categorias(*),
            escuela:escuelas(*)
          `)
          .eq('activo', true)
          .order('apellido', { ascending: true })
          .range(from, to);
        
        if (pageError) {
          console.error(`❌ Error en página ${page + 1}:`, pageError);
          throw pageError;
        }
        
        if (pageData) {
          allJugadores.push(...(pageData as unknown as Jugador[]));
        }
        
        console.log(`✅ Página ${page + 1}/${totalPages} - ${pageData?.length || 0} jugadores`);
      }
      
      console.log(`🎯 Total obtenido: ${allJugadores.length} jugadores`);
      return { data: allJugadores, error: null };
      
    } else {
      // Si son menos de 1000, una sola consulta
      const { data, error } = await supabase
        .from('jugadores')
        .select(`
          *,
          categoria:categorias(*),
          escuela:escuelas(*)
        `)
        .eq('activo', true)
        .order('apellido', { ascending: true });
      
      if (error) throw error;
      
      console.log(`✅ Jugadores obtenidos: ${data?.length || 0}`);
      return { data: data as unknown as Jugador[] | null, error: null };
    }
    
  } catch (catchError) {
    console.error('💥 Error en getAllJugadores:', catchError);
    return { data: null, error: catchError };
  }
}

// Función para obtener jugadores por escuela (para entrenadores) CON PAGINACIÓN
export const getJugadoresByEscuela = async (escuelaId: string) => {
  try {
    // Primero, obtenemos el conteo total
    const { count: totalCount, error: countError } = await supabase
      .from('jugadores')
      .select('*', { count: 'exact', head: true })
      .eq('escuela_id', escuelaId)
      .eq('activo', true);
    
    if (countError) throw countError;
    
    console.log(`📊 Total de jugadores en escuela ${escuelaId}: ${totalCount}`);
    
    const LIMIT = 1000;
    const allJugadores: Jugador[] = [];
    
    if (totalCount && totalCount > LIMIT) {
      const totalPages = Math.ceil(totalCount / LIMIT);
      console.log(`🔄 Se necesitan ${totalPages} consultas para la escuela`);
      
      for (let page = 0; page < totalPages; page++) {
        const from = page * LIMIT;
        const to = from + LIMIT - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('jugadores')
          .select(`
            *,
            categoria:categorias(*),
            escuela:escuelas(*)
          `)
          .eq('escuela_id', escuelaId)
          .eq('activo', true)
          .order('apellido', { ascending: true })
          .range(from, to);
        
        if (pageError) throw pageError;
        
        if (pageData) {
          allJugadores.push(...(pageData as unknown as Jugador[]));
        }
        
        console.log(`✅ Escuela - Página ${page + 1}/${totalPages}`);
      }
      
      console.log(`🎯 Total obtenido para escuela: ${allJugadores.length}`);
      return { data: allJugadores, error: null };
      
    } else {
      const { data, error } = await supabase
        .from('jugadores')
        .select(`
          *,
          categoria:categorias(*),
          escuela:escuelas(*)
        `)
        .eq('escuela_id', escuelaId)
        .eq('activo', true)
        .order('apellido', { ascending: true });
      
      if (error) throw error;
      
      console.log(`✅ Jugadores obtenidos por escuela: ${data?.length || 0}`);
      return { data: data as unknown as Jugador[] | null, error: null };
    }
  } catch (catchError) {
    console.error('💥 Error en getJugadoresByEscuela:', catchError);
    return { data: null, error: catchError };
  }
}

// ===========================================
// FUNCIONES EXISTENTES (SIN CAMBIOS DE PAGINACIÓN)
// ===========================================

// Helper functions para la autenticación
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = async (): Promise<{
  data: Usuario | null
  error: any
} | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      escuela:escuelas(*)
    `)
    .eq('id', user.id)
    .single()
    
  return { data: data as unknown as Usuario | null, error }
}

export const checkUserRole = async (): Promise<UserRole | null> => {
  const profile = await getUserProfile()
  return profile?.data?.rol || null
}

// Función para verificar si el usuario es admin
export const isAdmin = async (): Promise<boolean> => {
  const role = await checkUserRole()
  return role === 'admin'
}

// Función para verificar si el usuario es entrenador
export const isEntrenador = async (): Promise<boolean> => {
  const role = await checkUserRole()
  return role === 'entrenador'
}

// Función para obtener la escuela del usuario
export const getUserEscuela = async () => {
  const profile = await getUserProfile()
  return profile?.data?.escuela || null
}

// Función para obtener todas las categorías
export const getCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true })
  
  return { data, error }
}

// Función para obtener todas las escuelas
export const getEscuelas = async () => {
  const { data, error } = await supabase
    .from('escuelas')
    .select('*')
    .order('nombre', { ascending: true })
  
  return { data: data as Escuela[] | null, error }
}

// Función para crear un nuevo jugador
export const createJugador = async (jugador: JugadorInsert) => {
  try {
    console.log('👤 Creando jugador con datos:', {
      ...jugador,
      foto_perfil_url: jugador.foto_perfil_url || '',
      documento_pdf_url: jugador.documento_pdf_url || '',
      registro_civil_url: jugador.registro_civil_url || ''
    });
    
    const { data, error } = await supabase
      .from('jugadores')
      .insert({
        ...jugador,
        // Asegurar que las URLs sean strings vacíos en lugar de null
        foto_perfil_url: jugador.foto_perfil_url || '',
        documento_pdf_url: jugador.documento_pdf_url || '',
        registro_civil_url: jugador.registro_civil_url || '',
        activo: true
      })
      .select(`
        *,
        categoria:categorias(*),
        escuela:escuelas(*)
      `)
      .single();
    
    if (error) {
      console.error('❌ Error creando jugador:', error);
      return { data: null, error };
    }
    
    console.log('✅ Jugador creado exitosamente:', data);
    return { data: data as unknown as Jugador | null, error: null };
    
  } catch (catchError: any) {
    console.error('💥 Error inesperado creando jugador:', catchError);
    return { data: null, error: catchError };
  }
};

// Función para actualizar un jugador
export const updateJugador = async (id: string, updates: JugadorUpdate) => {
  const { data, error } = await supabase
    .from('jugadores')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      categoria:categorias(*),
      escuela:escuelas(*)
    `)
    .single()
  
  return { data: data as unknown as Jugador | null, error }
}

// =====================================
// FUNCIONES DE ELIMINACIÓN MEJORADAS
// =====================================

// Función para desactivar un jugador (eliminación lógica)
export const deactivateJugador = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('jugadores')
      .update({ 
        activo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        categoria:categorias(*),
        escuela:escuelas(*)
      `)
      .single();
    
    return { data: data as unknown as Jugador | null, error };
  } catch (catchError) {
    return { data: null, error: catchError };
  }
};

// Función para eliminar físicamente un jugador de la base de datos
export const deleteJugadorPermanently = async (id: string) => {
  try {
    // Primero verificamos si el jugador existe
    const { data: checkData, error: checkError } = await supabase
      .from('jugadores')
      .select('id, nombre, apellido, documento')
      .eq('id', id)
      .single();
    
    if (checkError) {
      return { data: null, error: checkError };
    }
    
    // Ahora eliminamos el jugador permanentemente
    const { error } = await supabase
      .from('jugadores')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { data: null, error };
    }
    
    // Verificar que realmente se eliminó
    const { data: verifyData } = await supabase
      .from('jugadores')
      .select('id')
      .eq('id', id)
      .single();
    
    if (verifyData) {
      return { data: null, error: { message: 'El jugador no pudo ser eliminado completamente' } };
    }
    
    // Retornamos los datos del jugador que se eliminó
    return { data: checkData, error: null };
  } catch (catchError) {
    return { data: null, error: catchError };
  }
};

// Función principal de eliminación (puedes elegir cuál usar)
export const deleteJugador = async (id: string, permanent: boolean = false) => {
  if (permanent) {
    return await deleteJugadorPermanently(id);
  } else {
    return await deactivateJugador(id);
  }
};

// Función para restaurar un jugador desactivado
export const restoreJugador = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('jugadores')
      .update({ 
        activo: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        categoria:categorias(*),
        escuela:escuelas(*)
      `)
      .single();
    
    return { data: data as unknown as Jugador | null, error };
  } catch (catchError) {
    return { data: null, error: catchError };
  }
};

// Función para obtener jugadores inactivos (para poder restaurarlos)
export const getInactiveJugadores = async (escuelaId?: string) => {
  let query = supabase
    .from('jugadores')
    .select(`
      *,
      categoria:categorias(*),
      escuela:escuelas(*)
    `)
    .eq('activo', false)
    .order('apellido', { ascending: true });
    
  if (escuelaId) {
    query = query.eq('escuela_id', escuelaId);
  }
  
  const { data, error } = await query;
  return { data: data as unknown as Jugador[] | null, error };
};

// =====================================
// RESTO DE FUNCIONES (SIN CAMBIOS)
// =====================================

// Función para crear un nuevo usuario (solo admins)
export const createUsuario = async (usuario: UsuarioInsert) => {
  const { data, error } = await supabase
    .from('usuarios')
    .insert(usuario)
    .select(`
      *,
      escuela:escuelas(*)
    `)
    .single()
  
  return { data: data as unknown as Usuario | null, error }
}

// Función para actualizar un usuario
export const updateUsuario = async (id: string, updates: UsuarioUpdate) => {
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      escuela:escuelas(*)
    `)
    .single()
  
  return { data: data as unknown as Usuario | null, error }
}

// Función para obtener todos los usuarios (solo admins)
export const getAllUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      escuela:escuelas(*)
    `)
    .order('nombre', { ascending: true })
  
  return { data: data as unknown as Usuario[] | null, error }
}

// Función para obtener todos los países
export const getPaises = async () => {
  const { data, error } = await supabase
    .from('paises')
    .select('*')
    .order('nombre', { ascending: true })
  
  return { data: data as Pais[] | null, error }
}

// Función para obtener departamentos por país
export const getDepartamentosByPais = async (paisId: string) => {
  const { data, error } = await supabase
    .from('departamentos')
    .select('*')
    .eq('pais_id', paisId)
    .order('nombre', { ascending: true })
  
  return { data: data as Departamento[] | null, error }
}

// Función para obtener ciudades por departamento
export const getCiudadesByDepartamento = async (departamentoId: string) => {
  const { data, error } = await supabase
    .from('ciudades')
    .select('*')
    .eq('departamento_id', departamentoId)
    .order('nombre', { ascending: true })
  
  return { data: data as Ciudad[] | null, error }
}

// Función para actualizar las URLs de archivos de un jugador
export const updatePlayerFileUrls = async (playerId: string, fileUrls: {
  foto_perfil_url?: string;
  documento_pdf_url?: string;
  registro_civil_url?: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📝 Actualizando URLs de archivos para jugador:', playerId, fileUrls);
    
    const { error } = await supabase
      .from('jugadores')
      .update(fileUrls)
      .eq('id', playerId);

    if (error) {
      console.error('❌ Error actualizando URLs:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ URLs actualizadas exitosamente');
    return { success: true };
  } catch (error: any) {
    console.error('💥 Error inesperado actualizando URLs:', error);
    return { success: false, error: error.message };
  }
};

export const saveEscuelaLogo = async (
  escuelaId: string, 
  file: File): Promise<{
  success: boolean;
  logoUrl?: string;
  error?: string;
}> => {
  try {
    console.log('🖼️ Iniciando upload de logo para escuela:', escuelaId);
    
    // 1. Validar archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o SVG.'
      };
    }

    // 2. Validar tamaño (5MB máximo)
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        error: `El archivo es muy grande. Tamaño máximo: ${maxSizeMB}MB.`
      };
    }

    // 3. Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `logo_${escuelaId}_${timestamp}.${fileExtension}`;
    const filePath = `escuelas/${escuelaId}/${fileName}`;

    console.log('📁 Subiendo archivo:', {
      fileName,
      filePath,
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    // 4. Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('team-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError);
      return {
        success: false,
        error: `Error subiendo archivo: ${uploadError.message}`
      };
    }

    console.log('✅ Archivo subido exitosamente:', uploadData);

    // 5. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('team-logos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('🔗 URL pública generada:', publicUrl);

    // 6. Actualizar la escuela con la URL del logo
    const { error: updateError } = await supabase
      .from('escuelas')
      .update({
        logo_url: publicUrl,
        logo_file_type: file.type,
        updated_at: new Date().toISOString()
      })
      .eq('id', escuelaId);

    if (updateError) {
      console.error('❌ Error actualizando escuela:', updateError);
      
      // Intentar eliminar el archivo subido
      try {
        await supabase.storage
          .from('team-logos')
          .remove([filePath]);
        console.log('🗑️ Archivo eliminado después de error en BD');
      } catch (deleteError) {
        console.error('Error eliminando archivo:', deleteError);
      }
      
      return {
        success: false,
        error: `Error guardando en base de datos: ${updateError.message}`
      };
    }

    console.log('✅ Logo guardado exitosamente en la base de datos');
    return {
      success: true,
      logoUrl: publicUrl
    };

  } catch (error: any) {
    console.error('💥 Error inesperado:', error);
    return {
      success: false,
      error: `Error inesperado: ${error.message || 'Error desconocido'}`
    };
  }
};

/**
 * Obtener logo de una escuela desde la BD
 */
export const getEscuelaLogo = async (escuelaId: string): Promise<{
  logoUrl: string | null;
  fileType: string | null;
  escuela: Escuela | null;
}> => {
  try {
    console.log('🔍 Buscando logo para escuela:', escuelaId);
    
    const { data, error } = await supabase
      .from('escuelas')
      .select('*')
      .eq('id', escuelaId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo escuela:', error);
      return {
        logoUrl: null,
        fileType: null,
        escuela: null
      };
    }

    const escuela = data as Escuela;
    console.log('✅ Logo encontrado:', {
      tieneLogo: !!escuela.logo_url,
      fileType: escuela.logo_file_type
    });

    return {
      logoUrl: escuela.logo_url || null,
      fileType: escuela.logo_file_type || null,
      escuela
    };

  } catch (error) {
    console.error('💥 Error obteniendo logo:', error);
    return {
      logoUrl: null,
      fileType: null,
      escuela: null
    };
  }
};

/**
 * Eliminar logo de una escuela
 */
export const deleteEscuelaLogo2 = async (escuelaId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    console.log('🗑️ Eliminando logo de escuela:', escuelaId);
    
    // 1. Obtener info de la escuela para saber el archivo
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

    const logoUrl = escuelaData?.logo_url;
    
    // 2. Si hay logo, extraer path y eliminar del storage
    if (logoUrl) {
      try {
        // Extraer path del archivo desde la URL
        const urlObj = new URL(logoUrl);
        const pathParts = urlObj.pathname.split('/');
        // El path es algo como: "team-logos/escuelas/{escuelaId}/logo_{timestamp}.ext"
        const filePath = pathParts.slice(pathParts.indexOf('team-logos') + 1).join('/');
        
        console.log('📁 Eliminando archivo del storage:', filePath);
        
        const { error: deleteError } = await supabase.storage
          .from('team-logos')
          .remove([filePath]);

        if (deleteError) {
          console.warn('⚠️ No se pudo eliminar archivo físico:', deleteError);
        }
      } catch (urlError) {
        console.warn('⚠️ Error procesando URL del logo:', urlError);
      }
    }

    // 3. Actualizar la escuela (poner logo_url y logo_file_type en null)
    const { error: updateError } = await supabase
      .from('escuelas')
      .update({
        logo_url: null,
        logo_file_type: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', escuelaId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      };
    }

    console.log('✅ Logo eliminado exitosamente');
    return { success: true };

  } catch (error: any) {
    console.error('💥 Error eliminando logo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ===========================================
// FUNCIONES PARA FIRMAS DE ADMINS
// ===========================================

/**
 * Subir firma del admin
 */
export const uploadAdminSignature = async (adminId: string, file: File): Promise<FileUploadResult> => {
  try {
    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Formato no válido. Use JPG, PNG o WEBP'
      };
    }

    // Tamaño máximo: 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'La firma no puede superar los 2MB'
      };
    }

    console.log('✍️ Guardando firma del admin:', adminId);
    
    // Convertir el archivo a Base64 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64DataUrl = e.target?.result as string;
          // Guardar en localStorage con clave específica
          const storageKey = `admin_signature_${adminId}`;
          localStorage.setItem(storageKey, base64DataUrl);
          
          console.log('✅ Firma guardada exitosamente en localStorage');
          resolve({ 
            success: true, 
            url: base64DataUrl
          });
        } catch (error: any) {
          console.error('❌ Error guardando firma en localStorage:', error);
          resolve({ 
            success: false, 
            error: error.message || 'Error al guardar la firma'
          });
        }
      };
      reader.onerror = () => {
        resolve({ 
          success: false, 
          error: 'Error al leer el archivo'
        });
      };
      reader.readAsDataURL(file);
    });
    
  } catch (error: any) {
    console.error('💥 Error inesperado subiendo firma:', error);
    return { success: false, error: error.message || 'Error inesperado' };
  }
};

/**
 * Obtener firma del admin actual
 */
export const getCurrentAdminSignature = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener URL de firma de localStorage
    const signatureUrl = localStorage.getItem(`admin_signature_${user.id}`);
    return signatureUrl || null;
  } catch (error) {
    console.error('Error obteniendo firma del admin:', error);
    return null;
  }
};

/**
 * Guardar URL de firma del admin en localStorage
 */
export const saveAdminSignatureUrl = (adminId: string, signatureUrl: string): void => {
  try {
    localStorage.setItem(`admin_signature_${adminId}`, signatureUrl);
    console.log('✅ Firma guardada en localStorage:', adminId);
  } catch (error) {
    console.error('❌ Error guardando firma en localStorage:', error);
  }
};

/**
 * Obtener firma de un admin específico
 */
export const getAdminSignature = async (adminId: string): Promise<string | null> => {
  try {
    // Primero intenta obtener del localStorage
    const localSignature = localStorage.getItem(`admin_signature_${adminId}`);
    if (localSignature) return localSignature;

    // Si no está en localStorage, devuelve null
    return null;
  } catch (error) {
    console.error('Error obteniendo firma del admin:', error);
    return null;
  }
};

/**
 * Eliminar firma del admin
 */
export const deleteAdminSignature = (adminId: string): boolean => {
  try {
    localStorage.removeItem(`admin_signature_${adminId}`);
    console.log('✅ Firma eliminada:', adminId);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando firma:', error);
    return false;
  }
};

