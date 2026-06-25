// Servicio para manejar datos de profesores
import { API_BASE_URL } from '../config/api';

export interface Profesor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
}

export interface ProfesoresResponse {
  success: boolean;
  profesores: Profesor[];
  count: number;
}

class ProfesorService {
  async getProfesores(): Promise<Profesor[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/profesores/list/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProfesoresResponse = await response.json();
      
      if (data.success) {
        return data.profesores;
      } else {
        throw new Error('Error al obtener profesores');
      }
    } catch (error) {
      console.error('Error fetching profesores:', error);
      return [];
    }
  }

  // Método para crear notificación cuando se asigna un bloque
  async notificarAsignacionBloque(profesorId: number, bloqueInfo: any): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notificaciones/crear/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profesor_id: profesorId,
          tipo: 'bloque_asignado',
          titulo: 'Nuevo bloque asignado',
          mensaje: `Se te ha asignado el bloque ${bloqueInfo.nivel} ${bloqueInfo.turno}`,
          prioridad: 'alta'
        }),
      });

      if (!response.ok) {
        console.error('Error al crear notificación');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
}

export const profesorService = new ProfesorService();
