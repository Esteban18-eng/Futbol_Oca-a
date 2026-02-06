import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../../../services/supabaseClient';
import '../../Dashboard.css';
import { 
  Usuario, 
  Jugador, 
  Categoria, 
  Escuela,
  getAllJugadores,
  getCategorias,
  getEscuelas,
  getUserProfile
} from '../../../services/supabaseClient';
import { getAdminStats, createAdmin, createCoach, createSchool } from '../../../services/adminServices';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminPlayerModal from './AdminPlayerModal';
import PeaceAndSafeModal from './PeaceAndSafeModal';
import EditPlayerModal from './EditPlayerModal';
import AddAdminModal from './AddAdminModal';
import AddCoachModal from './AddCoachModal';
import AddSchoolModal from './AddSchoolModal';
import ProfileModal from '../coach/components/ProfileModal';
import DocumentViewer from '../../shared/components/DocumentViewer';
import DocumentActionsModal from './DocumentActionsModal';
import SyncLogosButton from './SyncLogosButton'; // AGREGAR ESTA IMPORTACIÓN

interface AdminDashboardProps {
  onLogout: () => void;
  currentUser: Usuario;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, currentUser }) => {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Jugador[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Jugador[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  
  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalJugadores: 0,
    totalEscuelas: 0,
    totalAdmins: 0,
    totalCoaches: 0,
    totalCategorias: 0
  });

  // Estados para filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  // Estados para modales
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showDocumentActionsModal, setShowDocumentActionsModal] = useState(false);
  const [showPeaceAndSafeModal, setShowPeaceAndSafeModal] = useState(false);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSyncLogosModal, setShowSyncLogosModal] = useState(false); // AGREGAR ESTE ESTADO
  
  // Estados para jugador seleccionado
  const [selectedPlayer, setSelectedPlayer] = useState<Jugador | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Jugador | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);

  // Estados para documentos
  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    url: '',
    filename: ''
  });

  // Estados de UI
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const hamburgerMenuRef = useRef<HTMLDivElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          jugadoresResult,
          categoriasResult,
          escuelasResult,
          statsResult
        ] = await Promise.all([
          getAllJugadores(),
          getCategorias(),
          getEscuelas(),
          getAdminStats()
        ]);

        if (jugadoresResult.error) throw jugadoresResult.error;
        if (categoriasResult.error) throw categoriasResult.error;
        if (escuelasResult.error) throw escuelasResult.error;
        if (statsResult.error) throw statsResult.error;

        setPlayers(jugadoresResult.data || []);
        setFilteredPlayers(jugadoresResult.data || []);
        setCategorias(categoriasResult.data || []);
        setEscuelas(escuelasResult.data || []);
        setStats(statsResult);

      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Filtrar jugadores
  useEffect(() => {
    let filtered = players;

    if (selectedCategory) {
      filtered = filtered.filter(player => player.categoria_id === selectedCategory);
    }

    if (selectedSchool) {
      filtered = filtered.filter(player => player.escuela_id === selectedSchool);
    }

    if (searchTerm) {
      filtered = filtered.filter(player => 
        `${player.nombre} ${player.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.documento.includes(searchTerm)
      );
    }

    setFilteredPlayers(filtered);
  }, [players, selectedCategory, selectedSchool, searchTerm]);

  // Handlers del Header
  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  const handleToggleHamburgerMenu = useCallback(() => {
    setShowHamburgerMenu(!showHamburgerMenu);
  }, [showHamburgerMenu]);

  const handleViewProfile = useCallback(async () => {
    setShowHamburgerMenu(false);
    const profile = await getUserProfile();
    if (profile?.data) {
      setUserProfile(profile.data);
      setShowProfileModal(true);
    }
  }, []);

  const handleAddAdmin = useCallback(() => {
    setShowHamburgerMenu(false);
    setShowAddAdminModal(true);
  }, []);

  const handleAddCoach = useCallback(() => {
    setShowHamburgerMenu(false);
    setShowAddCoachModal(true);
  }, []);

  const handleAddSchool = useCallback(() => {
    setShowHamburgerMenu(false);
    setShowAddSchoolModal(true);
  }, []);

  // Handlers del Sidebar
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
  }, []);

  const handleSchoolSelect = useCallback((schoolId: string) => {
    setSelectedSchool(schoolId);
    setShowSchoolDropdown(false);
  }, []);

  const handleClearCategory = useCallback(() => {
    setSelectedCategory('');
  }, []);

  const handleClearSchool = useCallback(() => {
    setSelectedSchool('');
  }, []);

  const handleToggleCategoryDropdown = useCallback(() => {
    setShowCategoryDropdown(!showCategoryDropdown);
    setShowSchoolDropdown(false);
  }, [showCategoryDropdown]);

  const handleToggleSchoolDropdown = useCallback(() => {
    setShowSchoolDropdown(!showSchoolDropdown);
    setShowCategoryDropdown(false);
  }, [showSchoolDropdown]);

  const handlePlayerClick = useCallback((player: Jugador) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  }, []);

  // NUEVOS HANDLERS PARA LAS FUNCIONALIDADES AGREGADAS
  /*const handleShowPeaceAndSafe = useCallback((player: Jugador) => {
    setSelectedPlayer(player);
    setShowPeaceAndSafeModal(true);
  }, []);]*/

  /*const handleEditPlayer = useCallback((player: Jugador) => {
    setSelectedPlayer(player);
    setShowEditPlayerModal(true);
  }, []);*/

  const handleDeletePlayer = useCallback((player: Jugador) => {
    setPlayerToDelete(player);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeletePlayer = useCallback(async () => {
    if (!playerToDelete) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('jugadores')
        .delete()
        .eq('id', playerToDelete.id);

      if (error) throw error;

      // Actualizar la lista de jugadores
      setPlayers(players.filter(p => p.id !== playerToDelete.id));
      setShowDeleteConfirm(false);
      setPlayerToDelete(null);
      
      // Recargar estadísticas
      const statsResult = await getAdminStats();
      if (!statsResult.error) {
        setStats(statsResult);
      }
      
      alert('Jugador eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting player:', error);
      setError('Error al eliminar el jugador');
    } finally {
      setIsProcessing(false);
    }
  }, [playerToDelete, players]);

  const handleUpdatePlayerSchool = useCallback(async (playerId: string, escuelaId: string) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('jugadores')
        .update({ escuela_id: escuelaId })
        .eq('id', playerId);

      if (error) throw error;

      // Actualizar la lista de jugadores
      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, escuela_id: escuelaId }
          : player
      ));

      alert('Escuela actualizada correctamente');
    } catch (error: any) {
      console.error('Error updating player school:', error);
      throw new Error('Error al actualizar la escuela del jugador');
    } finally {
      setIsProcessing(false);
    }
  }, [players]);

  // Handlers para documentos
  const handleDocumentOpen = useCallback((url: string, filename: string) => {
    setDocumentViewer({
      isOpen: true,
      url,
      filename
    });
  }, []);

  const handleCloseDocument = useCallback(() => {
    setDocumentViewer({
      isOpen: false,
      url: '',
      filename: ''
    });
  }, []);

  // Handlers para funciones del jugador
  const handlePrint = useCallback(async () => {
    if (!selectedPlayer || isProcessing) return;

    try {
      setIsProcessing(true);
      // Implementar lógica de impresión (similar a la del coach)
      console.log('Imprimir información del jugador:', selectedPlayer);
      
      // Simulación de impresión
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Función de impresión activada - En un entorno real se abriría el diálogo de impresión');
      
    } catch (err: any) {
      setError(`Error al imprimir: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlayer, isProcessing]);

  const handleDownloadID = useCallback(async () => {
    if (!selectedPlayer || isProcessing) return;

    try {
      setIsProcessing(true);
      // Implementar lógica de descarga de ID
      console.log('Descargar ID del jugador:', selectedPlayer);
      
      // Simulación de descarga
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Identificación generada - En un entorno real se descargaría el PDF');
      
    } catch (err: any) {
      setError(`Error al generar identificación: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlayer, isProcessing]);

  const handleDownloadRegister = useCallback(async () => {
    if (!selectedPlayer || isProcessing) return;

    try {
      setIsProcessing(true);
      // Implementar lógica de descarga de registros
      console.log('Descargar registros del jugador:', selectedPlayer);
      
      // Simulación de descarga
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Documentos preparados para descarga - En un entorno real se descargarían los archivos');
      
    } catch (err: any) {
      setError(`Error al descargar documentos: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlayer, isProcessing]);

  const handleCloseDocumentActions = useCallback(() => {
    setShowDocumentActionsModal(false);
  }, []);

  const handlePrintDocument = useCallback((documentUrl: string) => {
    try {
      // Abrir el documento en una nueva ventana para imprimir
      const printWindow = window.open(documentUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err: any) {
      setError(`Error al imprimir documento: ${err.message}`);
    }
  }, []);

  const handleDownloadDocument = useCallback((documentUrl: string, documentName: string) => {
    try {
      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Mostrar confirmación
      setTimeout(() => {
        alert(`✅ Documento "${documentName}" descargado correctamente`);
      }, 500);
    } catch (err: any) {
      setError(`Error al descargar documento: ${err.message}`);
    }
  }, []);

  // Handlers para crear nuevos registros
  const handleCreateAdmin = useCallback(async (adminData: any) => {
    try {
      setIsProcessing(true);
      const result = await createAdmin(adminData);
      
      if (result.error) {
        throw result.error;
      }
      
      setShowAddAdminModal(false);
      setError(null);
      // Recargar estadísticas
      const statsResult = await getAdminStats();
      if (!statsResult.error) {
        setStats(statsResult);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error creando administrador');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCreateCoach = useCallback(async (coachData: any) => {
    try {
      setIsProcessing(true);
      const result = await createCoach(coachData);
      
      if (result.error) {
        throw result.error;
      }
      
      setShowAddCoachModal(false);
      setError(null);
      // Recargar estadísticas
      const statsResult = await getAdminStats();
      if (!statsResult.error) {
        setStats(statsResult);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error creando entrenador');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCreateSchool = useCallback(async (schoolData: any) => {
    try {
      setIsProcessing(true);
      const result = await createSchool(schoolData);
      
      if (result.error) {
        throw result.error;
      }
      
      setShowAddSchoolModal(false);
      setError(null);
      // Recargar escuelas y estadísticas
      const [escuelasResult, statsResult] = await Promise.all([
        getEscuelas(),
        getAdminStats()
      ]);
      
      if (!escuelasResult.error) {
        setEscuelas(escuelasResult.data || []);
      }
      if (!statsResult.error) {
        setStats(statsResult);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error creando escuela');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handler para sincronizar logos
  const handleSyncLogos = useCallback(() => {
    setShowSyncLogosModal(true);
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando dashboard del administrador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark-theme' : ''}`}>
      <AdminHeader
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        showHamburgerMenu={showHamburgerMenu}
        onToggleDarkMode={handleToggleDarkMode}
        onToggleHamburgerMenu={handleToggleHamburgerMenu}
        onViewProfile={handleViewProfile}
        onAddAdmin={handleAddAdmin}
        onAddCoach={handleAddCoach}
        onAddSchool={handleAddSchool}
        onLogout={onLogout}
        hamburgerMenuRef={hamburgerMenuRef}
      />

      {error && (
        <div className="alert alert-danger m-3" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {isProcessing && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="bg-white rounded p-4 text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Procesando...</span>
            </div>
            <p className="mb-0">Procesando...</p>
          </div>
        </div>
      )}

      <div className="dashboard-body">
        <div className="container-fluid h-100">
          <div className="row h-100">
            {/* Sidebar */}
            <div className="col-lg-4 col-xl-3">
              <AdminSidebar
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                selectedSchool={selectedSchool}
                showCategoryDropdown={showCategoryDropdown}
                showSchoolDropdown={showSchoolDropdown}
                players={players}
                filteredPlayers={filteredPlayers}
                categorias={categorias}
                escuelas={escuelas}
                currentUser={currentUser}
                loading={loading}
                onSearchChange={handleSearchChange}
                onCategorySelect={handleCategorySelect}
                onSchoolSelect={handleSchoolSelect}
                onClearCategory={handleClearCategory}
                onClearSchool={handleClearSchool}
                onToggleCategoryDropdown={handleToggleCategoryDropdown}
                onToggleSchoolDropdown={handleToggleSchoolDropdown}
                onPlayerClick={handlePlayerClick}
              />
            </div>

            {/* Contenido principal */}
            <div className="col-lg-8 col-xl-9">
              <div className="main-content">
                <div className="admin-stats-section">
                  <h4 className="section-title">📊 ESTADÍSTICAS GENERALES DEL SISTEMA</h4>
                  
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="stat-card bg-primary text-white">
                        <div className="stat-icon">👥</div>
                        <div className="stat-number">{stats.totalJugadores}</div>
                        <div className="stat-label">Jugadores Activos</div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="stat-card bg-success text-white">
                        <div className="stat-icon">🏫</div>
                        <div className="stat-number">{stats.totalEscuelas}</div>
                        <div className="stat-label">Escuelas Registradas</div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="stat-card bg-warning text-white">
                        <div className="stat-icon">👨‍💼</div>
                        <div className="stat-number">{stats.totalAdmins}</div>
                        <div className="stat-label">Administradores</div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="stat-card bg-info text-white">
                        <div className="stat-icon">👨‍🏫</div>
                        <div className="stat-number">{stats.totalCoaches}</div>
                        <div className="stat-label">Entrenadores</div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="stat-card bg-secondary text-white">
                        <div className="stat-icon">⚽</div>
                        <div className="stat-number">{stats.totalCategorias}</div>
                        <div className="stat-label">Categorías</div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="stat-card bg-dark text-white">
                        <div className="stat-icon">📈</div>
                        <div className="stat-number">{filteredPlayers.length}</div>
                        <div className="stat-label">
                          {selectedCategory || selectedSchool || searchTerm ? 
                            'Jugadores Filtrados' : 'Total en Vista'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* BOTÓN PARA SINCRONIZAR LOGOS - MODIFICADO */}
                    <div className="col-md-4">
                      <div className="stat-card" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onClick={handleSyncLogos}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div className="stat-icon">🖼️</div>
                        <div className="stat-number" style={{ fontSize: '2rem' }}>
                          <i className="fas fa-sync-alt"></i>
                        </div>
                        <div className="stat-label" style={{ fontWeight: 'bold' }}>
                          Sincronizar Logos
                        </div>
                        <div className="stat-subtext" style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                          Asignar logos a escuelas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información adicional para admin */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ProfileModal
        show={showProfileModal}
        userProfile={userProfile}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Modal de jugador para admin */}
      {showPlayerModal && selectedPlayer && (
        <AdminPlayerModal
          player={selectedPlayer}
          categorias={categorias}
          escuelas={escuelas}
          onClose={() => setShowPlayerModal(false)}
          onPrint={handlePrint}
          onDownloadID={handleDownloadID}
          onDownloadRegister={handleDownloadRegister}
          onDocumentOpen={handleDocumentOpen}
          onDeletePlayer={handleDeletePlayer}
          onUpdatePlayerSchool={handleUpdatePlayerSchool}
        />
      )}

      {/* NUEVOS MODALES AGREGADOS */}
      <PeaceAndSafeModal
        show={showPeaceAndSafeModal}
        onHide={() => setShowPeaceAndSafeModal(false)}
        player={selectedPlayer}
      />

      <EditPlayerModal
        show={showEditPlayerModal}
        onHide={() => setShowEditPlayerModal(false)}
        player={selectedPlayer}
        escuelas={escuelas}
        onSave={handleUpdatePlayerSchool}
      />

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar Eliminación</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                ¿Estás seguro de que deseas eliminar al jugador <strong>{playerToDelete?.nombre} {playerToDelete?.apellido}</strong>?
                <br />
                <small className="text-muted">Esta acción no se puede deshacer.</small>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmDeletePlayer}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer */}
      {documentViewer.isOpen && (
        <DocumentViewer
          url={documentViewer.url}
          filename={documentViewer.filename}
          onClose={handleCloseDocument}
        />
      )}

      {/* Modal de acciones de documentos */}
      {showDocumentActionsModal && selectedPlayer && (
        <DocumentActionsModal
          player={selectedPlayer}
          onClose={handleCloseDocumentActions}
          onPrint={handlePrintDocument}
          onDownload={handleDownloadDocument}
        />
      )}

      {/* Modales de creación */}
      <AddAdminModal
        show={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
        onSubmit={handleCreateAdmin}
      />

      <AddCoachModal
        show={showAddCoachModal}
        escuelas={escuelas}
        onClose={() => setShowAddCoachModal(false)}
        onSubmit={handleCreateCoach}
      />

      <AddSchoolModal
        show={showAddSchoolModal}
        onClose={() => setShowAddSchoolModal(false)}
        onSubmit={handleCreateSchool}
      />

      {/* Modal de Sincronización de Logos - AGREGAR ESTO */}
      <SyncLogosButton
        show={showSyncLogosModal}
        onClose={() => setShowSyncLogosModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;