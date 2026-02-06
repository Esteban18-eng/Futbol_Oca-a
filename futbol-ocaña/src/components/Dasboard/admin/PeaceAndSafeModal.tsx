// PeaceAndSafeModal.tsx - MODIFICADO
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Jugador } from '../../../services/supabaseClient';
import { DocumentLogoService } from '../../../services/documentLogoService';
import { formatDateForDocument } from '../../../utils/logoUtils';

interface PeaceAndSafeModalProps {
  show: boolean;
  onHide: () => void;
  player: Jugador | null;
}

const PeaceAndSafeModal: React.FC<PeaceAndSafeModalProps> = ({ show, onHide, player }) => {
  const [fromSchool, setFromSchool] = useState('');
  const [toInstitution, setToInstitution] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  // Cargar logo de la corporación cuando se abre el modal
  useEffect(() => {
    if (show) {
      setLoadingLogo(true);
      try {
        const logo = DocumentLogoService.getCorporacionLogo();
        setLogoUrl(logo);
      } catch (error) {
        console.error('Error cargando logo:', error);
      } finally {
        setLoadingLogo(false);
      }
    }
  }, [show]);

  const generatePDF = () => {
    const fecha = formatDateForDocument();
    const playerName = player ? `${player.nombre} ${player.apellido}` : '';
    
    // Generar PDF con el servicio
    const doc = DocumentLogoService.generateTransferPDF(
      playerName,
      fromSchool,
      toInstitution,
      fecha
    );

    // Guardar el PDF
    const fileName = `transferencia-${player?.nombre}-${player?.apellido}-${Date.now()}.pdf`
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    doc.save(fileName);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Generar Paz y Salvo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Información del logo */}
        <div className="logo-info-card alert alert-light mb-4">
          <div className="d-flex align-items-center">
            <div className="me-3">
              {loadingLogo ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              ) : logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo corporación" 
                  style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                  className="border rounded"
                />
              ) : (
                <div className="text-muted" style={{ width: '40px', height: '40px', border: '1px dashed #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-building"></i>
                </div>
              )}
            </div>
            <div className="flex-grow-1">
              <small>
                <strong>Logo de la Corporación:</strong> {logoUrl ? 'Disponible' : 'No disponible'}
                <br />
                <span className="text-muted">Aparecerá en el documento generado</span>
              </small>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="includeLogoAdmin"
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="includeLogoAdmin">
                Incluir logo
              </label>
            </div>
          </div>
        </div>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Jugador seleccionado</Form.Label>
            <Form.Control 
              type="text" 
              value={player ? `${player.nombre} ${player.apellido} - ${player.documento}` : 'Ningún jugador seleccionado'} 
              disabled 
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Escuela/Club de origen *</Form.Label>
            <Form.Control 
              type="text" 
              value={fromSchool}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromSchool(e.target.value)}
              placeholder="Ingrese la escuela o club de origen del jugador"
              required
            />
            <Form.Text className="text-muted">
              Nombre de la escuela o club donde actualmente está registrado el jugador
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Institución destino *</Form.Label>
            <Form.Control 
              type="text" 
              value={toInstitution}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToInstitution(e.target.value)}
              placeholder="Ingrese la institución destino (puede ser 'Libre')"
              required
            />
            <Form.Text className="text-muted">
              Nombre de la nueva institución o "Libre" si no tiene destino específico
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              value={observaciones}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales..."
            />
          </Form.Group>
        </Form>
        
        <div className="border p-3 mt-3 bg-light">
          <h6 className="text-center mb-3">Vista previa del certificado</h6>
          {logoUrl && includeLogo && (
            <div className="text-center mb-3">
              <img 
                src={logoUrl} 
                alt="Logo corporación" 
                style={{ width: '50px', height: '50px', objectFit: 'contain' }}
              />
            </div>
          )}
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.4'
          }}>
{`CORPORACIÓN DE FÚTBOL OCAÑERO
CERTIFICADO DE TRANSFERENCIA DE JUGADOR

La Corporación de Fútbol Ocañero certifica que el jugador ${player?.nombre || '__________________________'} ${player?.apellido || ''}, identificado en nuestros registros deportivos, se encuentra paz y salvo con esta institución y no presenta obligaciones pendientes que restrinjan su movilidad entre escuelas o clubes formativos.

En consecuencia, la Corporación autoriza de manera oficial la transferencia del jugador desde la escuela o club ${fromSchool || '__________________________'} hacia la institución deportiva ${toInstitution || '__________________________'}, garantizando así la continuidad de su proceso formativo y deportivo.

${observaciones ? `Observaciones: ${observaciones}\n\n` : ''}
Este certificado se expide a solicitud de la parte interesada para los fines que estime convenientes.

Dado en Ocaña, a los ${formatDateForDocument()}.

__________________________________
Corporación de Fútbol Ocañero
Dirección Administrativa`}
          </pre>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={generatePDF}
          disabled={!fromSchool || !toInstitution}
        >
          <i className="fas fa-download me-2"></i>
          Exportar a PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PeaceAndSafeModal;