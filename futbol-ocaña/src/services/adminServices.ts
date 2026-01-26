import { supabase/*, UsuarioInsert*/ } from './supabaseClient';

// Función para generar contraseña segura aleatoria
/*const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};*/

// Función para crear un nuevo administrador (versión segura)
export const createAdmin = async (adminData: {
  email: string;
  nombre: string;
  apellido: string;
  password: string; // Ahora solo usamos una contraseña
}) => {
  try {
    console.log('🔑 Creando nuevo administrador:', adminData.email);

    // Crear el usuario en Auth de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminData.email,
      password: adminData.password,
      options: {
        data: {
          nombre: adminData.nombre,
          apellido: adminData.apellido,
          is_admin: true
        }
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario en Auth:', authError);
      throw authError;
    }
    
    if (!authData.user) throw new Error('No se pudo crear el usuario en Auth');

    // Crear registro en la tabla usuarios
    const usuarioData: any = {
      id: authData.user.id,
      email: adminData.email,
      nombre: adminData.nombre,
      apellido: adminData.apellido,
      rol: 'admin',
      activo: true
    };

    // Solo agregar system_password si la columna existe
    try {
      usuarioData.system_password = adminData.password;
    } catch (e) {
      console.log('La columna system_password no existe, omitiendo...');
    }

    const { data, error } = await supabase
      .from('usuarios')
      .insert(usuarioData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando registro en usuarios:', error);
      
      // Intentar eliminar el usuario de Auth
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Error eliminando usuario de Auth:', deleteError);
      }
      
      throw error;
    }

    console.log('✅ Administrador creado exitosamente');
    return { 
      data: { 
        ...data, 
        created_at: new Date().toISOString()
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error('💥 Error general creando admin:', error);
    return { data: null, error };
  }
};

// Función para crear un nuevo entrenador (versión segura)
export const createCoach = async (coachData: {
  email: string;
  nombre: string;
  apellido: string;
  password: string; // Solo una contraseña
  escuela_id: string;
}) => {
  try {
    console.log('🔑 Creando nuevo entrenador:', coachData.email);

    // Crear el usuario en Auth de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: coachData.email,
      password: coachData.password,
      options: {
        data: {
          nombre: coachData.nombre,
          apellido: coachData.apellido,
          escuela_id: coachData.escuela_id,
          is_coach: true
        }
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario en Auth:', authError);
      throw authError;
    }
    
    if (!authData.user) throw new Error('No se pudo crear el usuario en Auth');

    // Crear registro en la tabla usuarios
    const usuarioData: any = {
      id: authData.user.id,
      email: coachData.email,
      nombre: coachData.nombre,
      apellido: coachData.apellido,
      rol: 'entrenador',
      escuela_id: coachData.escuela_id,
      activo: true
    };

    // Solo agregar system_password si la columna existe
    try {
      usuarioData.system_password = coachData.password;
    } catch (e) {
      console.log('La columna system_password no existe, omitiendo...');
    }

    const { data, error } = await supabase
      .from('usuarios')
      .insert(usuarioData)
      .select(`
        *,
        escuela:escuelas(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando registro en usuarios:', error);
      
      // Intentar eliminar el usuario de Auth
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Error eliminando usuario de Auth:', deleteError);
      }
      
      throw error;
    }

    console.log('✅ Entrenador creado exitosamente');
    return { 
      data: { 
        ...data, 
        created_at: new Date().toISOString()
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error('💥 Error general creando coach:', error);
    return { data: null, error };
  }
};

// Función para crear una nueva escuela
export const createSchool = async (schoolData: {
  nombre: string;
}) => {
  try {
    const escuelaData = {
      nombre: schoolData.nombre
    };

    const { data, error } = await supabase
      .from('escuelas')
      .insert(escuelaData)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Función para obtener todos los usuarios (admins y coaches)
export const getAllUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      escuela:escuelas(*)
    `)
    .order('nombre', { ascending: true });

  return { data, error };
};

// Función para obtener estadísticas generales
export const getAdminStats = async () => {
  try {
    const [
      { data: jugadores, error: jugadoresError },
      { data: escuelas, error: escuelasError },
      { data: usuarios, error: usuariosError },
      { data: categorias, error: categoriasError }
    ] = await Promise.all([
      supabase.from('jugadores').select('id').eq('activo', true),
      supabase.from('escuelas').select('id'),
      supabase.from('usuarios').select('id, rol').eq('activo', true),
      supabase.from('categorias').select('id')
    ]);

    if (jugadoresError || escuelasError || usuariosError || categoriasError) {
      throw new Error('Error obteniendo estadísticas');
    }

    const admins = usuarios?.filter(u => u.rol === 'admin').length || 0;
    const coaches = usuarios?.filter(u => u.rol === 'entrenador').length || 0;

    return {
      totalJugadores: jugadores?.length || 0,
      totalEscuelas: escuelas?.length || 0,
      totalAdmins: admins,
      totalCoaches: coaches,
      totalCategorias: categorias?.length || 0
    };
  } catch (error: any) {
    console.error('Error getting admin stats:', error);
    return { 
      totalJugadores: 0,
      totalEscuelas: 0,
      totalAdmins: 0,
      totalCoaches: 0,
      totalCategorias: 0,
      error: error.message 
    };
  }
};

// Función para verificar si un usuario existe por email (para recuperación)
export const checkUserExistsByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo')
      .eq('email', email.trim())
      .single();

    if (error) {
      // Usuario no encontrado
      if (error.code === 'PGRST116') {
        return { exists: false, data: null, error: null };
      }
      throw error;
    }

    return { 
      exists: true, 
      data: {
        ...data,
        estado: data.activo ? 'Activo' : 'Inactivo',
        tipo: data.rol === 'admin' ? 'Administrador' : 'Entrenador'
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error('❌ Error verificando usuario:', error);
    return { exists: false, data: null, error };
  }
};

// Función para enviar email de recuperación de contraseña
export const sendPasswordRecoveryEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/update-password`,
      }
    );

    if (error) throw error;

    return { success: true, error: null };
  } catch (error: any) {
    console.error('❌ Error enviando email de recuperación:', error);
    return { success: false, error };
  }
};