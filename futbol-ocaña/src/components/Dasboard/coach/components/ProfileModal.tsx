import React from 'react';
import { Usuario } from '../../../../services/supabaseClient';

interface ProfileModalProps {
  show: boolean;
  userProfile: Usuario | null;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ show, userProfile, onClose }) => {
  if (!show) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="player-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            MI PERFIL
          </h3>
          <button 
            className="close-button" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="row">
            <div className="col-md-8">
              <div className="info-section">
                <div className="info-field">
                  <label>NOMBRE COMPLETO</label>
                  <input 
                    type="text" 
                    value={`${userProfile?.nombre || ''} ${userProfile?.apellido || ''}`} 
                    readOnly 
                    className="form-control readonly-input"
                  />
                </div>

                <div className="info-field">
                  <label>EMAIL</label>
                  <input 
                    type="text" 
                    value={userProfile?.email || ''} 
                    readOnly 
                    className="form-control readonly-input"
                  />
                </div>

                <div className="info-field">
                  <label>ROL</label>
                  <input 
                    type="text" 
                    value={userProfile?.rol === 'admin' ? 'Administrador' : 'Entrenador'} 
                    readOnly 
                    className="form-control readonly-input"
                  />
                </div>

                {userProfile?.escuela && (
                  <div className="info-field">
                    <label>ESCUELA/CLUB</label>
                    <input 
                      type="text" 
                      value={userProfile.escuela.nombre} 
                      readOnly 
                      className="form-control readonly-input"
                    />
                  </div>
                )}

                <div className="info-field">
                  <label>ESTADO</label>
                  <input 
                    type="text" 
                    value={userProfile?.activo ? 'Activo' : 'Inactivo'} 
                    readOnly 
                    className="form-control readonly-input"
                  />
                </div>

                <div className="info-field">
                  <label>FECHA DE REGISTRO</label>
                  <input 
                    type="text" 
                    value={userProfile?.created_at ? formatDate(userProfile.created_at) : 'No disponible'} 
                    readOnly 
                    className="form-control readonly-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              className="btn btn-primary action-btn"
              onClick={() => {
                alert('Funcionalidad de editar perfil en desarrollo');
              }}
            >
              Editar Perfil
            </button>
            <button 
              className="btn btn-secondary action-btn"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;