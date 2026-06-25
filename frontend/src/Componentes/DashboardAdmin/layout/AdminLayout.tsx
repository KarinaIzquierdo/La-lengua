import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
//importar estilos css
import './AdminLayout.css';

export const AdminLayout = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="admin-layout">
      <Sidebar onLogout={onLogout} />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};
