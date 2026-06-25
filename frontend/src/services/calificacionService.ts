import { API_BASE_URL } from '../config/api';

interface RespuestaEvaluacion {
  id: number;
  evaluacion: number;
  evaluacion_titulo: string;
  evaluacion_tipo?: string;
  estudiante: number;
  estudiante_nombre: string;
  archivo_respuesta?: string;
  respuestas_json: any;
  tiempo_gastado: number;
  advertencias: number;
  completado: boolean;
  fecha_envio: string;
  calificacion?: number;
  comentarios_profesor?: string;
  fecha_calificacion?: string;
  calificado_por?: number;
  calificado_por_nombre?: string;
}

interface PanelCalificacionItem {
  evaluacion_id: number;
  evaluacion_titulo: string;
  evaluacion_tipo?: string;
  estudiante_id: number;
  estudiante_nombre: string;
  respuesta_id: number | null;
  tiene_respuesta: boolean;
  calificacion: number | null;
  fecha_envio: string | null;
  archivo_respuesta_url?: string | null;
  comentarios_profesor?: string | null;
}

interface CalificacionData {
  calificacion: number;
  comentarios_profesor?: string;
}

class CalificacionService {
  private getBaseUrl() {
    // Si se define VITE_DJANGO_API_URL, usarla (por ejemplo, para probar contra Django local)
    if (import.meta.env.VITE_DJANGO_API_URL) {
      return import.meta.env.VITE_DJANGO_API_URL as string;
    }
    // En cualquier otro caso (dev o prod) usar la base global configurada (normalmente PHP)
    return API_BASE_URL;
  }

  async calificarDesdePanel(
    evaluacionId: number,
    estudianteId: number,
    calificacionData: CalificacionData
  ): Promise<{
    success: boolean;
    respuesta?: RespuestaEvaluacion;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/calificaciones/panel/calificar/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          evaluacion_id: evaluacionId,
          estudiante_id: estudianteId,
          ...calificacionData,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        return {
          success: false,
          error: data.error || data.message || 'Error al calificar desde panel',
        };
      }

      return {
        success: true,
        respuesta: data.respuesta,
        message: data.message,
      };
    } catch (error) {
      console.error('Error en calificarDesdePanel:', error);
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  }

  async obtenerPanelCalificaciones(): Promise<{
    success: boolean;
    items: PanelCalificacionItem[];
    total: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/calificaciones/panel/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        return {
          success: false,
          items: [],
          total: 0,
          error: data.error || data.message || 'Error al obtener panel de calificaciones',
        };
      }

      const items: PanelCalificacionItem[] = data.items || [];

      return {
        success: true,
        items,
        total: data.total ?? items.length,
      };
    } catch (error) {
      console.error('Error en obtenerPanelCalificaciones:', error);
      return {
        success: false,
        items: [],
        total: 0,
        error: 'Error de conexión',
      };
    }
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async obtenerRespuestasPorCalificar(): Promise<{
    success: boolean;
    respuestas: RespuestaEvaluacion[];
    total: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/calificaciones/por-calificar/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          respuestas: [],
          total: 0,
          error: data.error || 'Error al obtener respuestas por calificar'
        };
      }

      return {
        success: true,
        respuestas: data.respuestas || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error en obtenerRespuestasPorCalificar:', error);
      return {
        success: false,
        respuestas: [],
        total: 0,
        error: 'Error de conexión'
      };
    }
  }

  async obtenerRespuestasCalificadas(): Promise<{
    success: boolean;
    respuestas: RespuestaEvaluacion[];
    total: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/calificaciones/calificadas/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          respuestas: [],
          total: 0,
          error: data.error || 'Error al obtener respuestas calificadas'
        };
      }

      return {
        success: true,
        respuestas: data.respuestas || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error en obtenerRespuestasCalificadas:', error);
      return {
        success: false,
        respuestas: [],
        total: 0,
        error: 'Error de conexión'
      };
    }
  }

  async obtenerDetalleRespuesta(respuestaId: number): Promise<{
    success: boolean;
    respuesta?: RespuestaEvaluacion;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/calificaciones/${respuestaId}/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al obtener detalle de respuesta'
        };
      }

      return {
        success: true,
        respuesta: data.respuesta
      };
    } catch (error) {
      console.error('Error en obtenerDetalleRespuesta:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }

  async calificarRespuesta(respuestaId: number, calificacionData: CalificacionData): Promise<{
    success: boolean;
    respuesta?: RespuestaEvaluacion;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/calificaciones/${respuestaId}/calificar/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(calificacionData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al calificar respuesta'
        };
      }

      return {
        success: true,
        respuesta: data.respuesta,
        message: data.message
      };
    } catch (error) {
      console.error('Error en calificarRespuesta:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }

  async actualizarCalificacion(respuestaId: number, calificacionData: CalificacionData): Promise<{
    success: boolean;
    respuesta?: RespuestaEvaluacion;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/calificaciones/${respuestaId}/actualizar/`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(calificacionData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al actualizar calificación'
        };
      }

      return {
        success: true,
        respuesta: data.respuesta,
        message: data.message
      };
    } catch (error) {
      console.error('Error en actualizarCalificacion:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  }

  // Utilidades para formateo
  formatearCalificacion(calificacion: number): string {
    return `${calificacion.toFixed(1)}/100`;
  }

  obtenerColorCalificacion(calificacion: number): string {
    if (calificacion >= 90) return '#22c55e'; // Verde
    if (calificacion >= 80) return '#84cc16'; // Verde claro
    if (calificacion >= 70) return '#eab308'; // Amarillo
    if (calificacion >= 60) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  }

  obtenerEtiquetaCalificacion(calificacion: number): string {
    if (calificacion >= 90) return 'Excelente';
    if (calificacion >= 80) return 'Muy Bueno';
    if (calificacion >= 70) return 'Bueno';
    if (calificacion >= 60) return 'Regular';
    return 'Necesita Mejorar';
  }

  formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const calificacionService = new CalificacionService();
export type { RespuestaEvaluacion, CalificacionData, PanelCalificacionItem };
