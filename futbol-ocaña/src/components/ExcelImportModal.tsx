import React, { useRef } from 'react';
import { useExcelImport } from '../components/Dasboard/coach/hooks/useExcelImport';
import * as XLSX from 'xlsx';
import './ExcelImportModal.css';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  categorias: any[];
  escuelas: any[];
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  categorias,
  escuelas
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isImporting,
    importProgress,
    importResult,
    processExcelFile,
    importPlayers,
    resetImport
  } = useExcelImport();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('❌ Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      resetImport();
      console.log('📁 Archivo seleccionado:', file.name, file.size, 'bytes');

      // Procesar el archivo
      const players = await processExcelFile(file);
      console.log(`✅ ${players.length} jugadores listos para importar`);

      if (players.length === 0) {
        alert('❌ No se encontraron datos válidos en el archivo. Revisa la consola para más detalles.');
        return;
      }

      // Mostrar resumen y confirmar
      const confirmMessage = `¿Deseas importar ${players.length} jugadores?\n\n` +
        `Categorías detectadas: ${[...new Set(players.map(p => p.categoria_nombre))].join(', ')}\n` +
        `Escuelas detectadas: ${[...new Set(players.map(p => p.escuela_nombre))].join(', ')}`;

      if (confirm(confirmMessage)) {
        console.log('🚀 Confirmada importación, iniciando...');
        const result = await importPlayers(players, categorias, escuelas);
        
        if (result.success) {
          alert(`✅ ¡Importación exitosa! Se importaron ${result.imported} de ${result.total} jugadores.`);
          onImportSuccess();
          onClose();
        } else {
          alert(`⚠️ Importación completada con errores. Se importaron ${result.imported} de ${result.total} jugadores. Revisa la consola para más detalles.`);
        }
      } else {
        console.log('❌ Importación cancelada por el usuario');
      }
    } catch (error) {
      console.error('❌ Error en importación:', error);
      alert(`❌ Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files;
      const changeEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(changeEvent);
    }
  };

  const downloadTemplate = () => {
    // Crear datos de ejemplo basados en tu estructura real
    const templateData = [
      ['Año/Categoría*', 'Escuela*', 'Nombre Completo*', 'Documento*', 'Fecha Nacimiento*'],
      [2017, 'Athletic F.C.', 'Juan Jose Velasquez Quesada', '1092190584', '22/04/2018'],
      [2016, 'Athletic F.C.', 'Cristian Alejandro Castro Pérez', '1092190572', '13/04/2018'],
      [2015, 'Athletic F.C.', 'Daniel Alejandro Navarro Galvis', '1091999103', '14/09/2015']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jugadores');
    XLSX.writeFile(workbook, 'template_importacion_jugadores_futbol_ocana.xlsx');
    
    alert('📋 Template descargado. Completa con tus datos manteniendo la misma estructura.');
  };

  if (!isOpen) return null;

  return (
    <div className="excel-import-modal-overlay" onClick={onClose}>
      <div className="excel-import-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="excel-import-modal-header">
          <h3 className="excel-import-modal-title">
            📊 Importar Jugadores desde Excel
          </h3>
          <button 
            className="excel-import-close-btn" 
            onClick={onClose}
            disabled={isImporting}
          >
            ✕
          </button>
        </div>

        <div className="excel-import-modal-body">
          <div className="import-instructions">
            <h4>📝 Formato requerido (EXACTO):</h4>
            <div className="instructions-grid">
              <div className="instruction-item">
                <strong>Columna A:</strong> Año/Categoría* (ej: "2017")
              </div>
              <div className="instruction-item">
                <strong>Columna B:</strong> Escuela* (ej: "Athletic F.C.")
              </div>
              <div className="instruction-item">
                <strong>Columna C:</strong> Nombre Completo* (ej: "Juan Jose Velasquez Quesada")
              </div>
              <div className="instruction-item">
                <strong>Columna D:</strong> Documento* (ej: "1092190584")
              </div>
              <div className="instruction-item">
                <strong>Columna E:</strong> Fecha Nacimiento* (DD/MM/YYYY)
              </div>
            </div>
            <p className="instruction-note">
              <strong>💡 Nota:</strong> El sistema convertirá automáticamente el año al formato de categoría y separará nombre/apellido.
            </p>
          </div>

          <div 
            className="file-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <span className="drop-zone-icon">📁</span>
              <p>Arrastra tu archivo Excel aquí o</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="file-input"
                disabled={isImporting}
              />
              <button 
                className="browse-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? 'Importando...' : 'Seleccionar archivo'}
              </button>
              <p className="file-types">Formatos aceptados: .xlsx, .xls</p>
            </div>
          </div>

          {isImporting && (
            <div className="import-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                Importando... {importProgress}%
              </span>
            </div>
          )}

          {importResult && (
            <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
              <h4>{importResult.success ? '✅ Importación Exitosa' : '⚠️ Importación con Errores'}</h4>
              <p>Se importaron {importResult.imported} de {importResult.total} jugadores</p>
              
              {importResult.failedImports.length > 0 && (
                <div className="failed-imports">
                  <h5>Errores encontrados ({importResult.failedImports.length}):</h5>
                  <div className="errors-list">
                    {importResult.failedImports.slice(0, 5).map((failed, index) => (
                      <div key={index} className="error-item">
                        <strong>Fila {failed.row}:</strong> {failed.error}
                      </div>
                    ))}
                    {importResult.failedImports.length > 5 && (
                      <div className="error-more">
                        ... y {importResult.failedImports.length - 5} errores más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="template-section">
            <button 
              className="template-btn"
              onClick={downloadTemplate}
              disabled={isImporting}
            >
              📋 Descargar Template
            </button>
            <p className="template-note">
              Usa este template para asegurar el formato correcto
            </p>
          </div>
        </div>

        <div className="excel-import-modal-actions">
          <button 
            className="import-close-btn"
            onClick={onClose}
            disabled={isImporting}
          >
            {isImporting ? 'Cerrar (Importando...)' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;