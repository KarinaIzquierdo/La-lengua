import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './Componentes/Home/Home'
import Blog from './Componentes/Blog/Blog'
import PlanesPublicos from './Componentes/Planes/PlanesPublicos'
import Header from './Componentes/Layout/Encabezado'
import Footer from './Componentes/Layout/PiePagina'
import Dashboard from './Componentes/DashboardUsu/Dashboard_Usuario'
import DashboardProfesor from './Componentes/DashboardProfesor/Dashboard_Profesor'
import LoginModal from './Componentes/Login/LoginModal'
import ResetPassword from './Componentes/Login/ResetPassword'
import NewPassword from './Componentes/Login/NewPassword'
import UserInfoModal from './Componentes/UserInfo/UserInfoModal'
import { authService } from './services/authService'
import { ThemeProvider } from './context/ThemeContext'
import { AdminLayout } from './Componentes/DashboardAdmin/layout/AdminLayout'
import Dashboard_Admin from './Componentes/DashboardAdmin/Dashboard_Admin'
import FormularioUsuarios from './Componentes/DashboardAdmin/FormularioUsuarios'
import GestionEstudiantes from './Componentes/DashboardAdmin/GestionEstudiantes'
import ProgramarClases from './Componentes/DashboardAdmin/ProgramarClases'
// import GestionCursos from './Componentes/DashboardAdmin/GestionCursos'
import GestionGaleria from './Componentes/DashboardAdmin/GestionGaleria'
import Especializaciones from './Componentes/DashboardAdmin/Especializaciones'
import PlanesPrecios from './Componentes/DashboardAdmin/PlanesPrecios';
import RegistroVentas from './Componentes/DashboardAdmin/RegistroVentas';
import GestionSuscripciones from './Componentes/DashboardAdmin/GestionSuscripciones';
import MisionesAdmin from './Componentes/DashboardAdmin/MisionesAdmin';
import RetosDiariosAdmin from './Componentes/DashboardAdmin/RetosDiariosAdmin';
import RankingRetosAdmin from './Componentes/DashboardAdmin/RankingRetosAdmin';
import RegistrosEliminacion from './Componentes/DashboardAdmin/RegistrosEliminacion';

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [userRole, setUserRole] = useState<'student' | 'profesor' | 'admin' | null>(null)

  useEffect(() => {
    // Verificar si el usuario ya está autenticado al cargar la app
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Simplificado - solo verificar si existe el token
          setIsAuthenticated(true);
          const role = localStorage.getItem('userRole') as 'student' | 'profesor' | 'admin' | null;
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    // Escuchar evento personalizado para abrir modal de login
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
    };

    window.addEventListener('openLoginModal', handleOpenLoginModal);
    checkAuth();

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsLoginModalOpen(false)
  }

  const handleLogin = async (credentials: any) => {
    console.log('=== HANDLE LOGIN START ===');
    console.log('authService:', authService);
    console.log('authService.getUserProfile:', authService.getUserProfile);
    console.log('typeof authService.getUserProfile:', typeof authService.getUserProfile);
    
    const result = await authService.login(credentials)
    
    if (result.success) {
      setIsAuthenticated(true)
      setIsLoginModalOpen(false)
      
      // Obtener el rol del usuario y verificar si es primer login
      try {
        console.log('About to call getUserProfile...');
        console.log('authService before call:', authService);
        
        const profile = await authService.getUserProfile()
        console.log('Profile check:', profile)
        console.log('Profile role:', profile.role)
        console.log('Profile completed:', profile.profile_completed)
        setUserRole(profile.role || 'student')
        
        // Guardar el rol en localStorage para persistencia
        localStorage.setItem('userRole', profile.role || 'student')
        
        // Redirigir según el rol, independientemente del estado del perfil
        const role = profile.role || 'student'
        console.log('Redirecting user with role:', role)
        
        // Si el perfil no está completado, mostrar modal DESPUÉS de redirigir
        if (!profile.profile_completed && role === 'student') {
          setShowUserInfoModal(true)
        }
        
        // Forzar recarga completa de la página para evitar problemas de estado
        if (role === 'student') {
          window.location.replace('/dashboard')
        } else if (role === 'profesor') {
          window.location.replace('/dashboard-profesor')
        } else if (role === 'admin') {
          window.location.replace('/admin')
        }
      } catch (error) {
        console.error('Error getting profile:', error)
        // Si no puede obtener el perfil, asumir que es estudiante y primer login
        setUserRole('student')
        setShowUserInfoModal(true)
      }
    } else {
      throw new Error(result.message || 'Error de autenticación')
    }
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUserRole(null)
    setShowUserInfoModal(false)
  }

  const handleUserInfoComplete = () => {
    setShowUserInfoModal(false)
  }

  return (
    <ThemeProvider>
      <Router>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            fontSize: '1.2rem',
            color: '#667eea'
          }}>
            Cargando...
          </div>
        ) : (
          <Routes>
            {/* Ruta principal */}
            <Route path="/" element={
              <>
                <Header onLoginClick={handleLoginClick} />
                <Home />
                <Footer />
                <LoginModal 
                  isOpen={isLoginModalOpen}
                  onClose={handleCloseModal}
                  onLogin={handleLogin}
                />
              </>
            } />
            
            {/* Recuperar contraseña */}
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Nueva contraseña (con token) */}
            <Route path="/new-password" element={<NewPassword />} />
            
            {/* Ruta del Blog - Pública para todos */}
            <Route path="/blog" element={
              <>
                <Blog />
                <LoginModal 
                  isOpen={isLoginModalOpen}
                  onClose={handleCloseModal}
                  onLogin={handleLogin}
                />
              </>
            } />

            {/* Ruta de Planes - Pública para todos */}
            <Route path="/planes" element={
              <>
                <PlanesPublicos />
                <LoginModal 
                  isOpen={isLoginModalOpen}
                  onClose={handleCloseModal}
                  onLogin={handleLogin}
                />
              </>
            } />
            
            {/* Dashboard de estudiante */}
            <Route path="/dashboard" element={
              isAuthenticated && userRole === 'student' ? (
                <>
                  <Dashboard onLogout={handleLogout} />
                  <UserInfoModal 
                    isOpen={showUserInfoModal}
                    onClose={() => setShowUserInfoModal(false)}
                    onComplete={handleUserInfoComplete}
                  />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            {/* Dashboard de profesor */}
            <Route path="/dashboard-profesor" element={
              isAuthenticated && userRole === 'profesor' ? (
                <DashboardProfesor onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            {/* Rutas del Panel de Administración */}
            <Route path="/admin" element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminLayout onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }>
              {/* Redirección por defecto a /admin/dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard_Admin />} />
              <Route path="usuarios" element={<FormularioUsuarios />} />
              <Route path="gestion-estudiantes" element={<GestionEstudiantes />} />
              <Route path="registros-eliminacion" element={<RegistrosEliminacion />} />
              <Route path="programar-clases" element={<ProgramarClases />} />
              {/** Gestión de cursos movida al Dashboard del Profesor como "Gestión CLB" **/}
              <Route path="galeria" element={<GestionGaleria />} />
              <Route path="especializaciones" element={<Especializaciones />} />
              <Route path="planes-precios" element={<PlanesPrecios />} />
              <Route path="registro-ventas" element={<RegistroVentas />} />
              <Route path="gestion-suscripciones" element={<GestionSuscripciones />} />
              <Route path="misiones" element={<MisionesAdmin />} />
              <Route path="retos-diarios" element={<RetosDiariosAdmin />} />
              <Route path="ranking-retos" element={<RankingRetosAdmin />} />
            </Route>
            
            {/* Ruta de login - redirige al home */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            
            {/* Ruta 404 */}
            <Route path="*" element={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                textAlign: 'center'
              }}>
                <h1 style={{ color: '#667eea', marginBottom: '1rem' }}>Error 404 - Página no encontrada</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>La página que buscas no existe.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Ir al inicio
                </button>
              </div>
            } />
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  )
}

export default App
