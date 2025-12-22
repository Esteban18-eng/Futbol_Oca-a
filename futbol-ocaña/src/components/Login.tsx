import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import { supabase } from '../services/supabaseClient';

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
          INICIO DE SESIÓN
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <small>{error}</small>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              EMAIL <span className="text-danger">*</span>
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
              placeholder="admin@futbolocañero.com"
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              CONTRASEÑA <span className="text-danger">*</span>
            </label>
            <input
              type="password"
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
          </div>

          <button 
            type="submit" 
            className="btn login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Ingresando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-info-text">
          Las cuentas solo pueden ser creadas por<br />
          administradores
        </div>

        
      </div>
    </div>
  );
};

export default Login;