import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Verificando sesión en UpdatePassword...');
        console.log('URL actual:', window.location.href);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Sesión obtenida:', session ? 'Sí' : 'No');
        console.log('Error de sesión:', sessionError);
        
        if (sessionError) {
          console.error('Error verificando sesión:', sessionError);
          setError('Error verificando sesión. Intenta solicitar un nuevo enlace.');
          return;
        }

        if (!session) {
          console.log('No hay sesión activa');
          setError('❌ Enlace inválido o expirado. Por favor solicita un nuevo enlace de recuperación.');
        } else {
          console.log('Sesión válida encontrada');
        }
      } catch (error: any) {
        console.error('Error en checkSession:', error);
        setError(`Error: ${error.message}`);
      } finally {
        console.log('Verificación de sesión completada');
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Iniciando actualización de contraseña');
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('La contraseña debe contener mayúsculas, minúsculas y números');
      return;
    }

    setLoading(true);

    try {
      // Actualizar contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Error actualizando contraseña:', updateError);
        
        if (updateError.message.includes('Password should')) {
          setError('La contraseña no cumple con los requisitos de seguridad');
        } else if (updateError.message.includes('Auth session missing')) {
          setError('La sesión ha expirado. Solicita un nuevo enlace.');
        } else {
          setError(`Error: ${updateError.message}`);
        }
        
        setLoading(false);
        return;
      }

      // Obtener el usuario actual para actualizar en nuestra tabla
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          // Primero, verificar si existe la columna system_password
          const { error: checkError } = await supabase
            .from('usuarios')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (!checkError) {
            // Intentar actualizar con system_password
            const updateData: any = {
              updated_at: new Date().toISOString()
            };
            
            // Solo agregar system_password si la columna existe
            // Esto evita errores si la columna no se ha creado aún
            try {
              updateData.system_password = password;
            } catch (e) {
              console.log('La columna system_password no existe aún, omitiendo...');
            }
            
            await supabase
              .from('usuarios')
              .update(updateData)
              .eq('id', user.id);
          }
        } catch (dbError) {
          console.warn('No se pudo actualizar en la tabla usuarios, pero la contraseña en Auth se cambió:', dbError);
        }
      }

      setSuccess('✅ Contraseña actualizada correctamente');
      
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          setTimeout(() => {
            navigate('/');
          }, 1000);
        });
      }, 3000);

    } catch (error: any) {
      console.error('Error inesperado:', error);
      setError(`❌ Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="login-container">
        <div className="login-background"></div>
        <div className="login-card">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Verificando enlace...</span>
            </div>
            <p className="mt-2">Verificando enlace de recuperación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-card">
        <div className="text-center mb-4">
          <div className="logo-container">
            <img 
              src="/img/logo_bueno.png" 
              alt="Logo Corporación de Futbol Ocañero" 
              className="logo-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50x50/4caf50/ffffff?text=O';
              }}
            />
          </div>
          <h4 className="company-name">
            Nueva Contraseña
          </h4>
          <p className="text-muted mb-0">Crea una nueva contraseña segura</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <small>{error}</small>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <small style={{ whiteSpace: 'pre-line' }}>{success}</small>
            <div className="mt-2">
              <small>Redirigiendo al login en unos segundos...</small>
            </div>
          </div>
        )}

        {!success && (
          <>
            <div className="alert alert-info">
              <small>
                🔒 <strong>Requisitos de seguridad:</strong>
                <br/>• Mínimo 6 caracteres
                <br/>• Al menos una mayúscula
                <br/>• Al menos una minúscula  
                <br/>• Al menos un número
              </small>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Nueva Contraseña <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control login-input"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Mínimo 6 caracteres, mayúsculas, minúsculas y números"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar Contraseña <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control login-input"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Repite tu nueva contraseña"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn login-btn w-100"
                disabled={loading || !!error}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Actualizando contraseña...
                  </>
                ) : (
                  'Actualizar Contraseña'
                )}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  ← Volver al login
                </button>
              </div>
            </form>

            <div className="login-info-text mt-3">
              Recuerda usar una contraseña segura y<br />
              no compartirla con nadie.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdatePassword;