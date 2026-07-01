import { supabase } from './supabaseClient'
import { Jugador } from './supabaseClient'

export interface EquipoRegistro {
  id: string
  nombre: string
  categoria_id: string
  escuela_id: string
  estado: string
  created_at: string | null
}

export interface EquipoJugadorAsignacion {
  id: string
  equipo_id: string
  jugador_id: string
  estado: string
  created_at: string | null
}

const LOCAL_STORAGE_PREFIX = 'futbol_ocana_team_registrations'
const LOCAL_ASSIGN_PREFIX = 'futbol_ocana_team_assignments'

const getLocalStorageKey = (escuelaId: string) => `${LOCAL_STORAGE_PREFIX}:${escuelaId}`
const getSharedLocalStorageKey = (escuelaId: string) => `${LOCAL_STORAGE_PREFIX}:shared:${escuelaId}`

const mergeTeams = (teams: EquipoRegistro[]) => {
  const uniqueById = new Map<string, EquipoRegistro>()
  teams.forEach((team) => {
    if (team?.id) {
      uniqueById.set(team.id, team)
    }
  })

  return Array.from(uniqueById.values()).sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
    return dateB - dateA
  })
}

const getLocalTeams = (escuelaId: string): EquipoRegistro[] => {
  if (!window?.localStorage) return []

  const keys = [getLocalStorageKey(escuelaId), getSharedLocalStorageKey(escuelaId)]
  const collected: EquipoRegistro[] = []

  try {
    keys.forEach((key) => {
      const raw = localStorage.getItem(key)
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as EquipoRegistro[]
        collected.push(...parsed)
      } catch (error) {
        console.warn(`Error leyendo equipos locales en ${key}:`, error)
      }
    })

    return mergeTeams(collected)
  } catch (error) {
    console.warn('Error leyendo equipos locales:', error)
    return []
  }
}

const saveLocalTeams = (escuelaId: string, teams: EquipoRegistro[]) => {
  if (!window?.localStorage) return
  const normalizedTeams = mergeTeams(teams)

  try {
    localStorage.setItem(getLocalStorageKey(escuelaId), JSON.stringify(normalizedTeams))
    localStorage.setItem(getSharedLocalStorageKey(escuelaId), JSON.stringify(normalizedTeams))
  } catch (error) {
    console.warn('Error guardando equipos locales:', error)
  }
}

const getLocalAssignments = (equipoId: string): EquipoJugadorAsignacion[] => {
  if (!window?.localStorage) return []
  try {
    const raw = localStorage.getItem(`${LOCAL_ASSIGN_PREFIX}:${equipoId}`)
    return raw ? (JSON.parse(raw) as EquipoJugadorAsignacion[]) : []
  } catch (error) {
    console.warn('Error leyendo asignaciones locales:', error)
    return []
  }
}

const saveLocalAssignments = (equipoId: string, assignments: EquipoJugadorAsignacion[]) => {
  if (!window?.localStorage) return
  try {
    localStorage.setItem(`${LOCAL_ASSIGN_PREFIX}:${equipoId}`, JSON.stringify(assignments))
  } catch (error) {
    console.warn('Error guardando asignaciones locales:', error)
  }
}

const getErrorMessage = (error: any): string => {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error.message === 'string') return error.message
  if (typeof error.error === 'string') return error.error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

const isTableMissing = (error: any): boolean => {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('relation "equipos" does not exist') ||
         message.includes('relation "equipo_jugadores" does not exist') ||
         message.includes('cannot find table') ||
         message.includes('public.equipos') ||
         message.includes('public.equipo_jugadores') ||
         message.includes('schema cache') ||
         error?.code === '42P01'
}

export const getEquiposByEscuela = async (escuelaId: string) => {
  try {
    const { data, error } = await supabase
      .from('equipos' as any)
      .select('*')
      .eq('escuela_id', escuelaId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isTableMissing(error)) {
        return { data: getLocalTeams(escuelaId), error: null }
      }
      return { data: null as EquipoRegistro[] | null, error }
    }

    return { data: data as unknown as EquipoRegistro[] | null, error: null }
  } catch (error) {
    console.warn('getEquiposByEscuela fallback local:', error)
    return { data: getLocalTeams(escuelaId), error: null }
  }
}

