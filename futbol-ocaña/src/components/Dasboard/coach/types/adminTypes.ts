import { Usuario, Escuela, Jugador, Categoria } from '../../../../services/supabaseClient';

export interface AdminDashboardProps {
  onLogout: () => void;
  currentUser: Usuario;
}

export interface AdminHeaderProps {
  currentUser: Usuario;
  isDarkMode: boolean;
  showHamburgerMenu: boolean;
  onToggleDarkMode: () => void;
  onToggleHamburgerMenu: () => void;
  onViewProfile: () => void;
  onAddAdmin: () => void;
  onAddCoach: () => void;
  onAddSchool: () => void;
  onLogout: () => void;
  hamburgerMenuRef: React.RefObject<HTMLDivElement>;
}

export interface AdminSidebarProps {
  searchTerm: string;
  selectedCategory: string;
  selectedSchool: string;
  showCategoryDropdown: boolean;
  showSchoolDropdown: boolean;
  players: Jugador[];
  filteredPlayers: Jugador[];
  categorias: Categoria[];
  escuelas: Escuela[];
  currentUser: Usuario;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onCategorySelect: (categoryId: string) => void;
  onSchoolSelect: (schoolId: string) => void;
  onClearCategory: () => void;
  onClearSchool: () => void;
  onToggleCategoryDropdown: () => void;
  onToggleSchoolDropdown: () => void;
  onPlayerClick: (player: Jugador) => void;
}

export interface AddAdminModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (adminData: any) => void;
}

export interface AddCoachModalProps {
  show: boolean;
  escuelas: Escuela[];
  onClose: () => void;
  onSubmit: (coachData: any) => void;
}

export interface AddSchoolModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (schoolData: any) => void;
}

export interface AdminPlayerItemProps {
  player: Jugador;
  onClick: (player: Jugador) => void;
  onShowPeaceAndSafe: (player: Jugador) => void;
  onEditPlayer: (player: Jugador) => void;
  onDeletePlayer: (player: Jugador) => void;
}

export interface AdminPlayerModalProps {
  player: Jugador;
  categorias: Categoria[];
  escuelas: Escuela[];
  onClose: () => void;
  onPrint: () => void;
  onDownloadID: () => void;
  onDownloadRegister: () => void;
  onDocumentOpen: (url: string, filename: string) => void;
  onDeletePlayer: (player: Jugador) => void;
  onUpdatePlayerSchool: (playerId: string, escuelaId: string) => Promise<void>;
}

// ============ INTERFACES PARA LOGOS ============

export interface UploadLogoModalProps {
  show: boolean;
  escuelaId: string;
  escuelaNombre: string;
  currentLogoUrl?: string | null;
  onClose: () => void;
  onUploadSuccess: (logoUrl: string) => void;
  onDeleteSuccess: () => void;
}

export interface DocumentLogoConfig {
  showLogo: boolean;
  position: 'watermark' | 'header' | 'corner' | 'none';
  opacity: number;
  size: 'small' | 'medium' | 'large';
}

export interface CreateSchoolData {
  nombre: string;
  logoFile?: File | null;
}

// ============ INTERFACES PARA DOCUMENTOS ============

export interface PeaceAndSafeDocumentProps {
  player: Jugador;
  escuela?: Escuela;  // Escuela ya incluye logo_url y logo_file_type
  logoConfig?: DocumentLogoConfig;
  onGenerate?: () => void;
  onClose?: () => void;
}

export interface TransferDocumentProps {
  player: Jugador;
  fromEscuela?: Escuela;
  toEscuela?: Escuela;
  logoConfig?: DocumentLogoConfig;
  onGenerate?: () => void;
  onClose?: () => void;
}

// ============ INTERFACES PARA MANEJO DE LOGOS ============

export interface LogoUploadData {
  escuelaId: string;
  file: File;
  onSuccess?: (logoUrl: string) => void;
  onError?: (error: string) => void;
}

export interface LogoDeleteData {
  escuelaId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface SchoolLogoStatus {
  escuelaId: string;
  hasLogo: boolean;
  logoUrl: string | null;
  fileType: string | null;
}

// ============ INTERFACES PARA COMPONENTES ============

export interface SchoolLogoPreviewProps {
  escuela: Escuela;  // Usa Escuela directamente
  size?: number;
  className?: string;
  onClick?: () => void;
}

export interface DocumentLogoOverlayProps {
  logoUrl: string;
  type: 'watermark' | 'header' | 'corner';
  opacity?: number;
  size?: 'small' | 'medium' | 'large';
}

// ============ INTERFACES PARA CONFIGURACIÓN ============

export interface LogoConfiguration {
  enabled: boolean;
  defaultPosition: 'header' | 'watermark';
  defaultOpacity: number;
  defaultSize: 'medium';
  allowedFileTypes: string[];
  maxFileSizeMB: number;
  storageBucket: string;
}

// ============ TIPO DE AYUDA PARA COMPATIBILIDAD ============

// Si necesitas un tipo con campos opcionales para formularios, usa:
export type PartialEscuela = Partial<Escuela> & {
  id: string;
  nombre: string;
};