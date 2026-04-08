import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { uploadAdminSignature, saveAdminSignatureUrl, getAdminSignature, deleteAdminSignature, getUserProfile, supabase } from '../../../services/supabaseClient';
import './AdminSignatureModal.css';

interface AdminSignatureModalProps {
  show: boolean;
  onHide: () => void;
  adminId?: string;
}

const AdminSignatureModal: React.FC<AdminSignatureModalProps> = ({
  show,
  onHide,
  adminId: providedAdminId
}) => {
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      // Si tenemos adminId desde props, usarlo directamente
      if (providedAdminId) {
        setCurrentAdminId(providedAdminId);
        loadAdminName();
      } else {
        // Si no, obtenerlo del Auth
        loadAdminInfo();
      }
      // Siempre cargar la firma actual después de establecer el admin ID
      setTimeout(() => loadCurrentSignature(), 100);
    }
  }, [show, providedAdminId]);

  const loadAdminName = async () => {
    try {
      const profile = await getUserProfile();
      if (profile?.data) {
        const name = `${profile.data.nombre || ''} ${profile.data.apellido || ''}`.trim();
        setAdminName(name || profile.data.email || 'Administrador');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAdminName(user.email || 'Administrador');
        }
      }
    } catch (err) {
      console.error('Error cargando nombre del admin:', err);
    }
  };

  const loadAdminInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdminId(user.id);
        const profile = await getUserProfile();
        if (profile?.data) {
          const name = `${profile.data.nombre || ''} ${profile.data.apellido || ''}`.trim();
          setAdminName(name || profile.data.email || 'Administrador');
        } else {
          setAdminName(user.email || 'Administrador');
        }
      }
    } catch (err) {
      console.error('Error cargando info del admin:', err);
    }
  };

  const loadCurrentSignature = async () => {
    try {
      const adminId = providedAdminId || currentAdminId;
      if (adminId) {
        const signatureUrl = await getAdminSignature(adminId);
        if (signatureUrl) {
          setCurrentSignatureUrl(signatureUrl);
          setPreviewUrl(signatureUrl);
        }
      }
    } catch (err) {
      console.error('Error cargando firma actual:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Solo se aceptan archivos JPG, PNG o WEBP');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La firma no puede superar 2MB');
        return;
      }

      setError('');
      setSignatureFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSignature = async () => {
    if (!signatureFile) {
      setError('Por favor selecciona una firma');
      return;
    }

    if (!currentAdminId) {
      setError('No se pudo identificar el admin');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Subir la firma
      const result = await uploadAdminSignature(currentAdminId, signatureFile);
      
      if (result.success && result.url) {
        // Guardar URL en localStorage
        saveAdminSignatureUrl(currentAdminId, result.url);
        setCurrentSignatureUrl(result.url);
        setSignatureFile(null);
        setSuccess('✅ Firma cargada exitosamente. Se usará automáticamente en los documentos de transferencia.');
        setTimeout(() => {
          setSuccess('');
          onHide();
        }, 2000);
      } else {
        setError(result.error || 'Error al cargar la firma');
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSignature = async () => {
    if (!currentAdminId) return;

    if (window.confirm('¿Deseas eliminar tu firma? Ya no se incluirá en los documentos de transferencia.')) {
      try {
        const deleted = deleteAdminSignature(currentAdminId);
        if (deleted) {
          setCurrentSignatureUrl(null);
          setPreviewUrl(null);
          setSuccess('✅ Firma eliminada exitosamente');
          setTimeout(() => {
            setSuccess('');
          }, 2000);
        }
      } catch (err: any) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>⚙️ Configurar Mi Firma</Modal.Title>
      </Modal.Header>

      <Modal.Body className="admin-signature-modal-body">
        <div className="signature-admin-info">
          <p className="admin-name">Administrador: <strong>{adminName || 'Cargando...'}</strong></p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <div className="signature-section">
          <h5>Firma Actual</h5>
          {currentSignatureUrl ? (
            <div className="current-signature-container">
              <img src={currentSignatureUrl} alt="Firma actual" className="current-signature-image" />
              <p className="text-muted mt-2">Esta es la firma que se incluirá en los documentos</p>
            </div>
          ) : (
            <div className="no-signature-placeholder">
              <p>No tienes firma configurada aún</p>
              <small className="text-muted">Sube tu firma para que aparezca automáticamente en los documentos de transferencia</small>
            </div>
          )}
        </div>

        <div className="signature-upload-section">
          <h5>Subir Nueva Firma</h5>
          <p className="text-muted">
            Puedes usar:<br/>
            ✓ Una fotografía de tu firma manuscrita<br/>
            ✓ Tu firma digital<br/>
            ✓ Un sello o imagen personal
          </p>

          <Form.Group className="mb-3">
            <Form.Label className="form-label-custom">Selecciona tu firma (JPG, PNG o WEBP)</Form.Label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="signature-file-input"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="form-control"
                disabled={loading}
              />
              <small className="text-muted d-block mt-1">
                Máximo 2MB. Se recomienda una imagen clara de 200x100 píxeles
              </small>
            </div>
          </Form.Group>

          {previewUrl && (
            <div className="signature-preview-section">
              <h6>Vista Previa</h6>
              <div className="preview-container">
                <img src={previewUrl} alt="Vista previa" className="signature-preview" />
              </div>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="signature-modal-footer">
        <Button
          variant="outline-danger"
          onClick={handleDeleteSignature}
          disabled={!currentSignatureUrl || loading}
        >
          🗑️ Eliminar Firma
        </Button>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleUploadSignature}
          disabled={!signatureFile || loading}
        >
          {loading ? 'Cargando...' : '📤 Cargar Firma'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminSignatureModal;
