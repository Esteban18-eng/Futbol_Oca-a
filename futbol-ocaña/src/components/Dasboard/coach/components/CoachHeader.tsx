import React from 'react';

interface CoachHeaderProps {
  currentUser: any;
  isDarkMode: boolean;
  showHamburgerMenu: boolean;
  onToggleDarkMode: () => void;
  onToggleHamburgerMenu: () => void;
  onViewProfile: () => void;
  onAddPlayer: () => void;
  onOpenTeamRegistration: () => void;
  onLogout: () => void;
  hamburgerMenuRef: React.RefObject<HTMLDivElement>;
}

const CoachHeader: React.FC<CoachHeaderProps> = ({
  currentUser,
  isDarkMode,
  showHamburgerMenu,
  onToggleDarkMode,
  onToggleHamburgerMenu,
  /*onViewProfile,*/
  onAddPlayer,
  onOpenTeamRegistration,
  onLogout,
  hamburgerMenuRef
}) => {
  return (
    <header className="dashboard-header">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-auto">
            <div className="logo-section d-flex align-items-center">
              <img 
                src="/img/logo_bueno.png" 
                alt="Logo Corporación de Futbol Ocañero" 
                className="header-logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x40/4caf50/ffffff?text=O';
                }}
              />
              <div className="company-info">
                <h5 className="company-title mb-0">Corporación de</h5>
                <h5 className="company-title mb-0">Futbol Ocañero</h5>
                <small className="text-muted d-none d-md-block">
                  {currentUser.rol === 'admin' ? 'Panel de Administración' : 'Panel de Entrenador'}
                </small>
              </div>
            </div>
          </div>
          <div className="col"></div>
          <div className="col-auto">
            <div className="user-section d-flex align-items-center">
              <span className="badge bg-primary me-2 me-md-3">
                {currentUser.rol === 'admin' ? 'Administrador' : 'Entrenador'}
              </span>
              {currentUser.escuela && (
                <span className="badge bg-secondary me-2 me-md-3 d-none d-sm-inline">
                  {currentUser.escuela.nombre}
                </span>
              )}
              <button 
                className="btn btn-sm theme-toggle me-2 me-md-3"
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
                aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <div className="hamburger-menu-container position-relative" ref={hamburgerMenuRef}>
                <button 
                  className={`btn btn-sm btn-outline-secondary hamburger-button ${showHamburgerMenu ? 'menu-open' : ''}`}
                  onClick={onToggleHamburgerMenu}
                  aria-expanded={showHamburgerMenu}
                  aria-label="Menú de usuario"
                >
                  ☰
                </button>
                
                {showHamburgerMenu && (
                  <div className="hamburger-menu position-absolute bg-white border rounded shadow-sm mt-1 end-0">
                    <div className="p-2">
                      <div className="user-info p-2 border-bottom mb-2">
                        <strong>{currentUser.nombre} {currentUser.apellido}</strong>
                        <div className="small text-muted">{currentUser.email}</div>
                        <div className="small text-primary">
                          {currentUser.rol === 'admin' ? 'Administrador' : 'Entrenador'}
                        </div>
                        {currentUser.escuela && (
                          <div className="small text-muted">
                            {currentUser.escuela.nombre}
                          </div>
                        )}
                      </div>

                      <button
                        className="btn btn-primary w-100 mt-2 mb-2"
                        onClick={onAddPlayer}
                        aria-label="Agregar nuevo jugador"
                      >
                        ➕ Agregar Jugador
                      </button>
                      <button
                        className="btn btn-secondary w-100 mb-2"
                        onClick={onOpenTeamRegistration}
                        aria-label="Inscribir equipo por categoría"
                      >
                        🏅 Inscribir Equipo
                      </button>
                      <hr className="my-2" />
                      
                      <button 
                        className="btn btn-sm w-100 mb-1 text-start text-danger"
                        onClick={onLogout}
                        aria-label="Cerrar sesión"
                      >
                        🚪 Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <span className="user-name ms-2 d-none d-md-inline">
                {currentUser.nombre} {currentUser.apellido}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CoachHeader;