// documentLogoService.ts
import { jsPDF } from 'jspdf';
import { getEscuelaLogoUrl, supabase, Jugador } from './supabaseClient';

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

      // Obtener escuela del usuario (sin violar RLS - usando solo Auth)
      // Nota: Esta función necesita que el escuelaId se pase desde el componente
      // o se obtenga de otra fuente que no sea la BD
      return null; // Temporalmente null hasta que se implemente correctamente
    } catch (error) {
      console.error('Error obteniendo logo de escuela:', error);
      return null;
    }
  }

  /**
   * Generar PDF de planilla de jugadores inscritos para un equipo
   * Incluye el nombre exacto del equipo y marca de agua con el logo de la escuela
   */
  static async generateTeamRosterPDF(
    teamName: string,
    roster: Jugador[],
    escuelaId?: string
  ): Promise<jsPDF> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const tableWidth = pageWidth - margin * 2;

    let logoUrl: string | null = null;
    try {
      logoUrl = await this.getEscuelaLogo(escuelaId);
    } catch (err) {
      console.warn('generateTeamRosterPDF: error obteniendo logo', err);
      logoUrl = null;
    }

    if (logoUrl) {
      this.addLogoToPDF(doc, { url: logoUrl, position: 'watermark', opacity: 0.08 });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(34, 49, 104);
    doc.text('PLANILLA DE JUGADORES', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Equipo: ${teamName}`, margin, 27);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - margin, 27, { align: 'right' });

    doc.setDrawColor(34, 49, 104);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    const columns = [
      { title: '#', width: 10 },
      { title: 'Nombre', width: 68 },
      { title: 'Documento', width: 42 },
      { title: 'Nacimiento', width: 35 }
    ];

    let y = 36;
    y = this.addTableHeader(doc, pageWidth, margin, y, columns);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    roster.forEach((player, index) => {
      const fullName = `${(player.nombre || '').trim()} ${(player.apellido || '').trim()}`.trim() || '-';
      const dateStr = player.fecha_nacimiento ? new Date(player.fecha_nacimiento).toLocaleDateString('es-CO') : '-';

      const nameLines = doc.splitTextToSize(fullName, columns[1].width - 2);
      const rowHeight = Math.max(6, nameLines.length * 4.5);
      const pageBottom = pageHeight - 18;

      if (y + rowHeight > pageBottom) {
        doc.addPage();
        y = 20;
        y = this.addTableHeader(doc, pageWidth, margin, y, columns);
      }

      if (index % 2 === 0) {
        doc.setFillColor(244, 248, 255);
        doc.rect(margin, y - 4, tableWidth, rowHeight + 3, 'F');
      }

      doc.setTextColor(0);
      doc.text(String(index + 1), margin, y);
      doc.text(nameLines, margin + columns[0].width, y);
      doc.text(String(player.documento || '-'), margin + columns[0].width + columns[1].width, y);
      doc.text(dateStr, margin + columns[0].width + columns[1].width + columns[2].width, y);

      y += rowHeight + 3;
    });

    this.addPageNumbers(doc, margin);
    return doc;
  }

  static async generateTeamPlayersPDF(
    teamName: string,
    roster: Jugador[],
    escuelaId?: string
  ): Promise<jsPDF> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const tableWidth = pageWidth - margin * 2;

    let logoUrl: string | null = null;
    try {
      logoUrl = await this.getEscuelaLogo(escuelaId);
    } catch (err) {
      console.warn('generateTeamPlayersPDF: error obteniendo logo', err);
      logoUrl = null;
    }

    if (logoUrl) {
      this.addLogoToPDF(doc, { url: logoUrl, position: 'watermark', opacity: 0.08 });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(34, 49, 104);
    doc.text('LISTADO DE JUGADORES', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Equipo: ${teamName}`, margin, 27);
    doc.text(`Total: ${roster.length}`, pageWidth - margin, 27, { align: 'right' });

    doc.setDrawColor(34, 49, 104);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    const columns = [
      { title: '#', width: 10 },
      { title: 'Nombre', width: 50 },
      { title: 'Documento', width: 24 },
      { title: 'Nacimiento', width: 20 },
      { title: 'Categoría', width: 24 },
      { title: 'Escuela', width: 37 },
      { title: 'Estado', width: 20 }
    ];

    let y = 36;
    y = this.addTableHeader(doc, pageWidth, margin, y, columns);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    roster.forEach((player, index) => {
      const fullName = `${(player.nombre || '').trim()} ${(player.apellido || '').trim()}`.trim() || '-';
      const dateStr = player.fecha_nacimiento ? new Date(player.fecha_nacimiento).toLocaleDateString('es-CO') : '-';
      const categoryName = (player as any).categoria?.nombre || (player as any).categoria_id || '-';
      const schoolName = (player as any).escuela?.nombre || (player as any).escuela_id || '-';
      const status = player.activo ? 'Activo' : 'Registrado';

      const nameLines = doc.splitTextToSize(fullName, columns[1].width - 2);
      const schoolLines = doc.splitTextToSize(schoolName, columns[5].width - 2);
      const linesCount = Math.max(nameLines.length, schoolLines.length, 1);
      const rowHeight = Math.max(6, linesCount * 4.5);
      const pageBottom = pageHeight - 18;

      if (y + rowHeight > pageBottom) {
        doc.addPage();
        y = 20;
        y = this.addTableHeader(doc, pageWidth, margin, y, columns);
      }

      if (index % 2 === 0) {
        doc.setFillColor(245, 247, 252);
        doc.rect(margin, y - 4, tableWidth, rowHeight + 3, 'F');
      }

      doc.setTextColor(0);
      let x = margin;
      doc.text(String(index + 1), x, y);
      x += columns[0].width;
      doc.text(nameLines, x, y);
      x += columns[1].width;
      doc.text(String((player.documento || '-') as string), x, y);
      x += columns[2].width;
      doc.text(dateStr, x, y);
      x += columns[3].width;
      doc.text(categoryName, x, y);
      x += columns[4].width;
      doc.text(schoolLines, x, y);
      x += columns[5].width;
      doc.text(status, x, y);

      y += rowHeight + 3;
    });

    this.addPageNumbers(doc, margin);
    return doc;
  }

  private static addTableHeader(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    y: number,
    columns: { title: string; width: number }[]
  ): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(34, 49, 104);

    let x = margin;
    columns.forEach(column => {
      doc.text(column.title, x, y);
      x += column.width;
    });

    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    return y + 8;
  }

  private static addPageNumbers(doc: jsPDF, margin: number): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(`Página ${page} / ${pageCount}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  /**
   * Obtener logo de una escuela específica
   */
  static async getEscuelaLogo(escuelaId?: string): Promise<string | null> {
    try {
      if (!escuelaId) {
        console.log('⚠️ getEscuelaLogo: escuelaId es null/undefined');
        return null;
      }
      console.log('🔍 Buscando logo para escuelaId:', escuelaId);
      const logoUrl = await getEscuelaLogoUrl(escuelaId);
      console.log('📸 Logo encontrado:', logoUrl);
      return logoUrl;
    } catch (error) {
      console.error('❌ Error obteniendo logo de escuela:', error);
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
    logoPosition: 'header' | 'watermark' | 'corner' = 'header',
    escuelaId?: string
  ): Promise<jsPDF> {
    const doc = new jsPDF();
    
    // Obtener logo si está habilitado
    let logoUrl: string | null = null;
    if (includeLogo) {
      logoUrl = await this.getEscuelaLogo(escuelaId);
      if (!logoUrl) {
        logoUrl = await this.getCurrentUserEscuelaLogo();
      }
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

  /**
   * Generar PDF con firma del admin para transferencia
   */
  static generateTransferPDFWithAdminSignature(
    playerName: string,
    fromSchool: string,
    toInstitution: string,
    fecha: string,
    adminSignatureUrl?: string | null,
    adminName?: string
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
    doc.setFont('helvetica', 'bold');
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

    // Agregar firma del admin si disponible
    if (adminSignatureUrl) {
      try {
        // Agregar la firma del admin a la izquierda
        doc.addImage(adminSignatureUrl, 'PNG', 20, yPosition + 5, 45, 30);
        yPosition += 35;
      } catch (error) {
        console.warn('Error agregando firma del admin:', error);
        // Continuar sin firma si hay error
      }
    }

    // Agregar línea de firma
    yPosition += 5;
    doc.setDrawColor(0);
    doc.line(20, yPosition, 70, yPosition);
    
    // Nombre del admin
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(adminName || 'Corporación de Fútbol Ocañero', 20, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Dirección Administrativa', 20, yPosition + 10);

    return doc;
  }
}