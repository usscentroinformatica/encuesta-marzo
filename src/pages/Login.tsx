// src/pages/Login.tsx
import { useState } from 'react'
import logoUss from '../assets/uss.png'

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const emailCompleto = `${nombreUsuario}@uss.edu.pe`.toLowerCase()

  const ingresar = async () => {
  if (!nombreUsuario.trim()) {
    setError('Ingresa tu usuario')
    return
  }

  setLoading(true)
  setError('')

  try {
    const emailCompleto = `${nombreUsuario}@uss.edu.pe`.toLowerCase();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) {
      // Desarrollo local - usar proxy directo
      const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwY2H2_5-mlbnpSE95trOmkpvgWHu--olFGQoEtSd1onp9eyDP1gfKFAHbRGcVMdz2u/exec";
      const targetUrl = `${GOOGLE_SCRIPT_URL}?email=${encodeURIComponent(emailCompleto)}`;
      const url = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

      const res = await fetch(url);
      const data = await res.json();
      
      if (data.contents) {
        const parsed = JSON.parse(data.contents);
        if (parsed.cursos && parsed.cursos.length > 0) {
          localStorage.setItem('eval_data', JSON.stringify({
            email: emailCompleto,
            cursos: parsed.cursos
          }));
          window.location.href = '/formulario';
        } else {
          setError('Usuario no encontrado');
        }
      }
    } else {
      // Producción Vercel
      console.log('Consultando API Vercel...');
      
      // Timeout de 15 segundos para la petición
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(`/api/google-script?email=${encodeURIComponent(emailCompleto)}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const data = await response.json();
        
        if (data.success && data.cursos && data.cursos.length > 0) {
          localStorage.setItem('eval_data', JSON.stringify({
            email: emailCompleto,
            cursos: data.cursos
          }));
          window.location.href = '/formulario';
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Usuario no encontrado');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          setError('La consulta está tomando demasiado tiempo. Intenta con un usuario de prueba.');
          
          // Datos de prueba para usuarios específicos
          if (nombreUsuario === 'test' || nombreUsuario === 'demo' || nombreUsuario.startsWith('a')) {
            if (confirm('¿Quieres acceder con datos de prueba?')) {
              localStorage.setItem('eval_data', JSON.stringify({
                email: emailCompleto,
                cursos: [{
                  nombre: "ALUMNO DE PRUEBA",
                  curso: "MATEMATICA I - PEAD-a",
                  pead: "PEAD-a",
                  docente: "MG. EDGAR CHAMBILLA FLORES"
                }]
              }));
              window.location.href = '/formulario';
            }
          }
        } else {
          throw fetchError;
        }
      }
    }

  } catch (error: any) {
    console.error('Error:', error);
    setError('Error de conexión. Verifica tu internet.');
  } finally {
    setLoading(false);
  }
}

  // ====== JSX COMPLETO ======
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Roboto, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Principal con Logo USS */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '6px solid #63ed12',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <img
            src={logoUss}
            alt="Universidad Señor de Sipán"
            style={{
              width: '200px',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 6px rgba(32,33,36,0.28)',
          overflow: 'hidden'
        }}>
          {/* Banner del Formulario */}
          <div style={{
            backgroundColor: '#5a2290',
            color: 'white',
            padding: '32px 48px',
            textAlign: 'center'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '400'
            }}>
              ENCUESTA DE SATISFACCIÓN DOCENTE
            </h2>
            <div style={{
              marginTop: '12px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              2026 FEBRERO
            </div>
            <div style={{
              marginTop: '8px',
              fontSize: '14px',
              opacity: 0.9
            }}>
              Tu participación es anónima y confidencial.
            </div>
          </div>

          {/* Formulario de Login */}
          <div style={{ padding: '32px 48px' }}>
            <div style={{
              border: '1px solid #dadce0',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '32px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#202124',
                marginBottom: '12px',
                fontWeight: '500'
              }}>
                Correo institucional <span style={{ color: '#d93025' }}>*</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '2px solid #dadce0',
                borderRadius: '4px',
                padding: '0 14px',
                backgroundColor: '#fff',
                height: '56px',
                transition: 'border-color 0.2s ease'
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#63ed12'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#dadce0'}
              >
                <input
                  type="text"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value.toLowerCase().trim())}
                  onKeyDown={(e) => e.key === 'Enter' && ingresar()}
                  placeholder="tuusuario"
                  disabled={loading}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    backgroundColor: 'transparent'
                  }}
                />
                <span style={{
                  color: '#5f6368',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  @uss.edu.pe
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#5f6368',
                marginTop: '8px'
              }}>
                Ingresa solo tu nombre de usuario sin el @uss.edu.pe
              </div>
            </div>

            {/* Botones */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div></div>
              <button
                onClick={ingresar}
                disabled={loading || !nombreUsuario}
                style={{
                  backgroundColor: loading || !nombreUsuario ? '#f1f3f4' : '#5a2290',
                  color: loading || !nombreUsuario ? '#9aa0a6' : 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !nombreUsuario ? 'not-allowed' : 'pointer',
                  boxShadow: loading || !nombreUsuario ? 'none' : '0 2px 6px rgba(90, 34, 144, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading && nombreUsuario) {
                    e.currentTarget.style.backgroundColor = '#63ed12'
                    e.currentTarget.style.color = '#000'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(99, 237, 18, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && nombreUsuario) {
                    e.currentTarget.style.backgroundColor = '#5a2290'
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(90, 34, 144, 0.4)'
                  }
                }}
              >
                {loading ? 'Verificando...' : 'Siguiente'}
              </button>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#fce8e6',
                color: '#c5221f',
                borderRadius: '8px',
                border: '1px solid #f28b82',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Nota para desarrollo */}
            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && error && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
                borderRadius: '8px',
                border: '1px solid #90caf9',
                fontSize: '13px'
              }}>
                <strong>Nota para desarrollo:</strong> Si los proxies están caídos, prueba con: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>arandade</code> o <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>test</code>
              </div>
            )}
          </div>

          {/* Footer del Formulario */}
          <footer style={{
            backgroundColor: '#f8f9fa',
            padding: '24px 48px',
            fontSize: '12px',
            color: '#5f6368',
            borderTop: '1px solid #dadce0',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            Nunca envíes contraseñas a través de Formularios de Google.<br />
            Este formulario se creó en el Centro de Informática de la Universidad Señor de Sipán.
          </footer>
        </div>
      </main>

      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: '#5f6368',
        fontSize: '14px'
      }}>
        Google Formularios
      </div>
    </div>
  )
}
