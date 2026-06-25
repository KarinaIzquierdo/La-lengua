import { userService } from './userService';
import { API_BASE_URL } from '../config/api';

// Función para obtener headers de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export interface EvaluacionData {
  titulo: string;
  descripcion?: string;
  tipo?: string;
  estado?: string;
  fecha_limite?: string;
  // Campos personalizados que no están en el modelo backend
  nivel?: string;
  unidad?: string;
  clase?: string;
  enlace?: string;
  archivo?: File | null;
}

export interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  nivel: string;
}

export const evaluacionProfesorService = {
  // Obtener estudiantes usando el mismo método que otras secciones
  async getEstudiantes(): Promise<Estudiante[]> {
    try {
      // Usar el mismo método que EstudiantesView, ReportesProgreso, etc.
      const usuarios = await userService.getAll();
      
      // Filtrar estudiantes usando la misma lógica que otras secciones
      const estudiantes = usuarios
        .filter((usuario: any) => {
          // Usar los mismos campos que otras secciones
          const esEstudiante = usuario.rol === 'student' || usuario.role === 'student' || usuario.role === 'estudiante';
          const estaActivo = usuario.activo !== false && usuario.is_active !== false;
          
          return esEstudiante && estaActivo;
        })
        .map((usuario: any) => ({
          id: usuario.id.toString(),
          nombre: `${usuario.nombres || usuario.first_name || ''} ${usuario.apellidos || usuario.last_name || ''}`.trim(),
          email: usuario.correo || usuario.email || usuario.correo_personal || '',
          nivel: usuario.english_level || usuario.nivel || 'A1'
        }));
      
      return estudiantes;
      
    } catch (error) {
      console.error('Error obteniendo estudiantes:', error);
      return [];
    }
  },

  // Crear nueva evaluación
  async crearEvaluacion(data: EvaluacionData): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // Usar FormData para permitir subir archivos (PDF, Word, etc.)
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      formData.append(
        'descripcion',
        `Nivel: ${data.nivel || ''} | Unidad: ${data.unidad || ''} | Clase: ${data.clase || ''} | Enlace: ${data.enlace || ''}`
      );
      formData.append('tipo', data.tipo || 'quiz');
      formData.append('estado', 'borrador');
      if (data.fecha_limite) {
        formData.append('fecha_limite', data.fecha_limite);
      }
      if (data.archivo) {
        formData.append('archivo', data.archivo);
      }

      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE_URL}/evaluaciones/create/`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error del backend:', result);
        console.error('Status:', response.status);
        console.error('Datos enviados:', data);
        return { success: false, message: result.message || result.error || `Error ${response.status}: ${response.statusText}` };
      }
      
      // Si es exitoso, el backend devuelve { success: true, data: {...} }
      if (result.success) {
        return { success: true, data: result.data, message: result.message };
      } else {
        return { success: false, message: result.message || 'Error al crear evaluación' };
      }
    } catch (error) {
      console.error('Error creando evaluación:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Obtener evaluaciones del profesor
  async getEvaluaciones(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/evaluaciones/`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        console.warn('API response not ok:', response.status, response.statusText);
        return [];
      }
      
      const result = await response.json();
      
      // El backend devuelve { success: true, data: [...] }
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      } else if (Array.isArray(result)) {
        return result;
      } else {
        console.warn('API no devolvió un array válido:', result);
        return [];
      }
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      return [];
    }
  },

  // Asignar evaluación a estudiantes
  async asignarEvaluacion(evaluacionId: number, estudianteIds: string[]): Promise<{ success: boolean; message?: string }> {
    try {
      // Primero intentar actualizar la evaluación para agregar los estudiantes
      const response = await fetch(`${API_BASE_URL}/evaluaciones/${evaluacionId}/update/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          estudiantes_asignados: estudianteIds.map(id => parseInt(id))
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, message: result.message || 'Error al asignar evaluación' };
      }
      
      return { success: true, message: 'Evaluación asignada correctamente a los estudiantes seleccionados' };
    } catch (error) {
      console.error('Error asignando evaluación:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Actualizar evaluación
  async actualizarEvaluacion(id: number, data: Partial<EvaluacionData>): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // Mapear los datos al formato del backend
      const backendData: any = {};
      if (data.titulo) backendData.titulo = data.titulo;
      if (data.nivel || data.unidad || data.clase || data.enlace) {
        backendData.descripcion = `Nivel: ${data.nivel} | Unidad: ${data.unidad} | Clase: ${data.clase} | Enlace: ${data.enlace}`;
      }
      if (data.tipo) backendData.tipo = data.tipo;
      if (data.estado) backendData.estado = data.estado;

      const response = await fetch(`${API_BASE_URL}/evaluaciones/${id}/update/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, message: result.message || 'Error al actualizar evaluación' };
      }
      
      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error actualizando evaluación:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Eliminar evaluación
  async eliminarEvaluacion(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/evaluaciones/${id}/delete/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, message: result.message || 'Error al eliminar evaluación' };
      }
      
      return { success: true, message: result.message || 'Evaluación eliminada correctamente' };
    } catch (error) {
      console.error('Error eliminando evaluación:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Cambiar estado activo/inactivo (usar publish endpoint)
  async toggleActiva(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/evaluaciones/${id}/publish/`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, message: result.message || 'Error al cambiar estado' };
      }
      
      return { success: true, message: result.message || 'Estado actualizado correctamente' };
    } catch (error) {
      console.error('Error cambiando estado:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }
};
