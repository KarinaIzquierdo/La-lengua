import { API_BASE_URL as BASE_URL } from '../config/api';

// Router PHP principal (legacy) - se mantiene para compatibilidad en algunas vistas antiguas
const API_BASE_URL = BASE_URL;

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    // Si hay errores específicos en la respuesta, construir un mensaje de error detallado
    if (data.errors) {
      const errorMessage = Object.entries(data.errors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('\n');
      throw new Error(errorMessage);
    }
    throw new Error(data.message || `Error del servidor: ${response.status}`);
  }
  
  return data;
};

export const evaluacionService = {
  // Listar todas las evaluaciones del profesor
  async getEvaluaciones() {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/`);
  },

  // Crear nueva evaluación
  async createEvaluacion(evaluacionData) {
    const formData = new FormData();
    
    // Agregar campos básicos
    formData.append('titulo', evaluacionData.titulo);
    formData.append('descripcion', evaluacionData.descripcion || '');
    formData.append('tipo', evaluacionData.tipo);
    formData.append('estado', evaluacionData.estado || 'borrador');
    
    // Agregar archivo si existe
    if (evaluacionData.archivo) {
      formData.append('archivo', evaluacionData.archivo);
    }
    
    // Agregar fecha límite si existe
    if (evaluacionData.fecha_limite) {
      formData.append('fecha_limite', evaluacionData.fecha_limite);
    }
    
    // Agregar estudiantes asignados como un array JSON
    if (evaluacionData.estudiantes_asignados && evaluacionData.estudiantes_asignados.length > 0) {
      formData.append('estudiantes_asignados', JSON.stringify(evaluacionData.estudiantes_asignados));
    }
    
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/`, {
      method: 'POST',
      body: formData,
    });
  },

  // Actualizar evaluación existente
  async updateEvaluacion(id, evaluacionData) {
    const formData = new FormData();
    
    // Agregar campos básicos
    if (evaluacionData.titulo) formData.append('titulo', evaluacionData.titulo);
    if (evaluacionData.descripcion) formData.append('descripcion', evaluacionData.descripcion);
    if (evaluacionData.tipo) formData.append('tipo', evaluacionData.tipo);
    if (evaluacionData.estado) formData.append('estado', evaluacionData.estado);
    
    // Agregar archivo si existe
    if (evaluacionData.archivo) {
      formData.append('archivo', evaluacionData.archivo);
    }
    
    // Agregar fecha límite si existe
    if (evaluacionData.fecha_limite) {
      formData.append('fecha_limite', evaluacionData.fecha_limite);
    }
    
    // Agregar estudiantes asignados
    if (evaluacionData.estudiantes_asignados && evaluacionData.estudiantes_asignados.length > 0) {
      evaluacionData.estudiantes_asignados.forEach(studentId => {
        formData.append('estudiantes_asignados', studentId);
      });
    }
    
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/${id}/update/`, {
      method: 'PUT',
      body: formData,
    });
  },

  // Eliminar evaluación
  async deleteEvaluacion(id) {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/${id}/delete/`, {
      method: 'DELETE',
    });
  },

  // Publicar evaluación
  async publishEvaluacion(id) {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/${id}/publish/`, {
      method: 'POST',
    });
  },

  // Obtener lista de estudiantes para asignar
  async getStudents() {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/students/`);
  },

  // Obtener evaluaciones asignadas al estudiante (para dashboard de estudiante)
  async getStudentEvaluaciones() {
    // Usar directamente Django (sin /index.php)
    return makeAuthenticatedRequest(`${BASE_URL}/student/evaluaciones/`);
  },

  // Descargar archivo de evaluación
  async downloadEvaluacion(id) {
    try {
      const token = getAuthToken();
      // Endpoint Django para descargar el archivo de la evaluación
      const response = await fetch(`${BASE_URL}/evaluaciones/${id}/download/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Error al descargar: ${response.status}`
        };
      }

      // Obtener el nombre del archivo desde el header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'evaluacion.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        filename: filename
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Subir respuesta de evaluación
  async uploadRespuesta(evaluacionId, respuestaData) {
    const formData = new FormData();
    
    if (respuestaData.archivo_respuesta) {
      formData.append('archivo_respuesta', respuestaData.archivo_respuesta);
    }
    
    if (respuestaData.comentarios) {
      formData.append('comentarios_profesor', respuestaData.comentarios);
    }

    // Usar endpoint Django para subir la respuesta (tarea del estudiante)
    return makeAuthenticatedRequest(`${BASE_URL}/evaluaciones/${evaluacionId}/upload-respuesta/`, {
      method: 'POST',
      body: formData,
    });
  },

  // Obtener reportes de progreso de estudiantes (para profesores)
  async getReportesProgreso() {
    // Reportes reales desde Django
    return makeAuthenticatedRequest(`${BASE_URL}/reportes/progreso/`);
  },

  // Obtener datos del examen para modo seguro
  getExamenData: async (evaluacionId) => {
    const response = await fetch(`${API_BASE_URL}/evaluaciones/${evaluacionId}/examen-data/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cargar el examen');
    }

    return await response.json();
  },

  // Enviar respuestas del examen seguro
  enviarRespuestasExamen: async (evaluacionId, datosRespuesta) => {
    const response = await fetch(`${API_BASE_URL}/evaluaciones/${evaluacionId}/enviar-respuestas/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosRespuesta),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar las respuestas');
    }

    return await response.json();
  },

  // Obtener respuestas del estudiante
  getStudentRespuestas: async () => {
    // Usar directamente el backend Django (sin /index.php)
    const response = await fetch(`${BASE_URL}/student/respuestas/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener las respuestas');
    }

    return await response.json();
  },
};

export default evaluacionService;
