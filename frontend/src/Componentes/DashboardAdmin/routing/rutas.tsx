import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { AdminLayout } from "../layout/AdminLayout";

// Pages
import AdminDashboardHome from '../AdminDashboardHome';
import FormularioUsuarios from "../FormularioUsuarios";
import GestionEstudiantes from "../GestionEstudiantes";
import ProgramarClases from "../ProgramarClases";
import GestionCursos from '../GestionCursos';
import Dashboard_Admin from '../Dashboard_Admin';
import RegistrosEliminacion from '../RegistrosEliminacion';

export const Rutas = () => {
    // Función de logout para pasar a AdminLayout
    const handleLogout = () => {
        // Aquí puedes poner la lógica de logout real (limpiar sesión, redirigir, etc.)
        window.location.href = "/login";
    };
    return (
        <Routes>
            {/* Rutas del Panel de Administración */}
            <Route path="/admin" element={<AdminLayout onLogout={handleLogout} />}>
                {/* Redirección por defecto a /admin/dashboard */}
                <Route index element={<Navigate to="dashboard" />} /> 
                <Route path="dashboard" element={<Dashboard_Admin />} />
                <Route path="usuarios" element={<FormularioUsuarios />} />
                <Route path="gestion-estudiantes" element={<GestionEstudiantes />} />
                <Route path="registros-eliminacion" element={<RegistrosEliminacion />} />
                <Route path="programar-clases" element={<ProgramarClases />} />
                <Route path="gestion-cursos" element={<GestionCursos />} />
            </Route>

            {/* Ruta para manejar páginas no encontradas */}
            <Route path="*" element={<h1>Error 404 - Página no encontrada</h1>} />
        </Routes>
    )
}
