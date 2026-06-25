import axios from 'axios';

const API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';

// Interfaces
export interface Usuario {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_joined: string;
  role: string;
}

export interface Plan {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  precio_base: number;
  duracion_meses: number;
  caracteristicas: string[];
  activo: boolean;
  color_tema: string;
}

export interface Suscripcion {
  id: number;
  estudiante_nombre: string;
  plan_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_inicio_plan?: string;  // Mantener por compatibilidad
  fecha_fin_plan?: string;      // Mantener por compatibilidad
  precio_total?: number;
  estado: string;
  metodo_pago?: string;
  clases_totales?: number;
  clases_tomadas?: number;
  dias_restantes?: number;
  clases_restantes?: number;
  progreso_porcentaje?: number;
}

export interface AsignarPlanData {
  user_id: number;
  plan_id: number;
  especializacion_id?: number;
  metodo_pago: string;
  descuento: number;
  notas: string;
}

// Configuración de axios
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const subscriptionService = {
  // Obtener usuarios sin plan activo
  async getUsuariosSinPlan(): Promise<Usuario[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/suscripciones/usuarios-sin-plan/`, {
        headers: getAuthHeaders()
      });
      return response.data.usuarios || response.data;
    } catch (error) {
      console.error('Error fetching usuarios sin plan:', error);
      throw error;
    }
  },

  // Obtener planes por vencer
  async getPlanesPorVencer(dias: number = 7): Promise<Suscripcion[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/suscripciones/planes-por-vencer/?dias=${dias}`, {
        headers: getAuthHeaders()
      });
      return response.data.planes_por_vencer;
    } catch (error) {
      console.error('Error fetching planes por vencer:', error);
      throw error;
    }
  },

  // Obtener suscripciones activas
  async getSuscripcionesActivas(): Promise<Suscripcion[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/suscripciones/activas/`, {
        headers: getAuthHeaders()
      });
      return response.data.suscripciones;
    } catch (error) {
      console.error('Error fetching suscripciones activas:', error);
      throw error;
    }
  },

  // Obtener planes disponibles
  async getPlanes(): Promise<Plan[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/planes/`, {
        headers: getAuthHeaders()
      });
      // El backend devuelve { success: true, data: [...] }
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching planes:', error);
      throw error;
    }
  },

  // Obtener todos los estudiantes
  async getTodosLosEstudiantes(): Promise<Usuario[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/`, {
        headers: getAuthHeaders()
      });

      // El backend PHP devuelve { success, message, users: [...] }
      // pero mantenemos compatibilidad si alguna vez devuelve un array plano
      const raw = response.data;
      const users = Array.isArray(raw) ? raw : (raw.users || raw.data || []);

      // Asegurar que siempre devolvemos objetos con la forma de Usuario
      const estudiantes = (users as any[]).filter((user: any) => 
        user.role === 'student' || user.role === 'estudiante'
      );

      return estudiantes.map((u: any) => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        date_joined: u.date_joined,
        role: u.role,
      }));
    } catch (error) {
      console.error('Error fetching estudiantes:', error);
      throw error;
    }
  },

  // Asignar plan a usuario
  async asignarPlan(data: AsignarPlanData): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/suscripciones/asignar-plan/`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error asignando plan:', error);
      throw error;
    }
  },

  // Enviar recordatorio de pago
  async enviarRecordatorio(ventaId: number, mensaje?: string): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/suscripciones/recordatorio/`, {
        venta_id: ventaId,
        mensaje: mensaje
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
      throw error;
    }
  },

  // Renovar plan
  async renovarPlan(ventaId: number, nuevoPlanId?: number): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/suscripciones/renovar/`, {
        venta_id: ventaId,
        nuevo_plan_id: nuevoPlanId
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error renovando plan:', error);
      throw error;
    }
  },

  // Cancelar plan
  async cancelarPlan(suscripcionId: number): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/suscripciones/${suscripcionId}/cancelar/`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelando plan:', error);
      throw error;
    }
  }
};
