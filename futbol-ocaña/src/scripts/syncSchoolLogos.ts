// syncSchoolLogos.ts
import { supabase } from '../services/supabaseClient';

// Mapeo de nombres de escuela a archivos de logo
const LOGO_MAPPING: Record<string, string> = {
  // Mapeos exactos (nombres como aparecen en la tabla)
  'Academia Futbol Club': 'Academia.png',
  'Cambridge Futbol Club': 'Cambridge.png',
  'Cantera Futbol Club': 'Cantera.png',
  'EFD El Rosario': 'el rosario.jpg',
  'Formadores Futbol Club': 'formadores fc.jpeg',
  'Club Deportivo Independiente': 'Independiente.png',
  'Internacional Futbol Club': 'Internacional.jpg',
  'Juventus Futbol Club': 'Juventus.jpeg',
  'Tigres de Falcao': 'Tigres de Falcao.jpeg',
  'ACES Internacional Abrego': 'Alianza.PNG',
  
  // Mapeos basados en lo que probablemente corresponde
  'Club Deportivo Ocaña 2000': 'ocana 2000.png',
  'Selección San Pablo': 'Promesas.png',
  'Athletic Fc': 'Fc Athletic Ocana.png',
  'Rio de Oro Futbol Club': 'Promesas.png',
  'Club Deportivo Real F Libres': 'Promesas.png',
  'Ocaña FC': 'Ocana F.C..png',
};

// URL base de Supabase Storage
const STORAGE_BASE_URL = 'https://xobrjnugowhgudgkympf.supabase.co/storage/v1/object/public/team-logos/';

/**
 * Obtener tipo de archivo basado en extensión
 */
function getFileType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

/**
 * Codificar nombre de archivo para URL
 */
function encodeFileName(fileName: string): string {
  // Reemplazar espacios por %20
  return fileName.replace(/ /g, '%20');
}

/**
 * Buscar logo para una escuela (con coincidencias flexibles)
 */
function findLogoForSchool(schoolName: string): string | null {
  const schoolNameLower = schoolName.toLowerCase().trim();
  
  // 1. Buscar coincidencia exacta
  if (LOGO_MAPPING[schoolName]) {
    return LOGO_MAPPING[schoolName];
  }
  
  // 2. Buscar coincidencia parcial
  for (const [mappedName, fileName] of Object.entries(LOGO_MAPPING)) {
    const mappedNameLower = mappedName.toLowerCase();
    
    // Coincidencias comunes
    if (schoolNameLower.includes(mappedNameLower) || 
        mappedNameLower.includes(schoolNameLower)) {
      return fileName;
    }
    
    // Buscar palabras clave
    const schoolWords = schoolNameLower.split(' ');
    const mappedWords = mappedNameLower.split(' ');
    
    const hasCommonWord = schoolWords.some(word => 
      word.length > 3 && mappedWords.includes(word)
    );
    
    if (hasCommonWord) {
      return fileName;
    }
  }
  
  return null;
}

/**
 * Sincronizar logos de todas las escuelas
 */
