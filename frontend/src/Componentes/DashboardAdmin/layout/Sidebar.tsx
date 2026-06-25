import { NavLink } from 'react-router-dom';
import { ThemeToggleButton } from './ThemeToggleButton';

export const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <aside className="sidebar">
      <div>
        <h3>Admin Panel</h3>
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/usuarios" className={({ isActive }) => isActive ? 'active' : ''}>
              Gestionar Usuarios
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/programar-clases" className={({ isActive }) => isActive ? 'active' : ''}>
              Programar Clases
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/gestion-estudiantes" className={({ isActive }) => isActive ? 'active' : ''}>
              Gestión de Estudiantes
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/registros-eliminacion" className={({ isActive }) => isActive ? 'active' : ''}>
              📋 Registros de Eliminación
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/galeria" className={({ isActive }) => isActive ? 'active' : ''}>
              Gestión de Galería
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/especializaciones" className={({ isActive }) => isActive ? 'active' : ''}>
              Especializaciones
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/planes-precios" className={({ isActive }) => isActive ? 'active' : ''}>
              💰 Planes y Precios
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/registro-ventas" className={({ isActive }) => isActive ? 'active' : ''}>
              📊 Registro de Ventas
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/gestion-suscripciones" className={({ isActive }) => isActive ? 'active' : ''}>
              👥 Gestión de Suscripciones
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/misiones" className={({ isActive }) => isActive ? 'active' : ''}>
              🎯 Misiones
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/retos-diarios" className={({ isActive }) => isActive ? 'active' : ''}>
              🔥 Retos Diarios
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/ranking-retos" className={({ isActive }) => isActive ? 'active' : ''}>
              🏆 Ranking Retos
            </NavLink>
          </li>
        </ul>
        <button className="logout-button" onClick={onLogout} style={{ marginTop: '2rem', width: '100%' }}>
          Cerrar sesión
        </button>
      </div>
      <ThemeToggleButton />
    </aside>
  );
};
