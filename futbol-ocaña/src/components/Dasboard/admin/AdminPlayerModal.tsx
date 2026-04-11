import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Jugador, Categoria, Escuela, getAdminSignature, getUserProfile, supabase } from '../../../services/supabaseClient';
import { DocumentLogoService } from '../../../services/documentLogoService';
import DocumentActionsModal from './DocumentActionsModal';

interface AdminPlayerModalProps {
  player: Jugador;
  categorias: Categoria[];
  escuelas: Escuela[];
  onClose: () => void;
  onPrint: () => void;
  onDownloadID: () => void;
  onDownloadRegister: () => void;
  onDocumentOpen: (url: string, filename: string) => void;
  onDeletePlayer: (player: Jugador) => void;
  onUpdatePlayerSchool: (playerId: string, escuelaId: string | null) => Promise<void>;
}

const AdminPlayerModal: React.FC<AdminPlayerModalProps> = ({
  player,
  categorias,
  escuelas,
  onClose,
  onPrint,
  /*onDownloadID,
  onDownloadRegister,*/
  onDocumentOpen,
  onDeletePlayer,
  onUpdatePlayerSchool,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDocumentActions, setShowDocumentActions] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromSchool, setFromSchool] = useState('');
  const [toInstitution, setToInstitution] = useState('');
  const [selectedEscuela, setSelectedEscuela] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset image states cuando cambia el jugador
    setImageError(false);
    setImageLoaded(false);
    // Establecer la escuela actual del jugador
    setFromSchool(player.escuela?.nombre || '');
    setSelectedEscuela(player.escuela_id || '');
  }, [player]);

  useEffect(() => {
    if (selectedEscuela === 'libre') {
      setToInstitution('Libertad de movimiento');
    } else if (toInstitution === 'Libertad de movimiento') {
      setToInstitution('');
    }
  }, [selectedEscuela]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getCategoriaName = () => {
    return categorias.find(cat => cat.id === player.categoria_id)?.nombre || 'Sin categoría';
  };

  const getEscuelaName = () => {
    return escuelas.find(esc => esc.id === player.escuela_id)?.nombre || 'Sin escuela';
  };

  const handleDocumentOpen = (url: string, filename: string) => {
    onDocumentOpen(url, filename);
  };

  const handlePrintDocument = (documentUrl: string) => {
    const printWindow = window.open(documentUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownloadDocument = (documentUrl: string, documentName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      alert(`✅ Documento "${documentName}" descargado correctamente`);
    }, 500);
  };

  const handleDownloadDocuments = () => {
    setShowDocumentActions(true);
  };

  const handleTransfer = () => {
    setShowTransferModal(true);
  };

  const generatePDFAndTransfer = async () => {
    if (!fromSchool || !toInstitution || !selectedEscuela) {
      alert('Por favor complete todos los campos');
      return;
    }

    setLoading(true);

    try {
      // Obtener información del usuario admin actual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let adminId = currentUser?.id || '';

      // Obtener nombre real del perfil si está disponible
      const profile = await getUserProfile();
      let adminName = 'Administrador';
      if (profile?.data) {
        adminName = `${profile.data.nombre || ''} ${profile.data.apellido || ''}`.trim() || currentUser?.email || 'Administrador';
      } else {
        adminName = currentUser?.email || 'Administrador';
      }

      // Obtener firma del admin
      const adminSignature = await getAdminSignature(adminId);
      
      // Generar la fecha
      const currentDate = new Date();
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const fecha = `${day} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][month - 1]} de ${year}`;

      // Generar el PDF con firma del admin
      const doc = DocumentLogoService.generateTransferPDFWithAdminSignature(
        `${player.nombre} ${player.apellido}`,
        fromSchool,
        toInstitution,
        fecha,
        adminSignature,
        adminName
      );

      // Guardar el PDF
      const fileName = `transferencia-${player.nombre}-${player.apellido}-${Date.now()}.pdf`
        .replace(/\s+/g, '-')
        .toLowerCase();
      doc.save(fileName);

      // Actualizar la escuela del jugador automáticamente.
      const newEscuelaId = selectedEscuela === 'libre' ? null : selectedEscuela;
      await onUpdatePlayerSchool(player.id, newEscuelaId);

      // Cerrar el modal
      setShowTransferModal(false);
      onClose();

      const signatureStatus = adminSignature ? 'con firma del administrador' : '(sin firma configurada)';
      const transferMessage = selectedEscuela === 'libre'
        ? 'El jugador quedó libre y su registro fue actualizado.'
        : 'La escuela del jugador se actualizó correctamente.';

      alert(`✅ PDF generado exitosamente. ${transferMessage}\nDescargue el documento de transferencia ${signatureStatus}.`);

    } catch (error: any) {
      console.error('Error en la transferencia:', error);
      alert('❌ Error al completar la transferencia. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para forzar la recarga de la imagen
  const reloadImage = () => {
    setImageError(false);
    setImageLoaded(false);
  };

  return (
    <>
      <div className="player-modal-overlay" onClick={onClose}>
        <div className="player-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="player-modal-header">
            <h3 className="player-modal-title">
              INFORMACIÓN DEL JUGADOR - VISTA ADMINISTRADOR
            </h3>
            <button className="player-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="player-modal-body">
            {/* Header con foto e información básica */}
            <div className="player-header-info">
              <div className="player-photo-wrapper">
                {player.foto_perfil_url && !imageError ? (
                  <>
                    <img 
                      src={`${player.foto_perfil_url}?t=${Date.now()}`} 
                      alt={`${player.nombre} ${player.apellido}`}
                      className="player-main-photo"
                      onError={() => {
                        console.error("Error cargando la imagen:", player.foto_perfil_url);
                        setImageError(true);
                      }}
                      onLoad={() => setImageLoaded(true)}
                      style={{ display: imageLoaded ? 'block' : 'none' }}
                    />
                    {!imageLoaded && !imageError && (
                      <div className="player-photo-loading">Cargando...</div>
                    )}
                  </>
                ) : (
                  <div className="player-photo-fallback">
                    👤
                    {player.foto_perfil_url && imageError && (
                      <div className="player-photo-error">
                        <p>Error al cargar la imagen</p>
                        <button onClick={reloadImage}>Reintentar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="player-basic-details">
                <h2 className="player-fullname">{player.nombre} {player.apellido}</h2>
                <div className="player-info-grid">
                  <div className="player-info-item">
                    <span className="player-info-label">Documento:</span>
                    <span className="player-info-value">{player.documento}</span>
                  </div>
                  <div className="player-info-item">
                    <span className="player-info-label">Edad:</span>
                    <span className="player-info-value">{calculateAge(player.fecha_nacimiento)} años</span>
                  </div>
                  <div className="player-info-item">
                    <span className="player-info-label">Nacimiento:</span>
                    <span className="player-info-value">{formatDate(player.fecha_nacimiento)}</span>
                  </div>
                  <div className="player-info-item">
                    <span className="player-info-label">Categoría:</span>
                    <span className="player-info-value">{getCategoriaName()}</span>
                  </div>
                  <div className="player-info-item">
                    <span className="player-info-label">Escuela:</span>
                    <span className="player-info-value">{getEscuelaName()}</span>
                  </div>
                  <div className="player-info-item">
                    <span className="player-info-label">Estado:</span>
                    <span className={`player-status-badge ${player.activo ? 'active' : 'inactive'}`}>
                      {player.activo ? '✅ ACTIVO' : '❌ INACTIVO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de ubicación y médica */}
            <div className="player-readonly-info">
              <div className="player-info-section">
                <h4 className="player-section-title">📍 Ubicación</h4>
                <div className="player-info-grid-readonly">
                  <div className="player-info-item-readonly">
                    <span className="player-info-label-readonly">País:</span>
                    <span className="player-info-value-readonly">{player.pais || 'No especificado'}</span>
                  </div>
                  <div className="player-info-item-readonly">
                    <span className="player-info-label-readonly">Departamento:</span>
                    <span className="player-info-value-readonly">{player.departamento || 'No especificado'}</span>
                  </div>
                  <div className="player-info-item-readonly">
                    <span className="player-info-label-readonly">Ciudad:</span>
                    <span className="player-info-value-readonly">{player.ciudad || 'No especificado'}</span>
                  </div>
                </div>
              </div>

              <div className="player-info-section">
                <h4 className="player-section-title">🏥 Información Médica</h4>
                <div className="player-info-grid-readonly">
                  <div className="player-info-item-readonly">
                    <span className="player-info-label-readonly">EPS:</span>
                    <span className="player-info-value-readonly">{player.eps || 'No especificada'}</span>
                  </div>
                  <div className="player-info-item-readonly">
                    <span className="player-info-label-readonly">Tipo de EPS:</span>
                    <span className="player-info-value-readonly">{player.tipo_eps || 'No especificado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div className="player-documents-section">
              <h4 className="player-section-title">📁 Documentos</h4>
              <div className="player-document-buttons">
                {player.documento_pdf_url && (
                  <button
                    className="player-doc-btn"
                    onClick={() => handleDocumentOpen(player.documento_pdf_url!, `Documento_${player.documento}.pdf`)}
                  >
                    <span className="player-doc-icon">📄</span>
                    <span className="player-doc-text">Ver Documento de Identidad</span>
                  </button>
                )}
                {player.registro_civil_url && (
                  <button
                    className="player-doc-btn"
                    onClick={() => handleDocumentOpen(player.registro_civil_url!, `Registro_Civil_${player.documento}.pdf`)}
                  >
                    <span className="player-doc-icon">📋</span>
                    <span className="player-doc-text">Ver Registro Civil</span>
                  </button>
                )}
                {!player.documento_pdf_url && !player.registro_civil_url && (
                  <p className="player-no-docs">No hay documentos disponibles</p>
                )}
              </div>
            </div>

            {/* Información de administrador */}
          </div>

          <div className="player-modal-actions">
            <button className="player-action-btn player-transfer-btn" onClick={handleTransfer}>
              🔄 Hacer Transferencia
            </button>
            <button className="player-action-btn player-delete-btn" onClick={() => onDeletePlayer(player)}>
              🗑️ Eliminar Jugador
            </button>
            <button className="player-action-btn player-print-btn" onClick={onPrint}>
              🖨️ Imprimir Información
            </button>
            {(player.documento_pdf_url || player.registro_civil_url) && (
              <button className="player-action-btn player-download-docs-btn" onClick={handleDownloadDocuments}>
                📄 Gestionar Documentos
              </button>
            )}
            <button className="player-action-btn player-close-action-btn" onClick={onClose}>
              ✕ Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Transferencia usando react-bootstrap */}
      <Modal 
        show={showTransferModal} 
        onHide={() => setShowTransferModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Transferencia de Jugador</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Jugador</Form.Label>
              <Form.Control 
                type="text" 
                value={`${player.nombre} ${player.apellido} - ${player.documento}`}
                disabled 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Escuela/Club de origen *</Form.Label>
              <Form.Control 
                type="text" 
                value={fromSchool}
                onChange={(e) => setFromSchool(e.target.value)}
                placeholder="Ingrese la escuela o club de origen"
                required
              />
              <Form.Text className="text-muted">
                Nombre de la escuela o club donde actualmente está registrado
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nueva Escuela / Libre *</Form.Label>
              <Form.Select 
                value={selectedEscuela}
                onChange={(e) => setSelectedEscuela(e.target.value)}
                required
              >
                <option value="">Seleccionar nueva escuela...</option>
                {escuelas.map(escuela => (
                  <option key={escuela.id} value={escuela.id}>
                    {escuela.nombre}
                  </option>
                ))}
                <option value="libre">Libre / Sin escuela</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Seleccione la nueva escuela o marque al jugador como libre.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Institución destino *</Form.Label>
              <Form.Control 
                type="text" 
                value={toInstitution}
                onChange={(e) => setToInstitution(e.target.value)}
                placeholder="Ingrese la institución destino"
                required
              />
              <Form.Text className="text-muted">
                Nombre de la nueva institución destino
              </Form.Text>
            </Form.Group>

            <div className="certificate-preview border p-3 mt-3 bg-light">
              <h6 className="text-center mb-3">Vista previa del certificado:</h6>
              <div className="preview-content">
                <p className="text-center"><strong>CORPORACIÓN DE FÚTBOL OCAÑERO</strong></p>
                <p className="text-center"><strong>CERTIFICADO DE TRANSFERENCIA DE JUGADOR</strong></p>
                <p>La Corporación de Fútbol Ocañero certifica que el jugador {player.nombre} {player.apellido}, identificado en nuestros registros deportivos, se encuentra paz y salvo con esta institución...</p>
                <p>Transferencia desde: <strong>{fromSchool || '________________'}</strong></p>
                <p>Hacia: <strong>{toInstitution || '________________'}</strong></p>
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowTransferModal(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={generatePDFAndTransfer}
            disabled={loading || !fromSchool || !toInstitution || !selectedEscuela}
          >
            {loading ? 'Procesando...' : '✅ Exportar PDF y Transferir'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de acciones de documentos */}
      {showDocumentActions && (
        <DocumentActionsModal
          player={player}
          onClose={() => setShowDocumentActions(false)}
          onPrint={handlePrintDocument}
          onDownload={handleDownloadDocument}
        />
      )}
    </>
  );
};

export default AdminPlayerModal;