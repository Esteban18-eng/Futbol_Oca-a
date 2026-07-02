import React, { /*useState*/ } from 'react';
import './DocumentActionsModal.css';

interface DocumentActionsModalProps {
  player: any;
  onClose: () => void;
  onPrint: (documentUrl: string, documentName: string) => void;
  onDownload: (documentUrl: string, documentName: string) => void;
}

const DocumentActionsModal: React.FC<DocumentActionsModalProps> = ({
  player,
  onClose,
  onPrint,
  onDownload
}) => {
  /*const [selectedDocument, setSelectedDocument] = useState<string | null>(null);*/

  const documents = [
    {
      type: 'documento_pdf',
      url: player.documento_pdf_url,
      name: `Documento_Identidad_${player.documento}.pdf`,
      label: 'Documento de Identidad',
      icon: '🆔'
    },
    {
      type: 'registro_civil',
      url: player.registro_civil_url,
      name: `Registro_Civil_${player.documento}.pdf`,
      label: 'Registro Civil',
      icon: '📋'
    }
  ].filter(doc => doc.url);

  const handlePrint = (documentUrl: string, documentName: string) => {
    onPrint(documentUrl, documentName);
  };

  const handleDownload = (documentUrl: string, documentName: string) => {
    onDownload(documentUrl, documentName);
  };

  const handleDownloadAll = () => {
    documents.forEach(doc => {
      onDownload(doc.url, doc.name);
    });
  };

  if (documents.length === 0) {
    return (
      <div className="document-actions-overlay" onClick={onClose}>
        <div className="document-actions-modal" onClick={(e) => e.stopPropagation()}>
          <div className="document-actions-header">
            <h3>Documentos de {player.nombre} {player.apellido}</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="document-actions-body">
            <div className="no-documents">
              <span className="no-docs-icon">📭</span>
              <p>No hay documentos disponibles para este jugador</p>
            </div>
          </div>
          <div className="document-actions-footer">
            <button className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="document-actions-overlay" onClick={onClose}>
      <div className="document-actions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="document-actions-header">
          <h3>Documentos de {player.nombre} {player.apellido}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="document-actions-body">
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.type} className="document-item">
                <div className="document-info">
                  <span className="document-icon">{doc.icon}</span>
                  <div className="document-details">
                    <span className="document-name">{doc.label}</span>
                    <span className="document-filename">{doc.name}</span>
                  </div>
                </div>
                <div className="document-actions">
                  <button
                    className="action-btn print-btn"
                    onClick={() => handlePrint(doc.url, doc.name)}
                    title="Imprimir documento"
                  >
                    Imprimir
                  </button>
                  <button
                    className="action-btn download-btn"
                    onClick={() => handleDownload(doc.url, doc.name)}
                    title="Descargar documento"
                  >
                    Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="document-actions-footer">
          {documents.length > 1 && (
            <button
              className="btn-primary download-all-btn"
              onClick={handleDownloadAll}
            >
              Descargar Todos los Documentos
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentActionsModal;