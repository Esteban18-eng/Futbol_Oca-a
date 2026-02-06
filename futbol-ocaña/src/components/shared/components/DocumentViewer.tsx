// DocumentViewer.tsx
import React, { useState, useEffect } from 'react';
import './DocumentViewer.css';

interface DocumentViewerProps {
  url: string;
  filename: string;
  onClose: () => void;
  // NUEVAS PROPS PARA LOGOS
  escuelaLogoUrl?: string | null;
  escuelaNombre?: string;
  showLogo?: boolean;
  logoPosition?: 'watermark' | 'header' | 'corner';
  logoOpacity?: number;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  url, 
  filename, 
  onClose,
  escuelaLogoUrl,
  escuelaNombre = 'Escuela',
  showLogo = false,
  logoPosition = 'watermark',
  logoOpacity = 0.1
}) => {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [showLogoOverlay, setShowLogoOverlay] = useState(showLogo);
  const [error, setError] = useState<string | null>(null);

  // Manejar errores de carga del documento
  const handleIframeError = () => {
    setError('Error al cargar el documento. Verifique la URL.');
    setLoading(false);
  };

  // Manejar carga exitosa
  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  // Controles de zoom
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  // Determinar clases CSS según posición del logo
  const getLogoPositionClass = () => {
    switch (logoPosition) {
      case 'header':
        return 'logo-header';
      case 'corner':
        return 'logo-corner';
      case 'watermark':
      default:
        return 'logo-watermark';
    }
  };

  // Determinar tamaño del logo
  const getLogoSize = () => {
    switch (logoPosition) {
      case 'header':
        return { width: '120px', height: '120px' };
      case 'corner':
        return { width: '80px', height: '80px' };
      case 'watermark':
      default:
        return { width: '300px', height: '300px' };
    }
  };

  return (
    <div className="document-viewer-overlay" onClick={onClose}>
      <div className="document-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="document-viewer-header">
          <h5>{filename}</h5>
          <div className="document-controls">
            {/* Controles de logo (solo si hay logo disponible) */}
            {escuelaLogoUrl && (
              <div className="logo-control">
                <button
                  className="document-control-btn"
                  onClick={() => setShowLogoOverlay(!showLogoOverlay)}
                  title={showLogoOverlay ? 'Ocultar logo' : 'Mostrar logo'}
                >
                  {showLogoOverlay ? '👁️ Ocultar Logo' : '👁️ Mostrar Logo'}
                </button>
              </div>
            )}
            
            {/* Controles de zoom */}
            <div className="zoom-controls-inline">
              <button 
                className="document-control-btn" 
                onClick={handleZoomOut}
                title="Alejar"
              >
                🔍−
              </button>
              <button 
                className="document-control-btn" 
                onClick={handleResetZoom}
                title="Zoom normal"
              >
                {Math.round(scale * 100)}%
              </button>
              <button 
                className="document-control-btn" 
                onClick={handleZoomIn}
                title="Acercar"
              >
                🔍+
              </button>
            </div>
            
            <button className="btn btn-sm btn-danger" onClick={onClose}>
              ✕ Cerrar
            </button>
          </div>
        </div>
        
        <div className="document-viewer-body">
          {loading && (
            <div className="document-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando documento...</span>
              </div>
              <p>Cargando documento...</p>
            </div>
          )}
          
          {error && (
            <div className="document-error">
              <div className="document-error-icon">❌</div>
              <p className="document-error-message">{error}</p>
              <button className="btn btn-primary" onClick={() => window.open(url, '_blank')}>
                Abrir en nueva pestaña
              </button>
            </div>
          )}
          
          {/* Logo overlay */}
          {showLogoOverlay && escuelaLogoUrl && (
            <div className={`document-logo-overlay ${getLogoPositionClass()}`}>
              <img 
                src={escuelaLogoUrl} 
                alt={`Logo ${escuelaNombre}`}
                className="document-logo-img"
                style={{
                  opacity: logoOpacity,
                  ...getLogoSize()
                }}
              />
            </div>
          )}
          
          <iframe
            src={url}
            title={filename}
            className="document-iframe"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ 
              display: loading || error ? 'none' : 'block',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
              height: `${100 / scale}%`
            }}
          />
        </div>

        {/* Controles de zoom flotantes */}
        <div className="zoom-controls-floating">
          <button className="zoom-btn" onClick={handleZoomOut} title="Alejar">−</button>
          <button className="zoom-btn" onClick={handleResetZoom} title="Zoom normal">
            {Math.round(scale * 100)}%
          </button>
          <button className="zoom-btn" onClick={handleZoomIn} title="Acercar">+</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;