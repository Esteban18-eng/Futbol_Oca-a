import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dasboard/coach/Dashboard';
import AdminDashboard from './components/Dasboard/admin/AdminDashboard';
import UpdatePassword from './components/UpdatePassword'; // Añadir esta importación
import { supabase, Usuario } from './services/supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


function App() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Refs para control de montaje y cleanup
  const isMounted = useRef(true);
  const authSubscriptionRef = useRef<any>(null);
  const initializationTimeoutRef = useRef<NodeJS.Timeout>();

  // ✅ CLEANUP COMPLETO AL DESMONTAR
  useEffect(() => {
    isMounted.current = true;
    console.log('🚀 App montada');
    
    return () => {
      console.log('🧹 App DESMONTANDO - Limpiando todo');
      isMounted.current = false;
      
      // Cancelar subscription de auth
      if (authSubscriptionRef.current) {
        try {
          authSubscriptionRef.current.unsubscribe();
          console.log('🔌 Auth subscription limpiada');
        } catch (error) {
          console.error('Error limpiando auth subscription:', error);
        }
        authSubscriptionRef.current = null;
      }
      
      // Limpiar timeouts
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      
      // Limpiar estado para prevenir memory leaks
      setUser(null);
      setLoading(false);
      setAuthChecked(false);
      
      // Forzar garbage collection en desarrollo
      if (process.env.NODE_ENV === 'development') {
        if (window.gc) {
          try {
            window.gc();
            console.log('🗑️ Forzado garbage collection en App');
          } catch (e) {
            console.log('GC no disponible en App');
          }
        }
      }
    };
  }, []);

  // ✅ Función optimizada para verificar sesión CON TIMEOUT
  const checkSession = useCallback(async () => {
    if (!isMounted.current) return null;
    
    try {
      console.log('🔍 Verificando sesión...');
      
      // Timeout de seguridad
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout verificando sesión')), 8000)
      );
      
      // Obtener sesión con timeout
      const sessionPromise = supabase.auth.getSession();
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      const { data: { session }, error: sessionError } = result;
      
      if (sessionError) {
        console.error('❌ Error obteniendo sesión:', sessionError);
        return null;
      }

      if (session?.user && isMounted.current) {
        console.log('👤 Usuario encontrado:', session.user.email);
        
        // Obtener perfil con timeout reducido
        const profilePromise = supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .eq('activo', true)
          .single();

        const profileTimeout = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout obteniendo perfil')), 5000)
        );

        try {
          const profileResult = await Promise.race([profilePromise, profileTimeout]) as any;
          const { data: profile, error: profileError } = profileResult;
          
          if (profileError) {
            console.error('❌ Error obteniendo perfil:', profileError);
            return null;
          }
          
          if (profile && isMounted.current) {
            console.log('✅ Perfil cargado:', profile.nombre);
            return profile as Usuario;
          }
        } catch (profileError: any) {
          console.error('❌ Error en promise race de perfil:', profileError.message);
          return null;
        }
      } else {
        console.log('ℹ️ No hay sesión activa');
      }
      
      return null;
    } catch (error: any) {
      console.error('💥 Error crítico en checkSession:', error.message);
      return null;
    }
  }, []);

  // ✅ INICIALIZACIÓN SEGURA
  useEffect(() => {
    if (!isMounted.current) return;
    
    let mounted = true;
    const abortController = new AbortController();
    
    const initializeAuth = async () => {
      if (!mounted || !isMounted.current) return;
      
      try {
        // Timeout de inicialización
        initializationTimeoutRef.current = setTimeout(() => {
          if (mounted && isMounted.current) {
            console.warn('⚠️ Timeout en inicialización de auth');
            setLoading(false);
            setAuthChecked(true);
          }
        }, 15000);
        
        // Verificar sesión inicial
        const userData = await checkSession();
        
        if (mounted && isMounted.current) {
          if (userData) {
            setUser(userData);
          } else {
            setUser(null);
          }
          
          setLoading(false);
          setAuthChecked(true);
          clearTimeout(initializationTimeoutRef.current);
        }
        
        // ✅ SUSCRIPCIÓN SEGURA A CAMBIOS DE AUTH
        if (mounted && isMounted.current && !authSubscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (!mounted || !isMounted.current || abortController.signal.aborted) return;
              
              console.log('🔄 Cambio de estado de auth:', event);
              
              // Usar debounce para evitar múltiples updates rápidos
              if (authSubscriptionRef.current?.debounceTimeout) {
                clearTimeout(authSubscriptionRef.current.debounceTimeout);
              }
              
              authSubscriptionRef.current.debounceTimeout = setTimeout(async () => {
                if (!mounted || !isMounted.current || abortController.signal.aborted) return;
                
                switch (event) {
                  case 'SIGNED_IN':
                    console.log('🔑 Usuario firmó sesión');
                    if (session?.user) {
                      const userData = await checkSession();
                      if (mounted && isMounted.current && userData) {
                        setUser(userData);
                      }
                    }
                    break;
                    
                  case 'SIGNED_OUT':
                    console.log('🚪 Usuario cerró sesión');
                    if (mounted && isMounted.current) {
                      setUser(null);
                    }
                    break;
                    
                  case 'USER_UPDATED':
                    // Actualizar datos del usuario
                    if (session?.user) {
                      const userData = await checkSession();
                      if (mounted && isMounted.current && userData) {
                        setUser(userData);
                      }
                    }
                    break;
                    
                  case 'TOKEN_REFRESHED':
                    // No hacer nada explícitamente
                    break;
                    
                  default:
                    console.log('📝 Evento de auth no manejado:', event);
                }
              }, 300); // Debounce de 300ms
            }
          );
          
          authSubscriptionRef.current = {
            unsubscribe: subscription.unsubscribe,
            debounceTimeout: null as NodeJS.Timeout | null
          };
        }
        
      } catch (error: any) {
        console.error('💥 Error en initializeAuth:', error.message);
        if (mounted && isMounted.current) {
          setLoading(false);
          setAuthChecked(true);
          setUser(null);
        }
      }
    };

    initializeAuth();
    
    return () => {
      mounted = false;
      abortController.abort();
      
      // Limpiar debounce timeout
      if (authSubscriptionRef.current?.debounceTimeout) {
        clearTimeout(authSubscriptionRef.current.debounceTimeout);
      }
      
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, [checkSession]);

  const handleLogout = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Limpiar subscription temporalmente
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
      
      await supabase.auth.signOut();
      
      if (isMounted.current) {
        setUser(null);
        console.log('✅ Sesión cerrada exitosamente');
      }
      
      // Re-crear subscription después de logout
      setTimeout(() => {
        if (isMounted.current && !authSubscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {});
          authSubscriptionRef.current = {
            unsubscribe: subscription.unsubscribe,
            debounceTimeout: null
          };
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error durante logout:', error.message);
    }
  }, []);

  // ✅ Loading optimizado CON TIMEOUT
  if (loading && !authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ 
            width: '4rem', 
            height: '4rem',
            borderWidth: '0.5rem'
          }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-4 text-muted" style={{ fontSize: '1.1rem' }}>
            Inicializando aplicación...
          </p>
          <div className="progress mt-3" style={{ width: '200px', margin: '0 auto' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated" 
              style={{ width: '75%' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ DEBUG: Mostrar estado actual (solo desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Estado App - User:', user ? `${user.nombre} (${user.rol})` : 'null', 
                'Loading:', loading, 
                'AuthChecked:', authChecked,
                'Mounted:', isMounted.current);
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta de login */}
          <Route 
            path="/login" 
            element={
              !user ? (
                <Login />
              ) : (
                <Navigate 
                  to={user.rol === 'admin' ? '/admin-dashboard' : '/coach-dashboard'} 
                  replace 
                  state={{ from: 'login' }}
                />
              )
            } 
          />
          
          {/* Ruta para actualizar contraseña (accesible sin estar logueado) */}
          <Route 
            path="/update-password" 
            element={
              <UpdatePassword />
            } 
          />
          
          {/* Ruta del dashboard de entrenador */}
          <Route 
            path="/coach-dashboard" 
            element={
              user ? (
                user.rol === 'entrenador' ? (
                  <Dashboard onLogout={handleLogout} currentUser={user} />
                ) : (
                  <Navigate to="/admin-dashboard" replace state={{ from: 'coach-redirect' }} />
                )
              ) : (
                <Navigate to="/login" replace state={{ from: 'coach-auth' }} />
              )
            } 
          />
          
          {/* Ruta del dashboard de administrador */}
          <Route 
            path="/admin-dashboard" 
            element={
              user ? (
                user.rol === 'admin' ? (
                  <AdminDashboard onLogout={handleLogout} currentUser={user} />
                ) : (
                  <Navigate to="/coach-dashboard" replace state={{ from: 'admin-redirect' }} />
                )
              ) : (
                <Navigate to="/login" replace state={{ from: 'admin-auth' }} />
              )
            } 
          />
          
          {/* Ruta raíz - redirección automática */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={user ? (user.rol === 'admin' ? '/admin-dashboard' : '/coach-dashboard') : '/login'} 
                replace 
                state={{ from: 'root' }}
              />
            } 
          />

          {/* Ruta de fallback con mensaje útil */}
          <Route 
            path="*" 
            element={
              <div style={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                textAlign: 'center',
                padding: '20px'
              }}>
                <h1 className="text-muted mb-4">404 - Página no encontrada</h1>
                <p className="mb-4">La página que buscas no existe.</p>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/'}
                  >
                    Volver al inicio
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => window.location.href = '/login'}
                  >
                    Ir al login
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;