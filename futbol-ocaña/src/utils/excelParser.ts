// src/utils/excelParser.ts
import * as XLSX from 'xlsx';
import { ExcelPlayerData } from '../components/Dasboard/coach/types/excel.types';

export const excelParser = {
  // NUEVA FUNCIÓN: Parsear archivo Excel
  parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Leer como array para mejor control
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          console.log('📄 Estructura completa del archivo:', jsonData);
          
          resolve(jsonData);
        } catch (error) {
          console.error('❌ Error parseando Excel:', error);
          reject(new Error(`Error al leer el archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  },

  mapToPlayerData(excelData: any[]): ExcelPlayerData[] {
    const players: ExcelPlayerData[] = [];
    
    console.log('🔍 Analizando estructura del Excel...');
    
    // Detectar encabezados automáticamente
    let startRow = 0;
    if (excelData.length > 0) {
      const firstRow = excelData[0];
      const hasHeaders = firstRow.some((cell: any) => 
        cell && typeof cell === 'string' && (
          cell.toLowerCase().includes('año') ||
          cell.toLowerCase().includes('categoría') ||
          cell.toLowerCase().includes('nombre') ||
          cell.toLowerCase().includes('documento')
        )
      );
      
      if (hasHeaders) {
        console.log('📋 Se detectaron encabezados en la primera fila');
        startRow = 1;
      }
    }

    console.log(`📊 Procesando ${excelData.length - startRow} filas de datos...`);

    for (let i = startRow; i < excelData.length; i++) {
      const row = excelData[i];
      const rowNumber = i + 1;
      
      // Verificar si la fila está vacía
      if (!row || row.length === 0 || row.every((cell: any) => 
        cell === null || cell === undefined || cell === '' || cell.toString().trim() === ''
      )) {
        console.log(`⏭️  Fila ${rowNumber} vacía, omitiendo...`);
        continue;
      }

      console.log(`📝 Procesando fila ${rowNumber}:`, row);

      try {
        // Solo tomar los primeros 5 campos (excluyendo URLs)
        // A: Año, B: Club, C: Nombre Completo, D: Documento, E: Fecha
        const año = row[0];
        const club = row[1];
        const nombreCompleto = row[2];
        const documento = row[3];
        const fechaNacimiento = row[4];
        
        // IGNORAR las URLs (columnas F, G, H)
        // const fotoUrl = row[5]; // <-- IGNORADO
        // const documentoUrl = row[6]; // <-- IGNORADO
        // const registroUrl = row[7]; // <-- IGNORADO

        // Validar campos obligatorios
        if (!documento) {
          console.warn(`❌ Fila ${rowNumber} - Documento faltante`);
          continue;
        }

        if (!nombreCompleto) {
          console.warn(`❌ Fila ${rowNumber} - Nombre faltante`);
          continue;
        }

        if (!fechaNacimiento) {
          console.warn(`❌ Fila ${rowNumber} - Fecha de nacimiento faltante`);
          continue;
        }

        if (!año) {
          console.warn(`❌ Fila ${rowNumber} - Año/Categoría faltante`);
          continue;
        }

        if (!club) {
          console.warn(`❌ Fila ${rowNumber} - Club/Escuela faltante`);
          continue;
        }

        const [nombre, apellido] = this.splitNombreCompleto(nombreCompleto);
        const categoriaNombre = this.convertirAñoACategoria(año);
        const fechaFormateada = this.parseFecha(fechaNacimiento);

        if (!fechaFormateada) {
          console.warn(`❌ Fila ${rowNumber} - Fecha inválida: ${fechaNacimiento}`);
          continue;
        }

        const player: ExcelPlayerData = {
          documento: documento.toString().trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          fecha_nacimiento: fechaFormateada,
          pais: 'Colombia',
          departamento: 'Norte de Santander',
          ciudad: 'Ocaña',
          eps: '',
          tipo_eps: 'Contributivo',
          categoria_nombre: categoriaNombre,
          escuela_nombre: club.toString().trim(),
          // NO incluir URLs en la importación
          documento_pdf_url: null,
          registro_civil_url: null,
          foto_perfil_url: null
        };

        console.log(`✅ Jugador ${rowNumber} válido (sin URLs):`, player);
        players.push(player);

      } catch (error) {
        console.error(`❌ Error procesando fila ${rowNumber}:`, error, row);
      }
    }

    console.log(`🎯 Total de jugadores válidos encontrados (sin archivos): ${players.length}`);
    return players;
  },

  splitNombreCompleto(nombreCompleto: any): [string, string] {
    if (!nombreCompleto) return ['', ''];
    
    const partes = nombreCompleto.toString().trim().split(' ').filter((p: string) => p.trim() !== '');
    
    if (partes.length === 0) return ['', ''];
    if (partes.length === 1) return [partes[0], ''];
    
    const nombre = partes[0];
    const apellido = partes.slice(1).join(' ');
    
    return [nombre, apellido];
  },

  convertirAñoACategoria(año: any): string {
    if (!año) return 'Sin categoría';
    
    const añoStr = año.toString().trim();
    const añoNum = parseInt(añoStr);
    
    if (isNaN(añoNum)) {
      console.log(`ℹ️  Año no numérico, usando como texto: ${añoStr}`);
      return añoStr;
    }
    
    const mapeoCategorias: {[key: number]: string} = {
      2020: 'Sub 5 (2020)',
      2019: 'Sub 6 (2019)',
      2018: 'Sub 7 (2018)',
      2017: 'Sub 8 (2017)',
      2016: 'Sub 9 (2016)',
      2015: 'Sub 10 (2015)',
      2014: 'Sub 11 (2014)',
      2013: 'Sub 12 (2013)',
      2012: 'Sub 13 (2012)',
      2011: 'Sub 14 (2011)',
      2010: 'Sub 15 (2010)',
      2009: 'Sub 16 (2009)',
      2008: 'Sub 17 (2008)',
      2007: 'Sub 18 (2007)',
      2006: 'Sub 19 (2006)',
      2005: 'Sub 20 (2005)'
    };
    
    const categoria = mapeoCategorias[añoNum] || `Sub ${new Date().getFullYear() - añoNum} (${añoNum})`;
    console.log(`🏷️  Año ${añoNum} -> Categoría: ${categoria}`);
    return categoria;
  },

  parseFecha(fechaStr: any): string {
    if (!fechaStr) return '';
    
    try {
      console.log(`📅 Parseando fecha: ${fechaStr} (tipo: ${typeof fechaStr})`);
      
      // Si es una fecha de Excel (número serial)
      if (typeof fechaStr === 'number') {
        const fecha = XLSX.SSF.parse_date_code(fechaStr);
        if (fecha) {
          const result = `${fecha.y}-${fecha.m.toString().padStart(2, '0')}-${fecha.d.toString().padStart(2, '0')}`;
          console.log(`🔢 Fecha Excel ${fechaStr} -> ${result}`);
          return result;
        }
      }
      
      const str = fechaStr.toString().trim();
      
      // Formato YYYY-MM-DD (ya está bien)
      if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log(`✅ Fecha ya en formato correcto: ${str}`);
        return str;
      }
      
      // Formato DD/MM/YYYY
      if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [dia, mes, anio] = str.split('/');
        const result = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        console.log(`🔄 Fecha DD/MM/YYYY ${str} -> ${result}`);
        return result;
      }
      
      // Formato MM/DD/YYYY
      if (str.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [mes, dia, anio] = str.split('/');
        const result = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        console.log(`🔄 Fecha MM/DD/YYYY ${str} -> ${result}`);
        return result;
      }
      
      // Intentar con el constructor Date
      const fecha = new Date(str);
      if (!isNaN(fecha.getTime())) {
        const result = fecha.toISOString().split('T')[0];
        console.log(`📆 Fecha genérica ${str} -> ${result}`);
        return result;
      }
      
      console.warn(`❌ No se pudo parsear fecha: ${str}`);
      return '';
      
    } catch (error) {
      console.error('❌ Error parseando fecha:', fechaStr, error);
      return '';
    }
  }
};