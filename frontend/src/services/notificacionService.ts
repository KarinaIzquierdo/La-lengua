import { API_BASE_URL } from '../config/api';

export interface Notificacion {
  id: number;
  tipo: 'clase_proxima' | 'evaluacion_subida' | 'evaluacion_pendiente' | 'estudiante_sin_evaluar' | 'clase_hoy' | 'evaluacion_vencida';
  titulo: string;
  mensaje: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  leida: boolean;
  profesor_nombre: string;
  clase_nombre?: string;
  evaluacion_titulo?: string;
  estudiante_nombre?: string;
  tiempo_transcurrido: string;
  created_at: string;
  updated_at: string;
}

export interface NotificacionesResponse {
  success: boolean;
  notificaciones: Notificacion[];
  total: number;
  no_leidas: number;
  message?: string;
}

class NotificacionService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async obtenerNotificaciones(): Promise<NotificacionesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  async marcarComoLeida(notificacionId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/${notificacionId}/marcar-leida/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  async marcarTodasComoLeidas(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/marcar-todas-leidas/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  // Método para obtener el icono según el tipo de notificación
  getIconoTipo(tipo: string): string {
    const iconos = {
      'clase_hoy': '🔴',
      'clase_proxima': '📅',
      'evaluacion_subida': '📤',
      'evaluacion_pendiente': '⏳',
      'estudiante_sin_evaluar': '❌',
      'evaluacion_vencida': '🚨'
    };
    return iconos[tipo as keyof typeof iconos] || '📢';
  }

  // Método para obtener el color según la prioridad
  getColorPrioridad(prioridad: string): string {
    const colores = {
      'baja': '#10b981',
      'media': '#f59e0b',
      'alta': '#f97316',
      'urgente': '#ef4444'
    };
    return colores[prioridad as keyof typeof colores] || '#6b7280';
  }

  // Método para formatear el mensaje de notificación
  formatearMensaje(notificacion: Notificacion): string {
    return notificacion.mensaje.length > 100 
      ? notificacion.mensaje.substring(0, 100) + '...' 
      : notificacion.mensaje;
  }
}

export const notificacionService = new NotificacionService();
