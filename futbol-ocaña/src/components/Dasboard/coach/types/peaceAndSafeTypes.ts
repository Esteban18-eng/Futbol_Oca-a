// peaceAndSafeTypes.ts - ACTUALIZADO
export interface PeaceAndSafeData {
  // Campos originales
  playerName: string;
  schoolName: string;
  coachName: string;
  presidentName: string;
  currentDate: string;
  playerId: string;
  
  // NUEVOS CAMPOS PARA LOGOS
  includeLogo: boolean; // Cambiado a requerido
  logoPosition: 'header' | 'watermark' | 'corner';
  logoOpacity?: number;
  logoUrl?: string | null;
  escuelaId?: string | null;
  observaciones?: string;
  motivo?: string;
  ciudad?: string;
  categoria?: string;
  documento?: string;
}

export interface PeaceAndSafeDocument {
  id?: string;
  player_id: string;
  document_url: string;
  created_at: string;
  coach_id: string;
  include_logo?: boolean;
  logo_position?: string;
  observaciones?: string;
}

export interface PeaceAndSafeDataWithLogo extends PeaceAndSafeData {
  includeLogo: boolean;
  logoPosition: 'header' | 'watermark' | 'corner';
  logoOpacity: number;
  logoUrl: string | null;
  observaciones?: string;
}

export interface DocumentGenerationOptions {
  includeLogo: boolean;
  logoPosition: 'header' | 'watermark' | 'corner';
  logoOpacity: number;
  watermarkText?: string;
  escuelaId?: string;
  corporacionLogo?: boolean;
}

// NUEVO: Configuración de logo para corporación
export interface CorporacionLogoConfig {
  url: string;
  enabled: boolean;
  defaultPosition: 'header' | 'watermark' | 'corner';
  defaultOpacity: number;
}