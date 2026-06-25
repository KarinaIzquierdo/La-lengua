// Servicio para manejar clases (crear, listar, etc.)
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token'); // Usar la clave correcta del sistema
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ClaseService = {
  // Obtener todas las clases
  getClases: async () => {
    const res = await axios.get(`${API_URL}/clases/`, { headers: getAuthHeaders() });
    // El backend devuelve { success, data, total }
    return Array.isArray(res.data) ? res.data : (res.data.data || []);
  },

  // Crear una nueva clase
  createClase: async (claseData: any) => {
    const payload: any = { ...claseData };
    if (!payload.estudiantesSeleccionados && payload.estudiantes) {
      payload.estudiantesSeleccionados = payload.estudiantes;
    }
    const res = await axios.post(`${API_URL}/clases/`, payload, { headers: getAuthHeaders() });
    return res.data;
  },

  // Editar una clase
  updateClase: async (id: number, claseData: any) => {
    const res = await axios.put(`${API_URL}/clases/${id}/`, claseData, { headers: getAuthHeaders() });
    return res.data;
  },

  // Eliminar una clase
  deleteClase: async (id: number) => {
    const res = await axios.delete(`${API_URL}/clases/${id}/`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Obtener clases por profesor
  getClasesPorProfesor: async (profesorId: number) => {
    // Intentar obtener el nombre completo del profesor desde localStorage
    let nombreCompleto = '';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        nombreCompleto = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      } catch (e) {
        console.error('Error parseando usuario en getClasesPorProfesor:', e);
      }
    }

    const url = nombreCompleto
      ? `${API_URL}/clases/?profesor=${encodeURIComponent(nombreCompleto)}`
      : `${API_URL}/clases/`;

    const res = await axios.get(url, { headers: getAuthHeaders() });
    const todasLasClases: any[] = Array.isArray(res.data) ? res.data : (res.data.data || []);

    return todasLasClases;
  },

  // Obtener clases por usuario
  getClasesPorUsuario: async (usuarioId: number) => {
    const res = await axios.get(`${API_URL}/clases/`, { headers: getAuthHeaders() });
    const todasLasClases: any[] = Array.isArray(res.data) ? res.data : (res.data.data || []);

    if (!usuarioId) {
      return todasLasClases;
    }

    // Filtrar solo las clases donde el usuario está asignado como estudiante
    return todasLasClases.filter((clase: any) => {
      if (!clase.estudiantes) return false;

      // Caso ideal: arreglo de IDs numéricos
      if (Array.isArray(clase.estudiantes)) {
        return clase.estudiantes.includes(usuarioId);
      }

      // Compatibilidad: cadena "1,2,3"
      if (typeof clase.estudiantes === 'string') {
        try {
          const ids = clase.estudiantes
            .split(',')
            .map((id: string) => parseInt(id.trim(), 10))
            .filter((id: number) => !isNaN(id));
          return ids.includes(usuarioId);
        } catch {
          return false;
        }
      }

      return false;
    });
  },

  // Cambiar estado de una clase
  cambiarEstadoClase: async (claseId: number, estado: string) => {
    const res = await axios.put(`${API_URL}/clases/${claseId}/cambiar_estado/`, 
      { estado }, 
      { headers: getAuthHeaders() }
    );
    return res.data;
  }
};
