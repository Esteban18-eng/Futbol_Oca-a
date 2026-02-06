import React, { useState } from 'react';
import { supabase } from '../../../services/supabaseClient';

interface SyncLogosButtonProps {
  show: boolean;
  onClose: () => void;
}

const SyncLogosButton: React.FC<SyncLogosButtonProps> = ({ show, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Mapeo de logos (ajusta según necesites)
  const LOGO_MAPPING: Record<string, string> = {
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
    'Alianza Futbol Club' : 'Alianza.PNG',
    
    // Mapeos basados en lo que probablemente corresponde
    'Club Deportivo Ocaña 2000': 'ocana 2000.png',
    'Selección San Pablo': 'Promesas.png',
    'Athletic Fc': 'Fc Athletic Ocana.png',
    'Rio de Oro Futbol Club': 'Promesas.png',
    'Club Deportivo Real F Libres': 'Promesas.png',
    'Ocaña FC': 'Ocana F.C..png',
  };

  const STORAGE_BASE_URL = 'https://xobrjnugowhgudgkympf.supabase.co/storage/v1/object/public/team-logos/';

  // Si no se debe mostrar, retorna null
  if (!show) return null;

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const syncLogos = async () => {
    if (!window.confirm('¿Estás seguro de sincronizar los logos? Esto actualizará todas las escuelas.')) {
      return;
    }

    setLoading(true);
    setLogs([]);
    setSummary(null);

    try {
      addLog('🚀 Iniciando sincronización de logos...');
      
      // Obtener todas las escuelas
      const { data: escuelas, error } = await supabase
        .from('escuelas')
        .select('id, nombre, logo_url')
        .order('nombre');

      if (error) {
        addLog(`❌ Error obteniendo escuelas: ${error.message}`);
        throw error;
      }

      if (!escuelas || escuelas.length === 0) {
        addLog('ℹ️ No se encontraron escuelas');
        return;
      }

      addLog(`📊 Encontradas ${escuelas.length} escuelas`);
      
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const details: any[] = [];

      // Procesar cada escuela
      for (const escuela of escuelas) {
        addLog(`🔍 Procesando: ${escuela.nombre}`);
        
        // Si ya tiene logo, saltar
        if (escuela.logo_url) {
          addLog(`   ⏩ Ya tiene logo asignado`);
          skipped++;
          details.push({ escuela: escuela.nombre, status: 'skipped' });
          continue;
        }

        // Buscar logo en el mapeo
        const logoFileName = LOGO_MAPPING[escuela.nombre];
        
        if (!logoFileName) {
          addLog(`   ⚠️ No se encontró logo para esta escuela`);
          skipped++;
          details.push({ escuela: escuela.nombre, status: 'no_logo' });
          continue;
        }

        // Construir URL
        const encodedFileName = encodeURIComponent(logoFileName);
        const logoUrl = `${STORAGE_BASE_URL}${encodedFileName}`;
        
        // Determinar tipo de archivo
        let fileType = 'image/jpeg';
        if (logoFileName.toLowerCase().endsWith('.png')) fileType = 'image/png';
        if (logoFileName.toLowerCase().endsWith('.jpg') || logoFileName.toLowerCase().endsWith('.jpeg')) fileType = 'image/jpeg';
        if (logoFileName.toLowerCase().endsWith('.webp')) fileType = 'image/webp';

        addLog(`   ✅ Logo encontrado: ${logoFileName}`);
        addLog(`   📎 URL: ${logoUrl}`);

        // Actualizar en la base de datos
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

          addLog(`   💾 Actualizado exitosamente`);
          updated++;
          details.push({ escuela: escuela.nombre, status: 'updated', logoUrl });

        } catch (updateError: any) {
          addLog(`   ❌ Error: ${updateError.message}`);
          errors++;
          details.push({ escuela: escuela.nombre, status: 'error', error: updateError.message });
        }

        addLog('   ──────────────────────────────');
      }

      // Resumen final
      const result = {
        total: escuelas.length,
        updated,
        skipped,
        errors,
        details
      };

      setSummary(result);
      
      addLog('\n📊 RESUMEN FINAL:');
      addLog(`✅ Actualizadas: ${updated}`);
      addLog(`⏩ Saltadas: ${skipped}`);
      addLog(`❌ Errores: ${errors}`);
      addLog(`📋 Total procesadas: ${escuelas.length}`);

      if (errors === 0) {
        addLog('\n🎉 ¡Sincronización completada con éxito!');
        setTimeout(() => {
          alert('✅ Logos sincronizados exitosamente!');
        }, 500);
      } else {
        addLog('\n⚠️ Sincronización completada con errores.');
        setTimeout(() => {
          alert(`⚠️ Sincronización completada con ${errors} errores. Revisa la consola.`);
        }, 500);
      }

    } catch (error: any) {
      addLog(`💥 Error crítico: ${error.message}`);
      alert('❌ Error sincronizando logos. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentStatus = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('🔍 Verificando estado actual de logos...');
      
      const { data: escuelas, error } = await supabase
        .from('escuelas')
        .select('id, nombre, logo_url')
        .order('nombre');

      if (error) throw error;

      const total = escuelas?.length || 0;
      const withLogo = escuelas?.filter(e => e.logo_url)?.length || 0;
      const withoutLogo = total - withLogo;

      addLog(`📊 Total escuelas: ${total}`);
      addLog(`✅ Con logo: ${withLogo}`);
      addLog(`❌ Sin logo: ${withoutLogo}`);

      if (withoutLogo > 0) {
        addLog('\n📋 Escuelas sin logo:');
        escuelas
          ?.filter(e => !e.logo_url)
          .forEach(e => addLog(`   • ${e.nombre}`));
      }

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setSummary(null);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}
    onClick={(e) => {
      // Cerrar si se hace clic en el overlay (fuera del contenido)
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="modal-content" style={{
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="card sync-logos-card">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-sync-alt me-2"></i>
              Sincronizar Logos de Escuelas
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Cerrar"
            ></button>
          </div>
          
          <div className="card-body">
            <p className="card-text">
              Este botón asignará automáticamente los logos del storage de Supabase a cada escuela.
              Solo se actualizarán las escuelas que aún no tienen logo asignado.
            </p>
            
            <div className="alert alert-info">
              <small>
                <i className="fas fa-info-circle me-2"></i>
                <strong>Nota:</strong> Los logos deben estar previamente subidos al bucket "team-logos" en Supabase Storage.
              </small>
            </div>

            <div className="d-flex gap-2 mb-4">
              <button 
                className="btn btn-primary"
                onClick={syncLogos}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt me-2"></i>
                    Sincronizar Logos
                  </>
                )}
              </button>
              
              <button 
                className="btn btn-info"
                onClick={checkCurrentStatus}
                disabled={loading}
              >
                <i className="fas fa-search me-2"></i>
                Ver Estado Actual
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={clearLogs}
              >
                <i className="fas fa-trash me-2"></i>
                Limpiar Registro
              </button>
            </div>

            {/* Mapeo de logos */}
            <div className="mb-4">
              <h6 className="mb-3">
                <i className="fas fa-list me-2"></i>
                Mapeo de Logos Disponibles
              </h6>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Escuela</th>
                      <th>Archivo de Logo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(LOGO_MAPPING).map(([escuela, archivo]) => (
                      <tr key={escuela}>
                        <td>{escuela}</td>
                        <td>
                          <code>{archivo}</code>
                          <br />
                          <small className="text-muted">
                            <a 
                              href={`${STORAGE_BASE_URL}${encodeURIComponent(archivo)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              <i className="fas fa-external-link-alt me-1"></i>
                              Ver logo
                            </a>
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-success">
                            <i className="fas fa-check me-1"></i>
                            Disponible
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel de logs */}
            {logs.length > 0 && (
              <div className="logs-panel mt-4">
                <h6 className="mb-3">
                  <i className="fas fa-terminal me-2"></i>
                  Registro de Ejecución
                </h6>
                
                <div className="logs-container border rounded p-3 bg-dark text-light" style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  fontFamily: 'monospace', 
                  fontSize: '12px' 
                }}>
                  {logs.map((log, index) => (
                    <div key={index} className="log-entry mb-1">
                      {log.includes('✅') ? (
                        <span className="text-success">{log}</span>
                      ) : log.includes('❌') || log.includes('💥') ? (
                        <span className="text-danger">{log}</span>
                      ) : log.includes('⚠️') ? (
                        <span className="text-warning">{log}</span>
                      ) : log.includes('🔍') || log.includes('📊') ? (
                        <span className="text-info">{log}</span>
                      ) : log.includes('🚀') || log.includes('🎉') ? (
                        <span className="text-primary">{log}</span>
                      ) : (
                        <span>{log}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen */}
            {summary && (
              <div className="summary-panel mt-4">
                <h6 className="mb-3">
                  <i className="fas fa-chart-bar me-2"></i>
                  Resumen de Ejecución
                </h6>
                
                <div className="row">
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-primary">{summary.total}</h3>
                        <p className="mb-0 text-muted">Total Escuelas</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-success">{summary.updated}</h3>
                        <p className="mb-0 text-muted">Actualizadas</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-warning">{summary.skipped}</h3>
                        <p className="mb-0 text-muted">Saltadas</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-danger">{summary.errors}</h3>
                        <p className="mb-0 text-muted">Errores</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .sync-logos-card {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .logs-container {
          background-color: #1e1e1e !important;
        }
        
        .log-entry {
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.4;
        }
        
        .summary-panel .card {
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        
        .summary-panel .card:hover {
          transform: translateY(-2px);
        }
        
        .table {
          font-size: 0.9rem;
        }
        
        .table td {
          vertical-align: middle;
        }
        
        /* Animación para el modal */
        .modal-overlay {
          animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
          animation: slideIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SyncLogosButton;