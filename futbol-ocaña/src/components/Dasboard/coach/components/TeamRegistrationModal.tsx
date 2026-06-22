import React from 'react'
import { Categoria, Jugador } from '../../../../services/supabaseClient'
import { EquipoRegistro } from '../../../../services/teamRegistrationService'

interface TeamRegistrationModalProps {
  show: boolean
  onClose: () => void
  categorias: Categoria[]
  players: Jugador[]
  teams: EquipoRegistro[]
  selectedTeam: EquipoRegistro | null
  teamName: string
  teamCategoryId: string
  selectedPlayerIds: string[]
  message?: string | null
  error?: string | null
  onCreateTeam: (nombre: string, categoriaId: string) => Promise<void>
  onSelectTeam: (team: EquipoRegistro) => void
  onPlayerToggle: (playerId: string) => void
  onAssignPlayers: () => Promise<void>
  onChangeTeamName: (value: string) => void
  onChangeTeamCategory: (value: string) => void
}

const TeamRegistrationModal: React.FC<TeamRegistrationModalProps> = ({
  show,
  onClose,
  categorias,
  players,
  teams,
  selectedTeam,
  teamName,
  teamCategoryId,
  selectedPlayerIds,
  message,
  error,
  onCreateTeam,
  onSelectTeam,
  onPlayerToggle,
  onAssignPlayers,
  onChangeTeamName,
  onChangeTeamCategory
}) => {
  if (!show) return null

  // Allow selecting players even if their category differs from the team
  const playersByCategory = selectedTeam
    ? players
    : teamCategoryId
      ? players.filter(player => player.categoria_id === teamCategoryId)
      : []

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Inscripción de Equipos por Categoría</h5>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="alert alert-success" role="alert">
                {message}
              </div>
            )}

            <div className="row">
              <div className="col-lg-5 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Equipos inscritos</h6>
                    {teams.length === 0 ? (
                      <p className="text-muted">No hay equipos inscritos aún.</p>
                    ) : (
                      <div className="list-group">
                        {teams.map(team => (
                          <button
                            key={team.id}
                            type="button"
                            className={`list-group-item list-group-item-action ${selectedTeam?.id === team.id ? 'active' : ''}`}
                            onClick={() => onSelectTeam(team)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <span>{team.nombre}</span>
                              <small className="text-muted">{categorias.find(cat => cat.id === team.categoria_id)?.nombre || 'Sin categoría'}</small>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-7 mb-4">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Crear nueva inscripción de equipo</h6>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (teamName && teamCategoryId) {
                          onCreateTeam(teamName, teamCategoryId)
                        }
                      }}
                    >
                      <div className="mb-3">
                        <label htmlFor="teamName" className="form-label">Nombre del equipo</label>
                        <input
                          id="teamName"
                          value={teamName}
                          onChange={(e) => onChangeTeamName(e.target.value)}
                          className="form-control"
                          placeholder="Ej. Tigres Sub-12"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="teamCategory" className="form-label">Categoría</label>
                        <select
                          id="teamCategory"
                          className="form-select"
                          value={teamCategoryId}
                          onChange={(e) => onChangeTeamCategory(e.target.value)}
                          required
                        >
                          <option value="">Seleccione una categoría</option>
                          {categorias.map(categoria => (
                            <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary w-100">
                        Inscribir equipo
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {selectedTeam && (
              <div className="card mb-3">
                <div className="card-body">
                  <h6 className="card-title">Registrar jugadores para el equipo</h6>
                  <p className="text-muted mb-3">
                    Seleccione únicamente jugadores registrados en la base de datos del club y en la categoría del equipo.
                  </p>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                            <th></th>
                            <th>Nombre</th>
                            <th>Documento</th>
                            <th>Fecha Nac.</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                          </tr>
                      </thead>
                      <tbody>
                            {playersByCategory.length > 0 ? playersByCategory.map(player => (
                          <tr key={player.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedPlayerIds.includes(player.id)}
                                onChange={() => onPlayerToggle(player.id)}
                              />
                            </td>
                            <td>{player.nombre} {player.apellido}</td>
                            <td>{player.documento}</td>
                                <td>{player.fecha_nacimiento ? new Date(player.fecha_nacimiento).toLocaleDateString() : ''}</td>
                                <td>{categorias.find(cat => cat.id === player.categoria_id)?.nombre || player.categoria?.nombre || 'Sin categoría'}</td>
                            <td>{player.activo ? 'Activo' : 'Registrado'}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="text-center text-muted py-4">
                              {teamCategoryId || selectedTeam ? 'No existen jugadores registrados en la categoría seleccionada.' : 'Seleccione una categoría o un equipo para ver jugadores.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="btn btn-success"
                    disabled={selectedPlayerIds.length === 0}
                    onClick={onAssignPlayers}
                  >
                    Registrar jugadores seleccionados con participación activa
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamRegistrationModal
