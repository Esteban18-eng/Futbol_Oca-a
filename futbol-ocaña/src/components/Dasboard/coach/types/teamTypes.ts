export interface TeamLogo {
  id: string;
  escuela_id: string;
  logo_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface EscuelaWithLogo {
  id: string;
  nombre: string;
  logo_url: string | null;
  logo_file_type: string | null;
  created_at: string;
}

export interface DocumentLogoProps {
  logoUrl: string | null;
  logoType?: 'watermark' | 'header' | 'corner';
  opacity?: number;
  size?: 'small' | 'medium' | 'large';
}