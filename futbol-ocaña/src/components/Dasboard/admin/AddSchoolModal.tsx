import React, { useState, useRef } from 'react';
import { AddSchoolModalProps } from '../coach/types/adminTypes';

const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  show,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    nombre: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones de tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato no válido. Use JPG, PNG, WEBP o SVG');
      return;
    }

    // Validación de tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setError('El logo no puede superar los 5MB');
      return;
    }

    setLogoFile(file);
    setError('');

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simular progreso de upload (en producción esto sería real)
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      setError('El nombre de la escuela es obligatorio');
      setLoading(false);
      return;
    }

    if (formData.nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Simular progreso de upload si hay logo
      if (logoFile) {
        simulateUploadProgress();
      }

      // Preparar datos para enviar
      const schoolData = {
        nombre: formData.nombre.trim(),
        logoFile: logoFile // Enviar el archivo de logo
      };

      await onSubmit(schoolData);
      
      // Resetear formulario después de éxito
      setTimeout(() => {
        setFormData({ nombre: '' });
        setLogoFile(null);
        setLogoPreview(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 500);
      
    } catch (err: any) {
      setError(err.message || 'Error creando escuela');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="add-player-modal">
        <div className="modal-header">
          <h5 className="modal-title">Agregar Nueva Escuela</h5>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Nombre de la escuela */}
            <div className="mb-4">
              <label htmlFor="nombre" className="form-label">
                Nombre de la Escuela *
              </label>
              <input
                type="text"
                className="form-control"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Ej: Escuela de Fútbol Ocaña Norte"
              />
            </div>

            {/* Sección de Logo */}
            <div className="mb-4">
              <label className="form-label">
                Logo de la Escuela (Opcional)
                <span className="text-muted ms-1">- Aparecerá en documentos</span>
              </label>
              
              <div className="logo-upload-section">
                <div className="file-upload-area mb-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="logo-upload"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    onChange={handleLogoSelect}
                    className="form-control"
                    disabled={loading}
                  />
                  <small className="text-muted d-block mt-1">
                    Formatos aceptados: JPG, PNG, WEBP, SVG (Máx. 5MB)
                  </small>
                </div>
                
                {/* Progress bar para upload */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress mb-3">
                    <div className="progress">
                      <div 
                        className="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar" 
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {uploadProgress}%
                      </div>
                    </div>
                    <small className="text-muted">Subiendo logo...</small>
                  </div>
                )}
                
                {/* Preview del logo */}
                {logoPreview && (
                  <div className="logo-preview mt-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Vista Previa del Logo:</h6>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={handleRemoveLogo}
                        disabled={loading}
                        title="Eliminar logo"
                      >
                        ✕ Eliminar
                      </button>
                    </div>
                    
                    <div className="preview-container position-relative">
                      <img 
                        src={logoPreview} 
                        alt="Preview logo" 
                        className="preview-image img-thumbnail"
                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                      />
                    </div>
                    
                    <div className="logo-info mt-2">
                      <small className="text-muted">
                        <strong>Uso del logo:</strong> Aparecerá en:
                        <ul className="mb-0 mt-1">
                          <li>Documentos de Paz y Salvo</li>
                          <li>Documentos de Transferencia</li>
                          <li>Tarjetas de identificación</li>
                          <li>Registros de jugadores</li>
                        </ul>
                      </small>
                    </div>
                  </div>
                )}
                
                {/* Información sobre logos */}
                {!logoPreview && (
                  <div className="logo-info-card alert alert-light mt-3">
                    <h6 className="alert-heading">💡 ¿Por qué agregar un logo?</h6>
                    <ul className="mb-0">
                      <li>Identifica los documentos oficiales de tu escuela</li>
                      <li>Da profesionalismo a certificados y documentos</li>
                      <li>Los logos aparecen como marca de agua o en encabezados</li>
                      <li>Puedes actualizarlo en cualquier momento</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notas importantes */}
            <div className="alert alert-info">
              <small>
                <strong>Nota:</strong> 
                <ul className="mb-0 mt-1">
                  <li>Una vez creada la escuela, podrás asignarle entrenadores</li>
                  <li>Los entrenadores podrán registrar jugadores para esta escuela</li>
                  <li>El logo es opcional pero recomendado para identificar documentos</li>
                  <li>Puedes editar el logo posteriormente desde la configuración de la escuela</li>
                </ul>
              </small>
            </div>
            
            {/* Acciones */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary action-btn"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-success action-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {logoFile ? 'Creando escuela con logo...' : 'Creando...'}
                  </>
                ) : (
                  'Crear Escuela'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Añade estos estilos en tu archivo CSS global o en el CSS del componente
const styles = `
.logo-upload-section .file-upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 15px;
  background: #f8f9fa;
  transition: border-color 0.3s ease;
}

.logo-upload-section .file-upload-area:hover {
  border-color: #3498db;
  background: #e3f2fd;
}

.logo-preview {
  background: white;
  border-color: #dee2e6 !important;
}

.preview-container {
  text-align: center;
  padding: 10px;
}

.preview-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.logo-info-card {
  border-left: 4px solid #3498db;
}

.upload-progress .progress {
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.upload-progress .progress-bar {
  font-size: 12px;
  font-weight: 500;
}

/* Modo oscuro */
.dark-theme .logo-upload-section .file-upload-area {
  background: #2d3436;
  border-color: #555;
}

.dark-theme .logo-upload-section .file-upload-area:hover {
  border-color: #3498db;
  background: #34495e;
}

.dark-theme .logo-preview {
  background: #2d3436;
  border-color: #555 !important;
}

.dark-theme .logo-info-card {
  background: #34495e;
  border-color: #3498db;
  color: #e0e0e0;
}

.dark-theme .preview-image {
  border: 1px solid #555;
}
`;

export default AddSchoolModal;