export async function syncSchoolLogos() {
  try {
    console.log('🚀 INICIANDO SINCRONIZACIÓN DE LOGOS');
    console.log('=====================================');
    
    // Obtener todas las escuelas
    const { data: escuelas, error } = await supabase
      .from('escuelas')
      .select('id, nombre, logo_url')
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('❌ Error obteniendo escuelas:', error);
      return { success: false, error: error.message };
    }
    
    if (!escuelas || escuelas.length === 0) {
      console.log('ℹ️ No se encontraron escuelas');
      return { success: false, error: 'No hay escuelas' };
    }
    
    console.log(`📊 Encontradas ${escuelas.length} escuelas\n`);
    
    const results = {
      total: escuelas.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        escuela: string;
        status: 'updated' | 'skipped' | 'error';
        logoUrl?: string;
        error?: string;
      }>
    };
    
    // Procesar cada escuela
    for (const escuela of escuelas) {
      console.log(`🔍 Procesando: ${escuela.nombre}`);
      
      // Verificar si ya tiene logo
      if (escuela.logo_url) {
        console.log(`   ⏩ Ya tiene logo: ${escuela.logo_url}`);
        results.skipped++;
        results.details.push({
          escuela: escuela.nombre,
          status: 'skipped',
          logoUrl: escuela.logo_url
        });
        continue;
      }
      
      // Buscar logo
      const logoFileName = findLogoForSchool(escuela.nombre);
      
      if (!logoFileName) {
        console.log(`   ⚠️ No se encontró logo para: ${escuela.nombre}`);
        results.skipped++;
        results.details.push({
          escuela: escuela.nombre,
          status: 'skipped',
          error: 'No se encontró logo'
        });
        continue;
      }
      
      // Construir URL completa
      const encodedFileName = encodeFileName(logoFileName);
      const logoUrl = `${STORAGE_BASE_URL}${encodedFileName}`;
      const fileType = getFileType(logoFileName);
      
      console.log(`   ✅ Logo encontrado: ${logoFileName}`);
      console.log(`   📎 URL: ${logoUrl}`);
      
      // Actualizar en Supabase
      try {
        const { error: updateError } = await supabase
          .from('escuelas')
          .update({
            logo_url: logoUrl,
            logo_file_type: fileType,
            updated_at: new Date().toISOString()
          })
          .eq('id', escuela.id);
        
        if (updateError) {
          throw updateError;
        }
        
        console.log(`   💾 Actualizado en BD`);
        results.updated++;
        results.details.push({
          escuela: escuela.nombre,
          status: 'updated',
          logoUrl
        });
        
      } catch (updateError: any) {
        console.error(`   ❌ Error actualizando BD:`, updateError.message);
        results.errors++;
        results.details.push({
          escuela: escuela.nombre,
          status: 'error',
          error: updateError.message
        });
      }
      
      console.log('   ──────────────────────────────');
    }
    
    // Mostrar resumen
    console.log('\n📊 RESUMEN FINAL');
    console.log('================');
    console.log(`✅ Actualizadas: ${results.updated}`);
    console.log(`⏩ Saltadas (ya tenían logo): ${results.skipped}`);
    console.log(`❌ Errores: ${results.errors}`);
    console.log(`📋 Total procesadas: ${results.total}\n`);
    
    // Mostrar detalles
    console.log('📝 DETALLES POR ESCUELA:');
    results.details.forEach(detail => {
      const icon = detail.status === 'updated' ? '✅' : 
                   detail.status === 'skipped' ? '⏩' : '❌';
      console.log(`${icon} ${detail.escuela}`);
      if (detail.logoUrl) console.log(`   📎 ${detail.logoUrl}`);
      if (detail.error) console.log(`   💥 ${detail.error}`);
    });
    
    return {
      success: results.errors === 0,
      ...results
    };
    
  } catch (error: any) {
    console.error('💥 ERROR CRÍTICO EN SINCRONIZACIÓN:', error);
    return {
      success: false,
      error: error.message,
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 1
    };
  }
}

/**
 * Verificar estado actual de los logos
 */
export async function checkLogoStatus() {
  try {
    console.log('🔍 VERIFICANDO ESTADO DE LOGOS');
    console.log('===============================');
    
    const { data: escuelas, error } = await supabase
      .from('escuelas')
      .select('id, nombre, logo_url, logo_file_type')
      .order('nombre');
    
    if (error) throw error;
    
    const total = escuelas?.length || 0;
    const withLogo = escuelas?.filter(e => e.logo_url)?.length || 0;
    const withoutLogo = total - withLogo;
    
    console.log(`📊 Total escuelas: ${total}`);
    console.log(`✅ Con logo: ${withLogo}`);
    console.log(`❌ Sin logo: ${withoutLogo}\n`);
    
    if (withoutLogo > 0) {
      console.log('📋 ESCUELAS SIN LOGO:');
      escuelas
        ?.filter(e => !e.logo_url)
        .forEach(e => console.log(`   • ${e.nombre}`));
    }
    
    console.log('\n📋 ESCUELAS CON LOGO:');
    escuelas
      ?.filter(e => e.logo_url)
      .forEach(e => console.log(`   ✅ ${e.nombre}: ${e.logo_url}`));
    
    return {
      total,
      withLogo,
      withoutLogo,
      escuelas
    };
    
  } catch (error: any) {
    console.error('Error verificando logos:', error);
    return null;
  }
}