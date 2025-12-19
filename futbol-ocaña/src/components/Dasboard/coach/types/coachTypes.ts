import { Jugador, Categoria, Escuela, Pais, Departamento, Ciudad, Usuario } from '../../../../services/supabaseClient';
import { PlayerFiles } from '../../../../services/supabaseClient';
import { UploadProgress } from '../hooks/useFileUpload';
import { PeaceAndSafeData } from './peaceAndSafeTypes';

export interface PlayerModalProps {
    player: Jugador | null;
    originalPlayer: Jugador | null;
    isEditing: boolean;
    isSaving: boolean;
    documentOpened: boolean;
    categorias: Categoria[];
    escuelas: Escuela[];
    paises: Pais[];
    departamentos: Departamento[];
    ciudades: Ciudad[];
    editPaises: Pais[];
    editDepartamentos: Departamento[];
    editCiudades: Ciudad[];
    editSelectedPaisId: string;
    editSelectedDepartamentoId: string;
    onClose: () => void;
    onEdit: () => void;
    onSave: (files?: Partial<PlayerFiles>) => void;
    onCancelEdit: () => void;
    onDelete: (playerId: string) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onPrint: () => void;
    onDownloadID?: () => void;
    onDownloadRegister: () => void;
    onDocumentOpen: (url: string, filename: string) => void;
    onLoadEditDepartamentos: (paisId: string) => Promise<void>;
    onLoadEditCiudades: (departamentoId: string) => Promise<void>;
    onGeneratePeaceAndSafe?: (data: PeaceAndSafeData) => void; // NUEVA PROPIEDAD
}

// ... (el resto de las interfaces se mantienen igual)
export interface AddPlayerModalProps {
  show: boolean;
  newPlayer: Partial<Jugador>;
  paises: Pais[];
  departamentos: Departamento[];
  ciudades: Ciudad[];
  categorias: Categoria[];
  escuelas: Escuela[];
  selectedPaisId: string;
  selectedDepartamentoId: string;
  currentUser: Usuario;
  isUploading: boolean;
  uploadProgress: UploadProgress;
  fileErrors: {
    foto_perfil?: string;
    documento_pdf?: string;
    registro_civil?: string;
    general?: string;
  };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFileSelect: (fileType: keyof PlayerFiles, file: File | null) => void;
  onLoadDepartamentos: (paisId: string) => Promise<void>;
  onLoadCiudades: (departamentoId: string) => Promise<void>;
}

export interface PlayerItemProps {
  player: Jugador;
  selectedCategory: string | null;
  onClick: (player: Jugador) => void;
}

export interface CoachHeaderProps {
  currentUser: Usuario;
  isDarkMode: boolean;
  showHamburgerMenu: boolean;
  onToggleDarkMode: () => void;
  onToggleHamburgerMenu: () => void;
  onViewProfile: () => void;
  onAddPlayer: () => void;
  onLogout: () => void;
  hamburgerMenuRef: React.RefObject<HTMLDivElement>;
}

export interface CoachSidebarProps {
  searchTerm: string;
  selectedCategory: string | null;
  showCategoryDropdown: boolean;
  players: Jugador[];
  filteredPlayers: Jugador[];
  categorias: Categoria[];
  currentUser: Usuario;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onCategorySelect: (categoryId: string) => void;
  onClearCategory: () => void;
  onToggleCategoryDropdown: () => void;
  onPlayerClick: (player: Jugador) => void;
}

export interface ProfileModalProps {
  show: boolean;
  userProfile: Usuario | null;
  onClose: () => void;
}