// documentLogoService.ts
import { jsPDF } from 'jspdf';
import { supabase } from './supabaseClient';

export interface LogoConfig {
  url: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  position?: 'header' | 'watermark' | 'corner';
  type?: 'escuela' | 'corporacion';
}

export class DocumentLogoService {
  // Logo por defecto de la corporación (puedes cambiarlo)
  private static readonly CORPORACION_LOGO_URL = 'https://via.placeholder.com/150/2c5aa0/FFFFFF?text=CFO';

  /**
   * Obtener logo de la escuela del usuario actual
   */
  static async getCurrentUserEscuelaLogo(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('escuela_id')
        .eq('id', user.id)
        .single();

      if (!usuario?.escuela_id) return null;

      // Obtener logo de la escuela
      const { data: escuela } = await supabase
        .from('escuelas')
        .select('logo_url')
        .eq('id', usuario.escuela_id)
        .single();

      return escuela?.logo_url || null;
    } catch (error) {
      console.error('Error obteniendo logo de escuela:', error);
      return null;
    }
  }

  /**
   * Obtener logo de una escuela específica
   */
  static async getEscuelaLogo(escuelaId: string): Promise<string | null> {
    try {
      const { data: escuela } = await supabase
        .from('escuelas')
        .select('logo_url')
        .eq('id', escuelaId)
        .single();

      return escuela?.logo_url || null;
    } catch (error) {
      console.error('Error obteniendo logo de escuela:', error);
      return null;
    }
  }

  /**
   * Obtener logo de la corporación
   */
  static getCorporacionLogo(): string {
    return this.CORPORACION_LOGO_URL;
  }

  /**
   * Agregar logo a un documento PDF según la posición
   */
  static addLogoToPDF(doc: jsPDF, logoConfig: LogoConfig): void {
    if (!logoConfig.url) return;

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Configuración por defecto según posición
    const config = {
      header: { x: 20, y: 20, width: 50, height: 50, opacity: 1 },
      watermark: { x: pageWidth/2 - 75, y: pageHeight/2 - 75, width: 150, height: 150, opacity: 0.1 },
      corner: { x: pageWidth - 70, y: 20, width: 50, height: 50, opacity: 1 }
    };

    const position = logoConfig.position || 'header';
    const { x, y, width, height, opacity } = {
      ...config[position],
      ...logoConfig
    };

    // Guardar el estado actual del PDF
    doc.saveGraphicsState();
    
    // Aplicar opacidad si es watermark
    if (position === 'watermark') {
      doc.setGState(new (doc as any).GState({ opacity }));
    }

    try {
      // Intentar agregar la imagen
      doc.addImage(logoConfig.url, 'PNG', x, y, width, height);
    } catch (error) {
      console.error('Error agregando logo al PDF:', error);
    }

    // Restaurar estado
    doc.restoreGraphicsState();
  }

  /**
   * Generar PDF con logo para paz y salvo de entrenador
   */
  static async generatePeaceAndSafePDF(
    playerName: string,
    schoolName: string,
    coachName: string,
    presidentName: string,
    fecha: string,
    includeLogo: boolean = true,
    logoPosition: 'header' | 'watermark' | 'corner' = 'header'
  ): Promise<jsPDF> {
    const doc = new jsPDF();
    
    // Obtener logo si está habilitado
    let logoUrl: string | null = null;
    if (includeLogo) {
      logoUrl = await this.getCurrentUserEscuelaLogo();
    }

    // Agregar logo si existe
    if (logoUrl && includeLogo) {
      this.addLogoToPDF(doc, {
        url: logoUrl,
        position: logoPosition,
        opacity: logoPosition === 'watermark' ? 0.1 : 1
      });
    }

    // Configuración del documento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESCUELA / CLUB DE FÚTBOL ' + schoolName.toUpperCase(), 105, 40, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('PAZ Y SALVO DE JUGADOR', 105, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const textos = [
      `La presente certifica que el jugador ${playerName}, quien pertenece o perteneció a la`,
      `Escuela/Club ${schoolName}, se encuentra paz y salvo por todo concepto deportivo,`,
      `administrativo y disciplinario dentro de nuestra institución.`,
      ``,
      `Después de revisar los registros internos y confirmar que no existe pendiente alguna`,
      `que impida su retiro o traslado, la escuela otorga plena autorización para que el`,
      `mencionado jugador pueda retirarse de la institución y continuar su proceso formativo`,
      `en cualquier otra escuela, club o entidad deportiva de su elección.`,
      ``,
      `Este paz y salvo se expide a solicitud del jugador, con el fin de ser presentado ante`,
      `la Corporación de Fútbol Ocañero, entidad encargada de validar y formalizar su traslado`,
      `conforme a los lineamientos establecidos.`,
      ``,
      `Se firma para constancia en la ciudad de Ocaña, a los ${fecha}.`
    ];

    let yPosition = 70;
    textos.forEach(line => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition, { maxWidth: 170 });
      yPosition += 6;
    });

    // Firmas
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(coachName, 50, yPosition);
    doc.text(presidentName, 140, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Entrenador / Director Técnico', 50, yPosition + 5);
    doc.text('Presidente / Representante Legal', 140, yPosition + 5);
    
    doc.text(`Escuela ${schoolName}`, 50, yPosition + 10);
    doc.text(`Escuela ${schoolName}`, 140, yPosition + 10);

    return doc;
  }

  /**
   * Generar PDF con logo para transferencia (admin)
   */
  static generateTransferPDF(
    playerName: string,
    fromSchool: string,
    toInstitution: string,
    fecha: string
  ): jsPDF {
    const doc = new jsPDF();
    
    // Logo de la corporación
    const corporacionLogo = this.getCorporacionLogo();
    if (corporacionLogo) {
      this.addLogoToPDF(doc, {
        url: corporacionLogo,
        position: 'header',
        x: 20,
        y: 15,
        width: 40,
        height: 40
      });
    }

    // Configuración del documento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CORPORACIÓN DE FÚTBOL OCAÑERO', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('CERTIFICADO DE TRANSFERENCIA DE JUGADOR', 105, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const textos = [
      `La Corporación de Fútbol Ocañero certifica que el jugador ${playerName},`,
      `identificado en nuestros registros deportivos, se encuentra paz y salvo con esta`,
      `institución y no presenta obligaciones pendientes que restrinjan su movilidad`,
      `entre escuelas o clubes formativos.`,
      ``,
      `En consecuencia, la Corporación autoriza de manera oficial la transferencia del`,
      `jugador desde la escuela o club ${fromSchool} hacia la institución deportiva`,
      `${toInstitution}, garantizando así la continuidad de su proceso formativo y`,
      `deportivo.`,
      ``,
      `Este certificado se expide a solicitud de la parte interesada para los fines que`,
      `estime convenientes.`,
      ``,
      `Dado en Ocaña, a los ${fecha}.`,
      ``,
      ``,
      `__________________________________`,
      `Corporación de Fútbol Ocañero`,
      `Dirección Administrativa`
    ];

    let yPosition = 60;
    textos.forEach(line => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition, { maxWidth: 170 });
      yPosition += 6;
    });

    return doc;
  }
}