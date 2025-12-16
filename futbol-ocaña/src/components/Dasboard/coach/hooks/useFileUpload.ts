// src/hooks/useFileUpload.ts - VERSIÓN CORREGIDA
import { useState } from 'react';
import { PlayerFiles } from '../../../../services/supabaseClient';
import { 
  uploadProfilePhoto, 
  uploadDocumentPDF, 
  uploadRegistroCivilPDF,
  updatePlayerFileUrls // AHORA SÍ ESTÁ EXPORTADA
} from '../../../../services/supabaseClient';

export type UploadProgress = {
  [key in keyof PlayerFiles]: number;
};

export const useFileUpload = () => {
  const [files, setFiles] = useState<PlayerFiles>({
    foto_perfil: null,
    documento_pdf: null,
    registro_civil: null
  });

  const [fileErrors, setFileErrors] = useState<{[key in keyof PlayerFiles]?: string} & {general?: string}>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    foto_perfil: 0,
    documento_pdf: 0,
    registro_civil: 0
  });

  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    url: '',
    filename: ''
  });

  const handleFileSelect = (fileType: keyof PlayerFiles, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: file
    }));

    if (file && fileErrors[fileType]) {
      setFileErrors(prev => ({
        ...prev,
        [fileType]: undefined
      }));
    }
  };

  const validateFiles = (requiredFields: (keyof PlayerFiles)[] = []): boolean => {
    const errors: {[key in keyof PlayerFiles]?: string} & {general?: string} = {};

    requiredFields.forEach(field => {
      if (!files[field]) {
        errors[field] = `El ${field.replace('_', ' ')} es obligatorio`;
      }
    });

    setFileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFiles = async (documento: string, requiredFields: (keyof PlayerFiles)[] = []): Promise<{[key in keyof PlayerFiles]?: string} | null> => {
    if (!validateFiles(requiredFields)) {
      return null;
    }

    setIsUploading(true);
    const results: {[key in keyof PlayerFiles]?: string} = {};

    try {
      for (const [fileType, file] of Object.entries(files)) {
        const key = fileType as keyof PlayerFiles;
        
        if (file) {
          setUploadProgress(prev => ({ ...prev, [key]: 0 }));
          
          let uploadResult;
          
          switch (key) {
            case 'foto_perfil':
              uploadResult = await uploadProfilePhoto(file, documento);
              break;
            case 'documento_pdf':
              uploadResult = await uploadDocumentPDF(file, documento);
              break;
            case 'registro_civil':
              uploadResult = await uploadRegistroCivilPDF(file, documento);
              break;
          }
          
          if (uploadResult && uploadResult.success) {
            results[key] = uploadResult.url!;
            setUploadProgress(prev => ({ ...prev, [key]: 100 }));
          } else {
            setFileErrors({
              general: `Error subiendo ${key}: ${uploadResult?.error || 'Error desconocido'}`
            });
            return null;
          }
        }
      }

      return results;
    } catch (error: any) {
      setFileErrors({
        general: `Error subiendo archivos: ${error.message || 'Error desconocido'}`
      });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress({
          foto_perfil: 0,
          documento_pdf: 0,
          registro_civil: 0
        });
      }, 1000);
    }
  };

  // FUNCIÓN CORREGIDA: Subir archivos durante edición
  const uploadFilesForEdit = async (
    playerId: string,
    documento: string, 
    filesToUpload: Partial<PlayerFiles>
  ): Promise<{[key in keyof PlayerFiles]?: string} | null> => {
    setIsUploading(true);
    const results: {[key in keyof PlayerFiles]?: string} = {};

    try {
      for (const [fileType, file] of Object.entries(filesToUpload)) {
        const key = fileType as keyof PlayerFiles;
        
        if (file) {
          setUploadProgress(prev => ({ ...prev, [key]: 0 }));
          
          let uploadResult;
          
          switch (key) {
            case 'foto_perfil':
              uploadResult = await uploadProfilePhoto(file, documento);
              break;
            case 'documento_pdf':
              uploadResult = await uploadDocumentPDF(file, documento);
              break;
            case 'registro_civil':
              uploadResult = await uploadRegistroCivilPDF(file, documento);
              break;
          }
          
          if (uploadResult && uploadResult.success) {
            results[key] = uploadResult.url!;
            
            // Actualizar la URL en la base de datos
            const updateResult = await updatePlayerFileUrls(playerId, {
              [`${key}_url`]: uploadResult.url!
            });
            
            if (!updateResult.success) {
              throw new Error(`Error actualizando ${key}: ${updateResult.error}`);
            }
            
            setUploadProgress(prev => ({ ...prev, [key]: 100 }));
          } else {
            setFileErrors({
              general: `Error subiendo ${key}: ${uploadResult?.error || 'Error desconocido'}`
            });
            return null;
          }
        }
      }

      return results;
    } catch (error: any) {
      setFileErrors({
        general: `Error subiendo archivos: ${error.message || 'Error desconocido'}`
      });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress({
          foto_perfil: 0,
          documento_pdf: 0,
          registro_civil: 0
        });
      }, 1000);
    }
  };

  const resetFiles = () => {
    setFiles({
      foto_perfil: null,
      documento_pdf: null,
      registro_civil: null
    });
    setFileErrors({});
  };

  const openDocument = (url: string, filename: string) => {
    setDocumentViewer({
      isOpen: true,
      url,
      filename
    });
  };

  const closeDocument = () => {
    setDocumentViewer({
      isOpen: false,
      url: '',
      filename: ''
    });
  };

  return {
    files,
    fileErrors,
    isUploading,
    uploadProgress,
    documentViewer,
    handleFileSelect,
    uploadFiles,
    uploadFilesForEdit,
    resetFiles,
    openDocument,
    closeDocument
  };
};