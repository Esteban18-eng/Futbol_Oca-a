// src/components/coach/components/PlayerModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerModalProps } from '../types/coachTypes';
import { 
    getGoogleDriveImageUrls, 
    getGoogleDriveUrlType,
    diagnoseGoogleDriveUrl,
    getGoogleDriveFileId 
} from '../../../../utils/googleDriveUtils';
import PeaceAndSafeModal from './PeaceAndSafeModal';
import { PeaceAndSafeData } from '../types/peaceAndSafeTypes';
import FileUpload from '../../../shared/components/fileUpload';
import { PlayerFiles } from '../../../../services/supabaseClient';
import './PlayerModal.css';
import { perfMonitor } from '../../../../utils/performanceMonitor';

interface LocalPlayerFiles {
    foto_perfil: File | null;
    documento_pdf: File | null;
    registro_civil: File | null;
}

const PlayerModal: React.FC<PlayerModalProps> = ({
    player,
    originalPlayer,
    isEditing,
    isSaving,
    documentOpened,
    categorias,
    escuelas,
    editPaises,
    editDepartamentos,
    editCiudades,
    editSelectedPaisId,
    editSelectedDepartamentoId,
    onClose,
    onEdit,
    onSave,
    onCancelEdit,
    onDelete,
    onInputChange,
    onPrint,
    onDownloadRegister,
    onDocumentOpen,
    onLoadEditDepartamentos,
    onLoadEditCiudades,
    onGeneratePeaceAndSafe
}) => {
    if (!player) return null;

    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [convertedImageUrl, setConvertedImageUrl] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [urlType, setUrlType] = useState<'file' | 'folder' | 'unknown'>('unknown');
    const [diagnosticInfo, setDiagnosticInfo] = useState<{
        isValid: boolean;
        fileId: string | null;
        error: string;
        suggestions: string[];
        urlType: 'file' | 'folder' | 'unknown';
    } | null>(null);
    const [showDiagnostic, setShowDiagnostic] = useState(false);
    const [showPeaceAndSafeModal, setShowPeaceAndSafeModal] = useState(false);
    
    // Estados para archivos en edición
    const [localFiles, setLocalFiles] = useState<LocalPlayerFiles>({
        foto_perfil: null,
        documento_pdf: null,
        registro_civil: null
    });
    const [filePreviews, setFilePreviews] = useState<{
        foto_perfil: string | null;
    }>({
        foto_perfil: null
    });

    // Refs para limpieza
    const imageRef = useRef<HTMLImageElement | null>(null);
    const isMountedRef = useRef(true);
    const previewUrlRef = useRef<string | null>(null);

    // Limpieza de recursos al desmontar
    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            
            // Limpiar imagen
            if (imageRef.current) {
                imageRef.current.onload = null;
                imageRef.current.onerror = null;
                imageRef.current.src = '';
                imageRef.current = null;
            }
            
            // Limpiar preview URLs
            if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
            
            // Limpiar file previews
            if (filePreviews.foto_perfil && filePreviews.foto_perfil.startsWith('blob:')) {
                URL.revokeObjectURL(filePreviews.foto_perfil);
            }
            
            perfMonitor.end('playerModalLifecycle');
        };
    }, []);

    // Efecto principal - manejo de imágenes con cleanup
    useEffect(() => {
        perfMonitor.start('playerModalImageLoad');
        let imageCleanup: (() => void) | null = null;
        
        // Reset image states cuando cambia el jugador
        setImageError(false);
        setImageLoaded(false);
        setCurrentUrlIndex(0);
        setShowDiagnostic(false);
        setDiagnosticInfo(null);
        
        // Verificar tipo de URL y generar URLs
        if (player.foto_perfil_url && !isEditing) {
            const type = getGoogleDriveUrlType(player.foto_perfil_url);
            setUrlType(type);
            
            if (type === 'folder') {
                console.error('❌ URL de carpeta detectada - no se puede cargar imagen');
                setImageError(true);
                return;
            }
            
            const urls = getGoogleDriveImageUrls(player.foto_perfil_url);
            setImageUrls(urls);
            
            if (urls.length > 0 && isMountedRef.current) {
                const url = urls[0];
                setConvertedImageUrl(url);
                
                // Cargar imagen con cleanup
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.referrerPolicy = 'no-referrer';
                img.src = url;
                
                const handleLoad = () => {
                    if (isMountedRef.current) {
                        console.log(`✅ Imagen cargada correctamente:`, url);
                        setImageLoaded(true);
                        setImageError(false);
                    }
                };
                
                const handleError = () => {
                    if (isMountedRef.current) {
                        console.error(`❌ Error cargando imagen:`, url);
                        handleImageError();
                    }
                };
                
                img.onload = handleLoad;
                img.onerror = handleError;
                
                imageCleanup = () => {
                    img.onload = null;
                    img.onerror = null;
                    img.src = '';
                };
                
                imageRef.current = img;
            } else if (isMountedRef.current) {
                setImageError(true);
            }
        } else if (isMountedRef.current) {
            setImageUrls([]);
            setConvertedImageUrl('');
        }
        
        // Resetear archivos locales cuando se cancela la edición
        if (!isEditing && isMountedRef.current) {
            setLocalFiles({
                foto_perfil: null,
                documento_pdf: null,
                registro_civil: null
            });
            setFilePreviews({
                foto_perfil: null
            });
        }
        
        return () => {
            if (imageCleanup) {
                imageCleanup();
            }
            perfMonitor.end('playerModalImageLoad');
        };
    }, [player, isEditing]);

    useEffect(() => {
        if (documentOpened && isMountedRef.current) {
            console.log('📄 Documento abierto');
        }
    }, [documentOpened]);

    // Función para manejar selección de archivos con cleanup
    const handleFileSelect = useCallback((fileType: keyof PlayerFiles, file: File | null) => {
        // Limpiar preview anterior si existe
        if (fileType === 'foto_perfil' && filePreviews.foto_perfil && filePreviews.foto_perfil.startsWith('blob:')) {
            URL.revokeObjectURL(filePreviews.foto_perfil);
        }
        
        setLocalFiles(prev => ({
            ...prev,
            [fileType]: file
        }));

        // Generar preview para foto de perfil
        if (fileType === 'foto_perfil' && file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                if (isMountedRef.current && e.target?.result) {
                    const newPreview = e.target.result as string;
                    
                    // Guardar referencia para cleanup
                    if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrlRef.current);
                    }
                    previewUrlRef.current = newPreview;
                    
                    setFilePreviews(prev => ({
                        ...prev,
                        foto_perfil: newPreview
                    }));
                }
            };
            
            reader.onerror = () => {
                if (isMountedRef.current) {
                    console.error('Error leyendo archivo');
                }
            };
            
            reader.readAsDataURL(file);
        } else if (fileType === 'foto_perfil' && isMountedRef.current) {
            setFilePreviews(prev => ({
                ...prev,
                foto_perfil: null
            }));
        }
    }, [filePreviews.foto_perfil]);

    // Función para preparar datos con archivos
    const prepareSaveData = useCallback(() => {
        const formData = new FormData();
        let hasFileChanges = false;

        // Agregar archivos al FormData si existen
        Object.entries(localFiles).forEach(([key, file]) => {
            if (file) {
                formData.append(key, file);
                hasFileChanges = true;
            }
        });

        return {
            playerData: { ...player },
            formData: hasFileChanges ? formData : null,
            fileChanges: localFiles
        };
    }, [player, localFiles]);

    // Función para manejar guardado con archivos
    const handleSaveWithFiles = useCallback(() => {
        perfMonitor.start('playerModalSave');
        
        const { fileChanges } = prepareSaveData();
        
        console.log('📤 Guardando jugador con cambios:', {
            datos: hasChanges(),
            archivos: Object.keys(fileChanges).filter(key => fileChanges[key as keyof LocalPlayerFiles])
        });
        
        // Filtrar solo archivos que tienen cambios
        const filesToUpdate: Partial<PlayerFiles> = {};
        Object.keys(fileChanges).forEach(key => {
            const fileType = key as keyof LocalPlayerFiles;
            if (fileChanges[fileType]) {
                filesToUpdate[fileType] = fileChanges[fileType];
            }
        });
        
        // Si hay archivos para actualizar, pasarlos a onSave
        if (Object.keys(filesToUpdate).length > 0) {
            console.log('📁 Archivos a actualizar:', filesToUpdate);
            onSave(filesToUpdate);
        } else {
            console.log('ℹ️ No hay cambios en archivos');
            onSave();
        }
        
        perfMonitor.end('playerModalSave');
    }, [prepareSaveData, onSave]);

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

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO');
    }, []);

    const handlePaisChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        onInputChange(e);
        
        const selectedPais = editPaises.find(p => p.nombre === value);
        if (selectedPais) {
            await onLoadEditDepartamentos(selectedPais.id);
        }
    }, [editPaises, onInputChange, onLoadEditDepartamentos]);

    const handleDepartamentoChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        onInputChange(e);
        
        const selectedDepto = editDepartamentos.find(d => d.nombre === value);
        if (selectedDepto) {
            await onLoadEditCiudades(selectedDepto.id);
        }
    }, [editDepartamentos, onInputChange, onLoadEditCiudades]);

    const hasChanges = useCallback(() => {
        if (!originalPlayer) return false;
        
        const dataChanges = (
            player.nombre !== originalPlayer.nombre ||
            player.apellido !== originalPlayer.apellido ||
            player.fecha_nacimiento !== originalPlayer.fecha_nacimiento ||
            player.pais !== originalPlayer.pais ||
            player.departamento !== originalPlayer.departamento ||
            player.ciudad !== originalPlayer.ciudad ||
            player.eps !== originalPlayer.eps ||
            player.tipo_eps !== originalPlayer.tipo_eps
        );

        const fileChanges = Object.values(localFiles).some(file => file !== null);
        
        return dataChanges || fileChanges;
    }, [player, originalPlayer, localFiles]);

    const handleImageError = useCallback(() => {
        if (!isMountedRef.current) return;
        
        console.error(`❌ Error cargando la imagen (intento ${currentUrlIndex + 1}/${imageUrls.length}):`, convertedImageUrl);
        
        if (currentUrlIndex < imageUrls.length - 1) {
            const nextIndex = currentUrlIndex + 1;
            console.log(`🔄 Intentando con siguiente URL (${nextIndex + 1}/${imageUrls.length}):`, imageUrls[nextIndex]);
            setCurrentUrlIndex(nextIndex);
            setConvertedImageUrl(imageUrls[nextIndex]);
            setImageError(false);
            setImageLoaded(false);
        } else {
            setImageError(true);
            setImageLoaded(false);
            console.log('❌ Todas las URLs fallaron');
        }
    }, [currentUrlIndex, imageUrls, convertedImageUrl]);

    const reloadImage = useCallback(() => {
        if (!isMountedRef.current) return;
        
        console.log('🔄 Reintentando cargar imagen desde el principio...');
        setImageError(false);
        setImageLoaded(false);
        setCurrentUrlIndex(0);
        setShowDiagnostic(false);
        if (imageUrls.length > 0) {
            setConvertedImageUrl(imageUrls[0] + '&t=' + Date.now());
        }
    }, [imageUrls]);

    const runDiagnostic = useCallback(async () => {
        if (!player.foto_perfil_url || !isMountedRef.current) return;
        
        console.log('🔍 Ejecutando diagnóstico...');
        setShowDiagnostic(true);
        const diagnosis = await diagnoseGoogleDriveUrl(player.foto_perfil_url);
        
        if (isMountedRef.current) {
            setDiagnosticInfo(diagnosis);
            console.log('📊 Resultado diagnóstico:', diagnosis);
        }
    }, [player.foto_perfil_url]);

    const handleDocumentOpen = useCallback((url: string, filename: string) => {
        console.log('📄 Abriendo documento en modal interno:', filename);
        
        if (onDocumentOpen) {
            onDocumentOpen(url, filename);
        } else {
            console.warn('❌ onDocumentOpen callback no disponible');
            const fileId = getGoogleDriveFileId(url);
            const viewerUrl = fileId 
                ? `https://drive.google.com/file/d/${fileId}/view`
                : url;
            window.open(viewerUrl, '_blank', 'noopener,noreferrer');
        }
    }, [onDocumentOpen]);

    const handleGeneratePeaceAndSafe = useCallback((data: PeaceAndSafeData) => {
        console.log('📄 Generando Paz y Salvo:', data);
        if (onGeneratePeaceAndSafe) {
            onGeneratePeaceAndSafe(data);
        } else {
            alert(`Paz y Salvo generado para ${data.playerName}\n\nSe guardará en Google Drive y se descargará automáticamente.`);
        }
    }, [onGeneratePeaceAndSafe]);

    // Botón de cancelar con confirmación si hay cambios
    const handleCancelEdit = useCallback(() => {
        if (hasChanges()) {
            if (window.confirm('¿Estás seguro de cancelar la edición? Se perderán los cambios no guardados.')) {
                onCancelEdit();
            }
        } else {
            onCancelEdit();
        }
    }, [hasChanges, onCancelEdit]);

    // Render
    return (
        <div className="player-modal-overlay" onClick={onClose}>
            <div className="player-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="player-modal-header">
                    <h3 className="player-modal-title">
                        {isEditing ? 'EDITAR JUGADOR' : 'INFORMACIÓN DEL JUGADOR'}
                        {isEditing && hasChanges() && <span className="player-changes-indicator">* Cambios pendientes</span>}
                        {documentOpened && <span className="document-opened-indicator">📄 Documento abierto</span>}
                    </h3>
                    <button className="player-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="player-modal-body">
                    {/* Header con foto e información básica */}
                    <div className="player-header-info">
                        <div className="player-photo-wrapper">
                            {isEditing ? (
                                // Mostrar FileUpload en modo edición
                                <div className="player-photo-edit">
                                    <FileUpload
                                        type="foto_perfil"
                                        label="Foto de Perfil"
                                        accept="image/jpeg,image/png,image/jpg"
                                        maxSize="5"
                                        onFileSelect={handleFileSelect}
                                        currentFile={localFiles.foto_perfil}
                                        currentUrl={filePreviews.foto_perfil || player.foto_perfil_url || null}
                                        required={false}
                                    />
                                    {player.foto_perfil_url && !localFiles.foto_perfil && (
                                        <div className="player-current-photo-note">
                                            ⚠️ Manteniendo foto actual
                                        </div>
                                    )}
                                </div>
                            ) : convertedImageUrl && !imageError ? (
                                // Mostrar imagen normal en modo lectura
                                <>
                                    <img 
                                        ref={imageRef}
                                        src={convertedImageUrl}
                                        alt={`${player.nombre} ${player.apellido}`}
                                        className="player-main-photo"
                                        onError={handleImageError}
                                        onLoad={() => {
                                            if (isMountedRef.current) {
                                                setImageLoaded(true);
                                                setImageError(false);
                                            }
                                        }}
                                        style={{ display: imageLoaded ? 'block' : 'none' }}
                                        crossOrigin="anonymous"
                                        loading="lazy"
                                    />
                                    {!imageLoaded && !imageError && (
                                        <div className="player-photo-loading">
                                            <div className="loading-spinner"></div>
                                            <span>
                                                Cargando imagen... ({currentUrlIndex + 1}/{imageUrls.length})
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="player-photo-fallback">
                                    <div className="fallback-icon">👤</div>
                                    <span className="fallback-text">
                                        {player.nombre.charAt(0)}{player.apellido.charAt(0)}
                                    </span>
                                    {player.foto_perfil_url && imageError && (
                                        <div className="player-photo-error">
                                            {urlType === 'folder' ? (
                                                <>
                                                    <p>❌ URL incorrecta</p>
                                                    <p className="error-detail">
                                                        Tienes una URL de carpeta, no de archivo
                                                    </p>
                                                    <div className="permission-steps">
                                                        <h5>Para obtener la URL correcta:</h5>
                                                        <ol>
                                                            <li>Abre la carpeta en Google Drive</li>
                                                            <li>Haz doble click en la imagen</li>
                                                            <li>Click en los 3 puntos (⋮) arriba a la derecha</li>
                                                            <li>Selecciona "Obtener enlace"</li>
                                                            <li>Copia esa URL y actualiza el Excel</li>
                                                        </ol>
                                                    </div>
                                                    <a 
                                                        href={player.foto_perfil_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="drive-link-btn"
                                                    >
                                                        🔗 Abrir carpeta en Drive
                                                    </a>
                                                </>
                                            ) : (
                                                <>
                                                    <p>❌ No se pudo cargar la imagen</p>
                                                    <p className="error-detail">
                                                        Intentadas {imageUrls.length} URLs
                                                    </p>
                                                    <div className="diagnostic-buttons">
                                                        <button className="retry-btn" onClick={reloadImage}>
                                                            🔄 Reintentar
                                                        </button>
                                                        <button className="diagnostic-btn" onClick={runDiagnostic}>
                                                            🔍 Diagnosticar
                                                        </button>
                                                        <a 
                                                            href={player.foto_perfil_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="drive-link-btn"
                                                        >
                                                            🔗 Abrir en Drive
                                                        </a>
                                                    </div>
                                                    {showDiagnostic && diagnosticInfo && (
                                                        <div className="diagnostic-info">
                                                            <h5>Información de diagnóstico:</h5>
                                                            <p><strong>File ID:</strong> {diagnosticInfo.fileId || 'No encontrado'}</p>
                                                            <p><strong>Error:</strong> {diagnosticInfo.error || 'Ninguno'}</p>
                                                            <p><strong>Sugerencias:</strong></p>
                                                            <ul>
                                                                {diagnosticInfo.suggestions.map((suggestion: string, index: number) => (
                                                                    <li key={index}>{suggestion}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="player-basic-details">
                            <h2 className="player-fullname">{player.nombre} {player.apellido}</h2>
                            <div className="player-info-grid">
                                <div className="player-info-item">
                                    <span className="player-info-label">Documento:</span>
                                    <span className="player-info-value">{player.documento}</span>
                                </div>
                                <div className="player-info-item">
                                    <span className="player-info-label">Edad:</span>
                                    <span className="player-info-value">{calculateAge(player.fecha_nacimiento)} años</span>
                                </div>
                                <div className="player-info-item">
                                    <span className="player-info-label">Nacimiento:</span>
                                    <span className="player-info-value">{formatDate(player.fecha_nacimiento)}</span>
                                </div>
                                <div className="player-info-item">
                                    <span className="player-info-label">Categoría:</span>
                                    <span className="player-info-value">{categorias.find(cat => cat.id === player.categoria_id)?.nombre || 'Sin categoría'}</span>
                                </div>
                                <div className="player-info-item">
                                    <span className="player-info-label">Escuela:</span>
                                    <span className="player-info-value">{escuelas.find(esc => esc.id === player.escuela_id)?.nombre || 'Sin escuela'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formulario de edición */}
                    {isEditing && (
                        <div className="player-edit-section">
                            <div className="player-form-section">
                                <h4 className="player-section-title">Datos Personales</h4>
                                <div className="player-form-row">
                                    <div className="player-form-group">
                                        <label className="player-form-label">Nombre</label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={player.nombre}
                                            onChange={onInputChange}
                                            className="player-form-input"
                                        />
                                    </div>
                                    <div className="player-form-group">
                                        <label className="player-form-label">Apellido</label>
                                        <input
                                            type="text"
                                            name="apellido"
                                            value={player.apellido}
                                            onChange={onInputChange}
                                            className="player-form-input"
                                        />
                                    </div>
                                </div>

                                <div className="player-form-group">
                                    <label className="player-form-label">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        name="fecha_nacimiento"
                                        value={player.fecha_nacimiento}
                                        onChange={onInputChange}
                                        className="player-form-input"
                                    />
                                </div>
                            </div>

                            {/* Sección de Documentos en modo edición */}
                            <div className="player-form-section">
                                <h4 className="player-section-title">📁 Documentos</h4>
                                <div className="player-documents-edit">
                                    <div className="player-document-upload">
                                        <FileUpload
                                            type="documento_pdf"
                                            label="Documento de Identidad (PDF)"
                                            accept=".pdf,application/pdf"
                                            maxSize="10"
                                            onFileSelect={handleFileSelect}
                                            currentFile={localFiles.documento_pdf}
                                            currentUrl={player.documento_pdf_url || null}
                                            required={false}
                                        />
                                    </div>
                                    <div className="player-document-upload">
                                        <FileUpload
                                            type="registro_civil"
                                            label="Registro Civil (PDF)"
                                            accept=".pdf,application/pdf"
                                            maxSize="10"
                                            onFileSelect={handleFileSelect}
                                            currentFile={localFiles.registro_civil}
                                            currentUrl={player.registro_civil_url || null}
                                            required={false}
                                        />
                                    </div>
                                    <div className="player-documents-note">
                                        <p>⚠️ <strong>Nota:</strong> Solo selecciona archivos si deseas reemplazar los existentes.</p>
                                        <p>Dejar en blanco mantendrá los documentos actuales.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="player-form-section">
                                <h4 className="player-section-title">Ubicación</h4>
                                <div className="player-form-row">
                                    <div className="player-form-group">
                                        <label className="player-form-label">País</label>
                                        <select
                                            name="pais"
                                            value={player.pais}
                                            onChange={handlePaisChange}
                                            className="player-form-select"
                                        >
                                            <option value="">Seleccionar país</option>
                                            {editPaises.map(pais => (
                                                <option key={pais.id} value={pais.nombre}>
                                                    {pais.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="player-form-group">
                                        <label className="player-form-label">Departamento</label>
                                        <select
                                            name="departamento"
                                            value={player.departamento}
                                            onChange={handleDepartamentoChange}
                                            className="player-form-select"
                                            disabled={!editSelectedPaisId}
                                        >
                                            <option value="">Seleccionar departamento</option>
                                            {editDepartamentos.map(depto => (
                                                <option key={depto.id} value={depto.nombre}>
                                                    {depto.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="player-form-group">
                                        <label className="player-form-label">Ciudad</label>
                                        <select
                                            name="ciudad"
                                            value={player.ciudad}
                                            onChange={onInputChange}
                                            className="player-form-select"
                                            disabled={!editSelectedDepartamentoId}
                                        >
                                            <option value="">Seleccionar ciudad</option>
                                            {editCiudades.map(ciudad => (
                                                <option key={ciudad.id} value={ciudad.nombre}>
                                                    {ciudad.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="player-form-section">
                                <h4 className="player-section-title">🏥 Información Médica</h4>
                                <div className="player-form-row">
                                    <div className="player-form-group">
                                        <label className="player-form-label">EPS</label>
                                        <input
                                            type="text"
                                            name="eps"
                                            value={player.eps}
                                            onChange={onInputChange}
                                            className="player-form-input"
                                        />
                                    </div>
                                    <div className="player-form-group">
                                        <label className="player-form-label">Tipo de EPS</label>
                                        <select
                                            name="tipo_eps"
                                            value={player.tipo_eps}
                                            onChange={onInputChange}
                                            className="player-form-select"
                                        >
                                            <option value="Subsidiado">Subsidiado</option>
                                            <option value="Contributivo">Contributivo</option>
                                            <option value="Especial">Especial</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Información de ubicación y médica (solo lectura) */}
                    {!isEditing && (
                        <div className="player-readonly-info">
                            <div className="player-info-section">
                                <h4 className="player-section-title">📍 Ubicación</h4>
                                <div className="player-info-grid-readonly">
                                    <div className="player-info-item-readonly">
                                        <span className="player-info-label-readonly">País:</span>
                                        <span className="player-info-value-readonly">{player.pais || 'No especificado'}</span>
                                    </div>
                                    <div className="player-info-item-readonly">
                                        <span className="player-info-label-readonly">Departamento:</span>
                                        <span className="player-info-value-readonly">{player.departamento || 'No especificado'}</span>
                                    </div>
                                    <div className="player-info-item-readonly">
                                        <span className="player-info-label-readonly">Ciudad:</span>
                                        <span className="player-info-value-readonly">{player.ciudad || 'No especificado'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="player-info-section">
                                <h4 className="player-section-title">🏥 Información Médica</h4>
                                <div className="player-info-grid-readonly">
                                    <div className="player-info-item-readonly">
                                        <span className="player-info-label-readonly">EPS:</span>
                                        <span className="player-info-value-readonly">{player.eps || 'No especificado'}</span>
                                    </div>
                                    <div className="player-info-item-readonly">
                                        <span className="player-info-label-readonly">Tipo de EPS:</span>
                                        <span className="player-info-value-readonly">{player.tipo_eps || 'No especificado'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documentos (solo lectura cuando no está editando) */}
                    {!isEditing && (
                        <div className="player-documents-section">
                            <h4 className="player-section-title">📁 Documentos</h4>
                            <div className="player-document-buttons">
                                {player.documento_pdf_url && (
                                    <button
                                        className="player-doc-btn"
                                        onClick={() => handleDocumentOpen(player.documento_pdf_url!, 'Documento de Identidad')}
                                    >
                                        <span className="player-doc-icon">📄</span>
                                        <span className="player-doc-text">Ver Documento de Identidad</span>
                                    </button>
                                )}
                                {player.registro_civil_url && (
                                    <button
                                        className="player-doc-btn"
                                        onClick={() => handleDocumentOpen(player.registro_civil_url!, 'Registro Civil')}
                                    >
                                        <span className="player-doc-icon">📋</span>
                                        <span className="player-doc-text">Ver Registro Civil</span>
                                    </button>
                                )}
                                {!player.documento_pdf_url && !player.registro_civil_url && (
                                    <p className="player-no-docs">No hay documentos disponibles</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="player-modal-actions">
                    {!isEditing ? (
                        <>
                            <button className="player-action-btn player-edit-btn" onClick={onEdit}>
                                ✏️ Editar
                            </button>
                            <button className="player-action-btn player-print-btn" onClick={onPrint}>
                                🖨️ Imprimir
                            </button>
                            <button 
                                className="player-action-btn player-peace-safe-btn" 
                                onClick={() => setShowPeaceAndSafeModal(true)}
                            >
                                📄 Generar Paz y Salvo
                            </button>
                            {(player.documento_pdf_url || player.registro_civil_url) && (
                                <button className="player-action-btn player-download-docs-btn" onClick={onDownloadRegister}>
                                    📄 Descargar Documentos
                                </button>
                            )}
                            <button 
                                className="player-action-btn player-delete-btn" 
                                onClick={() => {
                                    if (window.confirm(`¿Estás seguro de eliminar a ${player.nombre} ${player.apellido}?`)) {
                                        onDelete(player.id);
                                    }
                                }}
                            >
                                🗑️ Eliminar
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                className="player-action-btn player-save-btn" 
                                onClick={handleSaveWithFiles}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="player-spinner"></span>
                                        Guardando...
                                    </>
                                ) : (
                                    '💾 Guardar Cambios'
                                )}
                            </button>
                            <button 
                                className="player-action-btn player-cancel-btn" 
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                            >
                                ❌ Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Paz y Salvo */}
            <PeaceAndSafeModal
                isOpen={showPeaceAndSafeModal}
                onClose={() => setShowPeaceAndSafeModal(false)}
                onGenerate={handleGeneratePeaceAndSafe}
                playerData={{
                    name: player.nombre + ' ' + player.apellido,
                    schoolName: escuelas.find(esc => esc.id === player.escuela_id)?.nombre || 'Sin escuela',
                    id: player.id
                }}
            />
        </div>
    );
};

export default React.memo(PlayerModal);