export const createEquipo = async (
  escuelaId: string,
  nombre: string,
  categoriaId: string
) => {
  const newEquipo: EquipoRegistro = {
    id: crypto.randomUUID(),
    nombre: nombre.trim(),
    categoria_id: categoriaId,
    escuela_id: escuelaId,
    estado: 'inscrito',
    created_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('equipos' as any)
      .insert({
        id: newEquipo.id,
        nombre: newEquipo.nombre,
        categoria_id: newEquipo.categoria_id,
        escuela_id: newEquipo.escuela_id,
        estado: newEquipo.estado
      })
      .select('*')
      .single()

    if (error) {
      if (isTableMissing(error)) {
        const teams = getLocalTeams(escuelaId)
        const updated = [newEquipo, ...teams]
        saveLocalTeams(escuelaId, updated)
        return { data: newEquipo, error: null }
      }
      return { data: null as EquipoRegistro | null, error }
    }

    return { data: data as unknown as EquipoRegistro | null, error: null }
  } catch (error) {
    console.warn('createEquipo fallback local:', error)
    const teams = getLocalTeams(escuelaId)
    const updated = [newEquipo, ...teams]
    saveLocalTeams(escuelaId, updated)
    return { data: newEquipo, error: null }
  }
}

export const assignPlayersToEquipo = async (
  equipoId: string,
  playerIds: string[]
) => {
  if (!playerIds.length) {
    return { data: null as EquipoJugadorAsignacion[] | null, error: null }
  }

  const assignments = playerIds.map((jugadorId) => ({
    id: crypto.randomUUID(),
    equipo_id: equipoId,
    jugador_id: jugadorId,
    estado: 'Jugador inscrito con participación activa',
    created_at: new Date().toISOString()
  }))

  try {
    const insertResult = await supabase
      .from('equipo_jugadores' as any)
      .insert(assignments)
      .select('*')

    if (insertResult.error) {
      if (isTableMissing(insertResult.error)) {
        console.warn('assignPlayersToEquipo fallback local, no equipo_jugadores table')
        // save locally
        const existing = getLocalAssignments(equipoId)
        const updated = [...assignments, ...existing]
        saveLocalAssignments(equipoId, updated)
      } else {
        return { data: null as EquipoJugadorAsignacion[] | null, error: insertResult.error }
      }
    }

    const { error: updateError } = await supabase
      .from('jugadores')
      .update({ activo: true })
      .in('id', playerIds)

    if (updateError) {
      return { data: null as EquipoJugadorAsignacion[] | null, error: updateError }
    }

    return { data: insertResult.data as EquipoJugadorAsignacion[] | null ?? assignments, error: null }
  } catch (error) {
    console.warn('assignPlayersToEquipo fallback update only:', error)
    const { error: updateError } = await supabase
      .from('jugadores')
      .update({ activo: true })
      .in('id', playerIds)

    if (updateError) {
      return { data: null as EquipoJugadorAsignacion[] | null, error: updateError }
    }

    // store locally as last resort
    const existing = getLocalAssignments(equipoId)
    const updated = [...assignments, ...existing]
    saveLocalAssignments(equipoId, updated)

    return { data: assignments, error: null }
  }
}

export const getPlayersByEquipo = async (equipoId: string) => {
  try {
    const { data: asigns, error: asignsError } = await supabase
      .from('equipo_jugadores' as any)
      .select('jugador_id, estado, created_at')
      .eq('equipo_id', equipoId)

    if (asignsError) {
      if (isTableMissing(asignsError)) {
        const local = getLocalAssignments(equipoId)
        const jugadorIds = local.map(a => a.jugador_id)
        if (!jugadorIds.length) return { data: [] as Jugador[], error: null }

        const { data: jugadores, error: jugadoresError } = await supabase
          .from('jugadores')
          .select('*')
          .in('id', jugadorIds)

        if (jugadoresError) return { data: null as Jugador[] | null, error: jugadoresError }
        return { data: jugadores as Jugador[] | null, error: null }
      }
      return { data: null as Jugador[] | null, error: asignsError }
    }

    const jugadorIds = (asigns as any[]).map(r => r.jugador_id)
    if (!jugadorIds.length) return { data: [] as Jugador[], error: null }

    const { data: jugadores, error: jugadoresError } = await supabase
      .from('jugadores')
      .select('*')
      .in('id', jugadorIds)

    if (jugadoresError) return { data: null as Jugador[] | null, error: jugadoresError }
    return { data: jugadores as Jugador[] | null, error: null }
  } catch (error) {
    console.warn('getPlayersByEquipo fallback local:', error)
    const local = getLocalAssignments(equipoId)
    const jugadorIds = local.map(a => a.jugador_id)
    if (!jugadorIds.length) return { data: [] as Jugador[], error: null }

    const { data: jugadores, error: jugadoresError } = await supabase
      .from('jugadores')
      .select('*')
      .in('id', jugadorIds)

    if (jugadoresError) return { data: null as Jugador[] | null, error: jugadoresError }
    return { data: jugadores as Jugador[] | null, error: null }
  }
}

export const updateEquipo = async (
  equipoId: string,
  updates: Partial<Pick<EquipoRegistro, 'nombre' | 'categoria_id' | 'escuela_id' | 'estado'>>,
  escuelaId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('equipos' as any)
      .update(updates)
      .eq('id', equipoId)
      .select('*')
      .single()

    if (error) {
      if (isTableMissing(error)) {
        if (escuelaId) {
          const teams = getLocalTeams(escuelaId).map((team) =>
            team.id === equipoId ? { ...team, ...updates } : team
          )
          saveLocalTeams(escuelaId, teams)
        }
        return { data: null as EquipoRegistro | null, error: null }
      }
      return { data: null as EquipoRegistro | null, error }
    }

    return { data: data as unknown as EquipoRegistro | null, error: null }
  } catch (error) {
    console.warn('updateEquipo fallback local:', error)
    if (escuelaId) {
      const teams = getLocalTeams(escuelaId).map((team) =>
        team.id === equipoId ? { ...team, ...updates } : team
      )
      saveLocalTeams(escuelaId, teams)
    }
    return { data: null as EquipoRegistro | null, error: null }
  }
}

export const deleteEquipo = async (equipoId: string, escuelaId?: string) => {
  try {
    const { error } = await supabase
      .from('equipos' as any)
      .delete()
      .eq('id', equipoId)

    if (error) {
      if (isTableMissing(error)) {
        // remove from local teams
        if (escuelaId) {
          const teams = getLocalTeams(escuelaId).filter(t => t.id !== equipoId)
          saveLocalTeams(escuelaId, teams)
        }
        // remove local assignments
        try { localStorage.removeItem(`${LOCAL_ASSIGN_PREFIX}:${equipoId}`) } catch {}
        return { data: true, error: null }
      }
      return { data: null as boolean | null, error }
    }

    // try removing assignments in DB if exists
    const { error: asgErr } = await supabase
      .from('equipo_jugadores' as any)
      .delete()
      .eq('equipo_id', equipoId)

    try { localStorage.removeItem(`${LOCAL_ASSIGN_PREFIX}:${equipoId}`) } catch {}

    return { data: true, error: asgErr || null }
  } catch (error) {
    console.warn('deleteEquipo fallback local:', error)
    if (escuelaId) {
      const teams = getLocalTeams(escuelaId).filter(t => t.id !== equipoId)
      saveLocalTeams(escuelaId, teams)
    }
    try { localStorage.removeItem(`${LOCAL_ASSIGN_PREFIX}:${equipoId}`) } catch {}
    return { data: true, error: null }
  }
}

export const getAllEquipos = async () => {
  try {
    const { data, error } = await supabase
      .from('equipos' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (isTableMissing(error)) {
        const entries: EquipoRegistro[] = []

        if (!window?.localStorage) {
          return { data: entries, error: null }
        }

        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(LOCAL_STORAGE_PREFIX)) {
              const raw = localStorage.getItem(key)
              if (!raw) return
              const teams = JSON.parse(raw) as EquipoRegistro[]
              entries.push(...teams)
            }
          })
        } catch (localError) {
          console.warn('getAllEquipos fallback local storage error:', localError)
        }

        return { data: mergeTeams(entries), error: null }
      }
      return { data: null as EquipoRegistro[] | null, error }
    }

    return { data: data as unknown as EquipoRegistro[] | null, error: null }
  } catch (error) {
    console.warn('getAllEquipos fallback local storage:', error)
    const entries: EquipoRegistro[] = []

    if (!window?.localStorage) {
      return { data: entries, error: null }
    }

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(LOCAL_STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key)
          if (!raw) return
          const teams = JSON.parse(raw) as EquipoRegistro[]
          entries.push(...teams)
        }
      })
    } catch (localError) {
      console.warn('getAllEquipos fallback local storage error:', localError)
    }

    return { data: mergeTeams(entries), error: null }
  }
}

export const getJugadorEquippedStatus = (player: Jugador) => {
  return player.activo ? 'Jugador inscrito con participación activa' : 'Jugador registrado'
}
