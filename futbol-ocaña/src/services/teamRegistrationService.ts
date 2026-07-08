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

export const getEquiposByEscuela = async (escuelaId: string) => {
  try {
    const { data, error } = await supabase
      .from('equipos' as any)
      .select('*')
      .eq('escuela_id', escuelaId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null as EquipoRegistro[] | null, error }
    }

    return { data: data as unknown as EquipoRegistro[] | null, error: null }
  } catch (error) {
    console.error('getEquiposByEscuela error:', error)
    return { data: null as EquipoRegistro[] | null, error }
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
      return { data: null as EquipoRegistro | null, error }
    }

    return { data: data as unknown as EquipoRegistro | null, error: null }
  } catch (error) {
    console.error('createEquipo error:', error)
    return { data: null as EquipoRegistro | null, error }
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
      return { data: null as EquipoJugadorAsignacion[] | null, error: insertResult.error }
    }

    const insertedData = insertResult.data as unknown as EquipoJugadorAsignacion[] | null
    const { error: updateError } = await supabase
      .from('jugadores')
      .update({ activo: true })
      .in('id', playerIds)

    if (updateError) {
      return { data: insertedData, error: updateError }
    }

    return { data: insertedData, error: null }
  } catch (error) {
    console.error('assignPlayersToEquipo error:', error)
    return { data: null as EquipoJugadorAsignacion[] | null, error }
  }
}

export const getPlayersByEquipo = async (equipoId: string) => {
  try {
    const { data: asigns, error: asignsError } = await supabase
      .from('equipo_jugadores' as any)
      .select('jugador_id')
      .eq('equipo_id', equipoId)

    if (asignsError) {
      return { data: null as Jugador[] | null, error: asignsError }
    }

    const jugadorIds = (asigns as any[]).map(r => r.jugador_id)
    if (!jugadorIds.length) return { data: [] as Jugador[], error: null }

    const { data: jugadores, error: jugadoresError } = await supabase
      .from('jugadores')
      .select('*, categoria:categorias(*), escuela:escuelas(*)')
      .in('id', jugadorIds)

    if (jugadoresError) return { data: null as Jugador[] | null, error: jugadoresError }
    return { data: jugadores as Jugador[] | null, error: null }
  } catch (error) {
    console.error('getPlayersByEquipo error:', error)
    return { data: null as Jugador[] | null, error }
  }
}

export const updateEquipo = async (
  equipoId: string,
  updates: Partial<Pick<EquipoRegistro, 'nombre' | 'categoria_id' | 'escuela_id' | 'estado'>>
) => {
  try {
    const { data, error } = await supabase
      .from('equipos' as any)
      .update(updates)
      .eq('id', equipoId)
      .select('*')
      .single()

    if (error) {
      return { data: null as EquipoRegistro | null, error }
    }

    return { data: data as unknown as EquipoRegistro | null, error: null }
  } catch (error) {
    console.error('updateEquipo error:', error)
    return { data: null as EquipoRegistro | null, error }
  }
}

export const deleteEquipo = async (equipoId: string) => {
  try {
    const { error } = await supabase
      .from('equipos' as any)
      .delete()
      .eq('id', equipoId)

    if (error) {
      return { data: null as boolean | null, error }
    }

    const { error: asgErr } = await supabase
      .from('equipo_jugadores' as any)
      .delete()
      .eq('equipo_id', equipoId)

    return { data: true, error: asgErr || null }
  } catch (error) {
    console.error('deleteEquipo error:', error)
    return { data: null as boolean | null, error }
  }
}

export const getAllEquipos = async () => {
  try {
    const { data, error } = await supabase
      .from('equipos' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null as EquipoRegistro[] | null, error }
    }

    return { data: data as unknown as EquipoRegistro[] | null, error: null }
  } catch (error) {
    console.error('getAllEquipos error:', error)
    return { data: null as EquipoRegistro[] | null, error }
  }
}

export const getJugadorEquippedStatus = (player: Jugador) => {
  return player.activo ? 'Jugador inscrito con participación activa' : 'Jugador registrado'
}
