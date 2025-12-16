// src/services/excelImportService.ts
import { ExcelPlayerData, ImportResult } from '../components/Dasboard/coach/types/excel.types';
import { supabase } from './supabaseClient';

export const excelImportService = {
  async importPlayers(
    players: ExcelPlayerData[], 
    categorias: any[], 
    escuelas: any[],
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      total: players.length,
      imported: 0,
      errors: [],
      failedImports: []
    };

    console.log(`🏁 Iniciando importación de ${players.length} jugadores`);
    console.log('🏫 Categorías disponibles:', categorias.map(c => c.nombre));
    console.log('🎓 Escuelas disponibles:', escuelas.map(e => e.nombre));

    for (let i = 0; i < players.length; i++) {
      const playerData = players[i];
      const rowNumber = i + 2;
      
      console.log(`\n👤 Procesando jugador ${i + 1}/${players.length}:`, playerData.nombre, playerData.apellido);

      try {
        // Filtrar solo los campos básicos del jugador
        const cleanPlayerData = {
          documento: playerData.documento,
          nombre: playerData.nombre,
          apellido: playerData.apellido,
          fecha_nacimiento: playerData.fecha_nacimiento,
          categoria_nombre: playerData.categoria_nombre,
          escuela_nombre: playerData.escuela_nombre,
          pais: playerData.pais || 'Colombia',
          departamento: playerData.departamento || 'Norte de Santander',
          ciudad: playerData.ciudad || 'Ocaña',
          eps: playerData.eps || '',
          tipo_eps: playerData.tipo_eps || 'Contributivo'
        };

        console.log('📊 Datos limpios del jugador (sin URLs):', cleanPlayerData);

        // Buscar categoría
        const categoria = categorias.find(cat => {
          const catNombre = cat.nombre.toLowerCase();
          const playerCat = cleanPlayerData.categoria_nombre.toLowerCase();
          
          return catNombre.includes(playerCat) || 
                 playerCat.includes(catNombre) ||
                 catNombre.replace(/[^a-z0-9]/g, '') === playerCat.replace(/[^a-z0-9]/g, '');
        });
        
        if (!categoria) {
          throw new Error(`Categoría no encontrada: "${cleanPlayerData.categoria_nombre}". Disponibles: ${categorias.map(c => c.nombre).join(', ')}`);
        }

        // Buscar escuela  
        const escuela = escuelas.find(esc => {
          const escNombre = esc.nombre.toLowerCase();
          const playerEsc = cleanPlayerData.escuela_nombre.toLowerCase();
          
          return escNombre.includes(playerEsc) || 
                 playerEsc.includes(escNombre) ||
                 escNombre.replace(/[^a-z0-9]/g, '') === playerEsc.replace(/[^a-z0-9]/g, '');
        });

        if (!escuela) {
          throw new Error(`Escuela no encontrada: "${cleanPlayerData.escuela_nombre}". Disponibles: ${escuelas.map(e => e.nombre).join(', ')}`);
        }

        // Verificar si el jugador ya existe
        const { data: existingPlayer, error: checkError } = await supabase
          .from('jugadores')
          .select('id, nombre, apellido')
          .eq('documento', cleanPlayerData.documento)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Error verificando jugador existente:', checkError);
          throw new Error(`Error al verificar jugador: ${checkError.message}`);
        }

        if (existingPlayer) {
          throw new Error(`Jugador con documento ${cleanPlayerData.documento} ya existe: ${existingPlayer.nombre} ${existingPlayer.apellido}`);
        }

        // Preparar datos para inserción (SIN URLs)
        const playerToInsert = {
          documento: cleanPlayerData.documento,
          nombre: cleanPlayerData.nombre,
          apellido: cleanPlayerData.apellido,
          fecha_nacimiento: cleanPlayerData.fecha_nacimiento,
          categoria_id: categoria.id,
          escuela_id: escuela.id,
          ciudad: cleanPlayerData.ciudad,
          departamento: cleanPlayerData.departamento,
          eps: cleanPlayerData.eps,
          tipo_eps: cleanPlayerData.tipo_eps,
          pais: cleanPlayerData.pais,
          activo: true,
          ciudad_id: null,
          departamento_id: null,
          pais_id: null,
          // NO incluir URLs en la importación
          foto_perfil_url: null,
          documento_pdf_url: null,
          registro_civil_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('💾 Insertando jugador en base de datos (sin URLs)...');
        const { error: insertError } = await supabase
          .from('jugadores')
          .insert([playerToInsert]);

        if (insertError) {
          console.error('❌ Error detallado al insertar:', insertError);
          throw new Error(`Error al insertar jugador: ${insertError.message}`);
        }

        result.imported++;
        console.log(`✅ Jugador ${cleanPlayerData.nombre} ${cleanPlayerData.apellido} importado correctamente (sin archivos)`);

      } catch (error) {
        console.error(`❌ Error en fila ${rowNumber}:`, error);
        result.success = false;
        result.failedImports.push({
          row: rowNumber,
          player: playerData,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }

      // Actualizar progreso
      if (onProgress) {
        const progress = Math.round(((i + 1) / players.length) * 100);
        onProgress(progress);
      }
    }

    // Resumen final
    if (result.failedImports.length > 0) {
      result.errors.push(`${result.failedImports.length} jugadores no pudieron ser importados`);
      console.warn(`⚠️  Importación completada con ${result.failedImports.length} errores`);
    } else {
      console.log(`🎉 Importación completada exitosamente: ${result.imported} jugadores importados (sin archivos adjuntos)`);
    }

    return result;
  }
};