import React, { useState, useRef } from 'react';
import './UploadLogoModal.css';

interface UploadLogoModalProps {
  show: boolean;
  escuelaId: string;
  escuelaNombre: string;
  currentLogoUrl?: string | null;
  onClose: () => void;
  onUploadSuccess: (logoUrl: string) => void;
  onDeleteSuccess: () => void;
}

const UploadLogoModal: React.FC<UploadLogoModalProps> = ({
  show,
  escuelaId,
  escuelaNombre,
  currentLogoUrl,
  onClose,
  onUploadSuccess,
  onDeleteSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato no válido. Use JPG, PNG, WEBP o SVG');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setError('El logo no puede superar los 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(null);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Subir logo
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor seleccione un archivo');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Aquí iría la llamada a tu API o servicio
      const formData = new FormData();
      formData.append('logo', selectedFile);
      formData.append('escuelaId', escuelaId);

      // Simulación de upload - reemplaza esto con tu implementación real
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error subiendo logo');
      }

      const data = await response.json();
      
      setSuccess('¡Logo subido exitosamente!');
      onUploadSuccess(data.logoUrl);
      
      // Resetear formulario después de 2 segundos
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setSuccess(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error subiendo logo');
    } finally {
      setUploading(false);
    }
  };

  // Eliminar logo
  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de eliminar el logo actual?')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // Simulación de delete - reemplaza esto con tu implementación real
      const response = await fetch(`/api/delete-logo/${escuelaId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error eliminando logo');
      }

      setSuccess('¡Logo eliminado exitosamente!');
      onDeleteSuccess();
      
      // Cerrar después de 1.5 segundos
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error eliminando logo');
    } finally {
      setDeleting(false);
    }
  };

  // Resetear formulario
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-logo-modal-overlay" onClick={onClose}>
      <div className="upload-logo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-logo-header">
          <h5>Logo de {escuelaNombre}</h5>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="upload-logo-body">
          {error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <strong>Éxito:</strong> {success}
            </div>
          )}

          {/* Logo actual */}
          {currentLogoUrl && !previewUrl && (
            <div className="current-logo-section">
              <h6>Logo Actual</h6>
              <div className="current-logo-preview">
                <img 
                  src={currentLogoUrl} 
                  alt={`Logo ${escuelaNombre}`}
                  className="current-logo-img"
                />
              </div>
              <button
                className="btn btn-danger btn-sm mt-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar Logo'}
              </button>
            </div>
          )}

          {/* Formulario de upload */}
          <div className="upload-section">
            <h6>{currentLogoUrl ? 'Reemplazar Logo' : 'Agregar Logo'}</h6>
            
            <div className="file-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                id="logo-file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={handleFileSelect}
                className="file-input"
              />
              <label htmlFor="logo-file" className="file-label">
                <div className="file-icon">📁</div>
                <div className="file-text">
                  <strong>Seleccionar archivo</strong>
                  <small>JPG, PNG, WEBP o SVG (máx. 5MB)</small>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="file-info">
                <strong>Archivo seleccionado:</strong> {selectedFile.name}
                <br />
                <small>Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB</small>
              </div>
            )}

            {/* Preview */}
            {previewUrl && (
              <div className="preview-section">
                <h6>Vista Previa</h6>
                <div className="logo-preview-container">
                  <img 
                    src={previewUrl} 
                    alt="Vista previa" 
                    className="logo-preview-img"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notas importantes */}
          <div className="notes-section">
            <div className="alert alert-info">
              <strong>Recomendaciones:</strong>
              <ul className="mb-0">
                <li>Use imágenes cuadradas o de proporción 1:1</li>
                <li>Resolución recomendada: 500x500px mínimo</li>
                <li>Fondo transparente para mejor resultado</li>
                <li>El logo aparecerá en todos los documentos de la escuela</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="upload-logo-footer">
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={uploading || !selectedFile}
          >
            Limpiar
          </button>
          
          <div>
            <button
              className="btn btn-secondary me-2"
              onClick={onClose}
              disabled={uploading || deleting}
            >
              Cancelar
            </button>
            <button
              className="btn btn-success"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Subiendo...
                </>
              ) : 'Subir Logo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadLogoModal;