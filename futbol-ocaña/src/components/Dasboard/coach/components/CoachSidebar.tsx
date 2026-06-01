import React from 'react';
import { CoachSidebarProps } from '../types/coachTypes';
import PlayerItem from './PlayerItem';

interface CoachSidebarPropsWithImport extends CoachSidebarProps {
  onOpenExcelImport: () => void;
  onOpenTeamRegistration: () => void;
}

const CoachSidebar: React.FC<CoachSidebarPropsWithImport> = ({
  searchTerm,
  selectedCategory,
  showCategoryDropdown,
  players,
  filteredPlayers,
  categorias,
  currentUser,
  loading,
  onSearchChange,
  onCategorySelect,
  onClearCategory,
  onToggleCategoryDropdown,
  onPlayerClick,
  onOpenExcelImport
}) => {
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'Todas las categorías';
    const category = categorias.find(cat => cat.id === selectedCategory);
    return category?.nombre || 'Categoría desconocida';
  };

  return (
    <div className="sidebar h-100 d-flex flex-column">
      
      {/* Header fijo - no hace scroll */}
      <div className="flex-shrink-0">
        <div className="search-section">
          <div className="d-flex align-items-center mb-3">
            {/* Botón de categorías */}
            <div className="position-relative me-2">
              <button 
                id="category-button"
                className={`btn btn-outline-secondary btn-sm d-flex align-items-center ${selectedCategory ? 'btn-primary text-white' : ''}`}
                onClick={onToggleCategoryDropdown}
                title="Filtrar por categoría"
              >
                <span className="me-1">📋</span>
                <span className="d-none d-md-inline">
                  {selectedCategory ? '✓' : ''}
                </span>
              </button>
              
              {showCategoryDropdown && (
                <div 
                  id="category-dropdown"
                  className="position-absolute bg-white border rounded shadow-sm mt-1"
                  style={{ 
                    zIndex: 1000, 
                    minWidth: '200px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    left: 0
                  }}
                >
                  <div className="p-2">
                    <div className="fw-bold mb-2 text-muted small">Filtrar por categoría:</div>
                    
                    <button
                      className={`btn btn-sm w-100 mb-1 text-start ${!selectedCategory ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={onClearCategory}
                    >
                      <span className="me-2">🏆</span>
                      Todas las categorías
                      {!selectedCategory && <span className="float-end">✓</span>}
                    </button>
                    
                    {categorias.map(categoria => (
                      <button
                        key={categoria.id}
                        className={`btn btn-sm w-100 mb-1 text-start ${
                          selectedCategory === categoria.id ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                        onClick={() => onCategorySelect(categoria.id)}
                      >
                        <span className="me-2">⚽</span>
                        {categoria.nombre}
                        {selectedCategory === categoria.id && <span className="float-end">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Barra de búsqueda */}
            <div className="search-input-container flex-grow-1">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Buscar jugador..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="btn btn-sm search-clear"
                  onClick={() => onSearchChange('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botón de importación Excel */}
            <button 
              className="btn btn-success btn-sm ms-2 d-flex align-items-center"
              onClick={onOpenExcelImport}
              title="Importar jugadores desde Excel"
              style={{ minWidth: 'auto' }}
            >
              <span className="me-1">📊</span>
              <span className="d-none d-md-inline">Importar</span>
            </button>
          </div>
          
          {/* Mostrar filtro activo */}
          {selectedCategory && (
            <div className="mb-3">
              <span className="badge bg-primary d-flex align-items-center justify-content-between">
                <span>📋 {getSelectedCategoryName()}</span>
                <button 
                  className="btn btn-sm p-0 ms-2 text-white border-0 bg-transparent"
                  onClick={onClearCategory}
                  style={{ fontSize: '12px', lineHeight: '1' }}
                >
                  ✕
                </button>
              </span>
            </div>
          )}
          
          {/* Estadísticas rápidas */}
          <div className="stats-section mb-3">
            <div className="small text-muted">
              {selectedCategory || searchTerm ? (
                <>
                  Mostrando: <strong>{filteredPlayers.length}</strong> de {players.length}
                  {selectedCategory && (
                    <div className="mt-1">
                      Categoría: <strong>{getSelectedCategoryName()}</strong>
                    </div>
                  )}
                </>
              ) : (
                <>
                  Total jugadores: <strong>{filteredPlayers.length}</strong>
                  {currentUser.rol === 'admin' && (
                    <span> de {players.length}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de jugadores CON SCROLL */}
      <div className="players-list-container flex-grow-1 overflow-auto">
        <div className="players-list">
          {filteredPlayers.map((player) => (
            <PlayerItem
              key={player.id}
              player={player}
              selectedCategory={selectedCategory}
              onClick={onPlayerClick}
            />
          ))}
          
          {filteredPlayers.length === 0 && !loading && (
            <div className="text-center py-4">
              <div className="text-muted">
                {selectedCategory || searchTerm ? 
                  'No se encontraron jugadores con los filtros aplicados' : 
                  (searchTerm ? 'No se encontraron jugadores' : 'No hay jugadores registrados')
                }
                {(selectedCategory || searchTerm) && (
                  <div className="mt-2">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        onSearchChange('');
                        onClearCategory();
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CoachSidebar;