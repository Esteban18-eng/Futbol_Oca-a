import React, { useState } from 'react';
import FileUpload from '../../../shared/components/fileUpload';
import { AddPlayerModalProps } from '../types/coachTypes';

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  show,
  newPlayer,
  paises,
  departamentos,
  ciudades,
  categorias,
  escuelas,
  selectedPaisId,
  selectedDepartamentoId,
  currentUser,
  isUploading,
  uploadProgress,
  fileErrors,
  onClose,
  onSubmit,
  onInputChange,
  onFileSelect,
  onLoadDepartamentos,
  onLoadCiudades
}) => {
  if (!show) return null;

  // Estado para almacenar los archivos seleccionados
  const [selectedFiles, setSelectedFiles] = useState({
    foto_perfil: null as File | null,
    documento_pdf: null as File | null,
    registro_civil: null as File | null
  });

  // Función para manejar la selección de archivos
  const handleFileSelect = (fileType: keyof typeof selectedFiles, file: File | null) => {
    console.log('Archivo seleccionado:', {
      tipo: fileType,
      archivo: file ? file.name : 'null',
      tamaño: file ? file.size + ' bytes' : 'N/A',
      tipoMIME: file ? file.type : 'N/A'
    });
    
    // Actualizar estado local con el archivo seleccionado
    setSelectedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
    
    // Llamar a la función original del padre
    onFileSelect(fileType, file);
  };

  // Función para manejar el cambio de país
  const handlePaisChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    onInputChange(e);
    
    const selectedPais = paises.find(p => p.nombre === value);
    if (selectedPais) {
      await onLoadDepartamentos(selectedPais.id);
    }
  };

  // Función para manejar el cambio de departamento
  const handleDepartamentoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    onInputChange(e);
    
    const selectedDepto = departamentos.find(d => d.nombre === value);
    if (selectedDepto) {
      await onLoadCiudades(selectedDepto.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-player-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            AGREGAR NUEVO JUGADOR
            {isUploading && (
              <span className="ms-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Subiendo archivos...</span>
                </div>
              </span>
            )}
          </h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={(e) => {
            console.log('Formulario enviado');
            console.log('Datos del jugador:', newPlayer);
            onSubmit(e);
          }}>
            {/* Sección de archivos */}
            <div className="files-section mb-4">
              <h5 className="mb-3">ARCHIVOS DEL JUGADOR</h5>
              
              <div className="row">
                <div className="col-md-4">
                  <FileUpload
                    type="foto_perfil"
                    label="Foto de Perfil"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    maxSize="5"
                    onFileSelect={handleFileSelect}
                    currentFile={selectedFiles.foto_perfil}
                    error={fileErrors.foto_perfil}
                    required={true}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress.foto_perfil}
                  />
                </div>
                
                <div className="col-md-4">
                  <FileUpload
                    type="documento_pdf"
                    label="Documento de Identidad (PDF)"
                    accept="application/pdf"
                    maxSize="10"
                    onFileSelect={handleFileSelect}
                    currentFile={selectedFiles.documento_pdf}
                    error={fileErrors.documento_pdf}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress.documento_pdf}
                  />
                </div>
                
                <div className="col-md-4">
                  <FileUpload
                    type="registro_civil"
                    label="Registro Civil (PDF)"
                    accept="application/pdf"
                    maxSize="10"
                    onFileSelect={handleFileSelect}
                    currentFile={selectedFiles.registro_civil}
                    error={fileErrors.registro_civil}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress.registro_civil}
                  />
                </div>
              </div>

              {fileErrors.general && (
                <div className="alert alert-danger mt-2">
                  Error general: {fileErrors.general}
                </div>
              )}
            </div>

            <hr />

            {/* Datos personales */}
            <h5 className="mb-3">DATOS PERSONALES</h5>
            
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="documento" className="form-label">
                    Documento <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="documento"
                    name="documento"
                    value={newPlayer.documento || ''}
                    onChange={onInputChange}
                    placeholder="123456789"
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="fecha_nacimiento" className="form-label">
                    Fecha de Nacimiento <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    value={newPlayer.fecha_nacimiento || ''}
                    onChange={onInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">
                    Nombre <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nombre"
                    name="nombre"
                    value={newPlayer.nombre || ''}
                    onChange={onInputChange}
                    placeholder="Nombre del jugador"
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="apellido" className="form-label">
                    Apellido <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="apellido"
                    name="apellido"
                    value={newPlayer.apellido || ''}
                    onChange={onInputChange}
                    placeholder="Apellido del jugador"
                    required
                  />
                </div>
              </div>
            </div>

            <hr />

            <h5 className="mb-3">UBICACIÓN</h5>
            
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="pais" className="form-label">
                    País <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    id="pais"
                    name="pais"
                    value={newPlayer.pais || ''}
                    onChange={handlePaisChange}
                    required
                  >
                    <option value="">Seleccione un país</option>
                    {paises.map(pais => (
                      <option key={pais.id} value={pais.nombre}>{pais.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="departamento" className="form-label">
                    Departamento <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    id="departamento"
                    name="departamento"
                    value={newPlayer.departamento || ''}
                    onChange={handleDepartamentoChange}
                    disabled={!selectedPaisId}
                    required
                  >
                    <option value="">
                      {!selectedPaisId ? 'Seleccione primero un país' : 'Seleccione un departamento'}
                    </option>
                    {departamentos.map(depto => (
                      <option key={depto.id} value={depto.nombre}>{depto.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="ciudad" className="form-label">
                    Ciudad <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    id="ciudad"
                    name="ciudad"
                    value={newPlayer.ciudad || ''}
                    onChange={onInputChange}
                    disabled={!selectedDepartamentoId}
                    required
                  >
                    <option value="">
                      {!selectedDepartamentoId ? 'Seleccione primero un departamento' : 'Seleccione una ciudad'}
                    </option>
                    {ciudades.map(ciudad => (
                      <option key={ciudad.id} value={ciudad.nombre}>{ciudad.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <hr />

            <h5 className="mb-3">INFORMACIÓN DEPORTIVA</h5>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="categoria_id" className="form-label">
                    Categoría <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    id="categoria_id"
                    name="categoria_id"
                    value={newPlayer.categoria_id || ''}
                    onChange={onInputChange}
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="escuela_id" className="form-label">
                    Club o Escuela <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    id="escuela_id"
                    name="escuela_id"
                    value={newPlayer.escuela_id || ''}
                    onChange={onInputChange}
                    disabled={currentUser.rol === 'entrenador'}
                    required
                  >
                    <option value="">Seleccione una escuela</option>
                    {escuelas.map(escuela => (
                      <option key={escuela.id} value={escuela.id}>{escuela.nombre}</option>
                    ))}
                  </select>
                  {currentUser.rol === 'entrenador' && (
                    <small className="text-muted">
                      Solo puedes agregar jugadores a tu escuela asignada
                    </small>
                  )}
                </div>
              </div>
            </div>

            <hr />

            <h5 className="mb-3">INFORMACIÓN MÉDICA</h5>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="eps" className="form-label">
                    EPS <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="eps"
                    name="eps"
                    value={newPlayer.eps || ''}
                    onChange={onInputChange}
                    placeholder="Nueva EPS"
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="tipo_eps" className="form-label">
                    Tipo de EPS <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    id="tipo_eps"
                    name="tipo_eps"
                    value={newPlayer.tipo_eps || 'Subsidiado'}
                    onChange={onInputChange}
                    required
                  >
                    <option value="Subsidiado">Subsidiado</option>
                    <option value="Contributivo">Contributivo</option>
                    <option value="Especial">Especial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="submit" 
                className="btn btn-success action-btn"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creando Jugador...
                  </>
                ) : (
                  <>Crear Jugador</>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary action-btn"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;