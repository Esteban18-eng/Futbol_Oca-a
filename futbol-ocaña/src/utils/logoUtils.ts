// logoUtils.ts
import { jsPDF } from 'jspdf';

/**
 * Utilidades para manejo de logos en documentos
 */

export interface LogoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Obtener posición del logo según tipo
 */
export function getLogoPosition(
  type: 'header' | 'watermark' | 'corner' | 'signature',
  pageWidth: number,
  pageHeight: number
): LogoPosition {
  switch (type) {
    case 'header':
      return { x: 20, y: 15, width: 40, height: 40 };
    case 'watermark':
      return { 
        x: pageWidth / 2 - 75, 
        y: pageHeight / 2 - 75, 
        width: 150, 
        height: 150 
      };
    case 'corner':
      return { x: pageWidth - 60, y: 15, width: 40, height: 40 };
    case 'signature':
      return { x: pageWidth - 100, y: pageHeight - 50, width: 30, height: 30 };
    default:
      return { x: 20, y: 15, width: 40, height: 40 };
  }
}

/**
 * Validar si una URL de logo es válida
 */
export function isValidLogoUrl(url: string | null): boolean {
  if (!url) return false;
  
  try {
    // Verificar que sea una URL válida
    new URL(url);
    
    // Verificar extensión de imagen
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    const urlLower = url.toLowerCase();
    
    return imageExtensions.some(ext => urlLower.endsWith(ext)) || 
           urlLower.includes('data:image/') ||
           urlLower.includes('.png?') ||
           urlLower.includes('.jpg?');
  } catch {
    return false;
  }
}

/**
 * Agregar marca de agua a PDF
 */
export function addWatermark(
  doc: jsPDF, 
  imageUrl: string, 
  opacity: number = 0.1,
  /*rotation: number = 45*/
): void {
  try {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity }));
    
    // Calcular posición centrada
    const width = 150;
    const height = 150;
    const x = pageWidth / 2 - width / 2;
    const y = pageHeight / 2 - height / 2;
    
    // Rotar la imagen
    doc.rect(x, y, width, height);
    doc.addImage(imageUrl, 'PNG', x, y, width, height);
    
    doc.restoreGraphicsState();
  } catch (error) {
    console.warn('No se pudo agregar marca de agua:', error);
  }
}

/**
 * Convertir fecha a formato legible
 */
export function formatDateForDocument(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day} / ${month} / ${year}`;
}

/**
 * Validar archivo de logo antes de subir
 */
export function validateLogoFile(file: File): { isValid: boolean; error?: string } {
  // Validar tipo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Formato no válido. Use JPG, PNG, WEBP o SVG'
    };
  }

  // Validar tamaño (5MB máximo)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'El logo no puede superar los 5MB'
    };
  }

  return { isValid: true };
}

/**
 * Crear URL de preview para archivo
 */
export function createLogoPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Error creando preview'));
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}