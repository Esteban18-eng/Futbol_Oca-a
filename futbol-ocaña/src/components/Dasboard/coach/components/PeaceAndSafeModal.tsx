// PeaceAndSafeModal.tsx - MODIFICADO
import React, { useState, useEffect } from 'react';
import { PeaceAndSafeData } from '../types/peaceAndSafeTypes';
import { DocumentLogoService } from '../../../../services/documentLogoService';
import { formatDateForDocument } from '../../../../utils/logoUtils';

interface PeaceAndSafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: PeaceAndSafeData) => void;
  playerData: {
    name: string;
    schoolName: string;
    id: string;
    escuelaId?: string; // AGREGAR ESTO
  };
}

const PeaceAndSafeModal: React.FC<PeaceAndSafeModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  playerData
}) => {
  const [formData, setFormData] = useState<PeaceAndSafeData>({
    playerName: playerData.name,
    schoolName: playerData.schoolName,
    coachName: '',
    presidentName: '',
    currentDate: new Date().toISOString().split('T')[0],
    playerId: playerData.id,
    includeLogo: true, // NUEVO: Incluir logo por defecto
    logoPosition: 'header' as const,
    escuelaId: playerData.escuelaId,
    observaciones: '',
    motivo: 'Traslado voluntario',
    ciudad: 'Ocaña'
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  // Cargar logo cuando se abre el modal
  useEffect(() => {
    const loadLogo = async () => {
      if (isOpen) {
        setLoadingLogo(true);
        try {
          if (playerData.escuelaId) {
            // Obtener logo de la escuela específica
            const logo = await DocumentLogoService.getEscuelaLogo(playerData.escuelaId);
            setLogoUrl(logo);
          } else {
            // Obtener logo de la escuela del usuario actual
            const logo = await DocumentLogoService.getCurrentUserEscuelaLogo();
            setLogoUrl(logo);
          }
        } catch (error) {
          console.error('Error cargando logo:', error);
        } finally {
          setLoadingLogo(false);
        }
      }
    };

    if (isOpen) {
      loadLogo();
    }
  }, [isOpen, playerData.escuelaId]);

  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.coachName || !formData.presidentName) {
      alert('Por favor complete los nombres del entrenador y presidente');
      return;
    }
    
    if (!formData.playerName || !formData.schoolName) {
      alert('Por favor complete el nombre del jugador y la escuela');
      return;
    }
    
    // Generar PDF con logo
    try {
      const fechaFormateada = formatDateForDocument(formData.currentDate);
      const doc = await DocumentLogoService.generatePeaceAndSafePDF(
        formData.playerName,
        formData.schoolName,
        formData.coachName,
        formData.presidentName,
        fechaFormateada,
        formData.includeLogo,
        formData.logoPosition
      );

      // Guardar PDF
      const fileName = `paz-y-salvo-${formData.playerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      doc.save(fileName);
      
      // Llamar al callback
      onGenerate(formData);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error generando el documento. Por favor intente nuevamente.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
    }
  };

  // Efecto para manejar el foco
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape, true);
      const firstInput = modalRef.current?.querySelector('input');
      firstInput?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show peace-safe-modal" 
      style={{ 
        display: 'block', 
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10002 
      }} 
      tabIndex={-1}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="modal-dialog modal-xl"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-file-contract me-2"></i>
              Generar Paz y Salvo
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Cerrar"
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-primary mb-3">Información Requerida</h6>
                
                {/* Información de logo */}
                <div className="logo-info-card alert alert-light mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      {loadingLogo ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                      ) : logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Logo escuela" 
                          style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                          className="border rounded"
                        />
                      ) : (
                        <div className="text-muted" style={{ width: '40px', height: '40px', border: '1px dashed #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <small>
                        <strong>Logo de la escuela:</strong> {logoUrl ? 'Disponible' : 'No disponible'}
                        <br />
                        <span className="text-muted">Aparecerá en el documento generado</span>
                      </small>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="includeLogo"
                        name="includeLogo"
                        checked={formData.includeLogo}
                        onChange={(e) => setFormData(prev => ({ ...prev, includeLogo: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="includeLogo">
                        Incluir logo
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Posición del logo</label>
                    <select
                      className="form-select"
                      name="logoPosition"
                      value={formData.logoPosition}
                      onChange={handleInputChange}
                      disabled={!formData.includeLogo}
                    >
                      <option value="header">Encabezado</option>
                      <option value="corner">Esquina superior</option>
                      <option value="watermark">Marca de agua</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre del Jugador *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="playerName"
                    value={formData.playerName}
                    onChange={handleInputChange}
                    placeholder="Nombre completo del jugador"
                    autoComplete="off"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre de la Escuela/Club *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    placeholder="Nombre de la escuela o club"
                    autoComplete="off"
                  />
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Nombre del Entrenador *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="coachName"
                      value={formData.coachName}
                      onChange={handleInputChange}
                      placeholder="Ingrese el nombre del entrenador"
                      required
                      autoComplete="off"
                    />
                    <div className="form-text">Firma del entrenador/director técnico</div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Nombre del Presidente/Representante Legal *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="presidentName"
                      value={formData.presidentName}
                      onChange={handleInputChange}
                      placeholder="Ingrese el nombre del presidente"
                      required
                      autoComplete="off"
                    />
                    <div className="form-text">Firma del representante legal</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Fecha del Documento</label>
                  <input
                    type="date"
                    className="form-control"
                    name="currentDate"
                    value={formData.currentDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Ciudad</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ciudad donde se expide"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Motivo</label>
                  <input
                    type="text"
                    className="form-control"
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    placeholder="Motivo del paz y salvo"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Observaciones</label>
                  <textarea
                    className="form-control"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
                
                <div className="alert alert-info">
                  <small>
                    <i className="fas fa-info-circle me-2"></i>
                    Todos los campos marcados con * son obligatorios. 
                    El documento se generará con la información proporcionada.
                  </small>
                </div>
              </div>
              
              <div className="col-md-6">
                <h6 className="text-primary mb-3">Vista Previa del Documento</h6>
                
                <div className="peace-safe-preview border rounded p-4 bg-light">
                  <div className="text-center mb-4">
                    {logoUrl && formData.includeLogo && (
                      <div className="logo-preview-header mb-2">
                        <img 
                          src={logoUrl} 
                          alt="Logo" 
                          style={{ 
                            width: formData.logoPosition === 'watermark' ? '120px' : '50px',
                            height: formData.logoPosition === 'watermark' ? '120px' : '50px',
                            objectFit: 'contain',
                            opacity: formData.logoPosition === 'watermark' ? 0.3 : 1,
                            float: formData.logoPosition === 'corner' ? 'right' : 'left',
                            marginRight: formData.logoPosition === 'corner' ? '10px' : '0',
                            marginLeft: formData.logoPosition === 'corner' ? '0' : '10px'
                          }}
                        />
                      </div>
                    )}
                    <h5 className="fw-bold text-uppercase mb-1">
                      ESCUELA / CLUB DE FÚTBOL {formData.schoolName || '__________________________'}
                    </h5>
                    <h6 className="fw-bold text-uppercase border-top border-bottom py-2 my-2">
                      PAZ Y SALVO DE JUGADOR
                    </h6>
                  </div>
                  
                  <div className="document-content">
                    <p className="text-justify">
                      La presente certifica que el jugador <strong className="text-decoration-underline">
                        {formData.playerName || '__________________________'}
                      </strong>, quien pertenece o perteneció a la Escuela/Club <strong className="text-decoration-underline">
                        {formData.schoolName || '__________________________'}
                      </strong>, se encuentra paz y salvo por todo concepto deportivo, administrativo y disciplinario dentro de nuestra institución.
                    </p>
                    
                    <p className="text-justify">
                      Después de revisar los registros internos y confirmar que no existe pendiente alguna que impida su retiro o traslado, 
                      la escuela otorga plena autorización para que el mencionado jugador pueda retirarse de la institución y continuar 
                      su proceso formativo en cualquier otra escuela, club o entidad deportiva de su elección.
                    </p>
                    
                    <p className="text-justify">
                      {formData.observaciones && (
                        <>
                          <strong>Observaciones:</strong> {formData.observaciones}<br/><br/>
                        </>
                      )}
                    </p>
                    
                    <p className="text-justify">
                      Este paz y salvo se expide a solicitud del jugador, con el fin de ser presentado ante la Corporación de Fútbol Ocañero, 
                      entidad encargada de validar y formalizar su traslado conforme a los lineamientos establecidos.
                    </p>
                    
                    <p className="text-justify">
                      Se firma para constancia en la ciudad de {formData.ciudad || 'Ocaña'}, a los {formatDateForDocument(formData.currentDate)}.
                      {formData.motivo && ` Motivo: ${formData.motivo}`}
                    </p>
                  </div>
                  
                  <div className="signatures-section mt-4">
                    <div className="row">
                      <div className="col-md-6 text-center">
                        <div className="signature-field">
                          <div className="signature-line mb-2" 
                               style={{ 
                                 borderTop: '1px solid #000', 
                                 width: '200px', 
                                 margin: '0 auto',
                                 paddingTop: '40px'
                               }}>
                          </div>
                          <p className="fw-bold mb-1">{formData.coachName || '__________________________'}</p>
                          <p className="small mb-1">Entrenador / Director Técnico</p>
                          <p className="small">Escuela {formData.schoolName || '__________________________'}</p>
                        </div>
                      </div>
                      
                      <div className="col-md-6 text-center">
                        <div className="signature-field">
                          <div className="signature-line mb-2" 
                               style={{ 
                                 borderTop: '1px solid #000', 
                                 width: '200px', 
                                 margin: '0 auto',
                                 paddingTop: '40px'
                               }}>
                          </div>
                          <p className="fw-bold mb-1">{formData.presidentName || '__________________________'}</p>
                          <p className="small mb-1">Presidente / Representante Legal</p>
                          <p className="small">Escuela {formData.schoolName || '__________________________'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="document-footer mt-4 pt-3 border-top">
                    <p className="small text-muted text-center mb-0">
                      Documento generado el {new Date().toLocaleDateString('es-CO')} - 
                      Corporación de Fútbol Ocañero
                    </p>
                  </div>
                </div>
                
                <div className="preview-notes mt-3">
                  <div className="alert alert-warning py-2">
                    <small>
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <strong>Nota:</strong> Esta es una vista previa. El documento final se generará en formato PDF.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              <i className="fas fa-times me-2"></i>
              Cancelar
            </button>
            
            <button 
              type="button" 
              className="btn btn-success" 
              onClick={handleGenerate}
              disabled={!formData.coachName || !formData.presidentName || !formData.playerName || !formData.schoolName}
            >
              <i className="fas fa-file-pdf me-2"></i>
              Generar Documento PDF
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .peace-safe-modal .modal-content {
          border: none;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .peace-safe-modal .modal-header {
          border-radius: 12px 12px 0 0;
          background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
        }

        .peace-safe-preview {
          font-family: 'Times New Roman', serif;
          font-size: 14px;
          line-height: 1.6;
          min-height: 600px;
          background: white;
          position: relative;
        }

        .peace-safe-preview::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(0deg, transparent 95%, rgba(0,0,0,0.03) 95%);
          background-size: 100% 24px;
          pointer-events: none;
          border-radius: 6px;
        }

        .document-content {
          text-align: justify;
        }

        .text-justify {
          text-align: justify;
        }

        .signature-field {
          position: relative;
          margin-top: 20px;
        }

        .signature-line {
          border-top: 2px solid #000 !important;
          width: 200px;
          margin: 0 auto;
        }

        .btn-success:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .logo-info-card {
          border-left: 4px solid #3498db;
          background: #f8fafc;
        }

        .logo-preview-header {
          min-height: 60px;
        }

        @media (max-width: 768px) {
          .peace-safe-preview {
            min-height: 400px;
            font-size: 12px;
          }
          
          .signature-line {
            width: 150px;
          }
        }

        .modal.fade.show {
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-label.fw-bold::after {
          content: " *";
          color: #dc3545;
        }

        .preview-notes .alert {
          border-left: 4px solid #ffc107;
        }

        .document-footer {
          border-top: 1px dashed #dee2e6;
        }

        /* Prevenir que los inputs tengan fondo azul en algunos navegadores */
        input:focus {
          background-color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default PeaceAndSafeModal;