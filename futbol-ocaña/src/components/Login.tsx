import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import { supabase } from '../services/supabaseClient';
import { checkUserExistsByEmail, sendPasswordRecoveryEmail } from '../services/adminServices';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'contact'>('email');
  const [adminContactInfo/*, setAdminContactInfo*/] = useState({
    email: 'admin@futbolocañero.com',
    phone: '',
    office: 'Oficina principal - Corporación de Futbol Ocañero'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones básicas
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      setIsLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError('La contraseña es obligatoria');
      setIsLoading(false);
      return;
    }

    try {
      // Intentar login con Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de ingresar');
        } else {
          setError(`Error de autenticación: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Verificar que el usuario esté activo en la tabla usuarios
        const { data: profile, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          setError('No se encontró el perfil del usuario');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (!profile.activo) {
          setError('Tu cuenta está desactivada. Contacta al administrador.');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // Éxito - Redirección manual para asegurar
        console.log('Login exitoso, redirigiendo...');
        
        // Esperar un momento para que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirección manual basada en el rol
        window.location.href = profile.rol === 'admin' ? '/admin-dashboard' : '/coach-dashboard';
      }
    } catch (error: any) {
      setError(`Error de conexión: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Función para recuperar contraseña via email (Supabase)
  const handleRecoverPasswordByEmail = async () => {
    if (!recoveryEmail.trim()) {
      setRecoveryMessage('❌ Por favor ingresa tu email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail.trim())) {
      setRecoveryMessage('❌ Por favor ingresa un email válido');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryMessage('');

    try {
      // Primero verificar si el usuario existe
      const userCheck = await checkUserExistsByEmail(recoveryEmail);
      
      if (!userCheck.exists) {
        setRecoveryMessage('❌ No se encontró una cuenta con este email');
        setRecoveryLoading(false);
        return;
      }

      if (userCheck.data && !userCheck.data.activo) {
        setRecoveryMessage(`
          ⚠️ CUENTA DESACTIVADA
          
          Usuario: ${userCheck.data.nombre} ${userCheck.data.apellido}
          Email: ${userCheck.data.email}
          
          Tu cuenta está desactivada.
          Contacta al administrador para reactivarla.
          
          👨‍💼 Administrador: ${adminContactInfo.email}
        `);
        setRecoveryLoading(false);
        return;
      }

      // Enviar email de recuperación usando Supabase
      const result = await sendPasswordRecoveryEmail(recoveryEmail);
      
      if (result.error) {
        console.error('Error enviando email de recuperación:', result.error);
        
        let errorMessage = '❌ No pudimos enviar el email automáticamente.\n\n';
        
        if (result.error.message.includes('rate limit')) {
          errorMessage += 'Demasiados intentos. Por favor espera unos minutos e intenta nuevamente.';
        } else if (result.error.message.includes('not found')) {
          errorMessage += 'No se encontró una cuenta con este email.';
        } else {
          errorMessage += 'Por favor contacta al administrador para ayuda directa.';
        }
        
        errorMessage += `\n\n👨‍💼 Contacta al administrador:\nEmail: ${adminContactInfo.email}`;
        
        setRecoveryMessage(errorMessage);
      } else {
        setRecoveryMessage(`
          ✅ EMAIL ENVIADO CON ÉXITO
          
          Se ha enviado un enlace de recuperación a:
          **${recoveryEmail}**
          
          📝 INSTRUCCIONES:
          1. Revisa tu bandeja de entrada
          2. Busca el email de "Restablecer contraseña"
          3. Haz clic en el enlace del email
          4. Sigue las instrucciones para crear una nueva contraseña
          
          ⏰ El enlace expira en 24 horas.
          📧 Si no ves el email, revisa la carpeta de SPAM o CORREO NO DESEADO
          
          ¿No recibiste el email?
          • Espera unos minutos
          • Revisa todas las carpetas de tu email
          • Si aún no lo ves, contacta al administrador
        `);
      }

    } catch (error: any) {
      console.error('Error en recuperación por email:', error);
      setRecoveryMessage(`❌ Error inesperado: ${error.message}`);
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Función para mostrar opciones de contacto con el administrador
  const handleShowContactOptions = () => {
    const userInfo = recoveryEmail ? `\n📧 Tu email: ${recoveryEmail}` : '';
    
    setRecoveryMessage(`
      📞 CONTACTA AL ADMINISTRADOR
      
      Si no puedes recuperar tu contraseña automáticamente,
      contacta al administrador del sistema:${userInfo}
      
      👨‍💼 INFORMACIÓN DE CONTACTO:
      • Email: ${adminContactInfo.email}
      • ${adminContactInfo.phone ? `Teléfono: ${adminContactInfo.phone}\n` : ''}
      • Oficina: ${adminContactInfo.office}
      
      📋 INFORMACIÓN QUE DEBES PROPORCIONAR:
      1. Tu nombre completo
      2. Tu email registrado
      3. Tu escuela (si eres entrenador)
      4. Descripción del problema
      
      ⏰ TIEMPO DE RESPUESTA:
      • Generalmente responde en 24-48 horas
      • Días hábiles de lunes a viernes
      • Horario de atención: 8:00 AM - 5:00 PM
      
      🔧 EL ADMINISTRADOR PUEDE AYUDARTE CON:
      • Reactivar tu cuenta
      • Restablecer tu contraseña
      • Solucionar problemas de acceso
      • Responder preguntas sobre el sistema
      
      ¿Ya contactaste al administrador?
      ✅ Sí - Espera su respuesta por email
      ❌ No - Usa la información de contacto arriba
    `);
  };

  // Función para mostrar/ocultar contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Función para resetear el formulario de recuperación
  const resetRecoveryForm = () => {
    setRecoveryEmail('');
    setRecoveryMessage('');
    setRecoveryMethod('email');
    setRecoveryLoading(false);
  };

  // Función para copiar información de contacto al portapapeles
  /*const copyContactInfo = () => {
    const contactText = `Contacto Administrador:\nEmail: ${adminContactInfo.email}\n${adminContactInfo.phone ? `Teléfono: ${adminContactInfo.phone}\n` : ''}Oficina: ${adminContactInfo.office}`;
    
    navigator.clipboard.writeText(contactText)
      .then(() => {
        alert('✅ Información de contacto copiada al portapapeles');
      })
      .catch(err => {
        console.error('Error copiando al portapapeles:', err);
      });
  };*/

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
            Corporación de<br />
            Futbol Ocañero
          </h4>
        </div>

        <div className="login-section-title">
          {showForgotPassword ? '🔐 RECUPERAR CONTRASEÑA' : 'INICIO DE SESIÓN'}
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <small>{error}</small>
            <button 
              type="button" 
              className="btn-close btn-close-white float-end" 
              onClick={() => setError('')}
              aria-label="Cerrar"
            ></button>
          </div>
        )}

        {!showForgotPassword ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  📧 EMAIL <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control login-input"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  placeholder="ejemplo@futbolocañero.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label">
                  🔑 CONTRASEÑA <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control login-input"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? "🙈 Ocultar" : "👁️ Mostrar"}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn login-btn w-100 py-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Ingresando...
                  </>
                ) : (
                  <>
                    <span className="me-2">🚪</span>
                    Entrar al Sistema
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                className="btn btn-link text-decoration-none"
                onClick={() => {
                  setShowForgotPassword(true);
                  resetRecoveryForm();
                }}
                disabled={isLoading}
              >
                <span className="me-1">🔓</span>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="login-info-text mt-4 pt-3 border-top">
              <div className="d-flex align-items-center justify-content-center">
                <span className="me-2">ℹ️</span>
                <div className="text-center">
                  <small>
                    Las cuentas son creadas y gestionadas<br />
                    por administradores autorizados
                  </small>
                </div>
              </div>
              
              <div className="text-center mt-2">
                <small className="text-muted">
                  Versión 1.0 • Sistema de Gestión
                </small>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3">
                <details className="border rounded p-2">
                  <summary className="text-muted" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                    🔧 Información de desarrollo
                  </summary>
                  <div className="mt-2">
                    <small className="text-muted">
                      <div>NODE_ENV: {process.env.NODE_ENV}</div>
                      <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Configurada' : 'No configurada'}</div>
                      <div className="mt-1">
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setFormData({
                              email: 'admin@futbolocañero.com',
                              password: 'admin123'
                            });
                          }}
                        >
                          Rellenar datos de prueba
                        </button>
                      </div>
                    </small>
                  </div>
                </details>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="recovery-section">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">🔐 Recuperar Contraseña</h5>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={() => {
                    setShowForgotPassword(false);
                    resetRecoveryForm();
                  }}
                  disabled={recoveryLoading}
                >
                  ← Volver
                </button>
              </div>
              
              <div className="mb-3">
                <label htmlFor="recoveryEmail" className="form-label">
                  📧 Ingresa tu email registrado:
                </label>
                <input
                  type="email"
                  className="form-control login-input"
                  id="recoveryEmail"
                  value={recoveryEmail}
                  onChange={(e) => {
                    setRecoveryEmail(e.target.value);
                    if (recoveryMessage) setRecoveryMessage('');
                  }}
                  disabled={recoveryLoading}
                  placeholder="ejemplo@futbolocañero.com"
                  autoFocus
                />
              </div>

              <div className="d-grid gap-2">
                {!recoveryMessage ? (
                  <>
                    {recoveryMethod === 'email' && (
                      <button
                        type="button"
                        className="btn btn-primary py-2"
                        onClick={handleRecoverPasswordByEmail}
                        disabled={recoveryLoading || !recoveryEmail.trim()}
                      >
                        {recoveryLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Enviando email...
                          </>
                        ) : (
                          <>
                            <span className="me-2">📤</span>
                            Enviar enlace de recuperación
                          </>
                        )}
                      </button>
                    )}

                    {recoveryMethod === 'contact' && (
                      <button
                        type="button"
                        className="btn btn-info text-white py-2"
                        onClick={handleShowContactOptions}
                        disabled={recoveryLoading}
                      >
                        <span className="me-2">👨‍💼</span>
                        Mostrar información de contacto
                      </button>
                    )}
                  </>
                ) : null}

                {recoveryMessage && (
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={resetRecoveryForm}
                      disabled={recoveryLoading}
                    >
                      Intentar con otro método
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary flex-grow-1"
                      onClick={() => {
                        setShowForgotPassword(false);
                        resetRecoveryForm();
                      }}
                      disabled={recoveryLoading}
                    >
                      Volver al login
                    </button>
                  </div>
                )}

                {!recoveryMessage && (
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none"
                    onClick={() => {
                      setShowForgotPassword(false);
                      resetRecoveryForm();
                    }}
                    disabled={recoveryLoading}
                  >
                    ← Cancelar y volver al login
                  </button>
                )}
              </div>

              {!recoveryMessage && (
                <div className="alert alert-warning mt-3">
                  <div className="d-flex">
                    <span className="me-2">⚠️</span>
                    <div>
                      <small>
                        <strong>IMPORTANTE:</strong> 
                        <ul className="mb-0 ps-3">
                          <li>El enlace por email puede llegar a la carpeta de SPAM</li>
                          <li>Si no recibes el email en 5 minutos, intenta nuevamente</li>
                          <li>Para cuentas desactivadas, contacta al administrador</li>
                        </ul>
                      </small>
                    </div>
                  </div>
                </div>
              )}

              {recoveryMessage && recoveryMessage.includes('✅') && (
                <div className="alert alert-light border mt-3">
                  <div className="d-flex">
                    <span className="me-2">💡</span>
                    <div>
                      <small className="text-muted">
                        <strong>Consejos:</strong>
                        <ul className="mb-0 ps-3">
                          <li>Usa el mismo navegador donde solicitaste el enlace</li>
                          <li>No compartas el enlace con otras personas</li>
                          <li>Crea una contraseña segura y única</li>
                          <li>Anota tu nueva contraseña en un lugar seguro</li>
                        </ul>
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="login-info-text mt-4 pt-3 border-top">
              <div className="text-center">
                <small className="text-muted">
                  Si tienes problemas persistentes, contacta al administrador:
                  <br />
                  <strong>{adminContactInfo.email}</strong>
                </small>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;