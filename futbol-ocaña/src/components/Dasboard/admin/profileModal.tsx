import React from 'react';
import { Usuario } from '../../../services/supabaseClient';

interface ProfileModalProps {
  show: boolean;
  userProfile: Usuario | null;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  show,
  userProfile,
  onClose
}) => {
  if (!show || !userProfile) return null;

  const getRolDisplay = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'entrenador':
        return 'Entrenador';
      default:
        return rol;
    }
  };

  const getEstadoDisplay = (activo: boolean | null) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-player-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">Mi Perfil</h5>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <div className="profile-avatar">
                <div className="avatar-placeholder">
                  <span className="avatar-icon">👤</span>
                </div>
                <h5 className="mt-3">{userProfile.nombre} {userProfile.apellido}</h5>
                <span className="badge bg-primary">{getRolDisplay(userProfile.rol)}</span>
              </div>
            </div>
            
            <div className="col-md-8">
              <div className="profile-info">
                <h6 className="section-title mb-3">Información Personal</h6>
                
                <div className="info-grid">
                  <div className="info-item">
                    <label className="info-label">Nombre completo:</label>
                    <span className="info-value">{userProfile.nombre} {userProfile.apellido}</span>
                  </div>
                  
                  <div className="info-item">
                    <label className="info-label">Email:</label>
                    <span className="info-value">{userProfile.email}</span>
                  </div>
                  
                  <div className="info-item">
                    <label className="info-label">Rol:</label>
                    <span className="info-value">
                      <span className={`badge ${userProfile.rol === 'admin' ? 'bg-primary' : 'bg-success'}`}>
                        {getRolDisplay(userProfile.rol)}
                      </span>
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <label className="info-label">Estado:</label>
                    <span className="info-value">
                      <span className={`badge ${userProfile.activo ? 'bg-success' : 'bg-secondary'}`}>
                        {getEstadoDisplay(userProfile.activo)}
                      </span>
                    </span>
                  </div>
                  
                  {userProfile.escuela && (
                    <div className="info-item">
                      <label className="info-label">Escuela asignada:</label>
                      <span className="info-value">{userProfile.escuela.nombre}</span>
                    </div>
                  )}
                  
                  <div className="info-item">
                    <label className="info-label">Fecha de registro:</label>
                    <span className="info-value">
                      {formatDate(userProfile.created_at)}
                    </span>
                  </div>
                </div>
                
                {userProfile.rol === 'admin' && (
                  <div className="admin-features mt-4">
                    <h6 className="section-title mb-3">Funciones de Administrador</h6>
                    <div className="features-list">
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Gestionar todos los jugadores del sistema</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Crear y administrar escuelas</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Crear administradores y entrenadores</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Ver estadísticas generales</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Generar certificados de transferencia</span>
                      </div>
                    </div>
                  </div>
                )}

                {userProfile.rol === 'entrenador' && (
                  <div className="admin-features mt-4">
                    <h6 className="section-title mb-3">Funciones de Entrenador</h6>
                    <div className="features-list">
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Gestionar jugadores de mi escuela</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Registrar nuevos jugadores</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Editar información de jugadores</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Subir documentos de jugadores</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon"></span>
                        <span className="feature-text">Ver estadísticas de mi escuela</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="modal-actions mt-4">
            <button
              type="button"
              className="btn btn-primary action-btn"
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