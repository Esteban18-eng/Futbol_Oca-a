// src/components/Dashboard/coach/Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../Dashboard.css';
import { 
  Usuario, 
  Jugador, 
  Categoria, 
  Escuela,
  Pais,
  Departamento,
  Ciudad,
  getAllJugadores,
  getJugadoresByEscuela,
  getCategorias,
  getEscuelas,
  getPaises,
  getDepartamentosByPais,
  getCiudadesByDepartamento,
  getUserProfile,
  updateJugador,
  deleteJugador,
  createJugador
} from '../../../services/supabaseClient';
import CoachHeader from './components/CoachHeader';
import CoachSidebar from './components/CoachSidebar';
import PlayerModal from './components/PlayerModal';
import AddPlayerModal from './components/AddPlayerModal';
import ProfileModal from './components/ProfileModal';
import ExcelImportModal from '../../ExcelImportModal';
import DocumentViewer from '../../shared/components/DocumentViewer';
import { useFileUpload } from './hooks/useFileUpload';
import { PeaceAndSafeData } from './types/peaceAndSafeTypes';

interface DashboardProps {
  onLogout: () => void;
  currentUser: Usuario;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, currentUser }) => {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [players, setPlayers] = useState<Jugador[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Jugador[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  
  // Estados para ubicaciones
  const [paises, setPaises] = useState<Pais[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [selectedPaisId, setSelectedPaisId] = useState<string>('');
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string>('');

  // Estado para controlar operaciones bloqueantes
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  // Estados para ubicaciones del modal de edición
  const [editPaises, setEditPaises] = useState<Pais[]>([]);
  const [editDepartamentos, setEditDepartamentos] = useState<Departamento[]>([]);
  const [editCiudades, setEditCiudades] = useState<Ciudad[]>([]);
  const [editSelectedPaisId, setEditSelectedPaisId] = useState<string>('');
  const [editSelectedDepartamentoId, setEditSelectedDepartamentoId] = useState<string>('');
  
  // Estados para el menú hamburguesa
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const hamburgerMenuRef = useRef<HTMLDivElement>(null);
  
  // Estados para el modal de perfil del usuario
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  
  // Estados para modales de jugador
  const [selectedPlayer, setSelectedPlayer] = useState<Jugador | null>(null);
  const [originalPlayer, setOriginalPlayer] = useState<Jugador | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para búsqueda automática
  const [documentOpened, setDocumentOpened] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    player?: Jugador;
    message: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Hook para manejo de archivos
  const { 
    files, 
    fileErrors, 
    handleFileSelect, 
    uploadFiles, 
    resetFiles, 
    documentViewer, 
    openDocument, 
    closeDocument,
    uploadProgress,
    uploadFilesForEdit
  } = useFileUpload();

  // Estado inicial del nuevo jugador
  const initialPlayerState = useMemo(() => ({
    documento: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    pais: '',
    departamento: '',
    ciudad: '',
    categoria_id: '',
    escuela_id: currentUser.rol === 'entrenador' ? currentUser.escuela_id || '' : '',
    eps: '',
    tipo_eps: 'Subsidiado' as const
  }), [currentUser.rol, currentUser.escuela_id]);

  const [newPlayer, setNewPlayer] = useState<Partial<Jugador>>(initialPlayerState);

  // FUNCIÓN PARA RECARGAR PLAYERS
  const reloadPlayers = useCallback(async () => {
    try {
      let playersResult;

      if (currentUser.rol === 'admin') {
        playersResult = await getAllJugadores();
      } else if (currentUser.escuela_id) {
        playersResult = await getJugadoresByEscuela(currentUser.escuela_id);
      } else {
        throw new Error('No se pudo determinar la escuela del usuario');
      }

      if (playersResult.error) {
        throw playersResult.error;
      }

      const playersData = playersResult.data || [];
      setPlayers(playersData);
      setFilteredPlayers(playersData);
      
    } catch (err: any) {
      console.error('Error reloading players:', err);
      setError(err.message || 'Error recargando jugadores');
    }
  }, [currentUser.rol, currentUser.escuela_id]);

  // EFECTO PRINCIPAL - SE EJECUTA UNA SOLA VEZ AL MONTAR
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar categorías y escuelas en paralelo
        const [categoriasResult, escuelasResult, paisesResult] = await Promise.all([
          getCategorias(),
          getEscuelas(),
          getPaises()
        ]);

        if (categoriasResult.error) throw categoriasResult.error;
        if (escuelasResult.error) throw escuelasResult.error;
        if (paisesResult.error) throw paisesResult.error;

        setCategorias(categoriasResult.data || []);
        setEscuelas(escuelasResult.data || []);
        
        const paisesData = paisesResult.data || [];
        setPaises(paisesData);

        // Configurar Colombia por defecto
        const colombia = paisesData.find(p => p.nombre === 'Colombia');
        if (colombia) {
          setSelectedPaisId(colombia.id);
          setNewPlayer(prev => ({ ...prev, pais: colombia.nombre }));
          
          // Cargar departamentos de Colombia
          const departamentosResult = await getDepartamentosByPais(colombia.id);
          if (!departamentosResult.error) {
            setDepartamentos(departamentosResult.data || []);
          }
        }

        // Cargar jugadores
        await reloadPlayers();

      } catch (err: any) {
        console.error('Error loading initial data:', err);
        setError(err.message || 'Error cargando datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [currentUser.rol, currentUser.escuela_id, reloadPlayers]);

  // BÚSQUEDA AUTOMÁTICA POR DOCUMENTO
  useEffect(() => {
    const handler = setTimeout(() => {
      if (selectedDocument.trim().length > 0) {
        handleAutoSearch();
      } else {
        setSearchResult(null);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedDocument]);

  const handleAutoSearch = useCallback(() => {
    if (!selectedDocument.trim()) {
      setSearchResult(null);
      return;
    }

    setIsSearching(true);
    
    // Buscar el jugador por documento
    const player = players.find(p => p.documento === selectedDocument.trim());
    
    if (player) {
      setSearchResult({
        found: true,
        player: player,
        message: 'Jugador encontrado'
      });
    } else {
      setSearchResult({
        found: false,
        message: 'El documento no está registrado en el sistema'
      });
    }
    
    setIsSearching(false);
  }, [selectedDocument, players]);

  // Filtrar jugadores
  useEffect(() => {
    const filtered = players.filter(player => {
      const matchesSearch = searchTerm === '' || 
        `${player.nombre} ${player.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.documento.includes(searchTerm);
      
      const matchesCategory = !selectedCategory || player.categoria_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    setFilteredPlayers(filtered);
  }, [searchTerm, players, selectedCategory]);

  // Handlers para el Header
  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  const handleToggleHamburgerMenu = useCallback(() => {
    setShowHamburgerMenu(!showHamburgerMenu);
  }, [showHamburgerMenu]);

  const handleViewProfile = useCallback(async () => {
    setShowHamburgerMenu(false);
    await loadUserProfile();
    setShowProfileModal(true);
  }, []);

  const handleAddPlayer = useCallback(() => {
    setShowHamburgerMenu(false);
    setShowAddModal(true);
  }, []);

  // Handlers para el Sidebar
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
  }, []);

  const handleClearCategory = useCallback(() => {
    setSelectedCategory('');
    setShowCategoryDropdown(false);
  }, []);

  const handleToggleCategoryDropdown = useCallback(() => {
    setShowCategoryDropdown(!showCategoryDropdown);
  }, [showCategoryDropdown]);

  const handleOpenExcelImport = useCallback(() => {
    setShowHamburgerMenu(false);
    setShowExcelImport(true);
  }, []);

  // Función para manejar éxito en importación Excel
  const handleImportSuccess = useCallback(() => {
    reloadPlayers();
    setShowExcelImport(false);
  }, [reloadPlayers]);

  // Función para cargar el perfil del usuario
  const loadUserProfile = useCallback(async () => {
    try {
      const result = await getUserProfile();
      if (result?.data) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
      setError('Error al cargar el perfil');
    }
  }, []);

  // Función para manejar cambios en inputs
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'pais') {
      const selectedPais = paises.find(p => p.nombre === value);
      if (selectedPais) {
        setSelectedPaisId(selectedPais.id);
        setSelectedDepartamentoId('');
        setCiudades([]);
        loadDepartamentosByPais(selectedPais.id);
        setNewPlayer(prev => ({
          ...prev,
          [name]: value,
          departamento: '',
          ciudad: ''
        }));
      }
    } else if (name === 'departamento') {
      const selectedDepartamento = departamentos.find(d => d.nombre === value);
      if (selectedDepartamento) {
        setSelectedDepartamentoId(selectedDepartamento.id);
        loadCiudadesByDepartamento(selectedDepartamento.id);
        setNewPlayer(prev => ({
          ...prev,
          [name]: value,
          ciudad: ''
        }));
      }
    } else {
      setNewPlayer(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, [paises, departamentos]);

  // Funciones de carga de ubicaciones
  const loadDepartamentosByPais = useCallback(async (paisId: string) => {
    try {
      const result = await getDepartamentosByPais(paisId);
      if (result.error) throw result.error;
      
      const departamentosData = result.data || [];
      setDepartamentos(departamentosData);
      setCiudades([]);
      setSelectedDepartamentoId('');
      setNewPlayer(prev => ({ ...prev, departamento: '', ciudad: '' }));
      
    } catch (err: any) {
      console.error('Error loading departamentos:', err);
      setError('Error cargando departamentos');
    }
  }, []);

  const loadCiudadesByDepartamento = useCallback(async (departamentoId: string) => {
    try {
      const result = await getCiudadesByDepartamento(departamentoId);
      if (result.error) throw result.error;
      
      const ciudadesData = result.data || [];
      setCiudades(ciudadesData);
      setNewPlayer(prev => ({ ...prev, ciudad: '' }));
      
    } catch (err: any) {
      console.error('Error loading ciudades:', err);
      setError('Error cargando ciudades');
    }
  }, []);

  // Funciones de carga de ubicaciones para edición
  const loadEditDepartamentosByPais = useCallback(async (paisId: string) => {
    try {
      const result = await getDepartamentosByPais(paisId);
      if (result.error) throw result.error;
      
      const departamentosData = result.data || [];
      setEditDepartamentos(departamentosData);
      setEditCiudades([]);
      setEditSelectedDepartamentoId('');
      
    } catch (err: any) {
      console.error('Error loading edit departamentos:', err);
    }
  }, []);

  const loadEditCiudadesByDepartamento = useCallback(async (departamentoId: string) => {
    try {
      const result = await getCiudadesByDepartamento(departamentoId);
      if (result.error) throw result.error;
      
      const ciudadesData = result.data || [];
      setEditCiudades(ciudadesData);
      
    } catch (err: any) {
      console.error('Error loading edit ciudades:', err);
    }
  }, []);

  // Función para resetear formulario
  const resetPlayerForm = useCallback(() => {
    setNewPlayer(initialPlayerState);
    setSelectedPaisId('');
    setSelectedDepartamentoId('');
    setDepartamentos([]);
    setCiudades([]);
    resetFiles();
    setError(null);
  }, [initialPlayerState, resetFiles]);

  // FUNCIÓN PARA AGREGAR JUGADOR CON ARCHIVOS
  const handleAddPlayerSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsProcessing(true);
      setProcessingMessage('Creando jugador...');
      setError(null);
      
      // Validar campos requeridos
      if (!newPlayer.documento || !newPlayer.nombre || !newPlayer.apellido || 
          !newPlayer.fecha_nacimiento || !newPlayer.pais || !newPlayer.departamento || 
          !newPlayer.ciudad || !newPlayer.categoria_id || !newPlayer.escuela_id || !newPlayer.eps) {
        setError('Todos los campos son obligatorios');
        return;
      }

      // Validar que al menos la foto esté seleccionada
      if (!files.foto_perfil) {
        setError('La foto de perfil es obligatoria');
        return;
      }

      // Subir archivos
      const uploadResults = await uploadFiles(newPlayer.documento, ['foto_perfil']);
      
      if (!uploadResults) {
        return;
      }

      const playerData = {
        documento: newPlayer.documento,
        nombre: newPlayer.nombre,
        apellido: newPlayer.apellido,
        fecha_nacimiento: newPlayer.fecha_nacimiento,
        pais: newPlayer.pais,
        departamento: newPlayer.departamento,
        ciudad: newPlayer.ciudad,
        categoria_id: newPlayer.categoria_id,
        escuela_id: newPlayer.escuela_id,
        eps: newPlayer.eps,
        tipo_eps: newPlayer.tipo_eps || 'Subsidiado',
        foto_perfil_url: uploadResults.foto_perfil || '',
        documento_pdf_url: uploadResults.documento_pdf || '',
        registro_civil_url: uploadResults.registro_civil || ''
      };

      const result = await createJugador(playerData);
      
      if (result.error) {
        const error = result.error as any;
        if (error.code === '23505') {
          setError('Ya existe un jugador con este documento');
        } else {
          setError(`Error: ${error.message || 'Error agregando jugador'}`);
        }
        return;
      }

      await reloadPlayers();
      setShowAddModal(false);
      resetPlayerForm();
      
    } catch (err: any) {
      console.error('Error adding player with files:', err);
      setError(err.message || 'Error agregando jugador');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  }, [newPlayer, files, uploadFiles, reloadPlayers, resetPlayerForm]);

  // Función para manejar cambios en edición
  const handleEditInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (!selectedPlayer) return;

    setSelectedPlayer(prev => prev ? { ...prev, [name]: value } : null);

    if (name === 'pais') {
      const selectedPais = editPaises.find(p => p.nombre === value);
      if (selectedPais) {
        setEditSelectedPaisId(selectedPais.id);
        setEditSelectedDepartamentoId('');
        setEditCiudades([]);
        await loadEditDepartamentosByPais(selectedPais.id);
        setSelectedPlayer(prev => prev ? {
          ...prev,
          pais: value,
          departamento: '',
          ciudad: ''
        } : null);
      }
    } else if (name === 'departamento') {
      const selectedDepartamento = editDepartamentos.find(d => d.nombre === value);
      if (selectedDepartamento) {
        setEditSelectedDepartamentoId(selectedDepartamento.id);
        await loadEditCiudadesByDepartamento(selectedDepartamento.id);
        setSelectedPlayer(prev => prev ? {
          ...prev,
          departamento: value,
          ciudad: ''
        } : null);
      }
    }
  }, [selectedPlayer, editPaises, editDepartamentos, loadEditDepartamentosByPais, loadEditCiudadesByDepartamento]);

  // Función para abrir modal del jugador
  const handlePlayerClickDetailed = useCallback(async (player: Jugador) => {
    setSelectedPlayer({...player});
    setOriginalPlayer({...player});
    setShowPlayerModal(true);
    setIsEditing(false);
    
    // Resetear archivos de edición
    resetFiles();
    
    // Cargar países para edición
    const paisesResult = await getPaises();
    if (!paisesResult.error) {
      setEditPaises(paisesResult.data || []);
      
      // Si el jugador tiene país, configurar ubicaciones
      if (player.pais) {
        const paisData = paisesResult.data?.find(p => p.nombre === player.pais);
        if (paisData) {
          setEditSelectedPaisId(paisData.id);
          await loadEditDepartamentosByPais(paisData.id);
          
          if (player.departamento) {
            const deptosResult = await getDepartamentosByPais(paisData.id);
            if (!deptosResult.error) {
              const deptoData = deptosResult.data?.find(d => d.nombre === player.departamento);
              if (deptoData) {
                setEditSelectedDepartamentoId(deptoData.id);
                await loadEditCiudadesByDepartamento(deptoData.id);
              }
            }
          }
        }
      }
    }
  }, [loadEditDepartamentosByPais, loadEditCiudadesByDepartamento, resetFiles]);

  // FUNCIÓN PARA ACTUALIZAR JUGADOR CON ARCHIVOS
  const handleUpdatePlayerWithFiles = useCallback(async () => {
    if (!selectedPlayer || !originalPlayer) return;

    try {
      setIsSaving(true);
      setProcessingMessage('Actualizando jugador...');
      setError(null);

      // Preparar archivos para subir (si hay)
      const filesToUpload = {
        foto_perfil: files.foto_perfil,
        documento_pdf: files.documento_pdf,
        registro_civil: files.registro_civil
      };

      let uploadedFileUrls: {[key: string]: string} = {};
      
      // Subir archivos si hay cambios
      const hasFileChanges = Object.values(filesToUpload).some(file => file !== null);
      if (hasFileChanges && selectedPlayer) {
        setProcessingMessage('Subiendo archivos...');
        
        const uploadResult = await uploadFilesForEdit(
          selectedPlayer.id,
          selectedPlayer.documento, 
          filesToUpload
        );
        
        if (!uploadResult) {
          setError('Error subiendo archivos');
          setIsSaving(false);
          setProcessingMessage('');
          return;
        }
        
        // Convertir las URLs
        uploadedFileUrls = {
          foto_perfil_url: uploadResult.foto_perfil || selectedPlayer.foto_perfil_url || '',
          documento_pdf_url: uploadResult.documento_pdf || selectedPlayer.documento_pdf_url || '',
          registro_civil_url: uploadResult.registro_civil || selectedPlayer.registro_civil_url || ''
        };
      }

      // Actualizar datos básicos del jugador
      setProcessingMessage('Actualizando datos del jugador...');
      
      const updates = {
        nombre: selectedPlayer.nombre,
        apellido: selectedPlayer.apellido,
        fecha_nacimiento: selectedPlayer.fecha_nacimiento,
        pais: selectedPlayer.pais,
        departamento: selectedPlayer.departamento,
        ciudad: selectedPlayer.ciudad,
        eps: selectedPlayer.eps,
        tipo_eps: selectedPlayer.tipo_eps,
        // Incluir URLs de archivos si se subieron
        ...uploadedFileUrls
      };

      const result = await updateJugador(selectedPlayer.id, updates);
      
      if (result.error) throw result.error;
      
      // Recargar jugadores
      await reloadPlayers();
      
      // Actualizar el jugador seleccionado con los nuevos datos
      if (result.data) {
        setSelectedPlayer(result.data);
        setOriginalPlayer(result.data);
      }
      
      // Resetear estados
      setIsEditing(false);
      resetFiles();
      
      setProcessingMessage('Jugador actualizado exitosamente');
      
    } catch (err: any) {
      console.error('Error updating player with files:', err);
      setError(err.message || 'Error actualizando jugador');
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setProcessingMessage('');
      }, 1000);
    }
  }, [selectedPlayer, originalPlayer, files, uploadFilesForEdit, reloadPlayers, resetFiles]);

  // Función para cancelar edición
  const handleCancelEdit = useCallback(() => {
    if (originalPlayer) {
      setSelectedPlayer({...originalPlayer});
    }
    setIsEditing(false);
    resetFiles();
    setError(null);
  }, [originalPlayer, resetFiles]);

  // Función para eliminar jugador
  const handleDeletePlayer = useCallback(async (playerId: string) => {
    if (!selectedPlayer) {
      setError('No se ha seleccionado ningún jugador');
      return;
    }
    
    const playerName = `${selectedPlayer.nombre} ${selectedPlayer.apellido}`;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${playerName}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      setIsSaving(true);
      const result = await deleteJugador(playerId, true);
      
      if (result.error) {
        const error = result.error as any;
        if (error.code === '23503') {
          setError('No se puede eliminar el jugador porque tiene registros relacionados');
        } else {
          setError(`Error eliminando jugador: ${error.message || 'Error desconocido'}`);
        }
        return;
      }
      
      await reloadPlayers();
      setShowPlayerModal(false);
      setSelectedPlayer(null);
      setOriginalPlayer(null);
      
    } catch (err: any) {
      console.error('Error deleting player:', err);
      setError(err.message || 'Error eliminando jugador');
    } finally {
      setIsSaving(false);
    }
  }, [selectedPlayer, reloadPlayers]);

  const handleDocumentOpen = useCallback((url: string, filename: string) => {
    setDocumentOpened(true);
    openDocument(url, filename);
  }, [openDocument, setDocumentOpened]);

  // FUNCIÓN DE IMPRESIÓN MEJORADA
  const handlePrint = useCallback(async () => {
    if (!selectedPlayer || isProcessing) return;

    try {
      setIsProcessing(true);
      setProcessingMessage('Preparando impresión...');
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Información del Jugador - ${selectedPlayer.nombre} ${selectedPlayer.apellido}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #2c3e50; 
                padding-bottom: 20px; 
              }
              .header h1 { 
                color: #2c3e50; 
                margin: 0 0 10px 0; 
                font-size: 24px; 
              }
              .header h2 { 
                color: #34495e; 
                margin: 0; 
                font-size: 18px; 
              }
              .player-section { 
                display: flex; 
                gap: 30px; 
                margin-bottom: 30px; 
                align-items: flex-start;
              }
              .photo-section { 
                flex: 0 0 200px; 
              }
              .player-photo { 
                width: 200px; 
                height: 200px; 
                object-fit: cover; 
                border-radius: 10px; 
                border: 2px solid #ddd;
                display: block;
              }
              .photo-placeholder { 
                width: 200px; 
                height: 200px; 
                background: #f0f0f0; 
                border-radius: 10px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 60px; 
                color: #999; 
                border: 2px solid #ddd;
              }
              .info-section { 
                flex: 1; 
              }
              .player-name { 
                color: #2c3e50; 
                margin-bottom: 20px; 
                font-size: 22px; 
                font-weight: bold; 
              }
              .info-row { 
                margin-bottom: 8px; 
                display: flex;
              }
              .info-label { 
                font-weight: bold; 
                width: 140px; 
                flex-shrink: 0;
              }
              .info-value {
                flex: 1;
              }
              .section { 
                border-top: 2px solid #eee; 
                padding-top: 20px; 
                margin-top: 20px; 
  }              .section-title { 
                color: #2c3e50; 
                margin-bottom: 15px; 
                font-size: 18px; 
                font-weight: bold; 
              }
              .grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr 1fr; 
                gap: 20px; 
                margin-bottom: 20px; 
              }
              .grid-item { 
                padding: 10px; 
                background: #f8f9fa; 
                border-radius: 5px; 
                border: 1px solid #dee2e6; 
              }
              .grid-label { 
                font-weight: bold; 
                margin-bottom: 5px; 
                color: #495057; 
              }
              .footer { 
                margin-top: 40px; 
                text-align: center; 
                color: #7f8c8d; 
                font-size: 12px; 
                border-top: 1px solid #eee; 
                padding-top: 20px; 
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 15px;
                }
                @page { 
                  margin: 1cm; 
                  size: A4; 
                }
                .print-container { 
                  max-width: none; 
                  margin: 0;
                }
                .player-section { 
                  page-break-inside: avoid; 
                }
                .section { 
                  page-break-inside: avoid; 
                }
                .player-photo {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
            <script>
              function handleImageError(img) {
                console.log('Error cargando imagen, mostrando placeholder');
                img.style.display = 'none';
                var placeholder = img.nextElementSibling;
                if (placeholder && placeholder.classList.contains('photo-placeholder')) {
                  placeholder.style.display = 'flex';
                }
              }
              
              window.onload = function() {
                var img = document.getElementById('player-photo');
                if (img && img.complete && img.naturalHeight === 0) {
                  handleImageError(img);
                }
              };
            </script>
          </head>
          <body>
            <div class="print-container">
              <div class="header">
                <h1>Corporación de Futbol Ocañero</h1>
                <h2>Información del Jugador</h2>
              </div>
              
              <div class="player-section">
                <div class="photo-section">
                  ${selectedPlayer.foto_perfil_url ? 
                    `<img 
                      id="player-photo"
                      src="${selectedPlayer.foto_perfil_url}?t=${Date.now()}" 
                      alt="Foto de ${selectedPlayer.nombre} ${selectedPlayer.apellido}" 
                      class="player-photo" 
                      onerror="handleImageError(this)"
                      crossorigin="anonymous"
                    >
                     <div class="photo-placeholder" style="display:none;">👤</div>` :
                    `<div class="photo-placeholder">👤</div>`
                  }
                </div>
                <div class="info-section">
                  <div class="player-name">${selectedPlayer.nombre} ${selectedPlayer.apellido}</div>
                  <div class="info-row">
                    <span class="info-label">Documento:</span>
                    <span class="info-value">${selectedPlayer.documento}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Edad:</span>
                    <span class="info-value">${calculateAge(selectedPlayer.fecha_nacimiento)} años</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Fecha de Nacimiento:</span>
                    <span class="info-value">${formatDate(selectedPlayer.fecha_nacimiento)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Categoría:</span>
                    <span class="info-value">${selectedPlayer.categoria?.nombre || 'Sin categoría'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Escuela:</span>
                    <span class="info-value">${selectedPlayer.escuela?.nombre || 'Sin escuela'}</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Información de Ubicación</div>
                <div class="grid">
                  <div class="grid-item">
                    <div class="grid-label">País</div>
                    ${selectedPlayer.pais || 'No especificado'}
                  </div>
                  <div class="grid-item">
                    <div class="grid-label">Departamento</div>
                    ${selectedPlayer.departamento || 'No especificado'}
                  </div>
                  <div class="grid-item">
                    <div class="grid-label">Ciudad</div>
                    ${selectedPlayer.ciudad || 'No especificado'}
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Información Médica</div>
                <div class="grid" style="grid-template-columns: 1fr 1fr;">
                  <div class="grid-item">
                    <div class="grid-label">EPS</div>
                    ${selectedPlayer.eps || 'No especificado'}
                  </div>
                  <div class="grid-item">
                    <div class="grid-label">Tipo de EPS</div>
                    ${selectedPlayer.tipo_eps || 'No especificado'}
                  </div>
                </div>
              </div>
              
              <div class="footer">
                <p>Documento generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      
      if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión');
      }

      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      await new Promise<void>((resolve) => {
        if (printWindow.document.readyState === 'complete') {
          resolve();
        } else {
          printWindow.addEventListener('load', () => resolve());
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      printWindow.focus();
      
      const printWithFallback = () => {
        try {
          printWindow.print();
          
          setTimeout(() => {
            try {
              if (!printWindow.closed) {
                printWindow.close();
              }
            } catch (closeError) {
              console.log('No se pudo cerrar la ventana automáticamente');
            }
          }, 1000);
          
        } catch (printError: any) {
          console.error('Error al imprimir:', printError);
          
          try {
            const printStyles = `
              <style>
                @media print {
                  body { margin: 0; padding: 15mm; }
                  .print-container { max-width: 100%; }
                }
              </style>
            `;
            
            const pdfContent = printContent.replace('</head>', printStyles + '</head>');
            const blob = new Blob([pdfContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `Jugador_${selectedPlayer.nombre}_${selectedPlayer.apellido}.html`;
            downloadLink.click();
            
            URL.revokeObjectURL(url);
            
            setError('Se descargó el documento como archivo HTML para imprimir');
            
          } catch (fallbackError) {
            setError('Error al imprimir y al intentar descargar el documento');
          }
          
          try {
            printWindow.close();
          } catch (e) {
            console.log('No se pudo cerrar la ventana de impresión');
          }
        }
      };

      setTimeout(printWithFallback, 500);
      
    } catch (error: any) {
      console.error('Error en impresión:', error);
      setError(`Error al preparar la impresión: ${error?.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  }, [selectedPlayer, isProcessing]);

  // FUNCIÓN DE DESCARGA DE REGISTRO MEJORADA
  const handleDownloadRegister = useCallback(async () => {
    if (!selectedPlayer || isProcessing) return;

    try {
      setIsProcessing(true);
      setProcessingMessage('Preparando descarga...');
      
      const documentsToDownload = [];
      
      if (selectedPlayer.registro_civil_url) {
        documentsToDownload.push({
          url: selectedPlayer.registro_civil_url,
          filename: `Registro_Civil_${selectedPlayer.nombre}_${selectedPlayer.apellido}_${selectedPlayer.documento}.pdf`,
          type: 'registro_civil'
        });
      }
      
      if (selectedPlayer.documento_pdf_url) {
        documentsToDownload.push({
          url: selectedPlayer.documento_pdf_url,
          filename: `Documento_Identidad_${selectedPlayer.nombre}_${selectedPlayer.apellido}_${selectedPlayer.documento}.pdf`,
          type: 'documento_identidad'
        });
      }

      if (documentsToDownload.length === 0) {
        setError('No hay documentos disponibles para descargar');
        setIsProcessing(false);
        setProcessingMessage('');
        return;
      }

      const downloadFile = async (fileInfo: {url: string, filename: string, type: string}) => {
        return new Promise<void>(async (resolve, reject) => {
          try {
            console.log(`Iniciando descarga de: ${fileInfo.filename}`);
            
            const response = await fetch(fileInfo.url);
            
            if (!response.ok) {
              throw new Error(`Error al obtener el archivo: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileInfo.filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(blobUrl);
              resolve();
            }, 100);
            
          } catch (error) {
            console.error(`Error descargando ${fileInfo.type}:`, error);
            
            try {
              const link = document.createElement('a');
              link.href = fileInfo.url;
              link.download = fileInfo.filename;
              link.target = '_blank';
              link.style.display = 'none';
              
              document.body.appendChild(link);
              link.click();
              
              setTimeout(() => {
                document.body.removeChild(link);
                resolve();
              }, 100);
            } catch (fallbackError) {
              reject(`No se pudo descargar el ${fileInfo.type}`);
            }
          }
        });
      };

      if (documentsToDownload.length === 1) {
        await downloadFile(documentsToDownload[0]);
        setProcessingMessage('Descarga completada');
      } else {
        setProcessingMessage(`Descargando 1 de ${documentsToDownload.length} documentos...`);
        
        for (let i = 0; i < documentsToDownload.length; i++) {
          setProcessingMessage(`Descargando ${i + 1} de ${documentsToDownload.length} documentos...`);
          await downloadFile(documentsToDownload[i]);
          
          if (i < documentsToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        setProcessingMessage('Todos los documentos descargados');
      }

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingMessage('');
      }, 1000);
      
    } catch (error: any) {
      console.error('Error en descarga:', error);
      setError(`Error al descargar documentos: ${error.message || 'Error desconocido'}`);
      setIsProcessing(false);
      setProcessingMessage('');
    }
  }, [selectedPlayer, isProcessing]);

  // Función para cerrar modal del jugador
  const closePlayerModal = useCallback(async () => {
    if (isProcessing) {
      const confirmed = window.confirm('Hay una operación en progreso. ¿Estás seguro de que deseas cerrar?');
      if (!confirmed) return;
    }
    
    setIsProcessing(false);
    setProcessingMessage('');
    
    setShowPlayerModal(false);
    setSelectedPlayer(null);
    setOriginalPlayer(null);
    setIsEditing(false);
    setEditSelectedPaisId('');
    setEditSelectedDepartamentoId('');
    setEditDepartamentos([]);
    setEditCiudades([]);
    resetFiles();
    setError(null);
  }, [isProcessing, resetFiles]);

  // Función para cerrar modal de agregar jugador
  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    resetPlayerForm();
  }, [resetPlayerForm]);

  // Funciones de utilidad
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  }, []);

  const calculateAge = useCallback((birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  // NUEVA FUNCIÓN: Manejar generación de Paz y Salvo
  const handleGeneratePeaceAndSafe = useCallback(async (data: PeaceAndSafeData) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Generando Paz y Salvo...');
      
      console.log('📄 Generando Paz y Salvo:', data);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Paz y Salvo - ${data.playerName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { margin: 20px 0; }
              .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
              .signature { text-align: center; width: 45%; }
              .signature-line { border-top: 1px solid #000; margin: 60px auto 10px; width: 200px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>ESCUELA / CLUB DE FÚTBOL ${data.schoolName}</h2>
              <h3>PAZ Y SALVO DE JUGADOR</h3>
            </div>
            <div class="content">
              <p>La presente certifica que el jugador <strong>${data.playerName}</strong>, 
              quien pertenece o perteneció a la Escuela/Club <strong>${data.schoolName}</strong>, 
              se encuentra paz y salvo por todo concepto deportivo, administrativo y disciplinario dentro de nuestra institución.</p>
              
              <p>Después de revisar los registros internos y confirmar que no existe pendiente alguna que impida su retiro o traslado, 
              la escuela otorga plena autorización para que el mencionado jugador pueda retirarse de la institución y continuar 
              su proceso formativo en cualquier otra escuela, club o entidad deportiva de su elección.</p>
              
              <p>Este paz y salvo se expide a solicitud del jugador, con el fin de ser presentado ante la Corporación de Fútbol Ocañero, 
              entidad encargada de validar y formalizar su traslado conforme a los lineamientos establecidos.</p>
              
              <p>Se firma para constancia en la ciudad de Ocaña, a los ${formatDateForDocument(data.currentDate)}.</p>
            </div>
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <p><strong>${data.coachName}</strong></p>
                <p>Entrenador / Director Técnico</p>
                <p>Escuela ${data.schoolName}</p>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <p><strong>${data.presidentName}</strong></p>
                <p>Presidente / Representante Legal</p>
                <p>Escuela ${data.schoolName}</p>
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      
      setProcessingMessage('Paz y Salvo generado exitosamente');
      
    } catch (error: any) {
      console.error('Error generando Paz y Salvo:', error);
      setError(`Error al generar Paz y Salvo: ${error.message || 'Error desconocido'}`);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingMessage('');
      }, 1000);
    }
  }, []);

  // Función auxiliar para formatear fecha del documento
  const formatDateForDocument = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('category-dropdown');
      const button = document.getElementById('category-button');
      const hamburgerMenu = hamburgerMenuRef.current;
      
      if (dropdown && button && 
          !dropdown.contains(event.target as Node) && 
          !button.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      
      if (hamburgerMenu && showHamburgerMenu && !hamburgerMenu.contains(event.target as Node)) {
        setShowHamburgerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHamburgerMenu]);

  // Estados para manejo de errores y carga
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark-theme' : ''}`}>
      <CoachHeader
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        showHamburgerMenu={showHamburgerMenu}
        onToggleDarkMode={handleToggleDarkMode}
        onToggleHamburgerMenu={handleToggleHamburgerMenu}
        onViewProfile={handleViewProfile}
        onAddPlayer={handleAddPlayer}
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
            <p className="mb-0">{processingMessage}</p>
          </div>
        </div>
      )}

      <div className="dashboard-body">
        <div className="container-fluid h-100">
          <div className="row h-100">
            <div className="col-lg-4 col-xl-3">
              <CoachSidebar
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                showCategoryDropdown={showCategoryDropdown}
                players={players}
                filteredPlayers={filteredPlayers}
                categorias={categorias}
                currentUser={currentUser}
                loading={loading}
                onSearchChange={handleSearchChange}
                onCategorySelect={handleCategorySelect}
                onClearCategory={handleClearCategory}
                onToggleCategoryDropdown={handleToggleCategoryDropdown}
                onPlayerClick={handlePlayerClickDetailed}
                onOpenExcelImport={handleOpenExcelImport}
              />
            </div>

            <div className="col-lg-8 col-xl-9">
              <div className="main-content">
                <div className="search-document-section">
                  <h4 className="section-title">BÚSQUEDA POR DOCUMENTO</h4>
                  
                  <div className="document-search-form">
                    <label htmlFor="documento" className="form-label">DOCUMENTO</label>
                    <div className="document-input-container">
                      <span className="input-icon">🆔</span>
                      <input
                        type="text"
                        className="form-control document-input"
                        id="documento"
                        value={selectedDocument}
                        onChange={(e) => {
                          setSelectedDocument(e.target.value);
                          setSearchResult(null);
                        }}
                        placeholder="Ingrese número de documento"
                      />
                    </div>
                    
                    {selectedDocument && isSearching && (
                      <div className="searching-indicator mt-2">
                        <small className="text-muted">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Buscando...
                        </small>
                      </div>
                    )}
                  </div>

                  {searchResult && (
                    <div className="search-result mt-3">
                      {searchResult.found ? (
                        <div className="alert alert-success py-2 px-3">
                          <h6 className="mb-1">✅ Jugador encontrado</h6>
                          <p className="mb-1"><strong>Nombre:</strong> {searchResult.player?.nombre} {searchResult.player?.apellido}</p>
                          <p className="mb-1"><strong>Edad:</strong> {searchResult.player && calculateAge(searchResult.player.fecha_nacimiento)} años</p>
                          <p className="mb-1"><strong>Escuela:</strong> {searchResult.player && escuelas.find(esc => esc.id === searchResult.player!.escuela_id)?.nombre || 'Sin escuela'}</p>
                          <p className="mb-2"><strong>Categoría:</strong> {searchResult.player && categorias.find(cat => cat.id === searchResult.player!.categoria_id)?.nombre || 'Sin categoría'}</p>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => searchResult.player && handlePlayerClickDetailed(searchResult.player)}
                          >
                            Ver detalles
                          </button>
                        </div>
                      ) : (
                        <div className="alert alert-warning py-2 px-3">
                          <h6 className="mb-1">❌ Documento no registrado</h6>
                          <p className="mb-2">{searchResult.message}</p>
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setShowAddModal(true)}
                          >
                            Registrar nuevo jugador
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {documentViewer.isOpen && (
        <DocumentViewer
          url={documentViewer.url}
          filename={documentViewer.filename}
          onClose={closeDocument}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        show={showProfileModal}
        userProfile={userProfile}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Add Player Modal */}
      <AddPlayerModal
        show={showAddModal}
        newPlayer={newPlayer}
        paises={paises}
        departamentos={departamentos}
        ciudades={ciudades}
        categorias={categorias}
        escuelas={escuelas}
        selectedPaisId={selectedPaisId}
        selectedDepartamentoId={selectedDepartamentoId}
        currentUser={currentUser}
        isUploading={isProcessing}
        uploadProgress={uploadProgress}
        fileErrors={fileErrors}
        onClose={closeAddModal}
        onSubmit={handleAddPlayerSubmit}
        onInputChange={handleInputChange}
        onFileSelect={handleFileSelect}
        onLoadDepartamentos={loadDepartamentosByPais}
        onLoadCiudades={loadCiudadesByDepartamento}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onImportSuccess={handleImportSuccess}
        categorias={categorias}
        escuelas={escuelas}
      />

      {/* Player Modal */}
      {showPlayerModal && selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          originalPlayer={originalPlayer}
          isEditing={isEditing}
          isSaving={isSaving}
          documentOpened={documentOpened}
          categorias={categorias}
          escuelas={escuelas}
          paises={paises}
          departamentos={departamentos}
          ciudades={ciudades}
          editPaises={editPaises}
          editDepartamentos={editDepartamentos}
          editCiudades={editCiudades}
          editSelectedPaisId={editSelectedPaisId}
          editSelectedDepartamentoId={editSelectedDepartamentoId}
          onClose={closePlayerModal}
          onEdit={() => setIsEditing(true)}
          onSave={handleUpdatePlayerWithFiles}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDeletePlayer}
          onInputChange={handleEditInputChange}
          onPrint={handlePrint}
          onDownloadRegister={handleDownloadRegister}
          onDocumentOpen={handleDocumentOpen}
          onLoadEditDepartamentos={loadEditDepartamentosByPais}
          onLoadEditCiudades={loadEditCiudadesByDepartamento}
          onGeneratePeaceAndSafe={handleGeneratePeaceAndSafe}
        />
      )}
    </div>
  );
};

export default Dashboard;